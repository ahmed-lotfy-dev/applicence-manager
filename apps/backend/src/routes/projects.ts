import { Elysia, t } from "elysia";
import { getAuthenticatedUserId } from "../lib/request-auth";
import { createProject, deleteProject, getProjectById, getProjectDetail, getProjectStats, listProjects, updateProject } from "../services/projects";
import { addMilestone, generateInvoiceFromMilestone, removeMilestone } from "../services/milestones";
import { deletePayment, recordPayment } from "../services/payments";

export const projectRoutes = new Elysia({
  name: "project-routes",
  prefix: "/api/projects",
})
  .get("/", async ({ request, set, query }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const status = (query as { status?: string }).status;
    const rows = await listProjects(userId, status);
    return { projects: rows };
  })
  .get("/stats", async ({ request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const stats = await getProjectStats(userId);
    return { stats };
  })
  .post(
    "/",
    async ({ request, body, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const result = await createProject(userId, body as {
        clientId: string;
        name: string;
        description?: string;
        projectType?: "milestone" | "standard";
        totalAmount: number;
        status?: "draft" | "active" | "completed" | "cancelled";
        notes?: string;
      });
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }
      return { success: true, project: result.project };
    },
    {
      body: t.Object({
        clientId: t.String({ minLength: 1 }),
        name: t.String({ minLength: 1, maxLength: 200 }),
        description: t.Optional(t.String({ maxLength: 2000 })),
        projectType: t.Optional(t.Union([t.Literal("milestone"), t.Literal("standard")])),
        totalAmount: t.Number({ minimum: 0 }),
        status: t.Optional(t.Union([t.Literal("draft"), t.Literal("active"), t.Literal("completed"), t.Literal("cancelled")])),
        notes: t.Optional(t.String({ maxLength: 2000 })),
      }),
    },
  )
  .get("/:id", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const detail = await getProjectDetail(userId, params.id);
    if (!detail) {
      set.status = 404;
      return { error: "Project not found" };
    }
    return { project: detail.project, invoices: detail.invoices, milestones: detail.milestones, payments: detail.payments };
  })
  .patch(
    "/:id",
    async ({ request, params, body, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const result = await updateProject(userId, params.id, body as {
        name?: string;
        description?: string | null;
        totalAmount?: number;
        status?: "draft" | "active" | "completed" | "cancelled";
        notes?: string | null;
      });
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }
      return { success: true, project: result.project };
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
        description: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
        totalAmount: t.Optional(t.Number({ minimum: 0 })),
        status: t.Optional(t.Union([t.Literal("draft"), t.Literal("active"), t.Literal("completed"), t.Literal("cancelled")])),
        notes: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
      }),
    },
  )
  .delete("/:id", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const result = await deleteProject(userId, params.id);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }
    return { success: true };
  })
  .post(
    "/:id/milestones",
    async ({ request, params, body, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const result = await addMilestone(userId, params.id, body as {
        name: string;
        description?: string;
        amount: number;
        dueDate?: string;
      });
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }
      return { success: true, milestone: result.milestone };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 200 }),
        description: t.Optional(t.String({ maxLength: 2000 })),
        amount: t.Number({ minimum: 0 }),
        dueDate: t.Optional(t.String({ minLength: 4, maxLength: 40 })),
      }),
    },
  )
  .delete("/:id/milestones/:mid", async ({ request, params, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }
    const result = await removeMilestone(userId, params.id, params.mid);
    if (!result.ok) {
      set.status = 400;
      return { success: false, error: result.error };
    }
    return { success: true };
  })
  .post(
    "/:id/milestones/:mid/generate-invoice",
    async ({ request, params, body, set }) => {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }
      const result = await generateInvoiceFromMilestone(
        userId,
        params.id,
        params.mid,
        (body as { invoiceNo?: string }).invoiceNo,
      );
      if (!result.ok) {
        set.status = 400;
        return { success: false, error: result.error };
      }
      return { success: true, invoice: result.invoice };
    },
    {
      body: t.Object({
        invoiceNo: t.Optional(t.String({ maxLength: 80 })),
      }),
    },
  );
