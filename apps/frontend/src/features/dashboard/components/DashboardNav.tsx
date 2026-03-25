import { NavLink } from "react-router-dom";
import { useI18n } from "../../../shared/i18n/I18nProvider";

export type DashboardPage =
  | "overview"
  | "branding"
  | "clients"
  | "invoices"
  | "licensing";

interface DashboardNavProps {
  page: DashboardPage;
}

const ITEMS: Array<{ id: DashboardPage; key: string; to: string }> = [
  { id: "overview", key: "nav.overview", to: "/overview" },
  { id: "branding", key: "nav.branding", to: "/branding" },
  { id: "clients", key: "nav.clients", to: "/clients" },
  { id: "invoices", key: "nav.invoices", to: "/invoices" },
  { id: "licensing", key: "nav.licensing", to: "/licensing" },
];

export function DashboardNav({ page }: DashboardNavProps) {
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
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className={
                  active
                    ? "flex h-12 items-center rounded-2xl bg-primary/10 px-4 text-sm font-semibold text-primary"
                    : "flex h-12 items-center rounded-2xl px-4 text-sm font-medium text-text-muted transition-colors hover:bg-bg-card hover:text-text"
                }
              >
                {t(item.key)}
              </NavLink>
            );
          })}
      </nav>
    </aside>
  );
}
