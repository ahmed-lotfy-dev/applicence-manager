import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import type { Client, Invoice } from "../types/dashboard";
import { z } from "zod";
import type { SupportedCurrency } from "../../onboarding/setup";
import type { FreelanceOpsPanelProps } from "../components/FreelanceOpsPanel.types";

const brandingSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name is required")
    .max(180, "Business name is too long"),
  contactEmail: z
    .string()
    .trim()
    .max(254, "Contact email is too long")
    .refine(
      (value: string) => value.length === 0 || z.email().safeParse(value).success,
      "Invalid contact email",
    ),
  contactPhone: z.string().trim().max(60, "Contact phone is too long"),
  addressLine1: z.string().trim().max(220, "Address line 1 is too long"),
  addressLine2: z.string().trim().max(220, "Address line 2 is too long"),
  taxId: z.string().trim().max(120, "Tax ID is too long"),
});

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

export function useFreelanceOps(props: FreelanceOpsPanelProps) {
  const { t, locale } = useI18n();
  const {
    clients,
    invoices,
    freelancerProfile,
    nextInvoiceNo,
    onSaveFreelancerProfile,
    onUploadProfileLogo,
    onCreateClient,
    onUpdateClient,
    onRemoveClient,
    onRestoreClient,
    onHardDeleteClient,
    onCreateInvoice,
    onUpdateInvoice,
    onRemoveInvoice,
    onRestoreInvoice,
    onHardDeleteInvoice,
    onSendInvoiceEmail,
  } = props;

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [invoiceClientId, setInvoiceClientId] = useState("");
  const [invoiceTotal, setInvoiceTotal] = useState("");
  const [invoicePaid, setInvoicePaid] = useState("0");
  const [invoiceDueDate, setInvoiceDueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [invoiceLanguage, setInvoiceLanguage] = useState<"en" | "ar">(
    locale === "ar" ? "ar" : "en",
  );
  const [defaultCurrency, setDefaultCurrency] = useState<SupportedCurrency>(
    (freelancerProfile?.defaultCurrency as SupportedCurrency | null) || "USD",
  );
  const [defaultInvoiceLanguage, setDefaultInvoiceLanguage] = useState<
    "en" | "ar"
  >(freelancerProfile?.defaultInvoiceLanguage || (locale === "ar" ? "ar" : "en"));
  const [appLanguagePreference, setAppLanguagePreference] = useState<
    "en" | "ar"
  >(freelancerProfile?.appLanguage || (locale === "ar" ? "ar" : "en"));
  const [sendInvoiceEmailOnCreate, setSendInvoiceEmailOnCreate] =
    useState(false);

  const [profileBusinessName, setProfileBusinessName] = useState(
    freelancerProfile?.businessName || "",
  );
  const [profileEmail, setProfileEmail] = useState(
    freelancerProfile?.contactEmail || "",
  );
  const [profilePhone, setProfilePhone] = useState(
    freelancerProfile?.contactPhone || "",
  );
  const [profileAddress1, setProfileAddress1] = useState(
    freelancerProfile?.addressLine1 || "",
  );
  const [profileAddress2, setProfileAddress2] = useState(
    freelancerProfile?.addressLine2 || "",
  );
  const [profileTaxId, setProfileTaxId] = useState(
    freelancerProfile?.taxId || "",
  );

  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    freelancerProfile?.logoUrl || null,
  );
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const [invoiceStatusMap, setInvoiceStatusMap] = useState<
    Record<string, Invoice["status"]>
  >({});
  const [invoiceTotalMap, setInvoiceTotalMap] = useState<
    Record<string, string>
  >({});
  const [invoicePaidMap, setInvoicePaidMap] = useState<Record<string, string>>(
    {},
  );

  const [brandingStatus, setBrandingStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [invoiceCreateStatus, setInvoiceCreateStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [clientStatus, setClientStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [invoiceRowStatus, setInvoiceRowStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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
  const [invoiceFilter, setInvoiceFilter] = useState<"all" | "active" | "archived">(
    "all",
  );

  const [invoiceToArchive, setInvoiceToArchive] = useState<Invoice | null>(
    null,
  );
  const [invoiceToRestore, setInvoiceToRestore] = useState<Invoice | null>(
    null,
  );
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [sendingInvoiceEmailId, setSendingInvoiceEmailId] = useState<
    string | null
  >(null);

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
        "Business name is required": t("validation.businessRequired"),
        "Business name is too long": t("validation.businessTooLong"),
        "Contact email is too long": t("validation.emailTooLong"),
        "Invalid contact email": t("validation.invalidEmail"),
        "Contact phone is too long": t("validation.phoneTooLong"),
        "Address line 1 is too long": t("validation.address1TooLong"),
        "Address line 2 is too long": t("validation.address2TooLong"),
        "Tax ID is too long": t("validation.taxIdTooLong"),
        "Client is required": t("validation.clientRequired"),
        "Invoice number is required": t("validation.invoiceNumberRequired"),
        "Invoice number is too long": t("validation.invoiceNumberTooLong"),
        "Total amount must be greater than zero": t(
          "validation.totalMustBePositive",
        ),
        "Paid amount must be zero or higher": t("validation.paidMustBeNonNegative"),
        "Paid amount cannot exceed total amount": t(
          "validation.paidCannotExceedTotal",
        ),
      };
      return map[message] || message;
    },
    [t],
  );

  const toOptional = (value: string): string | undefined => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const handleBrandingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBrandingStatus(null);
    const parsed = brandingSchema.safeParse({
      businessName: profileBusinessName,
      contactEmail: profileEmail,
      contactPhone: profilePhone,
      addressLine1: profileAddress1,
      addressLine2: profileAddress2,
      taxId: profileTaxId,
    });
    if (!parsed.success) {
      setBrandingStatus({
        tone: "error",
        message:
          translateValidationMessage(parsed.error.issues[0]?.message || "") ||
          t("branding.validationCheck"),
      });
      return;
    }
    setIsSavingBranding(true);
    if (selectedLogoFile) {
      setIsUploadingLogo(true);
      const uploadResult = await onUploadProfileLogo(selectedLogoFile);
      setIsUploadingLogo(false);
      if (!uploadResult) {
        setIsSavingBranding(false);
        return;
      }
      if (uploadResult.logoUrl) {
        setLogoPreviewUrl(uploadResult.logoUrl);
      }
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl(null);
      setSelectedLogoFile(null);
    }
    const result = await onSaveFreelancerProfile({
      businessName: toOptional(parsed.data.businessName),
      contactEmail: toOptional(parsed.data.contactEmail),
      contactPhone: toOptional(parsed.data.contactPhone),
      addressLine1: toOptional(parsed.data.addressLine1),
      addressLine2: toOptional(parsed.data.addressLine2),
      taxId: toOptional(parsed.data.taxId),
      defaultCurrency,
      defaultInvoiceLanguage,
      appLanguage: appLanguagePreference,
    });
    if (result) {
      setBrandingStatus({ tone: "success", message: t("branding.saved") });
      setIsBrandingModalOpen(false);
    } else {
      setBrandingStatus({ tone: "error", message: t("branding.saveError") });
    }
    setIsSavingBranding(false);
  };

  const handleLogoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    const nextPreview = URL.createObjectURL(nextFile);
    setSelectedLogoFile(nextFile);
    setLocalPreviewUrl(nextPreview);
    setLogoPreviewUrl(nextPreview);
    event.target.value = "";
  };

  const handleCreateClientSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (props.isCreatingClient || !clientName.trim()) return;
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
  };

  const openEditClient = (client: Client) => {
    setClientStatus(null);
    setClientToEdit(client);
    setEditClientName(client.name || "");
    setEditClientEmail(client.email || "");
    setEditClientPhone(client.phone || "");
  };

  const handleUpdateClientSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
  };

  const handleArchiveClient = async () => {
    if (!clientToArchive) return;
    setClientStatus(null);
    const ok = await onRemoveClient(clientToArchive.id);
    if (ok) {
      setClientStatus({ tone: "success", message: t("clients.archiveSuccess") });
      setClientToArchive(null);
    }
  };

  const handleRestoreClient = async () => {
    if (!clientToRestore) return;
    setClientStatus(null);
    const restored = await onRestoreClient(clientToRestore.id);
    if (restored) {
      setClientStatus({ tone: "success", message: t("clients.restoreSuccess") });
      setClientToRestore(null);
    }
  };

  const handleHardDeleteClient = async () => {
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
  };

  const handleToggleClientStatus = async (client: Client) => {
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
      if (invoiceClientId === client.id && nextStatus === "inactive") {
        setInvoiceClientId("");
      }
    }
  };

  const handleCreateInvoiceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (props.isCreatingInvoice || activeClients.length === 0) return;
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

    const selectedInvoiceClient = activeClients.find(
      (c) => c.id === invoiceClientId,
    );
    const canEmailSelectedClient = Boolean(selectedInvoiceClient?.email?.trim());

    const result = await onCreateInvoice({
      clientId: parsed.data.clientId,
      invoiceNo: parsed.data.invoiceNo,
      invoiceLanguage: parsed.data.invoiceLanguage,
      currency: freelancerProfile?.defaultCurrency || defaultCurrency,
      totalAmount: parsed.data.totalAmount,
      paidAmount: parsed.data.paidAmount,
      dueDate: parsed.data.dueDate || undefined,
    });
    if (result) {
      let nextTone: "success" | "error" = "success";
      let nextMessage = t("invoice.created");
      if (sendInvoiceEmailOnCreate && canEmailSelectedClient) {
        try {
          await onSendInvoiceEmail(result.id);
          nextMessage = t("invoice.createdAndSent").replace(
            "{invoiceNo}",
            result.invoiceNo,
          );
        } catch (error) {
          nextTone = "error";
          nextMessage =
            error instanceof Error && error.message
              ? error.message
              : t("invoice.emailSendError");
        }
      }
      setInvoiceTotal("");
      setInvoicePaid("0");
      setInvoiceClientId("");
      setInvoiceDueDate(new Date().toISOString().slice(0, 10));
      setSendInvoiceEmailOnCreate(false);
      setInvoiceCreateStatus({ tone: nextTone, message: nextMessage });
    } else {
      setInvoiceCreateStatus({
        tone: "error",
        message: t("invoice.createError"),
      });
    }
  };

  const handleInvoiceRowSave = async (invoice: Invoice) => {
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
  };

  const handleArchiveInvoice = async () => {
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
  };

  const handleRestoreInvoice = async () => {
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
  };

  const handleHardDeleteInvoice = async () => {
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
  };

  const handleSendInvoiceEmailFn = async (invoice: Invoice) => {
    setInvoiceRowStatus(null);
    setSendingInvoiceEmailId(invoice.id);
    try {
      await onSendInvoiceEmail(invoice.id);
      setInvoiceRowStatus({
        tone: "success",
        message: t("invoice.emailSent").replace(
          "{invoiceNo}",
          invoice.invoiceNo,
        ),
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
  };

  // Sync profile effects
  useEffect(() => {
    setProfileBusinessName(freelancerProfile?.businessName || "");
    setProfileEmail(freelancerProfile?.contactEmail || "");
    setProfilePhone(freelancerProfile?.contactPhone || "");
    setProfileAddress1(freelancerProfile?.addressLine1 || "");
    setProfileAddress2(freelancerProfile?.addressLine2 || "");
    setProfileTaxId(freelancerProfile?.taxId || "");
    setDefaultCurrency(
      (freelancerProfile?.defaultCurrency as SupportedCurrency | null) || "USD",
    );
    setDefaultInvoiceLanguage(
      freelancerProfile?.defaultInvoiceLanguage ||
      (locale === "ar" ? "ar" : "en"),
    );
    setAppLanguagePreference(
      freelancerProfile?.appLanguage || (locale === "ar" ? "ar" : "en"),
    );
    if (!isBrandingModalOpen) {
      setSelectedLogoFile(null);
    }
    if (!localPreviewUrl) {
      setLogoPreviewUrl(freelancerProfile?.logoUrl || null);
    }
  }, [freelancerProfile, isBrandingModalOpen, localPreviewUrl, locale]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  return {
    // Form States
    clientName, setClientName,
    clientEmail, setClientEmail,
    clientPhone, setClientPhone,
    invoiceClientId, setInvoiceClientId,
    invoiceTotal, setInvoiceTotal,
    invoicePaid, setInvoicePaid,
    invoiceDueDate, setInvoiceDueDate,
    invoiceLanguage, setInvoiceLanguage,
    defaultCurrency, setDefaultCurrency,
    defaultInvoiceLanguage, setDefaultInvoiceLanguage,
    appLanguagePreference, setAppLanguagePreference,
    sendInvoiceEmailOnCreate, setSendInvoiceEmailOnCreate,
    profileBusinessName, setProfileBusinessName,
    profileEmail, setProfileEmail,
    profilePhone, setProfilePhone,
    profileAddress1, setProfileAddress1,
    profileAddress2, setProfileAddress2,
    profileTaxId, setProfileTaxId,
    isBrandingModalOpen, setIsBrandingModalOpen,
    selectedLogoFile,
    logoPreviewUrl,
    localPreviewUrl,

    // Status States
    brandingStatus,
    invoiceCreateStatus,
    clientStatus,
    invoiceRowStatus,
    isSavingBranding,
    isUploadingLogo,

    // Loading States
    sendingInvoiceEmailId,
    isCreatingClient: props.isCreatingClient,
    isCreatingInvoice: props.isCreatingInvoice,

    // From props
    freelancerProfile,
    billingStats: props.billingStats,
    nextInvoiceNo,

    // Filter & Derived States
    clientFilter, setClientFilter,
    invoiceFilter, setInvoiceFilter,
    filteredClients,
    sortedInvoices,
    activeClients,

    // Modals
    clientToArchive, setClientToArchive,
    clientToEdit, setClientToEdit,
    clientToDelete, setClientToDelete,
    clientToRestore, setClientToRestore,
    invoiceToArchive, setInvoiceToArchive,
    invoiceToRestore, setInvoiceToRestore,
    invoiceToDelete, setInvoiceToDelete,

    // Edit Fields
    editClientName, setEditClientName,
    editClientEmail, setEditClientEmail,
    editClientPhone, setEditClientPhone,
    invoiceStatusMap, setInvoiceStatusMap,
    invoiceTotalMap, setInvoiceTotalMap,
    invoicePaidMap, setInvoicePaidMap,

    // Handlers
    handleBrandingSubmit,
    handleLogoSelect,
    handleCreateClientSubmit,
    openEditClient,
    handleUpdateClientSubmit,
    handleArchiveClient,
    handleRestoreClient,
    handleHardDeleteClient,
    handleToggleClientStatus,
    handleCreateInvoiceSubmit,
    handleInvoiceRowSave,
    handleArchiveInvoice,
    handleRestoreInvoice,
    handleHardDeleteInvoice,
    handleSendInvoiceEmail: handleSendInvoiceEmailFn,
  };
}
