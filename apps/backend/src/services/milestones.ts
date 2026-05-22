import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db/db";
import { invoices, milestones, projects } from "../db/auth-schema";
import { toAmountCents } from "./utils";

export async function listMilestones(projectId: string) {
  return db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(asc(milestones.sortOrder));
}

export async function addMilestone(
  userId: string,
  projectId: string,
  input: {
    name: string;
    description?: string;
    amount: number;
    dueDate?: string;
  },
) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)));
  if (!project) return { ok: false as const, error: "Project not found" };

  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Milestone name is required" };

  const amountCents = toAmountCents(input.amount);

  const existingMilestones = await db
    .select({ sumAmount: sql<number>`COALESCE(SUM(${milestones.amount}), 0)`.mapWith(Number) })
    .from(milestones)
    .where(eq(milestones.projectId, projectId));

  const currentSum = existingMilestones[0]?.sumAmount || 0;
  const projectTotalCents = project.totalAmount * 100;
  if (currentSum + amountCents > projectTotalCents) {
    return { ok: false as const, error: "Milestone amounts exceed project total" };
  }

  const [last] = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${milestones.sortOrder}), -1)`.mapWith(Number) })
    .from(milestones)
    .where(eq(milestones.projectId, projectId));

  const id = crypto.randomUUID();
  await db.insert(milestones).values({
    id,
    projectId,
    name,
    description: input.description?.trim() || null,
    amount: amountCents,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    sortOrder: (last?.maxOrder || -1) + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [created] = await db.select().from(milestones).where(eq(milestones.id, id));
  return { ok: true as const, milestone: created };
}

export async function removeMilestone(userId: string, projectId: string, milestoneId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)));
  if (!project) return { ok: false as const, error: "Project not found" };

  const [milestone] = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)));
  if (!milestone) return { ok: false as const, error: "Milestone not found" };

  if (milestone.invoiceId) {
    return { ok: false as const, error: "Cannot remove milestone that has an invoice. Archive the invoice first." };
  }

  await db
    .delete(milestones)
    .where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)));

  return { ok: true as const };
}

export async function generateInvoiceFromMilestone(
  userId: string,
  projectId: string,
  milestoneId: string,
  invoiceNo?: string,
) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)));
  if (!project) return { ok: false as const, error: "Project not found" };

  const [milestone] = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)));
  if (!milestone) return { ok: false as const, error: "Milestone not found" };

  if (milestone.invoiceId) {
    return { ok: false as const, error: "Invoice already generated from this milestone" };
  }

  const invoiceId = crypto.randomUUID();
  const finalInvoiceNo = invoiceNo?.trim() || (await getNextProjectInvoiceNo(userId));

  await db.insert(invoices).values({
    id: invoiceId,
    userId,
    clientId: project.clientId,
    projectId: project.id,
    invoiceNo: finalInvoiceNo,
    status: "draft",
    currency: "USD",
    invoiceLanguage: "en",
    isDeleted: false,
    totalAmount: milestone.amount,
    paidAmount: 0,
    dueDate: milestone.dueDate,
    issuedAt: milestone.dueDate || new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db
    .update(milestones)
    .set({ invoiceId, updatedAt: new Date() })
    .where(eq(milestones.id, milestoneId));

  const [created] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId));

  return { ok: true as const, invoice: created };
}

async function getNextProjectInvoiceNo(userId: string): Promise<string> {
  const rows = await db
    .select({ invoiceNo: invoices.invoiceNo })
    .from(invoices)
    .where(eq(invoices.userId, userId));

  let max = 0;
  for (const row of rows) {
    const trimmed = row.invoiceNo.trim();
    const match = trimmed.match(/(\d+)$/);
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > max) max = parsed;
    }
  }
  const next = max + 1;
  return String(next).padStart(3, "0");
}
