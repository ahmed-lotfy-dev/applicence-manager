import { lazy, Suspense, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DashboardNav, type DashboardPage as DashboardPageType } from "../components/DashboardNav";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { authClient } from "../../../lib/auth-client";
import type { ActivationFilter } from "../types/dashboard";
import { DashboardHeader } from "../components/DashboardHeader";
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

interface DashboardPageProps {
  onLogout: () => void;
}

export function DashboardPage({ onLogout }: DashboardPageProps) {
  const location = useLocation();
  const { dir, t } = useI18n();
  const page: DashboardPageType = useMemo(() => {
    if (location.pathname.startsWith("/branding")) return "branding";
    if (location.pathname.startsWith("/clients")) return "clients";
    if (location.pathname.startsWith("/invoices")) return "invoices";
    if (location.pathname.startsWith("/freelance")) return "branding";
    if (location.pathname.startsWith("/licensing")) return "licensing";
    return "overview";
  }, [location.pathname]);
  const [selectedTab, setSelectedTab] = useState<ActivationFilter>("all");
  const {
    activations,
    licenses,
    apps,
    clients,
    invoices,
    freelancerProfile,
    invoicePdfJobs,
    getInvoicePdfUrl,
    billingStats,
    stats,
    userEmail,
    nextInvoiceNo,
    loading,
    error,
    actionLoadingId,
    licenseActionLoadingId,
    isCreatingLicense,
    isCreatingApp,
    isCreatingClient,
    isCreatingInvoice,
    appActionLoadingId,
    licenseFilter,
    setLicenseFilter,
    changeStatus,
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
    createNewLicense,
    createNewApp,
    updateApp,
    removeApp,
    updateExistingLicense,
    removeLicense,
    changeLicenseStatus,
  } = useDashboardData(onLogout);

  const filteredActivations = useMemo(() => {
    if (selectedTab === "all") return activations;
    return activations.filter((activation) => activation.status === selectedTab);
  }, [activations, selectedTab]);

  const handleLogout = async () => {
    await authClient.signOut();
    onLogout();
  };

  const pageLoadingFallback = (
    <div className="rounded-[2rem] surface-panel p-6 text-sm text-text-muted">
      {t("dashboard.loadingSection")}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-bg">
      <DashboardHeader userEmail={userEmail} onLogout={handleLogout} />
      <DashboardNav page={page} />

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
                  : page === "clients"
                    ? t("dashboard.page.clients.kicker")
                    : page === "invoices"
                      ? t("dashboard.page.invoices.kicker")
                      : t("dashboard.page.branding.kicker")}
            </p>
            <h1 className="text-4xl font-black tracking-tight text-text sm:text-5xl">
              {page === "overview"
                ? t("dashboard.page.overview.title")
                : page === "licensing"
                  ? t("dashboard.page.licensing.title")
                  : page === "clients"
                    ? t("dashboard.page.clients.title")
                    : page === "invoices"
                      ? t("dashboard.page.invoices.title")
                      : t("dashboard.page.branding.title")}
            </h1>
          </div>
          <Suspense fallback={pageLoadingFallback}>
            {page === "overview" && (
              <OverviewPage
                billingStats={billingStats}
                clientsCount={clients.length}
                invoicesCount={invoices.length}
              />
            )}

            {(page === "branding" || page === "clients" || page === "invoices") && (
              <FreelanceOpsPanel
                view={page}
                error={error}
                clients={clients}
                invoices={invoices}
                freelancerProfile={freelancerProfile}
                invoicePdfJobs={invoicePdfJobs}
                getInvoicePdfUrl={getInvoicePdfUrl}
                billingStats={billingStats}
                nextInvoiceNo={nextInvoiceNo}
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

            {page === "licensing" && (
              <LicensesPanel
                licenses={licenses}
                activations={filteredActivations}
                apps={apps}
                stats={stats}
                filterValue={licenseFilter}
                onFilterChange={setLicenseFilter}
                activationFilter={selectedTab}
                onActivationFilterChange={setSelectedTab}
                onCreateApp={createNewApp}
                onUpdateApp={updateApp}
                onRemoveApp={removeApp}
                onCreateLicense={createNewLicense}
                onUpdateLicense={updateExistingLicense}
                onRemoveLicense={removeLicense}
                onChangeLicenseStatus={changeLicenseStatus}
                isCreatingLicense={isCreatingLicense}
                isCreatingApp={isCreatingApp}
                appActionLoadingId={appActionLoadingId}
                licenseActionLoadingId={licenseActionLoadingId}
                activationActionLoadingId={actionLoadingId}
                loadingActivations={loading}
                activationError={error}
                onRevokeActivation={async (id) => {
                  await changeStatus(id, "revoke");
                }}
              />
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
