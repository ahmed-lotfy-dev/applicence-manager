import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./features/auth/components/LoginPage";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import "./styles.css";
import { authClient } from "./lib/auth-client";
import { useI18n } from "./shared/i18n/I18nProvider";

function App() {
  const { t } = useI18n();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession();
      setIsAuthenticated(session.authenticated);
      setIsLoading(false);
    };

    void checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-slate-500 font-medium tracking-widest uppercase text-xs animate-pulse">
          {t("app.loading")}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <ProtectedRoute onUnauthenticated={() => setIsAuthenticated(false)}>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
        <Route path="/freelance" element={<Navigate to="/branding" replace />} />
        <Route path="/branding" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
        <Route path="/clients" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
        <Route path="/invoices" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
        <Route path="/licensing" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
        <Route path="/activations" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </ProtectedRoute>
  );
}

export default App;
