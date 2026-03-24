import type { FormEvent } from "react";
import type { EditAppState } from "./LicensesPanel.types";
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
            <Select
              value={app.status}
              onValueChange={(value) => onAppChange({ ...app, status: value as "active" | "inactive" })}
            >
              <SelectTrigger id="edit-app-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="active">
                active
              </SelectItem>
              <SelectItem value="inactive">
                inactive
              </SelectItem>
              </SelectContent>
            </Select>
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
