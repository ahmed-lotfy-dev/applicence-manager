import { useState } from 'react';
import { authClient } from '../../../lib/auth-client';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import { Button } from '../../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await authClient.signIn(email, password);
      if (result.error) {
        setError(result.error || t('auth.invalidCredentials'));
      } else if (result.success) {
        onLogin();
      }
    } catch {
      setError(t('auth.signInError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_0%_0%,rgba(129,140,248,0.12),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(251,113,133,0.08),transparent_50%),linear-gradient(180deg,#060816_0%,#0A0F1F_100%)]">
      <Card className="w-full max-w-md bg-white/3 backdrop-blur-2xl border-white/5 shadow-soft-xl overflow-hidden ring-1 ring-white/5">
        <CardHeader className="space-y-2 border-b border-white/5 bg-white/2 pt-10 pb-8 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-white">{t('auth.title')}</CardTitle>
          <p className="text-slate-400 font-medium tracking-wide text-sm opacity-60">{t('auth.subtitle')}</p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {error && <div className="mb-4 rounded-lg border border-danger/30 bg-danger/20 p-3 text-sm text-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-slate-300 font-semibold ml-1">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-slate-300 font-semibold ml-1">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
