import type { FormEvent } from "react";
import type { EditAppState } from "./LicensesPanel.types";
import { useI18n } from "../../../shared/i18n/I18nProvider";
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
  const { t } = useI18n();

  return (
    <Dialog open={app !== null} onOpenChange={onOpenChange} title={t("licensing.dialog.editApp")}>
      {app && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-app-name">{t("licensing.field.appName")}</Label>
            <Input
              id="edit-app-name"
              value={app.name}
              onChange={(event) => onAppChange({ ...app, name: event.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-app-status">{t("licensing.field.status")}</Label>
            <Select
              value={app.status}
              onValueChange={(value) => onAppChange({ ...app, status: value as "active" | "inactive" })}
            >
              <SelectTrigger id="edit-app-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="active">
                {t("licensing.status.active")}
              </SelectItem>
              <SelectItem value="inactive">
                {t("licensing.status.inactive")}
              </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onAppChange(null)}>
              {t("licensing.cancel")}
            </Button>
            <Button type="submit" disabled={appActionLoadingId === app.id}>
              {t("licensing.save")}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
