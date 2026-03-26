import { useCallback, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import type { Invoice } from "../types/dashboard";
import { z } from "zod";


const invoiceCreateSchema = z
  .object({
    clientId: z.string().trim().min(1, "Client is required"),
    invoiceNo: z
      .string()
      .trim()
      .min(1, "Invoice number is required")
      .max(80, "Invoice number is too long"),
    invoiceLanguage: z.enum(["en", "ar"]),
    totalAmount: z
      .number()
      .finite()
      .positive("Total amount must be greater than zero"),
    paidAmount: z
      .number()
      .finite()
      .nonnegative("Paid amount must be zero or higher"),
    dueDate: z.string().trim().optional(),
  })
  .refine((value) => value.paidAmount <= value.totalAmount, {
    message: "Paid amount cannot exceed total amount",
    path: ["paidAmount"],
  });

const invoiceUpdateSchema = z
  .object({
    status: z.enum(["draft", "sent", "partially_paid", "paid", "overdue"]),
    paidAmount: z
      .number()
      .finite()
      .nonnegative("Paid amount must be zero or higher"),
    totalAmount: z.number().finite().nonnegative(),
  })
  .refine((value) => value.paidAmount <= value.totalAmount, {
    message: "Paid amount cannot exceed total amount",
    path: ["paidAmount"],
  });

interface UseFreelanceInvoicesProps {
  invoices: Invoice[];
  freelancerProfile: { defaultCurrency?: string | null } | null;
  nextInvoiceNo: string;
  isCreatingInvoice: boolean;
  onCreateInvoice: (input: {
    clientId: string;
    invoiceNo: string;
    invoiceLanguage: "en" | "ar";
    currency?: string;
    totalAmount: number;
    paidAmount?: number;
    dueDate?: string;
    notes?: string;
  }) => Promise<Invoice | null>;
  onUpdateInvoice: (
    id: string,
    input: {
      status?: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';
      totalAmount?: number;
      paidAmount?: number;
    },
  ) => Promise<void>;
  onRemoveInvoice: (id: string) => Promise<boolean>;
  onRestoreInvoice: (id: string) => Promise<Invoice | null>;
  onHardDeleteInvoice: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onSendInvoiceEmail: (invoiceId: string) => Promise<void>;
}

export function useFreelanceInvoices(props: UseFreelanceInvoicesProps) {
  const { t, locale } = useI18n();
  const {
    invoices,
    freelancerProfile,
    nextInvoiceNo,
    isCreatingInvoice,
    onCreateInvoice,
    onUpdateInvoice,
    onRemoveInvoice,
    onRestoreInvoice,
    onHardDeleteInvoice,
    onSendInvoiceEmail,
  } = props;

  const [invoiceClientId, setInvoiceClientId] = useState("");
  const [invoiceTotal, setInvoiceTotal] = useState("");
  const [invoicePaid, setInvoicePaid] = useState("0");
  const [invoiceDueDate, setInvoiceDueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [invoiceLanguage, setInvoiceLanguage] = useState<"en" | "ar">(
    locale === "ar" ? "ar" : "en",
  );
  const [sendInvoiceEmailOnCreate, setSendInvoiceEmailOnCreate] = useState(false);

  const [invoiceCreateStatus, setInvoiceCreateStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [invoiceRowStatus, setInvoiceRowStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [sendingInvoiceEmailId, setSendingInvoiceEmailId] = useState<string | null>(null);

  const [invoiceToArchive, setInvoiceToArchive] = useState<Invoice | null>(null);
  const [invoiceToRestore, setInvoiceToRestore] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const [invoiceFilter, setInvoiceFilter] = useState<"all" | "active" | "archived">("all");

  const [invoiceStatusMap, setInvoiceStatusMap] = useState<Record<string, Invoice["status"]>>({});
  const [invoiceTotalMap, setInvoiceTotalMap] = useState<Record<string, string>>({});
  const [invoicePaidMap, setInvoicePaidMap] = useState<Record<string, string>>({});

  const sortedInvoices = useMemo(
    () =>
      [...invoices]
        .filter((invoice) => {
          const isArchived = invoice.isDeleted === true;
          if (invoiceFilter === "archived") return isArchived;
          if (invoiceFilter === "active") return !isArchived;
          return true;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [invoiceFilter, invoices],
  );

  const translateValidationMessage = useCallback(
    (message: string) => {
      const map: Record<string, string> = {
        "Client is required": t("validation.clientRequired"),
        "Invoice number is required": t("validation.invoiceNumberRequired"),
        "Invoice number is too long": t("validation.invoiceNumberTooLong"),
        "Total amount must be greater than zero": t("validation.totalMustBePositive"),
        "Paid amount must be zero or higher": t("validation.paidMustBeNonNegative"),
        "Paid amount cannot exceed total amount": t("validation.paidCannotExceedTotal"),
      };
      return map[message] || message;
    },
    [t],
  );

  const handleCreateInvoiceSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isCreatingInvoice || !invoiceClientId) return;
      setInvoiceCreateStatus(null);
      const parsed = invoiceCreateSchema.safeParse({
        clientId: invoiceClientId,
        invoiceNo: nextInvoiceNo,
        invoiceLanguage,
        totalAmount: Number(invoiceTotal),
        paidAmount: Number(invoicePaid || 0),
        dueDate: invoiceDueDate || undefined,
      });
      if (!parsed.success) {
        setInvoiceCreateStatus({
          tone: "error",
          message:
            translateValidationMessage(parsed.error.issues[0]?.message || "") ||
            t("invoice.invalidInput"),
        });
        return;
      }

      const result = await onCreateInvoice({
        clientId: parsed.data.clientId,
        invoiceNo: parsed.data.invoiceNo,
        invoiceLanguage: parsed.data.invoiceLanguage,
        currency: freelancerProfile?.defaultCurrency || "USD",
        totalAmount: parsed.data.totalAmount,
        paidAmount: parsed.data.paidAmount,
        dueDate: parsed.data.dueDate || undefined,
      });
      if (result) {
        setInvoiceTotal("");
        setInvoicePaid("0");
        setInvoiceClientId("");
        setInvoiceDueDate(new Date().toISOString().slice(0, 10));
        setSendInvoiceEmailOnCreate(false);
        setInvoiceCreateStatus({
          tone: "success",
          message: t("invoice.created"),
        });
      } else {
        setInvoiceCreateStatus({
          tone: "error",
          message: t("invoice.createError"),
        });
      }
    },
    [
      isCreatingInvoice,
      invoiceClientId,
      nextInvoiceNo,
      invoiceLanguage,
      invoiceTotal,
      invoicePaid,
      invoiceDueDate,
      freelancerProfile,
      onCreateInvoice,
      translateValidationMessage,
      t,
    ],
  );

  const handleInvoiceRowSave = useCallback(
    async (invoice: Invoice) => {
      setInvoiceRowStatus(null);
      const totalAmount = Number(
        invoiceTotalMap[invoice.id] ?? invoice.totalAmount / 100,
      );
      const paidAmount = Number(
        invoicePaidMap[invoice.id] ?? invoice.paidAmount / 100,
      );
      const status = invoiceStatusMap[invoice.id] ?? invoice.status;
      const parsed = invoiceUpdateSchema.safeParse({
        status,
        paidAmount,
        totalAmount,
      });
      if (!parsed.success) {
        setInvoiceRowStatus({
          tone: "error",
          message:
            translateValidationMessage(parsed.error.issues[0]?.message || "") ||
            t("invoice.invalidValues").replace("{invoiceNo}", invoice.invoiceNo),
        });
        return;
      }
      await onUpdateInvoice(invoice.id, {
        status: parsed.data.status,
        totalAmount: parsed.data.totalAmount,
        paidAmount: parsed.data.paidAmount,
      });
      setInvoiceRowStatus({
        tone: "success",
        message: t("invoice.updated").replace("{invoiceNo}", invoice.invoiceNo),
      });
    },
    [invoiceTotalMap, invoicePaidMap, invoiceStatusMap, onUpdateInvoice, translateValidationMessage, t],
  );

  const handleArchiveInvoice = useCallback(async () => {
    if (!invoiceToArchive) return;
    setInvoiceRowStatus(null);
    const ok = await onRemoveInvoice(invoiceToArchive.id);
    if (ok) {
      setInvoiceRowStatus({
        tone: "success",
        message: t("invoice.archiveSuccess"),
      });
      setInvoiceToArchive(null);
    }
  }, [invoiceToArchive, onRemoveInvoice, t]);

  const handleRestoreInvoice = useCallback(async () => {
    if (!invoiceToRestore) return;
    setInvoiceRowStatus(null);
    const restored = await onRestoreInvoice(invoiceToRestore.id);
    if (restored) {
      setInvoiceRowStatus({
        tone: "success",
        message: t("invoice.restoreSuccess"),
      });
      setInvoiceToRestore(null);
    }
  }, [invoiceToRestore, onRestoreInvoice, t]);

  const handleHardDeleteInvoice = useCallback(async () => {
    if (!invoiceToDelete) return;
    setInvoiceRowStatus(null);
    const result = await onHardDeleteInvoice(invoiceToDelete.id);
    if (result.ok) {
      setInvoiceRowStatus({
        tone: "success",
        message: t("invoice.deleteSuccess"),
      });
      setInvoiceToDelete(null);
      return;
    }
    setInvoiceRowStatus({
      tone: "error",
      message:
        result.error === "Archive the invoice before deleting it permanently."
          ? t("invoice.deleteBlocked")
          : result.error || t("invoice.deleteBlocked"),
    });
    setInvoiceToDelete(null);
  }, [invoiceToDelete, onHardDeleteInvoice, t]);

  const handleSendInvoiceEmailFn = useCallback(
    async (invoice: Invoice) => {
      setInvoiceRowStatus(null);
      setSendingInvoiceEmailId(invoice.id);
      try {
        await onSendInvoiceEmail(invoice.id);
        setInvoiceRowStatus({
          tone: "success",
          message: t("invoice.emailSent").replace("{invoiceNo}", invoice.invoiceNo),
        });
      } catch (error) {
        setInvoiceRowStatus({
          tone: "error",
          message:
            error instanceof Error ? error.message : t("invoice.emailSendError"),
        });
      } finally {
        setSendingInvoiceEmailId(null);
      }
    },
    [onSendInvoiceEmail, t],
  );

  const clearStatus = useCallback(() => {
    setInvoiceCreateStatus(null);
    setInvoiceRowStatus(null);
  }, []);

  return {
    // Form state
    invoiceClientId, setInvoiceClientId,
    invoiceTotal, setInvoiceTotal,
    invoicePaid, setInvoicePaid,
    invoiceDueDate, setInvoiceDueDate,
    invoiceLanguage, setInvoiceLanguage,
    sendInvoiceEmailOnCreate, setSendInvoiceEmailOnCreate,
    isCreatingInvoice,

    // Filter
    invoiceFilter, setInvoiceFilter,
    sortedInvoices,

    // Modal state
    invoiceToArchive, setInvoiceToArchive,
    invoiceToRestore, setInvoiceToRestore,
    invoiceToDelete, setInvoiceToDelete,

    // Edit maps
    invoiceStatusMap, setInvoiceStatusMap,
    invoiceTotalMap, setInvoiceTotalMap,
    invoicePaidMap, setInvoicePaidMap,

    // Status
    invoiceCreateStatus,
    invoiceRowStatus,
    sendingInvoiceEmailId,
    clearStatus,

    // Handlers
    handleCreateInvoiceSubmit,
    handleInvoiceRowSave,
    handleArchiveInvoice,
    handleRestoreInvoice,
    handleHardDeleteInvoice,
    handleSendInvoiceEmail: handleSendInvoiceEmailFn,
  };
}
