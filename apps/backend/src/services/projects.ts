import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db/db";
import { clients, invoices, milestones, payments, projects } from "../db/auth-schema";

export type ProjectStatus = "draft" | "active" | "completed" | "cancelled";

export type ProjectWithStats = {
  id: string;
  userId: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string | null;
  projectType: string;
  totalAmount: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  totalInvoiced: number;
  totalPaid: number;
  remaining: number;
};

export type ProjectType = "milestone" | "standard";

function toAmountCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export async function listProjects(userId: string, status?: string) {
  const conditions = [eq(projects.userId, userId)];
  if (status) {
    conditions.push(eq(projects.status, status));
  }

  const rows = await db
    .select({
      id: projects.id,
      userId: projects.userId,
      clientId: projects.clientId,
      clientName: clients.name,
      name: projects.name,
      description: projects.description,
      projectType: projects.projectType,
      totalAmount: projects.totalAmount,
      status: projects.status,
      notes: projects.notes,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      totalInvoiced: sql<number>`COALESCE(SUM(DISTINCT COALESCE(${invoices.totalAmount}, 0)), 0)`.mapWith(Number),
      totalPaid: sql<number>`COALESCE(SUM(DISTINCT COALESCE(${payments.amount}, 0)), 0)`.mapWith(Number),
    })
    .from(projects)
    .leftJoin(clients, eq(clients.id, projects.clientId))
    .leftJoin(invoices, and(eq(invoices.projectId, projects.id), eq(invoices.isDeleted, false)))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .where(and(...conditions))
    .groupBy(projects.id, clients.name)
    .orderBy(asc(projects.createdAt));

  return rows.map((r) => ({
    ...r,
    remaining: Math.max(r.totalAmount - r.totalPaid, 0),
  }));
}

export async function getProjectById(userId: string, id: string) {
  const [row] = await db
    .select({
      id: projects.id,
      userId: projects.userId,
      clientId: projects.clientId,
      clientName: clients.name,
      name: projects.name,
      description: projects.description,
      projectType: projects.projectType,
      totalAmount: projects.totalAmount,
      status: projects.status,
      notes: projects.notes,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      totalInvoiced: sql<number>`COALESCE(SUM(DISTINCT COALESCE(${invoices.totalAmount}, 0)), 0)`.mapWith(Number),
      totalPaid: sql<number>`COALESCE(SUM(DISTINCT COALESCE(${payments.amount}, 0)), 0)`.mapWith(Number),
    })
    .from(projects)
    .leftJoin(clients, eq(clients.id, projects.clientId))
    .leftJoin(invoices, and(eq(invoices.projectId, projects.id), eq(invoices.isDeleted, false)))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .where(and(eq(projects.userId, userId), eq(projects.id, id)))
    .groupBy(projects.id, clients.name);

  if (!row) return null;
  return {
    ...row,
    remaining: Math.max(row.totalAmount - row.totalPaid, 0),
  };
}

export async function getProjectDetail(userId: string, id: string) {
  const project = await getProjectById(userId, id);
  if (!project) return null;

  const invoiceList = await db
    .select({
      id: invoices.id,
      invoiceNo: invoices.invoiceNo,
      status: invoices.status,
      currency: invoices.currency,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      dueDate: invoices.dueDate,
      issuedAt: invoices.issuedAt,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .where(and(eq(invoices.projectId, id), eq(invoices.isDeleted, false)))
    .orderBy(asc(invoices.createdAt));

  const milestoneList = await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, id))
    .orderBy(asc(milestones.sortOrder));

  const paymentList = await db
    .select()
    .from(payments)
    .where(
      eq(
        payments.invoiceId,
        sql`ANY(SELECT ${invoices.id} FROM ${invoices} WHERE ${invoices.projectId} = ${id})`,
      ),
    )
    .orderBy(asc(payments.paymentDate));

  return { project, invoices: invoiceList, milestones: milestoneList, payments: paymentList };
}

