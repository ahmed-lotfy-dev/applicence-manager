import type { FormEvent } from "react";
import type { ManagedApp } from "../../types/dashboard";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { selectChevronStyle, selectClassName } from "./LicensesPanel.selectStyle";

interface LicensesCreateLockedDialogProps {
  open: boolean;
  apps: ManagedApp[];
  appId: string;
  machineId: string;
  maxActivations: string;
  generatedKey: string;
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  onAppIdChange: (value: string) => void;
  onMachineIdChange: (value: string) => void;
  onMaxActivationsChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function LicensesCreateLockedDialog({
  open,
  apps,
  appId,
  machineId,
  maxActivations,
  generatedKey,
  isCreating,
  onOpenChange,
  onAppIdChange,
  onMachineIdChange,
  onMaxActivationsChange,
  onSubmit,
}: LicensesCreateLockedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Create Device-Locked License">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="create-locked-license-app">App</Label>
          <select
            id="create-locked-license-app"
            value={appId}
            onChange={(event) => onAppIdChange(event.target.value)}
            className={selectClassName}
            style={selectChevronStyle}
            required
          >
            <option value="" className="bg-bg-card text-white">
              Select app
            </option>
            {apps.map((app) => (
              <option key={app.id} value={app.id} className="bg-bg-card text-white">
                {app.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="locked-machine-id">Machine ID</Label>
          <Input
            id="locked-machine-id"
            value={machineId}
            onChange={(event) => onMachineIdChange(event.target.value)}
            placeholder="88c81c58c54d49e4a2d49d2a4b052d81"
            className="font-mono"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-locked-license-max">Max activations</Label>
          <Input
            id="create-locked-license-max"
            type="number"
            min={1}
            value={maxActivations}
            onChange={(event) => onMaxActivationsChange(event.target.value)}
            required
          />
          <p className="text-xs text-slate-400">Recommended: 1 for device-locked serials.</p>
        </div>

        {generatedKey && (
          <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <Label htmlFor="generated-locked-license">Generated Serial</Label>
            <Input
              id="generated-locked-license"
              readOnly
              value={generatedKey}
              className="font-mono"
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(generatedKey)}>
                Copy Serial
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Generating..." : "Generate Serial"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
