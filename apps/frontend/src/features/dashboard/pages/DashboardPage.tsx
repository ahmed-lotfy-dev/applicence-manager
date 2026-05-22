import { lazy, Suspense, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  DashboardNav,
  type DashboardPage as DashboardPageType,
} from "../components/DashboardNav";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { authClient } from "../../../lib/auth-client";
import { fetchNextInvoiceNo } from "../../../lib/api/invoices";
import type { ActivationFilter } from "../types/dashboard";
import { DashboardHeader } from "../components/DashboardHeader";
import { SkeletonCard } from "../../../shared/ui/skeleton";
import { useI18n } from "../../../shared/i18n/I18nProvider";

const OverviewPage = lazy(async () => {
  const module = await import("./OverviewPage");
  return { default: module.OverviewPage };
});

const FreelanceOpsPanel = lazy(async () => {
  const module = await import("../components/FreelanceOpsPanel");
  return { default: module.FreelanceOpsPanel };
});

const LicensesPanel = lazy(async () => {
  const module = await import("../components/LicensesPanel");
  return { default: module.LicensesPanel };
});

const SettingsPage = lazy(async () => {
  const module = await import("./SettingsPage");
  return { default: module.SettingsPage };
});

const ProjectsSection = lazy(async () => {
  const module = await import("../components/ProjectsSection");
  return { default: module.ProjectsSection };
});

interface DashboardPageProps {
  onLogout: () => void;
}

export function DashboardPage({ onLogout }: DashboardPageProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const urlActivationFilter = searchParams.get(
    "filter",
  ) as ActivationFilter | null;
  const { dir, t } = useI18n();
  const page: DashboardPageType = useMemo(() => {
    const path = location.pathname.replace(/^\/(en|ar)/, "");
    if (path.startsWith("/projects/")) return "project-detail";
    if (path.startsWith("/projects")) return "projects";
    if (path.startsWith("/branding")) return "branding";
    if (path.startsWith("/clients")) return "clients";
    if (path.startsWith("/invoices")) return "invoices";
    if (path.startsWith("/freelance")) return "branding";
    if (path.startsWith("/licensing")) return "licensing";
    if (path.startsWith("/settings")) return "settings";
    return "overview";
  }, [location.pathname]);

  const projectId = useMemo(() => {
    if (page !== "project-detail") return null;
    const match = location.pathname.match(/projects\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname, page]);
  const [selectedTab, setSelectedTab] = useState<ActivationFilter>(
    urlActivationFilter &&
      ["all", "pending", "active", "revoked"].includes(urlActivationFilter)
      ? urlActivationFilter
      : "all",
  );
  const {
    clients,
    invoices,
    freelancerProfile,
    invoicePdfJobs,
    getInvoicePdfUrl,
    billingStats,
    userEmail,
    error,
    isCreatingClient,
    isCreatingInvoice,
    createNewClient,
    hardDeleteClient,
    removeClient,
    restoreExistingClient,
    updateExistingClient,
    createNewInvoice,
    updateExistingInvoice,
    removeInvoice,
    restoreExistingInvoice,
    hardDeleteInvoice,
    saveFreelancerProfile,
    uploadProfileLogo,
    queueInvoicePdfGeneration,
    refreshInvoicePdfJob,
    sendInvoiceToEmail,
  } = useDashboardData(onLogout);

  const { data: nextInvoiceNo = "" } = useQuery({
    queryKey: ["nextInvoiceNo"],
    queryFn: fetchNextInvoiceNo,
  });

  const handleLogout = async () => {
    await authClient.signOut();
    onLogout();
  };

  const pageLoadingFallback = <SkeletonCard className="w-full" />;

  return (
    <div className="min-h-screen w-full bg-bg">
      <DashboardHeader userEmail={userEmail} />
      <DashboardNav page={page} onLogout={handleLogout} />

      <main
        className={
          dir === "rtl"
            ? "relative z-10 w-full space-y-10 px-4 py-8 sm:px-6 lg:pr-72 lg:px-8"
            : "relative z-10 w-full space-y-10 px-4 py-8 sm:px-6 lg:pl-72 lg:px-8"
        }
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-10">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/75">
              {page === "overview"
                ? t("dashboard.page.overview.kicker")
                : page === "licensing"
                  ? t("dashboard.page.licensing.kicker")
                  : page === "projects"
                    ? t("projects.kicker")
                    : page === "clients"
                      ? t("dashboard.page.clients.kicker")
                      : page === "invoices"
                        ? t("dashboard.page.invoices.kicker")
                        : page === "settings"
                          ? t("dashboard.page.settings.kicker")
                          : t("dashboard.page.branding.kicker")}
            </p>
            <h1 className="text-4xl font-black tracking-tight text-text sm:text-5xl">
              {page === "overview"
                ? t("dashboard.page.overview.title")
                : page === "licensing"
                  ? t("dashboard.page.licensing.title")
                  : page === "project-detail"
                    ? t("projects.detail")
                    : page === "projects"
                      ? t("projects.title")
                      : page === "clients"
                        ? t("dashboard.page.clients.title")
                        : page === "invoices"
                          ? t("dashboard.page.invoices.title")
                          : page === "settings"
                            ? t("dashboard.page.settings.title")
                            : t("dashboard.page.branding.title")}
            </h1>
          </div>
          <Suspense fallback={pageLoadingFallback}>
            {page === "overview" && (
              <OverviewPage
                billingStats={billingStats}
                clientsCount={clients.length}
                invoicesCount={invoices.length}
                currency={freelancerProfile?.defaultCurrency}
              />
            )}

            {(page === "branding" ||
              page === "clients" ||
              page === "invoices") && (
              <FreelanceOpsPanel
                view={page}
                error={error}
                clients={clients}
                invoices={invoices}
                freelancerProfile={freelancerProfile}
                invoicePdfJobs={invoicePdfJobs}
                getInvoicePdfUrl={getInvoicePdfUrl}
                billingStats={billingStats}
                nextInvoiceNo={nextInvoiceNo ?? ""}
                isCreatingClient={isCreatingClient}
                isCreatingInvoice={isCreatingInvoice}
                onCreateClient={createNewClient}
                onHardDeleteClient={hardDeleteClient}
                onRemoveClient={removeClient}
                onRestoreClient={restoreExistingClient}
                onUpdateClient={updateExistingClient}
                onCreateInvoice={createNewInvoice}
                onUpdateInvoice={updateExistingInvoice}
                onRemoveInvoice={removeInvoice}
                onRestoreInvoice={restoreExistingInvoice}
                onHardDeleteInvoice={hardDeleteInvoice}
                onSaveFreelancerProfile={saveFreelancerProfile}
                onUploadProfileLogo={uploadProfileLogo}
                onQueueInvoicePdf={queueInvoicePdfGeneration}
                onRefreshInvoicePdfJob={refreshInvoicePdfJob}
                onSendInvoiceEmail={sendInvoiceToEmail}
              />
            )}

            {page === "projects" && (
              <ProjectsSection />
            )}

            {page === "project-detail" && (
              <ProjectsSection projectId={projectId ?? undefined} />
            )}

            {page === "licensing" && (
              <LicensesPanel
                activationFilter={selectedTab}
                onActivationFilterChange={setSelectedTab}
                onLogout={handleLogout}
                activationError={error}
              />
            )}

            {page === "settings" && (
              <SettingsPage
                freelancerProfile={freelancerProfile}
                onSaveFreelancerProfile={saveFreelancerProfile}
              />
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
