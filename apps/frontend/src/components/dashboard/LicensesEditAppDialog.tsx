import type { FormEvent } from "react";
import type { EditAppState } from "./LicensesPanel.types";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { selectChevronStyle, selectClassName } from "./LicensesPanel.selectStyle";

interface LicensesEditAppDialogProps {
  app: EditAppState | null;
  appActionLoadingId: string | null;
  onOpenChange: (open: boolean) => void;
  onAppChange: (next: EditAppState | null) => void;
  onSubmit: (event: FormEvent) => void;
}

export function LicensesEditAppDialog({
  app,
  appActionLoadingId,
  onOpenChange,
  onAppChange,
  onSubmit,
}: LicensesEditAppDialogProps) {
  return (
    <Dialog open={app !== null} onOpenChange={onOpenChange} title="Edit App">
      {app && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-app-name">App name</Label>
            <Input
              id="edit-app-name"
              value={app.name}
              onChange={(event) => onAppChange({ ...app, name: event.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-app-status">Status</Label>
            <select
              id="edit-app-status"
              value={app.status}
              onChange={(event) => onAppChange({ ...app, status: event.target.value as "active" | "inactive" })}
              className={selectClassName}
              style={selectChevronStyle}
            >
              <option value="active" className="bg-bg-card text-white">
                active
              </option>
              <option value="inactive" className="bg-bg-card text-white">
                inactive
              </option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onAppChange(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={appActionLoadingId === app.id}>
              Save
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
