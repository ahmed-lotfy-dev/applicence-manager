import { cn } from "../../../lib/utils";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";
import type { ActivationFilter } from "../types/dashboard";

interface FilterTabsProps {
  selectedTab: ActivationFilter;
  onSelect: (tab: ActivationFilter) => void;
}

const TABS: ActivationFilter[] = ["all", "pending", "active", "revoked"];

export function FilterTabs({ selectedTab, onSelect }: FilterTabsProps) {
  const { t } = useI18n();

  return (
    <div className="w-full md:max-w-[14rem]">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted/70">
        {t("licensing.filterStatusLabel")}
      </p>
      <Select value={selectedTab} onValueChange={(value) => onSelect(value as ActivationFilter)}>
        <SelectTrigger className={cn("h-11 rounded-xl bg-white/5")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TABS.map((tab) => (
            <SelectItem key={tab} value={tab}>
              {t(`licensing.filter.${tab}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
