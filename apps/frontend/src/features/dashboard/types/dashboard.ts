export type ActivationStatus = "pending" | "active" | "revoked" | "expired";

export interface Activation {
  id: string;
  requestType?: "license_activation" | "request_only";
  appName: string;
  appVersion: string;
  licenseKey: string;
  machineId: string;
  shopName?: string | null;
  phone?: string | null;
  notes?: string | null;
  status: ActivationStatus;
  requestReason?: string | null;
  requestPlatform?: string | null;
  requestSource?: string | null;
  createdAt: string;
  activatedAt?: string;
}

export interface Stats {
  total: number;
  active: number;
  pending: number;
  revoked: number;
}

export type ActivationFilter = "all" | "pending" | "active" | "revoked";

export interface License {
  id: string;
  appName: string;
  licenseKey: string;
  licenseType?: "machine_id_bound" | "pre_generated";
  status: "active" | "revoked";
  maxActivations: number;
  activeActivations: number;
  remainingActivations: number;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedApp {
  id: string;
  name: string;
  slug: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: "active" | "inactive";
  isDeleted: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  clientName?: string | null;
  clientIsDeleted?: boolean | null;
  isDeleted: boolean;
  invoiceNo: string;
  status: "draft" | "sent" | "partially_paid" | "paid" | "overdue";
  currency: string;
  invoiceLanguage: "en" | "ar";
  totalAmount: number;
  paidAmount: number;
  dueDate?: string | null;
  issuedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingStats {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalCount: number;
}

export interface FreelancerProfile {
  id: string;
  userId: string;
  businessName?: string | null;
  logoUrl?: string | null;
  logoObjectKey?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  taxId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePdfJob {
  id: string;
  userId: string;
  invoiceId: string;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  errorMessage?: string | null;
  outputPath?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}
