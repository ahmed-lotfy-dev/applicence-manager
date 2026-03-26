import { Button } from "../../../shared/ui/button";
import { useI18n } from "../../../shared/i18n/I18nProvider";

interface DashboardHeaderProps {
  userEmail: string;
}

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const { locale, setLocale, t, dir } = useI18n();
  return (
    <header
      className={
        dir === "rtl"
          ? "glass-header sticky top-0 z-30 border-b border-border/10 lg:pr-72"
          : "glass-header sticky top-0 z-30 border-b border-border/10 lg:pl-72"
      }
    >
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.4rem] bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
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
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80">
              Fawtarly
            </p>
            <h1 className="text-lg font-extrabold tracking-tight text-text leading-none">{t("header.workspace")}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full bg-bg-light px-2 py-2 sm:flex">
            <span className={dir === "rtl" ? "pr-2 text-[11px] uppercase tracking-[0.14em] text-text-muted/70" : "pl-2 text-[11px] uppercase tracking-[0.14em] text-text-muted/70"}>{t("header.language")}</span>
            <Button
              type="button"
              variant={locale === "en" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 normal-case tracking-normal"
              onClick={() => setLocale("en")}
            >
              {t("header.lang.en")}
            </Button>
            <Button
              type="button"
              variant={locale === "ar" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 normal-case tracking-normal"
              onClick={() => setLocale("ar")}
            >
              {t("header.lang.ar")}
            </Button>
          </div>
          <div className="hidden rounded-full bg-bg-light px-4 py-2 sm:block">
            <span className="text-sm font-medium text-text-muted">{userEmail}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
