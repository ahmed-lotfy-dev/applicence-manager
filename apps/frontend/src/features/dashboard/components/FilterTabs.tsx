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
    <div className="flex flex-wrap gap-2 border-b border-border/10 bg-transparent px-6 py-4">
      {TABS.map((tab) => (
        <Button
          key={tab}
          size="sm"
          variant={selectedTab === tab ? 'default' : 'ghost'}
          onClick={() => onSelect(tab)}
          className={cn(
            "capitalize rounded-xl px-5 text-xs font-bold transition-all",
            selectedTab === tab
              ? "bg-primary text-white shadow-soft ring-2 ring-primary/15"
              : "text-slate-400 hover:bg-white/10 hover:text-white"
          )}
        >
          {t(`licensing.filter.${tab}`)}
        </Button>
      ))}
    </div>
  );
}
