import { lazy, Suspense, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DashboardNav, type DashboardPage as DashboardPageType } from "../components/DashboardNav";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { authClient } from "../../../lib/auth-client";
import type { ActivationFilter } from "../types/dashboard";
import { DashboardHeader } from "../components/DashboardHeader";

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
    removeClient,
    createNewInvoice,
    updateExistingInvoice,
    removeInvoice,
    saveFreelancerProfile,
    uploadProfileLogo,
    queueInvoicePdfGeneration,
    refreshInvoicePdfJob,
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
      Loading section...
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#060816] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[130px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-cta/10 blur-[110px]" />

      <DashboardHeader userEmail={userEmail} onLogout={handleLogout} />
      <DashboardNav page={page} />

      <main className="relative z-10 mx-auto w-full max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={pageLoadingFallback}>
          {page === "overview" && (
            <OverviewPage
              stats={stats}
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
              onRemoveClient={removeClient}
              onCreateInvoice={createNewInvoice}
              onUpdateInvoice={updateExistingInvoice}
              onRemoveInvoice={removeInvoice}
              onSaveFreelancerProfile={saveFreelancerProfile}
              onUploadProfileLogo={uploadProfileLogo}
              onQueueInvoicePdf={queueInvoicePdfGeneration}
              onRefreshInvoicePdfJob={refreshInvoicePdfJob}
            />
          )}

          {page === "licensing" && (
            <LicensesPanel
              licenses={licenses}
              activations={filteredActivations}
              apps={apps}
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
      </main>
    </div>
  );
}
