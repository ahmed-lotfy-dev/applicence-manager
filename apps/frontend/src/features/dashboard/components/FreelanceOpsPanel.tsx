import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '../../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';
import { DatePicker } from '../../../shared/ui/date-picker';
import { Dialog } from '../../../shared/ui/dialog';
import { Input } from '../../../shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/ui/select';
import { Table, TableWrapper, Td, Th } from '../../../shared/ui/table';
import { useI18n } from '../../../shared/i18n/I18nProvider';
import type { Locale } from '../../../shared/i18n/translations';
import type { BillingStats, Client, FreelancerProfile, Invoice, InvoicePdfJob } from '../types/dashboard';
import { z } from 'zod';

type FreelanceOpsView = 'branding' | 'clients' | 'invoices' | 'all';
type ClientFilter = 'all' | 'active' | 'archived';

const brandingSchema = z.object({
  businessName: z.string().trim().min(2, 'Business name is required').max(180, 'Business name is too long'),
  contactEmail: z
    .string()
    .trim()
    .max(254, 'Contact email is too long')
    .refine((value: string) => value.length === 0 || z.email().safeParse(value).success, 'Invalid contact email'),
  contactPhone: z.string().trim().max(60, 'Contact phone is too long'),
  addressLine1: z.string().trim().max(220, 'Address line 1 is too long'),
  addressLine2: z.string().trim().max(220, 'Address line 2 is too long'),
  taxId: z.string().trim().max(120, 'Tax ID is too long'),
});

const invoiceCreateSchema = z
  .object({
    clientId: z.string().trim().min(1, 'Client is required'),
    invoiceNo: z.string().trim().min(1, 'Invoice number is required').max(80, 'Invoice number is too long'),
    invoiceLanguage: z.enum(["en", "ar"]),
    totalAmount: z.number().finite().positive('Total amount must be greater than zero'),
    paidAmount: z.number().finite().nonnegative('Paid amount must be zero or higher'),
    dueDate: z.string().trim().optional(),
  })
  .refine((value) => value.paidAmount <= value.totalAmount, {
    message: 'Paid amount cannot exceed total amount',
    path: ['paidAmount'],
  });

const invoiceUpdateSchema = z
  .object({
    status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'overdue']),
    paidAmount: z.number().finite().nonnegative('Paid amount must be zero or higher'),
    totalAmount: z.number().finite().nonnegative(),
  })
  .refine((value) => value.paidAmount <= value.totalAmount, {
    message: 'Paid amount cannot exceed total amount',
    path: ['paidAmount'],
  });

