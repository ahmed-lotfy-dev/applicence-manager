import { Elysia } from "elysia";
import { getAuthenticatedUserId } from "../lib/request-auth";
import { getProjectStats } from "../services/projects";
import { getBillingStats } from "../services/invoices";

export const dashboardRoutes = new Elysia({
  name: "dashboard-routes",
  prefix: "/api/dashboard",
})
  .get("/stats", async ({ request, set }) => {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const [projectsStats, invoiceStats] = await Promise.all([
      getProjectStats(userId),
      getBillingStats(userId),
    ]);
    return {
      stats: {
        projects: projectsStats,
        invoices: invoiceStats,
      },
    };
  });
