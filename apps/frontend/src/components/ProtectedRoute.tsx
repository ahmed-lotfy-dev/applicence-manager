import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { authClient } from '../lib/auth-client';

interface ProtectedRouteProps {
  children: ReactNode;
  onUnauthenticated: () => void;
}

export function ProtectedRoute({ children, onUnauthenticated }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession();
      if (!session.authenticated) {
        onUnauthenticated();
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [onUnauthenticated]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="flex items-center gap-3 py-6">
            <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
            <p className="text-sm text-text-muted">Checking session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
