import type { FormEvent } from "react";
import type { EditLicenseState } from "./LicensesPanel.types";
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

interface LicensesEditLicenseDialogProps {
  license: EditLicenseState | null;
  licenseActionLoadingId: string | null;
  onOpenChange: (open: boolean) => void;
  onLicenseChange: (next: EditLicenseState | null) => void;
  onSubmit: (event: FormEvent) => void;
}

export function LicensesEditLicenseDialog({
  license,
  licenseActionLoadingId,
  onOpenChange,
  onLicenseChange,
  onSubmit,
}: LicensesEditLicenseDialogProps) {
  return (
    <Dialog open={license !== null} onOpenChange={onOpenChange} title="Edit License">
      {license && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-license-max">Max activations</Label>
            <Input
              id="edit-license-max"
              type="number"
              min={1}
              value={license.maxActivations}
              onChange={(event) => onLicenseChange({ ...license, maxActivations: event.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-license-status">Status</Label>
            <Select
              value={license.status}
              onValueChange={(value) => onLicenseChange({ ...license, status: value as "active" | "revoked" })}
            >
              <SelectTrigger id="edit-license-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="active">
                active
              </SelectItem>
              <SelectItem value="revoked">
                revoked
              </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onLicenseChange(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={licenseActionLoadingId === license.id}>
              Save
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
