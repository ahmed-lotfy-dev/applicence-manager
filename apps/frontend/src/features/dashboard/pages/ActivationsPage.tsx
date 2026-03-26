import { ActivationsTable } from "../components/ActivationsTable";
import { FilterTabs } from "../components/FilterTabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { useLicensingDataContext } from "../hooks/LicensingDataContext";
import type { ActivationFilter } from "../types/dashboard";

interface ActivationsPageProps {
  activationFilter: ActivationFilter;
  onActivationFilterChange: (filter: ActivationFilter) => void;
  error?: string;
}

export function ActivationsPage({
  activationFilter,
  onActivationFilterChange,
  error,
}: ActivationsPageProps) {
  useLicensingDataContext();

  return (
    <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
      <CardHeader className="space-y-2 border-b border-white/5 pb-6">
        <CardTitle className="text-xl text-white">Activation Requests</CardTitle>
        <p className="text-sm text-slate-400">
          Review pending machines and enforce license compliance.
        </p>
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/20 p-3 text-sm text-danger">
            {error}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <FilterTabs selectedTab={activationFilter} onSelect={onActivationFilterChange} />
        <ActivationsTable activationFilter={activationFilter} />
      </CardContent>
    </Card>
  );
}