interface FreelanceOpsPanelProps {
  view?: FreelanceOpsView;
  error?: string;
  clients: Client[];
  invoices: Invoice[];
  freelancerProfile: FreelancerProfile | null;
  invoicePdfJobs: Record<string, InvoicePdfJob | null>;
  getInvoicePdfUrl: (invoiceId: string) => string;
  billingStats: BillingStats;
  nextInvoiceNo: string;
  isCreatingClient: boolean;
  isCreatingInvoice: boolean;
  onCreateClient: (input: { name: string; email?: string; phone?: string; notes?: string }) => Promise<Client | null>;
  onRemoveClient: (id: string) => Promise<boolean>;
  onCreateInvoice: (input: {
    clientId: string;
    invoiceNo: string;
    invoiceLanguage: "en" | "ar";
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
  onRemoveInvoice: (id: string) => Promise<void>;
  onSaveFreelancerProfile: (input: {
    businessName?: string;
    contactEmail?: string;
    contactPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    taxId?: string;
  }) => Promise<FreelancerProfile | null>;
  onUploadProfileLogo: (file: File) => Promise<FreelancerProfile | null>;
  onQueueInvoicePdf: (invoiceId: string) => Promise<void>;
  onRefreshInvoicePdfJob: (invoiceId: string) => Promise<void>;
}

function formatMoneyCents(cents: number, locale: Locale, currency = 'USD'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

function buildInvoicePdfFileName(invoice: Invoice) {
  const safeNo = (invoice.invoiceNo || 'invoice').trim().replace(/[^a-zA-Z0-9_-]+/g, '-');
  const date = invoice.issuedAt ? new Date(invoice.issuedAt) : null;
  if (!date || Number.isNaN(date.getTime())) return `${safeNo}.pdf`;
  const safeDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `${safeNo}-${safeDate}.pdf`;
}

export function FreelanceOpsPanel({
  view = 'all',
  error = '',
  clients,
  invoices,
  freelancerProfile,
  invoicePdfJobs,
  getInvoicePdfUrl,
  billingStats,
  nextInvoiceNo,
  isCreatingClient,
  isCreatingInvoice,
  onCreateClient,
  onRemoveClient,
  onCreateInvoice,
  onUpdateInvoice,
  onRemoveInvoice,
  onSaveFreelancerProfile,
  onUploadProfileLogo,
  onQueueInvoicePdf,
  onRefreshInvoicePdfJob,
}: FreelanceOpsPanelProps) {
  const { t, locale } = useI18n();
  const replaceVars = (template: string, vars: Record<string, string>) =>
    Object.entries(vars).reduce((result, [key, value]) => result.replace(`{${key}}`, value), template);
  const toOptional = (value: string): string | undefined => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };
  const translateValidationMessage = (message: string) => {
    const map: Record<string, string> = {
      'Business name is required': t('validation.businessRequired'),
      'Business name is too long': t('validation.businessTooLong'),
      'Contact email is too long': t('validation.emailTooLong'),
      'Invalid contact email': t('validation.invalidEmail'),
      'Contact phone is too long': t('validation.phoneTooLong'),
      'Address line 1 is too long': t('validation.address1TooLong'),
      'Address line 2 is too long': t('validation.address2TooLong'),
      'Tax ID is too long': t('validation.taxIdTooLong'),
      'Client is required': t('validation.clientRequired'),
      'Invoice number is required': t('validation.invoiceNumberRequired'),
      'Invoice number is too long': t('validation.invoiceNumberTooLong'),
      'Total amount must be greater than zero': t('validation.totalMustBePositive'),
      'Paid amount must be zero or higher': t('validation.paidMustBeNonNegative'),
      'Paid amount cannot exceed total amount': t('validation.paidCannotExceedTotal'),
    };
    return map[message] || message;
  };
  const invoiceStatusLabel = (status: Invoice['status']) => t(`invoice.status.${status}`);
  const invoicePdfJobStatusLabel = (status?: InvoicePdfJob['status'] | null) =>
    status ? t(`invoice.pdfStatus.${status}`) : t('invoice.none');

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [invoiceClientId, setInvoiceClientId] = useState('');
  const [invoiceTotal, setInvoiceTotal] = useState('');
  const [invoicePaid, setInvoicePaid] = useState('0');
  const [invoiceDueDate, setInvoiceDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [invoiceLanguage, setInvoiceLanguage] = useState<"en" | "ar">(locale === "ar" ? "ar" : "en");
  const [profileBusinessName, setProfileBusinessName] = useState(freelancerProfile?.businessName || '');
  const [profileEmail, setProfileEmail] = useState(freelancerProfile?.contactEmail || '');
  const [profilePhone, setProfilePhone] = useState(freelancerProfile?.contactPhone || '');
  const [profileAddress1, setProfileAddress1] = useState(freelancerProfile?.addressLine1 || '');
  const [profileAddress2, setProfileAddress2] = useState(freelancerProfile?.addressLine2 || '');
  const [profileTaxId, setProfileTaxId] = useState(freelancerProfile?.taxId || '');
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(freelancerProfile?.logoUrl || null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [invoiceStatusMap, setInvoiceStatusMap] = useState<Record<string, Invoice['status']>>({});
  const [invoiceTotalMap, setInvoiceTotalMap] = useState<Record<string, string>>({});
  const [invoicePaidMap, setInvoicePaidMap] = useState<Record<string, string>>({});
  const [brandingStatus, setBrandingStatus] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [invoiceCreateStatus, setInvoiceCreateStatus] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [clientStatus, setClientStatus] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [invoiceRowStatus, setInvoiceRowStatus] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [clientToArchive, setClientToArchive] = useState<Client | null>(null);
  const [clientFilter, setClientFilter] = useState<ClientFilter>('active');

  const activeClients = useMemo(
    () => clients.filter((client) => !client.isDeleted),
    [clients],
  );
  const filteredClients = useMemo(() => {
    if (clientFilter === 'archived') return clients.filter((client) => client.isDeleted);
    if (clientFilter === 'active') return clients.filter((client) => !client.isDeleted);
    return clients;
  }, [clientFilter, clients]);
  const hasClients = activeClients.length > 0;
  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [invoices],
  );

  useEffect(() => {
    setProfileBusinessName(freelancerProfile?.businessName || '');
    setProfileEmail(freelancerProfile?.contactEmail || '');
    setProfilePhone(freelancerProfile?.contactPhone || '');
    setProfileAddress1(freelancerProfile?.addressLine1 || '');
    setProfileAddress2(freelancerProfile?.addressLine2 || '');
    setProfileTaxId(freelancerProfile?.taxId || '');
    if (!isBrandingModalOpen) {
      setSelectedLogoFile(null);
    }
    if (!localPreviewUrl) {
      setLogoPreviewUrl(freelancerProfile?.logoUrl || null);
    }
  }, [freelancerProfile, isBrandingModalOpen, localPreviewUrl]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    if (!error) return;
    setBrandingStatus({ tone: 'error', message: error });
    setClientStatus({ tone: 'error', message: error });
  }, [error]);

  useEffect(() => {
    setInvoiceLanguage(locale === "ar" ? "ar" : "en");
  }, [locale]);

  const showBranding = view === 'all' || view === 'branding';
  const showClients = view === 'all' || view === 'clients';
  const showInvoices = view === 'all' || view === 'invoices';
  const showBothOpsCards = showClients && showInvoices;

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
        tone: 'error',
        message: parsed.error.issues[0]?.message || 'Please check branding fields and try again.',
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
    });
    if (result) {
      setBrandingStatus({ tone: 'success', message: 'Branding saved.' });
      setIsBrandingModalOpen(false);
    } else {
      setBrandingStatus({ tone: 'error', message: 'Could not save branding. Check your inputs and try again.' });
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
    event.target.value = '';
  };