export async function createProject(
  userId: string,
  input: {
    clientId: string;
    name: string;
    description?: string;
    projectType?: ProjectType;
    totalAmount: number;
    status?: ProjectStatus;
    notes?: string;
  },
) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Project name is required" };

  const clientId = input.clientId.trim();
  if (!clientId) return { ok: false as const, error: "Client is required" };

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.userId, userId), eq(clients.id, clientId), eq(clients.isDeleted, false)));
  if (!client) return { ok: false as const, error: "Client not found" };

  const id = crypto.randomUUID();
  await db.insert(projects).values({
    id,
    userId,
    clientId,
    name,
    description: input.description?.trim() || null,
    projectType: input.projectType || "standard",
    totalAmount: input.totalAmount,
    status: input.status || "draft",
    notes: input.notes?.trim() || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await getProjectById(userId, id);
  if (!created) return { ok: false as const, error: "Failed to create project" };
  return { ok: true as const, project: created };
}

export async function updateProject(
  userId: string,
  id: string,
  input: {
    name?: string;
    description?: string | null;
    totalAmount?: number;
    status?: ProjectStatus;
    notes?: string | null;
  },
) {
  const existing = await getProjectById(userId, id);
  if (!existing) return { ok: false as const, error: "Project not found" };

  const nextName = input.name?.trim() || existing.name;
  if (!nextName) return { ok: false as const, error: "Project name is required" };

  const nextTotalAmount = input.totalAmount !== undefined ? input.totalAmount : existing.totalAmount;

  if (
    existing.projectType === "milestone" &&
    input.totalAmount !== undefined &&
    nextTotalAmount < existing.totalAmount
  ) {
    const [milestoneSum] = await db
      .select({ sumAmount: sql<number>`COALESCE(SUM(${milestones.amount}), 0)`.mapWith(Number) })
      .from(milestones)
      .where(eq(milestones.projectId, id));
    const milestoneTotalCents = milestoneSum?.sumAmount || 0;
    if (milestoneTotalCents > nextTotalAmount * 100) {
      return { ok: false as const, error: "Cannot reduce project total below sum of milestone amounts" };
    }
  }

  await db
    .update(projects)
    .set({
      name: nextName,
      description: input.description !== undefined ? input.description?.trim() || null : existing.description,
      totalAmount: nextTotalAmount,
      status: input.status || existing.status,
      notes: input.notes !== undefined ? input.notes?.trim() || null : existing.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.userId, userId), eq(projects.id, id)));

  const updated = await getProjectById(userId, id);
  if (!updated) return { ok: false as const, error: "Failed to update project" };
  return { ok: true as const, project: updated };
}

export async function deleteProject(userId: string, id: string) {
  const existing = await getProjectById(userId, id);
  if (!existing) return { ok: false as const, error: "Project not found" };

  await db
    .update(projects)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(projects.userId, userId), eq(projects.id, id)));

  return { ok: true as const };
}

export async function getProjectStats(userId: string) {
  const rows = await db
    .select({
      totalProjects: sql<number>`COUNT(*)`.mapWith(Number),
      activeProjects: sql<number>`COUNT(*) FILTER (WHERE ${projects.status} = 'active')`.mapWith(Number),
      totalContractValue: sql<number>`COALESCE(SUM(${projects.totalAmount}), 0)`.mapWith(Number),
      totalPaid: sql<number>`COALESCE(SUM(DISTINCT COALESCE(${payments.amount}, 0)), 0)`.mapWith(Number),
    })
    .from(projects)
    .leftJoin(invoices, and(eq(invoices.projectId, projects.id), eq(invoices.isDeleted, false)))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .where(eq(projects.userId, userId));

  const stats = rows[0];
  return {
    totalProjects: stats?.totalProjects || 0,
    activeProjects: stats?.activeProjects || 0,
    totalContractValue: stats?.totalContractValue || 0,
    totalPaid: stats?.totalPaid || 0,
    totalOutstanding: Math.max((stats?.totalContractValue || 0) - (stats?.totalPaid || 0), 0),
  };
}
