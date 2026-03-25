import { Dialog } from "../../../shared/ui/dialog";
import { Button } from "../../../shared/ui/button";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import type { LicensesPanelProps } from "./LicensesPanel.types";

interface LicensingDialogsProps {
  appToDelete: LicensesPanelProps["apps"][number] | null;
  licenseToRevoke: LicensesPanelProps["licenses"][number] | null;
  licenseToDelete: LicensesPanelProps["licenses"][number] | null;
  activationToRevoke: LicensesPanelProps["activations"][number] | null;
  activationToDelete: LicensesPanelProps["activations"][number] | null;
  appActionLoadingId: string | null;
  licenseActionLoadingId: string | null;
  activationActionLoadingId: string | null;
  onAppDeleteCancel: () => void;
  onAppDeleteConfirm: (id: string) => void;
  onLicenseRevokeCancel: () => void;
  onLicenseRevokeConfirm: (id: string) => void;
  onLicenseDeleteCancel: () => void;
  onLicenseDeleteConfirm: (id: string) => void;
  onActivationRevokeCancel: () => void;
  onActivationRevokeConfirm: (id: string) => void;
  onActivationDeleteCancel: () => void;
  onActivationDeleteConfirm: (id: string) => void;
}

export function LicensingDialogs(props: LicensingDialogsProps) {
  const { t } = useI18n();
  const {
    appToDelete,
    licenseToRevoke,
    licenseToDelete,
    activationToRevoke,
    activationToDelete,
    appActionLoadingId,
    licenseActionLoadingId,
    activationActionLoadingId,
    onAppDeleteCancel,
    onAppDeleteConfirm,
    onLicenseRevokeCancel,
    onLicenseRevokeConfirm,
    onLicenseDeleteCancel,
    onLicenseDeleteConfirm,
    onActivationRevokeCancel,
    onActivationRevokeConfirm,
    onActivationDeleteCancel,
    onActivationDeleteConfirm,
  } = props;

  return (
    <>
      {/* App Delete Dialog */}
      <Dialog
        open={appToDelete !== null}
        onOpenChange={(open) => !open && onAppDeleteCancel()}
        title={t("licensing.appDeleteTitle")}
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-300">
            {t("licensing.appDeleteDescription")}
          </p>
          {appToDelete ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <div className="font-semibold text-white">{appToDelete.name}</div>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-white"
              onClick={onAppDeleteCancel}
            >
              {t("clients.archiveCancel")}
            </Button>
            <Button
              type="button"
              className="bg-danger text-white hover:bg-danger/90"
              disabled={!appToDelete || appActionLoadingId === appToDelete.id}
              onClick={() => appToDelete && onAppDeleteConfirm(appToDelete.id)}
            >
              {t("licensing.appDeleteConfirm")}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* License Revoke Dialog */}
      <Dialog
        open={licenseToRevoke !== null}
        onOpenChange={(open) => !open && onLicenseRevokeCancel()}
        title={t("licensing.revokeTitle")}
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-300">
            {t("licensing.revokeDescription")}
          </p>
          {licenseToRevoke ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <div className="font-semibold text-white">
                {licenseToRevoke.appName}
              </div>
              <div className="mt-1 font-mono text-xs text-danger">
                {licenseToRevoke.licenseKey}
              </div>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-white"
              onClick={onLicenseRevokeCancel}
            >
              {t("clients.archiveCancel")}
            </Button>
            <Button
              type="button"
              className="bg-danger text-white hover:bg-danger/90"
              disabled={
                !licenseToRevoke ||
                licenseActionLoadingId === licenseToRevoke.id
              }
              onClick={() =>
                licenseToRevoke && onLicenseRevokeConfirm(licenseToRevoke.id)
              }
            >
              {t("licensing.revokeConfirm")}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* License Delete Dialog */}
      <Dialog
        open={licenseToDelete !== null}
        onOpenChange={(open) => !open && onLicenseDeleteCancel()}
        title={t("licensing.deleteTitle")}
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-300">
            {t("licensing.deleteDescription")}
          </p>
          {licenseToDelete ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <div className="font-semibold text-white">
                {licenseToDelete.appName}
              </div>
              <div className="mt-1 font-mono text-xs text-danger">
                {licenseToDelete.licenseKey}
              </div>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-white"
              onClick={onLicenseDeleteCancel}
            >
              {t("clients.archiveCancel")}
            </Button>
            <Button
              type="button"
              className="bg-danger text-white hover:bg-danger/90"
              disabled={
                !licenseToDelete ||
                licenseActionLoadingId === licenseToDelete.id
              }
              onClick={() =>
                licenseToDelete && onLicenseDeleteConfirm(licenseToDelete.id)
              }
            >
              {t("licensing.deleteConfirm")}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Activation Revoke Dialog */}
      <Dialog
        open={activationToRevoke !== null}
        onOpenChange={(open) => !open && onActivationRevokeCancel()}
        title={
          activationToRevoke?.status === "pending"
            ? t("activations.dismissTitle")
            : t("activations.revokeTitle")
        }
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-300">
            {activationToRevoke?.status === "pending"
              ? t("activations.dismissDescription")
              : t("activations.revokeDescription")}
          </p>
          {activationToRevoke ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <div className="font-semibold text-white">
                {activationToRevoke.appName}
              </div>
              <div className="mt-1 text-xs text-slate-300">
                {activationToRevoke.shopName || activationToRevoke.machineId}
              </div>
              <div className="mt-1 font-mono text-xs text-danger">
                {activationToRevoke.licenseKey || t("activations.noLicense")}
              </div>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-white"
              onClick={onActivationRevokeCancel}
            >
              {t("clients.archiveCancel")}
            </Button>
            <Button
              type="button"
              className="bg-danger text-white hover:bg-danger/90"
              disabled={
                !activationToRevoke ||
                activationActionLoadingId === activationToRevoke.id
              }
              onClick={() =>
                activationToRevoke &&
                onActivationRevokeConfirm(activationToRevoke.id)
              }
            >
              {activationToRevoke?.status === "pending"
                ? t("activations.dismissConfirm")
                : t("activations.revokeConfirm")}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Activation Delete Dialog */}
      <Dialog
        open={activationToDelete !== null}
        onOpenChange={(open) => !open && onActivationDeleteCancel()}
        title={t("licensing.deleteTitle")}
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-300">
            {t("licensing.deleteDescription")}
          </p>
          {activationToDelete ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <div className="font-semibold text-white">
                {activationToDelete.appName}
              </div>
              <div className="mt-1 text-xs text-slate-300">
                {activationToDelete.shopName || activationToDelete.machineId}
              </div>
              <div className="mt-1 font-mono text-xs text-danger">
                {activationToDelete.licenseKey || t("activations.noLicense")}
              </div>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-white"
              onClick={onActivationDeleteCancel}
            >
              {t("clients.archiveCancel")}
            </Button>
            <Button
              type="button"
              className="bg-danger text-white hover:bg-danger/90"
              disabled={
                !activationToDelete ||
                activationActionLoadingId === activationToDelete.id
              }
              onClick={() =>
                activationToDelete &&
                onActivationDeleteConfirm(activationToDelete.id)
              }
            >
              {t("licensing.deleteConfirm")}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
