import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import { useI18n } from "../../../shared/i18n/I18nProvider";

export type DashboardPage =
  | "overview"
  | "branding"
  | "clients"
  | "invoices"
  | "licensing";

interface DashboardNavProps {
  page: DashboardPage;
  onLogout: () => void;
}

function OverviewIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12.5 12 5l8 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 10.8V19h11v-8.2" />
    </svg>
  );
}

function BrandingIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a8 8 0 1 0 8 8c0-1.1-.9-2-2-2h-1.4a1.6 1.6 0 0 1-1.6-1.6c0-.9.7-1.6 1.6-1.6H18a2 2 0 0 0 2-2 8 8 0 0 0-8-1Z" />
      <circle cx="7.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="8.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="8.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ClientsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 19a3.5 3.5 0 0 0-7 0" />
      <circle cx="12" cy="9" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 18a3 3 0 0 0-2.5-2.95" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 15.05A3 3 0 0 0 4.5 18" />
    </svg>
  );
}

function InvoicesIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5h8l3 3V20a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4A.5.5 0 0 1 7 3.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3.5V7h3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11h6M9 14.5h6M9 18h4" />
    </svg>
  );
}

function LicensingIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 19 7v5c0 4.4-2.8 7.2-7 8.5-4.2-1.3-7-4.1-7-8.5V7l7-3.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.2 12.2 1.8 1.8 3.8-4.1" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L18.5 2M16 2v5h5" />
    </svg>
  );
}

const ITEMS: Array<{ id: DashboardPage; key: string; to: string; icon: ComponentType }> = [
  { id: "overview", key: "nav.overview", to: "/overview", icon: OverviewIcon },
  { id: "branding", key: "nav.branding", to: "/branding", icon: BrandingIcon },
  { id: "clients", key: "nav.clients", to: "/clients", icon: ClientsIcon },
  { id: "invoices", key: "nav.invoices", to: "/invoices", icon: InvoicesIcon },
  { id: "licensing", key: "nav.licensing", to: "/licensing", icon: LicensingIcon },
];

export function DashboardNav({ page, onLogout }: DashboardNavProps) {
  const { t, dir } = useI18n();
  return (
    <aside
      className={
        dir === "rtl"
          ? "hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-40 lg:flex lg:w-72 lg:flex-col lg:border-l lg:border-border/10 lg:bg-bg lg:px-6 lg:py-7"
          : "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-border/10 lg:bg-bg lg:px-6 lg:py-7"
      }
    >
      <div className="mb-10 px-4">
        <h2 className="text-[1.65rem] font-black tracking-tight text-text">Fawtarly</h2>
        <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-text-muted/55">Financial Command</p>
      </div>
      <nav className="flex-1 space-y-2">
          {ITEMS.map((item) => {
            const active = page === item.id;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className={
                  active
                    ? "flex h-12 items-center gap-3 rounded-2xl bg-primary/10 px-4 text-sm font-semibold text-primary"
                    : "flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium text-text-muted transition-colors hover:bg-bg-card hover:text-text"
                }
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <Icon />
                </span>
                {t(item.key)}
              </NavLink>
            );
          })}
      </nav>
      <div className="mt-auto pt-6">
        <Button
          variant="destructive"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start gap-3 rounded-2xl px-4 normal-case tracking-normal"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/10">
            <LogoutIcon />
          </span>
          {t("header.logout")}
        </Button>
      </div>
    </aside>
  );
}
