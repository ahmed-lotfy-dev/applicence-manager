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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2.1H12Z"
      />
      <path
        fill="#34A853"
        d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.5-1.7-5.3-3.9l-3.2 2.5C5.1 18.8 8.3 21 12 21Z"
      />
      <path
        fill="#FBBC05"
        d="M6.7 13.1c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9l-3.2-2.5C2.9 8.1 2.5 9.5 2.5 11s.4 2.9 1 4.2l3.2-2.1Z"
      />
      <path
        fill="#4285F4"
        d="M12 5.1c1.4 0 2.6.5 3.6 1.4l2.7-2.7C16.7 2.3 14.5 1.5 12 1.5c-3.7 0-6.9 2.2-8.5 5.3l3.2 2.5c.8-2.3 2.8-4.2 5.3-4.2Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-white">
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.8 1.1 1.8 1.1 1 .1 1.9-.6 2.4-1.1.1-.7.4-1.2.7-1.5-2.7-.3-5.5-1.3-5.5-6A4.7 4.7 0 0 1 5.4 7c-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 3.6 18 4 18 4c.7 1.6.3 2.8.2 3.1A4.7 4.7 0 0 1 19.5 10c0 4.7-2.8 5.7-5.5 6 .4.3.8 1 .8 2.1v3.1c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await authClient.signIn(email, password);
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (result.success) {
      onLogin();
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setError('');
    setSocialLoading(provider);

    const result = await authClient.signInSocial(provider);
    if (result.error) {
      setError(result.error);
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(128,131,255,0.18),transparent_28%),radial-gradient(circle_at_85%_22%,rgba(255,183,131,0.08),transparent_18%),radial-gradient(circle_at_80%_82%,rgba(192,193,255,0.12),transparent_24%)]" />
      <Card className="relative w-full max-w-md overflow-hidden border-border/12 bg-bg-card/92 backdrop-blur-2xl">
        <CardHeader className="space-y-3 pt-10 pb-7 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/75">Fawtarly</p>
          <CardTitle className="text-3xl font-black tracking-tight text-text">{t('auth.title')}</CardTitle>
          <p className="text-text-muted font-medium tracking-wide text-sm opacity-75">{t('auth.subtitle')}</p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {error && (
            <div className="rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="relative w-full justify-center border-border/15 bg-bg-light text-text hover:bg-bg-card-high"
              disabled={isLoading || socialLoading !== null}
              onClick={() => handleSocialLogin('google')}
            >
              <span className="absolute left-4 top-1/2 -translate-y-1/2">
                <GoogleIcon />
              </span>
              {socialLoading === 'google' ? t('auth.socialLoading') : t('auth.google')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="relative w-full justify-center border-border/15 bg-bg-light text-text hover:bg-bg-card-high"
              disabled={isLoading || socialLoading !== null}
              onClick={() => handleSocialLogin('github')}
            >
              <span className="absolute left-4 top-1/2 -translate-y-1/2">
                <GitHubIcon />
              </span>
              {socialLoading === 'github' ? t('auth.socialLoading') : t('auth.github')}
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-text-muted/55">
            <span className="h-px flex-1 bg-border/15" />
            <span>{t('auth.or')}</span>
            <span className="h-px flex-1 bg-border/15" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="ml-1 text-text-muted font-semibold">
                {t('auth.email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="ml-1 text-text-muted font-semibold">
                {t('auth.password')}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || socialLoading !== null}>
              {isLoading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
