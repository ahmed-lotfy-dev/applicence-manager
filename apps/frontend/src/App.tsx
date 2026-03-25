import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./features/auth/components/LoginPage";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { OnboardingPage } from "./features/onboarding/OnboardingPage";
import { isSetupComplete } from "./features/onboarding/setup";
import "./styles.css";
import { authClient } from "./lib/auth-client";
import { fetchFreelancerProfile, updateFreelancerProfile, uploadFreelancerLogo } from "./lib/api-client";
import { useI18n } from "./shared/i18n/I18nProvider";
import type { FreelancerProfile } from "./features/dashboard/types/dashboard";

function App() {
  const { t, setLocale } = useI18n();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession();
      setIsAuthenticated(session.authenticated);
      setIsLoading(false);
    };

    void checkAuth();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }
      setIsProfileLoading(true);
      const nextProfile = await fetchFreelancerProfile();
      setProfile(nextProfile);
      if (nextProfile?.appLanguage) {
        setLocale(nextProfile.appLanguage);
      }
      setIsProfileLoading(false);
    };

    void loadProfile();
  }, [isAuthenticated, setLocale]);

  if (isLoading || (isAuthenticated && isProfileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="rounded-full surface-elevated px-5 py-3 text-text-muted font-medium tracking-[0.22em] uppercase text-[11px] animate-pulse">
          {t("app.loading")}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const needsOnboarding = !isSetupComplete(profile);

  return (
    <ProtectedRoute onUnauthenticated={() => setIsAuthenticated(false)}>
      <Routes>
        {needsOnboarding ? (
          <>
            <Route
              path="/onboarding"
              element={
                <OnboardingPage
                  profile={profile}
                  onSaveProfile={updateFreelancerProfile}
                  onUploadLogo={uploadFreelancerLogo}
                  onComplete={(nextProfile) => {
                    setProfile(nextProfile);
                    if (nextProfile.appLanguage) {
                      setLocale(nextProfile.appLanguage);
                    }
                  }}
                />
              }
            />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/onboarding" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
            <Route path="/freelance" element={<Navigate to="/branding" replace />} />
            <Route path="/branding" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
            <Route path="/clients" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
            <Route path="/invoices" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
            <Route path="/licensing" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
            <Route path="/activations" element={<Navigate to="/licensing" replace />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </>
        )}
      </Routes>
    </ProtectedRoute>
  );
}

export default App;
