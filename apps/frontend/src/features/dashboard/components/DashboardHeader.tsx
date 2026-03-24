import { Button } from "../../../shared/ui/button";
import { useI18n } from "../../../shared/i18n/I18nProvider";

interface DashboardHeaderProps {
  userEmail: string;
  onLogout: () => void;
}

export function DashboardHeader({ userEmail, onLogout }: DashboardHeaderProps) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-7xl rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md shadow-soft ring-1 ring-white/5">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.02)]">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 120 120"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={8}
                  d="M60 10C35 15 20 30 20 55C20 85 45 105 60 110C75 105 100 85 100 55C100 30 85 15 60 10Z M45 60L55 70L75 50"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
                Fawtarly
              </p>
              <h1 className="text-lg font-bold text-white leading-none">{t("header.workspace")}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-1 sm:flex">
              <span className="text-xs text-slate-400">{t("header.language")}</span>
              <Button
                type="button"
                variant={locale === "en" ? "default" : "outline"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setLocale("en")}
              >
                {t("header.lang.en")}
              </Button>
              <Button
                type="button"
                variant={locale === "ar" ? "default" : "outline"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setLocale("ar")}
              >
                {t("header.lang.ar")}
              </Button>
            </div>
            <span className="hidden text-sm font-medium text-slate-400 sm:block">
              {userEmail}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="rounded-full px-5 border-white/10 text-white shadow-none hover:bg-white/10 hover:border-white/20"
            >
              {t("header.logout")}
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}
