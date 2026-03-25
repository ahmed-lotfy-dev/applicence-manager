import { cn } from "../../../lib/utils";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Button } from "../../../shared/ui/button";
import type { ActivationFilter } from "../types/dashboard";

interface FilterTabsProps {
  selectedTab: ActivationFilter;
  onSelect: (tab: ActivationFilter) => void;
}

const TABS: ActivationFilter[] = ["all", "pending", "active", "revoked"];

export function FilterTabs({ selectedTab, onSelect }: FilterTabsProps) {
  const { t } = useI18n();

  return (
    <div className="border-b border-border/10 px-6 py-4 flex flex-wrap gap-2 bg-white/5">
      {TABS.map((tab) => (
        <Button
          key={tab}
          size="sm"
          variant={selectedTab === tab ? 'default' : 'ghost'}
          onClick={() => onSelect(tab)}
          className={cn(
            "capitalize rounded-full px-5 text-xs font-bold transition-all",
            selectedTab === tab
              ? "shadow-soft ring-4 ring-primary/10 bg-primary text-white"
              : "text-slate-400 hover:text-white hover:bg-white/10"
          )}
        >
          {t(`licensing.filter.${tab}`)}
        </Button>
      ))}
    </div>
  );
}