  const handleCreateClientSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingClient || !clientName.trim()) return;
    setClientStatus(null);
    const result = await onCreateClient({
      name: clientName,
      email: clientEmail || undefined,
    });
    if (result) {
      setClientName('');
      setClientEmail('');
    }
  };

  const handleArchiveClient = async () => {
    if (!clientToArchive) return;
    setClientStatus(null);
    const ok = await onRemoveClient(clientToArchive.id);
    if (ok) {
      setClientStatus({ tone: 'success', message: t("clients.archiveSuccess") });
      setClientToArchive(null);
    }
  };

  const handleCreateInvoiceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingInvoice || !hasClients) return;
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
        tone: 'error',
        message: parsed.error.issues[0]?.message || 'Invalid invoice input',
      });
      return;
    }
    const result = await onCreateInvoice({
      clientId: parsed.data.clientId,
      invoiceNo: parsed.data.invoiceNo,
      invoiceLanguage: parsed.data.invoiceLanguage,
      totalAmount: parsed.data.totalAmount,
      paidAmount: parsed.data.paidAmount,
      dueDate: parsed.data.dueDate || undefined,
    });
    if (result) {
      setInvoiceTotal('');
      setInvoicePaid('0');
      setInvoiceClientId('');
      setInvoiceDueDate(new Date().toISOString().slice(0, 10));
      setInvoiceCreateStatus({ tone: 'success', message: 'Invoice created.' });
    } else {
      setInvoiceCreateStatus({ tone: 'error', message: 'Could not create invoice. Try again.' });
    }
  };

  const handleInvoiceRowSave = async (invoice: Invoice) => {
    setInvoiceRowStatus(null);
    const totalAmount = Number(invoiceTotalMap[invoice.id] ?? invoice.totalAmount / 100);
    const paidAmount = Number(invoicePaidMap[invoice.id] ?? invoice.paidAmount / 100);
    const status = invoiceStatusMap[invoice.id] ?? invoice.status;
    const parsed = invoiceUpdateSchema.safeParse({
      status,
      paidAmount,
      totalAmount,
    });
    if (!parsed.success) {
      setInvoiceRowStatus({
        tone: 'error',
        message: parsed.error.issues[0]?.message || `Invalid values for ${invoice.invoiceNo}`,
      });
      return;
    }
    await onUpdateInvoice(invoice.id, {
      status: parsed.data.status,
      totalAmount: parsed.data.totalAmount,
      paidAmount: parsed.data.paidAmount,
    });
    setInvoiceRowStatus({ tone: 'success', message: `Invoice ${invoice.invoiceNo} updated.` });
  };

  return (
    <section className="space-y-4">
      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="text-xl text-white">{t("freelance.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">{t("freelance.invoiced")}</p>
            <p className="metric-value text-2xl font-bold text-white mt-2">{formatMoneyCents(billingStats.totalInvoiced)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">{t("freelance.paid")}</p>
            <p className="metric-value text-2xl font-bold text-emerald-300 mt-2">{formatMoneyCents(billingStats.totalPaid)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">{t("freelance.outstanding")}</p>
            <p className="metric-value text-2xl font-bold text-amber-300 mt-2">{formatMoneyCents(billingStats.totalOutstanding)}</p>
          </div>
        </CardContent>
      </Card>

      {showBranding && (
        <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">{t("branding.title")}</CardTitle>
            <Button
              variant="outline"
              className="border-white/10 text-white"
              onClick={() => {
                setBrandingStatus(null);
                setIsBrandingModalOpen(true);
              }}
            >
              {t("branding.edit")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-slate-400">{t("branding.business")}</td>
                    <td className="px-3 py-2 text-white">{freelancerProfile?.businessName || '-'}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-slate-400">{t("branding.email")}</td>
                    <td className="px-3 py-2 text-white">{freelancerProfile?.contactEmail || '-'}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-slate-400">{t("branding.phone")}</td>
                    <td className="px-3 py-2 text-white">{freelancerProfile?.contactPhone || '-'}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-slate-400">{t("branding.address")}</td>
                    <td className="px-3 py-2 text-white">
                      {[freelancerProfile?.addressLine1, freelancerProfile?.addressLine2].filter(Boolean).join(' / ') || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-400">{t("branding.taxId")}</td>
                    <td className="px-3 py-2 text-white">{freelancerProfile?.taxId || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {logoPreviewUrl && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">{t("branding.currentLogo")}</p>
                <img
                  src={logoPreviewUrl}
                  alt="Freelancer logo"
                  className="max-h-24 w-auto rounded-lg border border-white/10 bg-white/5"
                />
              </div>
            )}

            {brandingStatus && (
              <div
                className={`rounded-lg border p-3 text-sm ${
                  brandingStatus.tone === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-danger/40 bg-danger/20 text-danger'
                }`}
              >
                {brandingStatus.message}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={isBrandingModalOpen}
        onOpenChange={setIsBrandingModalOpen}
        title={t("branding.modalTitle")}
        maxWidthClassName="max-w-2xl"
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleBrandingSubmit}>
          <Input placeholder="Business name" value={profileBusinessName} onChange={(e) => setProfileBusinessName(e.target.value)} />
          <label className="flex h-11 items-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200">
            <input
              type="file"
              accept="image/*"
              disabled={isSavingBranding || isUploadingLogo}
              className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-white disabled:opacity-50"
              onChange={handleLogoSelect}
            />
          </label>
          <Input placeholder="Contact email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
          <Input placeholder="Contact phone" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
          <Input placeholder="Address line 1" value={profileAddress1} onChange={(e) => setProfileAddress1(e.target.value)} />
          <Input placeholder="Address line 2" value={profileAddress2} onChange={(e) => setProfileAddress2(e.target.value)} />
          <Input placeholder="Tax ID" value={profileTaxId} onChange={(e) => setProfileTaxId(e.target.value)} />
          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              {selectedLogoFile ? `Selected logo: ${selectedLogoFile.name}` : t("branding.logoWillUploadOnSave")}
            </p>
            <Button type="submit" disabled={isSavingBranding || isUploadingLogo}>
              {isSavingBranding || isUploadingLogo ? t("branding.saving") : t("branding.save")}
            </Button>
          </div>
        </form>
      </Dialog>

      <div className={`grid grid-cols-1 gap-4 ${showBothOpsCards ? 'xl:grid-cols-2' : ''}`}>
        {showClients && (
          <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white">{t("clients.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid grid-cols-1 md:grid-cols-3 gap-2" onSubmit={handleCreateClientSubmit}>
              <Input
                placeholder={t("clients.namePlaceholder")}
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
              />
              <Input
                placeholder={t("clients.emailPlaceholder")}
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
              />
              <Button type="submit" disabled={isCreatingClient || !clientName.trim()}>
                {isCreatingClient ? t("clients.adding") : t("clients.add")}
              </Button>
            </form>

            <div className="flex justify-end">
              <div className="w-40">
                <Select value={clientFilter} onValueChange={(value) => setClientFilter(value as ClientFilter)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("clients.filter.all")}</SelectItem>
                    <SelectItem value="active">{t("clients.filter.active")}</SelectItem>
                    <SelectItem value="archived">{t("clients.filter.archived")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {clientStatus && (
              <div
                className={`rounded-lg border p-3 text-sm ${
                  clientStatus.tone === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-danger/40 bg-danger/20 text-danger'
                }`}
              >
                {clientStatus.message}
              </div>
            )}

            <TableWrapper>
              <Table>
                <thead>
                  <tr className="border-b border-white/10">
                    <Th>{t("clients.name")}</Th>
                    <Th>{t("clients.email")}</Th>
                    <Th>{t("clients.status")}</Th>
                    <Th className="text-right">{t("clients.action")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-white/5">
                      <Td className="text-white">
                        <div className="flex items-center gap-2">
                          <span>{client.name}</span>
                          {client.isDeleted && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100">
                              {t("clients.archivedBadge")}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td className="text-slate-300">{client.email || '-'}</Td>
                      <Td className="text-slate-300">
                        {client.isDeleted ? t("clients.archivedBadge") : client.status}
                      </Td>
                      <Td className="text-right">
                        {client.isDeleted ? (
                          <span className="text-xs text-slate-500">{t("clients.archivedBadge")}</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10 text-white"
                            onClick={() => {
                              setClientStatus(null);
                              setClientToArchive(client);
                            }}
                          >
                            {t("clients.archive")}
                          </Button>
                        )}
                      </Td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <Td colSpan={4} className="text-slate-400 text-center py-8">
                        {t("clients.empty")}
                      </Td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrapper>
          </CardContent>
          </Card>
        )}

        {showInvoices && (
          <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white">{t("invoices.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleCreateInvoiceSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <Select value={invoiceClientId} onValueChange={setInvoiceClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                  {activeClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Auto invoice number"
                  value={nextInvoiceNo}
                  disabled
                  readOnly
                />
                <Input
                  type="number"
                  placeholder="Total"
                  value={invoiceTotal}
                  onChange={(event) => setInvoiceTotal(event.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Paid"
                  value={invoicePaid}
                  onChange={(event) => setInvoicePaid(event.target.value)}
                />
                <Select value={invoiceLanguage} onValueChange={(value) => setInvoiceLanguage(value as "en" | "ar")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("invoice.lang.en")}</SelectItem>
                    <SelectItem value="ar">{t("invoice.lang.ar")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  disabled={isCreatingInvoice || !hasClients}
                >
                  {isCreatingInvoice ? 'Adding...' : 'Add Invoice'}
                </Button>
              </div>
              <DatePicker value={invoiceDueDate} onChange={setInvoiceDueDate} placeholder="Pick due date" />
            </form>
            {invoiceCreateStatus && (
              <div
                className={`rounded-lg border p-3 text-sm ${
                  invoiceCreateStatus.tone === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-danger/40 bg-danger/20 text-danger'
                }`}
              >
                {invoiceCreateStatus.message}
              </div>
            )}
            {invoiceRowStatus && (
              <div
                className={`rounded-lg border p-3 text-sm ${
                  invoiceRowStatus.tone === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-danger/40 bg-danger/20 text-danger'
                }`}
              >
                {invoiceRowStatus.message}
              </div>
            )}

            <TableWrapper>
              <Table>
                <thead>
                  <tr className="border-b border-white/10">
                    <Th>Invoice</Th>
                    <Th>{t("invoice.client")}</Th>
                    <Th>{t("invoice.total")}</Th>
                    <Th>{t("invoice.paidLabel")}</Th>
                    <Th>{t("invoice.status")}</Th>
                    <Th>{t("invoice.pdf")}</Th>
                    <Th className="text-right">{t("invoice.action")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-white/5">
                      <Td className="text-white">{invoice.invoiceNo}</Td>
                      <Td className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <span>{invoice.clientName || '-'}</span>
                          {invoice.clientIsDeleted && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100">
                              {t("clients.archivedBadge")}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <Input
                          type="number"
                          className="h-9"
                          value={invoiceTotalMap[invoice.id] ?? String(invoice.totalAmount / 100)}
                          onChange={(event) =>
                            setInvoiceTotalMap((prev) => ({ ...prev, [invoice.id]: event.target.value }))
                          }
                        />
                      </Td>
                      <Td>
                        <Input
                          type="number"
                          className="h-9"
                          value={invoicePaidMap[invoice.id] ?? String(invoice.paidAmount / 100)}
                          onChange={(event) =>
                            setInvoicePaidMap((prev) => ({ ...prev, [invoice.id]: event.target.value }))
                          }
                        />
                      </Td>
                      <Td>
                        <Select
                          value={invoiceStatusMap[invoice.id] ?? invoice.status}
                          onValueChange={(value) =>
                            setInvoiceStatusMap((prev) => ({
                              ...prev,
                              [invoice.id]: value as Invoice['status'],
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 rounded-lg px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">draft</SelectItem>
                            <SelectItem value="sent">sent</SelectItem>
                            <SelectItem value="partially_paid">partially_paid</SelectItem>
                            <SelectItem value="paid">paid</SelectItem>
                            <SelectItem value="overdue">overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-300">
                            {invoicePdfJobs[invoice.id]?.status || t("invoice.none")}
                          </span>
                          {(invoicePdfJobs[invoice.id]?.status === 'pending' ||
                            invoicePdfJobs[invoice.id]?.status === 'processing') && (
                            <span className="text-[11px] text-slate-500">{t("invoice.autoChecking")}</span>
                          )}
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/10 text-white"
                              onClick={() => {
                                void onQueueInvoicePdf(invoice.id);
                              }}
                            >
                              {t("invoice.retry")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/10 text-white"
                              onClick={() => {
                                void onRefreshInvoicePdfJob(invoice.id);
                              }}
                            >
                              {t("invoice.check")}
                            </Button>
                            {invoicePdfJobs[invoice.id]?.status === 'completed' && (
                              <a
                                href={getInvoicePdfUrl(invoice.id)}
                                download={buildInvoicePdfFileName(invoice)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-8 items-center rounded-md border border-white/10 px-2 text-xs text-white"
                              >
                                {t("invoice.download")}
                              </a>
                            )}
                          </div>
                        </div>
                      </Td>
                      <Td className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/10 text-white"
                          onClick={() => {
                            void handleInvoiceRowSave(invoice);
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/10 text-white"
                          onClick={() => {
                            void onRemoveInvoice(invoice.id);
                          }}
                        >
                          Delete
                        </Button>
                      </Td>
                    </tr>
                  ))}
                  {sortedInvoices.length === 0 && (
                    <tr>
                      <Td colSpan={7} className="text-slate-400 text-center py-8">
                        {t("invoices.empty")}
                      </Td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrapper>
          </CardContent>
          </Card>
        )}

        <Dialog
          open={clientToArchive !== null}
          onOpenChange={(open) => {
            if (!open) setClientToArchive(null);
          }}
          title={t("clients.archiveTitle")}
          maxWidthClassName="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-300">
              {t("clients.archiveDescription")}
            </p>
            {clientToArchive && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                {clientToArchive.name}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/10 text-white"
                onClick={() => setClientToArchive(null)}
              >
                {t("clients.archiveCancel")}
              </Button>
              <Button
                type="button"
                className="bg-danger text-white hover:bg-danger/90"
                onClick={() => {
                  void handleArchiveClient();
                }}
              >
                {t("clients.archiveConfirm")}
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </section>
  );
}
  const buildInvoicePdfFileName = (invoice: Invoice) => {
    const safeNo = (invoice.invoiceNo || "invoice").trim().replace(/[^a-zA-Z0-9_-]+/g, "-");
    const date = invoice.issuedAt ? new Date(invoice.issuedAt) : null;
    if (!date || Number.isNaN(date.getTime())) return `${safeNo}.pdf`;
    const safeDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return `${safeNo}-${safeDate}.pdf`;
  };
