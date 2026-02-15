import type { FormEvent } from "react";
import type { EditLicenseState } from "./LicensesPanel.types";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { selectChevronStyle, selectClassName } from "./LicensesPanel.selectStyle";

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
            <select
              id="edit-license-status"
              value={license.status}
              onChange={(event) => onLicenseChange({ ...license, status: event.target.value as "active" | "revoked" })}
              className={selectClassName}
              style={selectChevronStyle}
            >
              <option value="active" className="bg-bg-card text-white">
                active
              </option>
              <option value="revoked" className="bg-bg-card text-white">
                revoked
              </option>
            </select>
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
