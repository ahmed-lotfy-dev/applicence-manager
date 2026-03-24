import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/db";
import { clients } from "../db/auth-schema";

export async function listClients(userId: string) {
  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(asc(clients.name));
}

export async function getClientById(userId: string, id: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, userId), eq(clients.id, id)));
  return client ?? null;
}

export async function createClient(
  userId: string,
  input: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    status?: "active" | "inactive";
  },
) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Client name is required" };

  const id = crypto.randomUUID();
  await db.insert(clients).values({
    id,
    userId,
    name,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    notes: input.notes?.trim() || null,
    status: input.status || "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await getClientById(userId, id);
  if (!created) return { ok: false as const, error: "Failed to create client" };
  return { ok: true as const, client: created };
}

export async function updateClient(
  userId: string,
  id: string,
  input: {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
    status?: "active" | "inactive";
  },
) {
  const existing = await getClientById(userId, id);
  if (!existing) return { ok: false as const, error: "Client not found" };
  if (existing.isDeleted) return { ok: false as const, error: "Archived clients cannot be edited" };

  const nextName = input.name?.trim() || existing.name;
  if (!nextName) return { ok: false as const, error: "Client name is required" };

  await db
    .update(clients)
    .set({
      name: nextName,
      email: input.email !== undefined ? input.email.trim() || null : existing.email,
      phone: input.phone !== undefined ? input.phone.trim() || null : existing.phone,
      notes: input.notes !== undefined ? input.notes.trim() || null : existing.notes,
      status: input.status || (existing.status as "active" | "inactive"),
      updatedAt: new Date(),
    })
    .where(and(eq(clients.userId, userId), eq(clients.id, id)));

  const updated = await getClientById(userId, id);
  if (!updated) return { ok: false as const, error: "Failed to update client" };
  return { ok: true as const, client: updated };
}

export async function deleteClient(userId: string, id: string) {
  const existing = await getClientById(userId, id);
  if (!existing) return { ok: false as const, error: "Client not found" };
  if (existing.isDeleted) return { ok: false as const, error: "Client already archived" };

  await db
    .update(clients)
    .set({
      isDeleted: true,
      status: "inactive",
      updatedAt: new Date(),
    })
    .where(and(eq(clients.userId, userId), eq(clients.id, id)));

  const archived = await getClientById(userId, id);
  if (!archived) return { ok: false as const, error: "Failed to archive client" };
  return { ok: true as const, client: archived };
}
