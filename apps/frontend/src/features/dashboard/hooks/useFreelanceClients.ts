import { useCallback, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import type { Client } from "../types/dashboard";

interface UseFreelanceClientsProps {
  clients: Client[];
  isCreatingClient: boolean;
  onCreateClient: (input: { name: string; email?: string; phone?: string; notes?: string }) => Promise<Client | null>;
  onUpdateClient: (id: string, input: { name?: string; email?: string; phone?: string; notes?: string; status?: 'active' | 'inactive' }) => Promise<Client | null>;
  onRemoveClient: (id: string) => Promise<boolean>;
  onRestoreClient: (id: string) => Promise<Client | null>;
  onHardDeleteClient: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

export function useFreelanceClients(props: UseFreelanceClientsProps) {
  const { t } = useI18n();
  const {
    clients,
    isCreatingClient,
    onCreateClient,
    onUpdateClient,
    onRemoveClient,
    onRestoreClient,
    onHardDeleteClient,
  } = props;

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [clientStatus, setClientStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [clientToArchive, setClientToArchive] = useState<Client | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [clientToRestore, setClientToRestore] = useState<Client | null>(null);

  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");

  const [clientFilter, setClientFilter] = useState<
    "all" | "active" | "inactive" | "archived"
  >("all");

  const activeClients = useMemo(
    () => clients.filter((client) => !client.isDeleted && client.status === "active"),
    [clients],
  );

  const filteredClients = useMemo(() => {
    if (clientFilter === "archived")
      return clients.filter((client) => client.isDeleted);
    if (clientFilter === "active")
      return clients.filter((client) => !client.isDeleted && client.status === "active");
    if (clientFilter === "inactive")
      return clients.filter(
        (client) => !client.isDeleted && client.status === "inactive",
      );
    return clients;
  }, [clientFilter, clients]);

  const handleCreateClientSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isCreatingClient || !clientName.trim()) return;
      setClientStatus(null);
      const result = await onCreateClient({
        name: clientName,
        email: clientEmail || undefined,
        phone: clientPhone || undefined,
      });
      if (result) {
        setClientName("");
        setClientEmail("");
        setClientPhone("");
      }
    },
    [isCreatingClient, clientName, clientEmail, clientPhone, onCreateClient],
  );

  const openEditClient = useCallback((client: Client) => {
    setClientStatus(null);
    setClientToEdit(client);
    setEditClientName(client.name || "");
    setEditClientEmail(client.email || "");
    setEditClientPhone(client.phone || "");
  }, []);

  const handleUpdateClientSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!clientToEdit || !editClientName.trim()) return;
      setClientStatus(null);
      const updated = await onUpdateClient(clientToEdit.id, {
        name: editClientName.trim(),
        email: editClientEmail || undefined,
        phone: editClientPhone || undefined,
      });
      if (updated) {
        setClientStatus({ tone: "success", message: t("clients.updated") });
        setClientToEdit(null);
      }
    },
    [clientToEdit, editClientName, editClientEmail, editClientPhone, onUpdateClient, t],
  );

  const handleArchiveClient = useCallback(async () => {
    if (!clientToArchive) return;
    setClientStatus(null);
    const ok = await onRemoveClient(clientToArchive.id);
    if (ok) {
      setClientStatus({ tone: "success", message: t("clients.archiveSuccess") });
      setClientToArchive(null);
    }
  }, [clientToArchive, onRemoveClient, t]);

  const handleRestoreClient = useCallback(async () => {
    if (!clientToRestore) return;
    setClientStatus(null);
    const restored = await onRestoreClient(clientToRestore.id);
    if (restored) {
      setClientStatus({ tone: "success", message: t("clients.restoreSuccess") });
      setClientToRestore(null);
    }
  }, [clientToRestore, onRestoreClient, t]);

  const handleHardDeleteClient = useCallback(async () => {
    if (!clientToDelete) return;
    setClientStatus(null);
    const result = await onHardDeleteClient(clientToDelete.id);
    if (result.ok) {
      setClientStatus({ tone: "success", message: t("clients.deleteSuccess") });
      setClientToDelete(null);
      return;
    }
    setClientStatus({
      tone: "error",
      message:
        result.error ===
          "This client has receipts or invoice history and can only be archived."
          ? t("clients.deleteBlocked")
          : result.error || t("clients.deleteBlocked"),
    });
    setClientToDelete(null);
  }, [clientToDelete, onHardDeleteClient, t]);

  const handleToggleClientStatus = useCallback(
    async (client: Client) => {
      if (client.isDeleted) return;
      setClientStatus(null);
      const nextStatus: "active" | "inactive" =
        client.status === "active" ? "inactive" : "active";
      const updated = await onUpdateClient(client.id, { status: nextStatus });
      if (updated) {
        setClientStatus({
          tone: "success",
          message:
            nextStatus === "active"
              ? t("clients.markedActive")
              : t("clients.markedInactive"),
        });
      }
    },
    [onUpdateClient, t],
  );

  const clearStatus = useCallback(() => setClientStatus(null), []);

  return {
    // Form state
    clientName, setClientName,
    clientEmail, setClientEmail,
    clientPhone, setClientPhone,
    isCreatingClient,

    // Edit form
    editClientName, setEditClientName,
    editClientEmail, setEditClientEmail,
    editClientPhone, setEditClientPhone,

    // Filter
    clientFilter, setClientFilter,
    filteredClients,
    activeClients,

    // Modal state
    clientToArchive, setClientToArchive,
    clientToEdit, setClientToEdit,
    clientToDelete, setClientToDelete,
    clientToRestore, setClientToRestore,

    // Status
    clientStatus,
    clearStatus,

    // Handlers
    handleCreateClientSubmit,
    openEditClient,
    handleUpdateClientSubmit,
    handleArchiveClient,
    handleRestoreClient,
    handleHardDeleteClient,
    handleToggleClientStatus,
  };
}
