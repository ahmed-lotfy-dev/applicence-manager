import { Button } from "../../../shared/ui/button";
import { Dialog } from "../../../shared/ui/dialog";
import { Input } from "../../../shared/ui/input";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { useFreelanceOpsContext } from "../hooks/FreelanceOpsContext";

export function FreelanceOpsDialogs() {
  const { t } = useI18n();
  const ops = useFreelanceOpsContext();

  return (
    <>
      {/* Edit Client */}
      <Dialog
        open={!!ops.clientToEdit}
        onOpenChange={(open) => !open && ops.setClientToEdit(null)}
        title={t("clients.editTitle")}
      >
        <form className="space-y-4" onSubmit={ops.handleUpdateClientSubmit}>
          <Input placeholder={t("clients.namePlaceholder")} value={ops.editClientName} onChange={e => ops.setEditClientName(e.target.value)} />
          <Input placeholder={t("clients.emailPlaceholder")} value={ops.editClientEmail} onChange={e => ops.setEditClientEmail(e.target.value)} />
          <Input placeholder={t("clients.phonePlaceholder")} value={ops.editClientPhone} onChange={e => ops.setEditClientPhone(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => ops.setClientToEdit(null)}>{t("licensing.cancel")}</Button>
            <Button type="submit">{t("licensing.save")}</Button>
          </div>
        </form>
      </Dialog>

      {/* Archive Client */}
      <Dialog
        open={!!ops.clientToArchive}
        onOpenChange={(open) => !open && ops.setClientToArchive(null)}
        title={t("clients.archiveTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">{t("clients.archiveConfirm")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => ops.setClientToArchive(null)}>{t("licensing.cancel")}</Button>
            <Button variant="destructive" onClick={ops.handleArchiveClient}>{t("licensing.archive")}</Button>
          </div>
        </div>
      </Dialog>

      {/* Restore Client */}
      <Dialog
        open={!!ops.clientToRestore}
        onOpenChange={(open) => !open && ops.setClientToRestore(null)}
        title={t("clients.restoreTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">{t("clients.restoreConfirm")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => ops.setClientToRestore(null)}>{t("licensing.cancel")}</Button>
            <Button onClick={ops.handleRestoreClient}>{t("licensing.restore")}</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Client */}
      <Dialog
        open={!!ops.clientToDelete}
        onOpenChange={(open) => !open && ops.setClientToDelete(null)}
        title={t("clients.deleteTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-danger">{t("clients.deleteConfirm")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => ops.setClientToDelete(null)}>{t("licensing.cancel")}</Button>
            <Button variant="destructive" onClick={ops.handleHardDeleteClient}>{t("licensing.delete")}</Button>
          </div>
        </div>
      </Dialog>

      {/* Archive Invoice */}
      <Dialog
        open={!!ops.invoiceToArchive}
        onOpenChange={(open) => !open && ops.setInvoiceToArchive(null)}
        title={t("invoice.archiveTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">{t("invoice.archiveConfirm")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => ops.setInvoiceToArchive(null)}>{t("licensing.cancel")}</Button>
            <Button variant="destructive" onClick={ops.handleArchiveInvoice}>{t("licensing.archive")}</Button>
          </div>
        </div>
      </Dialog>

      {/* Restore Invoice */}
      <Dialog
        open={!!ops.invoiceToRestore}
        onOpenChange={(open) => !open && ops.setInvoiceToRestore(null)}
        title={t("invoice.restoreTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">{t("invoice.restoreConfirm")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => ops.setInvoiceToRestore(null)}>{t("licensing.cancel")}</Button>
            <Button onClick={ops.handleRestoreInvoice}>{t("licensing.restore")}</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Invoice */}
      <Dialog
        open={!!ops.invoiceToDelete}
        onOpenChange={(open) => !open && ops.setInvoiceToDelete(null)}
        title={t("invoice.deleteTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-danger">{t("invoice.deleteConfirm")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => ops.setInvoiceToDelete(null)}>{t("licensing.cancel")}</Button>
            <Button variant="destructive" onClick={ops.handleHardDeleteInvoice}>{t("licensing.delete")}</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
