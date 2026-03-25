import type { BillingStats, Client, FreelancerProfile, Invoice, InvoicePdfJob } from "../types/dashboard";
import type { SupportedCurrency } from "../../onboarding/setup";

export type FreelanceOpsView = 'branding' | 'clients' | 'invoices' | 'all';

export interface FreelanceOpsPanelProps {
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
  onHardDeleteClient: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onRemoveClient: (id: string) => Promise<boolean>;
  onRestoreClient: (id: string) => Promise<Client | null>;
  onUpdateClient: (id: string, input: { name?: string; email?: string; phone?: string; notes?: string; status?: 'active' | 'inactive' }) => Promise<Client | null>;
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
  onSaveFreelancerProfile: (input: {
    businessName?: string;
    contactEmail?: string;
    contactPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    taxId?: string;
    defaultCurrency?: SupportedCurrency;
    defaultInvoiceLanguage?: "en" | "ar";
    appLanguage?: "en" | "ar";
  }) => Promise<FreelancerProfile | null>;
  onUploadProfileLogo: (file: File) => Promise<FreelancerProfile | null>;
  onQueueInvoicePdf: (invoiceId: string) => Promise<void>;
  onRefreshInvoicePdfJob: (invoiceId: string) => Promise<void>;
  onSendInvoiceEmail: (invoiceId: string) => Promise<void>;
}
