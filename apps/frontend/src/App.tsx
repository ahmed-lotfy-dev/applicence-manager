import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { LoginPage } from "./features/auth/components/LoginPage";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { OnboardingPage } from "./features/onboarding/OnboardingPage";
import { isSetupComplete } from "./features/onboarding/setup";
import "./styles.css";
import { authClient } from "./lib/auth-client";
import { fetchFreelancerProfile, updateFreelancerProfile, uploadFreelancerLogo } from "./lib/api-client";
import { AppI18nProvider, useI18n } from "./shared/i18n/I18nProvider";
import type { FreelancerProfile } from "./features/dashboard/types/dashboard";

function detectDefaultLocale(): "en" | "ar" {
  const stored = localStorage.getItem("fawtarly_locale");
  if (stored === "ar" || stored === "en") return stored;
  const lang = navigator.language.toLowerCase();
  return lang.startsWith("ar") ? "ar" : "en";
}

function DashboardRoutes({ onLogout }: { onLogout: () => void }) {
  const { locale } = useParams<{ locale: string }>();
  const validLocale = locale === "en" || locale === "ar" ? locale : detectDefaultLocale();

  return (
    <Routes>
      <Route path="/:locale">
        <Route index element={<Navigate to={`/${validLocale}/overview`} replace />} />
        <Route path="onboarding" element={<Navigate to={`/${validLocale}/overview`} replace />} />
        <Route path="overview" element={<DashboardPage onLogout={onLogout} />} />
        <Route path="freelance" element={<Navigate to={`/${validLocale}/branding`} replace />} />
        <Route path="branding" element={<DashboardPage onLogout={onLogout} />} />
        <Route path="clients" element={<DashboardPage onLogout={onLogout} />} />
        <Route path="projects" element={<DashboardPage onLogout={onLogout} />} />
        <Route path="projects/:projectId" element={<DashboardPage onLogout={onLogout} />} />
        <Route path="invoices" element={<DashboardPage onLogout={onLogout} />} />
        <Route path="licensing" element={<DashboardPage onLogout={onLogout} />} />
        <Route path="settings" element={<DashboardPage onLogout={onLogout} />} />
        <Route path="activations" element={<Navigate to={`/${validLocale}/licensing`} replace />} />
        <Route path="*" element={<Navigate to={`/${validLocale}/overview`} replace />} />
      </Route>
      <Route path="*" element={<Navigate to={`/${validLocale}/overview`} replace />} />
    </Routes>
  );
}

function OnboardingRoutes({
  profile,
  onComplete,
}: {
  profile: FreelancerProfile | null;
  onComplete: (profile: FreelancerProfile) => void;
}) {
  const { locale } = useParams<{ locale: string }>();
  const validLocale = locale === "en" || locale === "ar" ? locale : detectDefaultLocale();

  return (
    <Routes>
      <Route path="/:locale">
        <Route
          path="onboarding"
          element={
            <OnboardingPage
              profile={profile}
              onSaveProfile={updateFreelancerProfile}
              onUploadLogo={uploadFreelancerLogo}
              onComplete={onComplete}
            />
          }
        />
        <Route path="*" element={<Navigate to={`/${validLocale}/overview`} replace />} />
      </Route>
      <Route path="*" element={<Navigate to={`/${validLocale}/overview`} replace />} />
    </Routes>
  );
}

function AppInner() {
  const { setLocale } = useI18n();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);

  useEffect(() => {
    const init = async () => {
      const session = await authClient.getSession();
      if (session.authenticated) {
        setIsAuthenticated(true);
        const nextProfile = await fetchFreelancerProfile();
        setProfile(nextProfile);
        if (nextProfile?.appLanguage) {
          setLocale(nextProfile.appLanguage);
        }
      }
      setReady(true);
    };

    void init();
  }, [setLocale]);

  if (!ready) return null;

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const needsOnboarding = !isSetupComplete(profile);

  return (
    <ProtectedRoute onUnauthenticated={() => setIsAuthenticated(false)}>
      {needsOnboarding ? (
        <OnboardingRoutes
          profile={profile}
          onComplete={(nextProfile) => setProfile(nextProfile)}
        />
      ) : (
        <DashboardRoutes onLogout={() => setIsAuthenticated(false)} />
      )}
    </ProtectedRoute>
  );
}

function App() {
  const { locale: urlLocale } = useParams<{ locale: string }>();
  const syncLocale = urlLocale === "en" || urlLocale === "ar" ? urlLocale : undefined;

  return (
    <AppI18nProvider syncLocale={syncLocale}>
      <AppInner />
    </AppI18nProvider>
  );
}

export default App;
