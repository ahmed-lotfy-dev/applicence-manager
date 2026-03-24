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
  const { t } = useI18n();
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <nav className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          {ITEMS.map((item) => {
            const active = page === item.id;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className={
                  active
                    ? "inline-flex h-10 items-center justify-center rounded-md border border-primary/40 bg-primary/20 px-4 text-sm font-medium text-white transition-colors hover:bg-primary/25"
                    : "inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-transparent px-4 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                }
              >
                {t(item.key)}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
