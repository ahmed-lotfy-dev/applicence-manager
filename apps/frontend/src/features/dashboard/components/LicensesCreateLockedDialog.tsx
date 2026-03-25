import type { FormEvent } from "react";
import type { ManagedApp } from "../types/dashboard";
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
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t("licensing.dialog.createLockedLicense")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="create-locked-license-app">{t("licensing.field.app")}</Label>
          <Select value={appId} onValueChange={onAppIdChange}>
            <SelectTrigger id="create-locked-license-app">
              <SelectValue placeholder={t("licensing.field.selectApp")} />
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
          <Label htmlFor="locked-machine-id">{t("licensing.field.machineId")}</Label>
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
          <Label htmlFor="create-locked-license-max">{t("licensing.field.maxActivations")}</Label>
          <Input
            id="create-locked-license-max"
            type="number"
            min={1}
            value={maxActivations}
            onChange={(event) => onMaxActivationsChange(event.target.value)}
            required
          />
          <p className="text-xs text-slate-400">{t("licensing.recommendedLocked")}</p>
        </div>

        {generatedKey && (
          <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <Label htmlFor="generated-locked-license">{t("licensing.field.generatedSerial")}</Label>
            <Input
              id="generated-locked-license"
              readOnly
              value={generatedKey}
              className="font-mono"
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(generatedKey)}>
                {t("licensing.copySerial")}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("licensing.close")}
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? t("licensing.generating") : t("licensing.generateSerial")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
