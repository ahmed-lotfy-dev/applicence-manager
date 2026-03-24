import type { FormEvent } from "react";
import type { ManagedApp } from "../types/dashboard";
import { Button } from "../../../shared/ui/button";
import { Dialog } from "../../../shared/ui/dialog";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";

interface LicensesCreateDialogProps {
  open: boolean;
  apps: ManagedApp[];
  appId: string;
  maxActivations: string;
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  onAppIdChange: (value: string) => void;
  onMaxActivationsChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function LicensesCreateDialog({
  open,
  apps,
  appId,
  maxActivations,
  isCreating,
  onOpenChange,
  onAppIdChange,
  onMaxActivationsChange,
  onSubmit,
}: LicensesCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Create License">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="create-license-app">App</Label>
          <Select value={appId} onValueChange={onAppIdChange}>
            <SelectTrigger id="create-license-app">
              <SelectValue placeholder="Select app" />
            </SelectTrigger>
            <SelectContent>
            {apps.map((app) => (
              <SelectItem key={app.id} value={app.id}>
                {app.name}
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-license-max">Max activations</Label>
          <Input
            id="create-license-max"
            type="number"
            min={1}
            value={maxActivations}
            onChange={(event) => onMaxActivationsChange(event.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
