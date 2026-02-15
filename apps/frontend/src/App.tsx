import { useEffect, useMemo, useState } from 'react';
import './styles.css';
import { ActivationsTable } from './components/dashboard/ActivationsTable';
import { FilterTabs } from './components/dashboard/FilterTabs';
import { LicensesPanel } from './components/dashboard/LicensesPanel';
import { StatsCards } from './components/dashboard/StatsCards';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { useDashboardData } from './hooks/use-dashboard-data';
import { authClient } from './lib/auth-client';
import type { ActivationFilter } from './types/dashboard';

interface DashboardProps {
  onLogout: () => void;
}

function DashboardHeader({ userEmail, onLogout }: { userEmail: string; onLogout: () => void }) {
  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-7xl rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md shadow-soft ring-1 ring-white/5">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.02)]">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 120 120" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={8}
                  d="M60 10C35 15 20 30 20 55C20 85 45 105 60 110C75 105 100 85 100 55C100 30 85 15 60 10Z M45 60L55 70L75 50"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">AppLicence</p>
              <h1 className="text-lg font-bold text-white leading-none">Manager</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-slate-400 sm:block">{userEmail}</span>
            <Button variant="outline" size="sm" onClick={onLogout} className="rounded-full px-5 border-white/10 text-white shadow-none hover:bg-white/10 hover:border-white/20">
              Logout
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}

function Dashboard({ onLogout }: DashboardProps) {
  const [selectedTab, setSelectedTab] = useState<ActivationFilter>('all');
  const {
    activations,
    licenses,
    apps,
    stats,
    userEmail,
    loading,
    error,
    actionLoadingId,
    licenseActionLoadingId,
    isCreatingLicense,
    isCreatingApp,
    appActionLoadingId,
    licenseFilter,
    setLicenseFilter,
    changeStatus,
    createNewLicense,
    createNewApp,
    updateApp,
    removeApp,
    updateExistingLicense,
    removeLicense,
    changeLicenseStatus,
  } = useDashboardData(onLogout);

  const filteredActivations = useMemo(() => {
    if (selectedTab === 'all') return activations;
    return activations.filter((activation) => activation.status === selectedTab);
  }, [activations, selectedTab]);

  const handleLogout = async () => {
    await authClient.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen w-full bg-[#060816] relative overflow-hidden">
      {/* Soft Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[130px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-cta/10 blur-[110px]" />

      <DashboardHeader userEmail={userEmail} onLogout={handleLogout} />

      <main className="relative z-10 mx-auto w-full max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <StatsCards stats={stats} />

        <LicensesPanel
          licenses={licenses}
          apps={apps}
          filterValue={licenseFilter}
          onFilterChange={setLicenseFilter}
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
        />

        <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
          <CardHeader className="space-y-2 border-b border-white/5 pb-6">
            <CardTitle className="text-xl text-white">Activation Requests</CardTitle>
            <p className="text-sm text-slate-400">Review pending machines and enforce license compliance.</p>
            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/20 p-3 text-sm text-danger">{error}</div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <FilterTabs selectedTab={selectedTab} onSelect={setSelectedTab} />
            <ActivationsTable
              activations={filteredActivations}
              loading={loading}
              actionLoadingId={actionLoadingId}
              onApprove={(id) => {
                void changeStatus(id, 'approve');
              }}
              onRevoke={(id) => {
                void changeStatus(id, 'revoke');
              }}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession();
      setIsAuthenticated(session.authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060816]">
        <div className="text-slate-500 font-medium tracking-widest uppercase text-xs animate-pulse">Loading Manager...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <ProtectedRoute onUnauthenticated={() => setIsAuthenticated(false)}>
      <Dashboard onLogout={() => setIsAuthenticated(false)} />
    </ProtectedRoute>
  );
}

export default App;
