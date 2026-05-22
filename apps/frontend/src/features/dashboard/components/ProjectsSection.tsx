import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Dialog } from "../../../shared/ui/dialog";
import { Input } from "../../../shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/ui/select";
import { Table, TableWrapper, Td, Th } from "../../../shared/ui/table";
import { DatePicker } from "../../../shared/ui/date-picker";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { formatCurrency, formatCurrencyCents } from "../../../shared/lib/currency";
import {
  fetchProjectDetail,
  createProject,
  updateProject,
  archiveProject,
  addMilestone,
  removeMilestone,
  generateInvoiceFromMilestone,
  recordPayment,
  buildReceiptPdfUrl,
} from "../../../lib/api/projects";
import type { Project, Milestone, Payment, Client } from "../types/dashboard";
import { SkeletonCard, SkeletonTable } from "../../../shared/ui/skeleton";
import { useClientsData } from "../hooks/use-clients-data";

function ProjectBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const colors: Record<string, string> = {
    draft: "bg-slate-500/20 text-slate-300",
    active: "bg-emerald-500/20 text-emerald-300",
    completed: "bg-blue-500/20 text-blue-300",
    cancelled: "bg-red-500/20 text-red-300",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${colors[status] || colors.draft}`}>
      {t(`projects.status.${status}`)}
    </span>
  );
}

function ProjectList({
  projects,
  clients,
  onCreateProject,
  isCreating,
  createError,
  onDeleteRequest,
}: {
  projects: Project[];
  clients: Client[];
  onCreateProject: (input: {
    clientId: string;
    name: string;
    totalAmount: number;
    projectType: "milestone" | "standard";
    milestones?: { name: string; amount: number }[];
  }) => Promise<void>;
  isCreating: boolean;
  createError?: string;
  onDeleteRequest: (id: string) => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [projectType, setProjectType] = useState<"milestone" | "standard">("standard");
  const [milestones, setMilestones] = useState<{ name: string; amount: string }[]>([]);
  const [filter, setFilter] = useState<"active" | "all">("active");

  const filtered = filter === "active"
    ? projects.filter((p) => p.status === "draft" || p.status === "active")
    : projects;

  const addMilestoneRow = () => {
    setMilestones([...milestones, { name: "", amount: "" }]);
  };

  const updateMilestone = (idx: number, field: "name" | "amount", value: string) => {
    setMilestones(milestones.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const removeMilestoneRow = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !name || !totalAmount) return;
    await onCreateProject({
      clientId,
      name,
      totalAmount: Number(totalAmount),
      projectType,
      milestones: projectType === "milestone"
        ? milestones.filter(m => m.name && m.amount).map(m => ({ name: m.name, amount: Number(m.amount) }))
        : undefined,
    });
    setClientId("");
    setName("");
    setTotalAmount("");
    setProjectType("standard");
    setMilestones([]);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="text-xl text-white">{t("projects.create")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={handleSubmit}>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder={t("invoice.selectClient")} />
              </SelectTrigger>
              <SelectContent>
                {clients.filter(c => !c.isDeleted).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder={t("projects.name")} value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Total amount (EGP)" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
            <Select value={projectType} onValueChange={(v) => setProjectType(v as "milestone" | "standard")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
              </SelectContent>
            </Select>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={isCreating || !clientId || !name || !totalAmount}>
                {isCreating ? "Creating..." : t("projects.create")}
              </Button>
            </div>
          </form>

          {projectType === "milestone" && (
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <p className="text-sm font-medium text-white">Installments</p>
              {milestones.map((m, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder="Name (e.g. 50% Advance)"
                    value={m.name}
                    onChange={(e) => updateMilestone(idx, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Amount"
                    value={m.amount}
                    onChange={(e) => updateMilestone(idx, "amount", e.target.value)}
                    className="w-32"
                  />
                  <Button variant="ghost" size="sm" className="h-9 text-xs text-red-400" onClick={() => removeMilestoneRow(idx)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMilestoneRow} className="text-xs">
                + Add installment
              </Button>
            </div>
          )}

          {createError && (
            <div className="mt-3 rounded-lg border border-danger/40 bg-danger/20 p-3 text-sm text-danger">
              {createError}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg text-white">{t("projects.title")}</CardTitle>
          <div className="w-36">
            <Select value={filter} onValueChange={(v) => setFilter(v as "active" | "all")}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("projects.filterActive")}</SelectItem>
                <SelectItem value="all">{t("projects.filterAll")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <TableWrapper>
              <Table>
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                    <Th>{t("projects.name")}</Th>
                    <Th>Client</Th>
                    <Th className="w-28">{t("projects.contract")}</Th>
                    <Th className="w-28">{t("projects.invoiced")}</Th>
                    <Th className="w-28">{t("projects.paid")}</Th>
                    <Th className="w-28">{t("projects.remaining")}</Th>
                    <Th className="w-24">{t("projects.status")}</Th>
                    <Th className="text-right">{t("projects.actions")}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.length === 0 ? (
                    <tr>
                      <Td colSpan={8} className="text-center py-8 text-sm text-slate-500">
                        {filter === "active" ? "No active projects" : "No projects yet"}
                      </Td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <Td className="text-sm font-medium text-white">{p.name}</Td>
                        <Td className="text-sm text-slate-300">{p.clientName}</Td>
                        <Td className="text-sm text-white tabular-nums">{formatCurrency(p.totalAmount, "USD")}</Td>
                        <Td className="text-sm text-slate-300 tabular-nums">{formatCurrency(p.totalInvoiced, "USD")}</Td>
                        <Td className="text-sm text-emerald-300 tabular-nums">{formatCurrency(p.totalPaid, "USD")}</Td>
                        <Td className="text-sm text-amber-300 tabular-nums">{formatCurrency(p.remaining, "USD")}</Td>
                        <Td><ProjectBadge status={p.status} /></Td>
                        <Td className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400" onClick={() => navigate(`/${localStorage.getItem("fawtarly_locale") || "en"}/projects/${p.id}`)}>
                              {t("licensing.view")}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-400" onClick={() => navigate(`/${localStorage.getItem("fawtarly_locale") || "en"}/projects/${p.id}?edit=1`)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400" onClick={() => onDeleteRequest(p.id)}>
                              Delete
                            </Button>
                          </div>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrapper>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MilestoneRow({
  milestone,
  onGenerateInvoice,
  onRemove,
}: {
  milestone: Milestone;
  onGenerateInvoice: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{milestone.name}</p>
        <p className="text-xs text-slate-400">{formatCurrencyCents(milestone.amount, "USD")}</p>
      </div>
      <div className="flex gap-2">
        {milestone.invoiceId ? (
          <span className="text-xs text-emerald-400">{t("invoice.title")}</span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-blue-400"
            onClick={() => onGenerateInvoice(milestone.id)}
          >
            {t("projects.detail.generateInvoice")}
          </Button>
        )}
        {!milestone.invoiceId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-red-400"
            onClick={() => onRemove(milestone.id)}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

function ProjectDetail({
  projectId,
  clients,
}: {
  projectId: string;
  clients: Client[];
}) {
  const { t } = useI18n();
  function fmtDate(date: Date) {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = localStorage.getItem("fawtarly_locale") || "en";
  const [searchParams] = useSearchParams();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["project-detail", projectId],
    queryFn: () => fetchProjectDetail(projectId),
  });

  useEffect(() => {
    const shouldEdit = searchParams.get("edit") === "1";
    if (shouldEdit && !editing && detail) {
      setEditName(detail.project.name);
      setEditAmount(String(Math.round(detail.project.totalAmount / 100)));
      setEditStatus(detail.project.status);
      setEditing(true);
    }
  }, [searchParams, detail]);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [milestoneName, setMilestoneName] = useState("");
  const [milestoneAmount, setMilestoneAmount] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentInvoiceId, setPaymentInvoiceId] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const invalidateDetail = () => queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });

  const addMilestoneMutation = useMutation({
    mutationFn: (input: { name: string; amount: number }) =>
      addMilestone(projectId, input),
    onSuccess: invalidateDetail,
  });

  const removeMilestoneMutation = useMutation({
    mutationFn: (milestoneId: string) => removeMilestone(projectId, milestoneId),
    onSuccess: invalidateDetail,
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: (milestoneId: string) => generateInvoiceFromMilestone(projectId, milestoneId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] }),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (input: { invoiceId: string; amount: number; paymentMethod: string }) =>
      recordPayment(input.invoiceId, input),
    onSuccess: invalidateDetail,
  });

  const updateProjectMutation = useMutation({
    mutationFn: (input: { name?: string; totalAmount?: number; status?: string }) =>
      updateProject(projectId, input),
    onSuccess: () => {
      invalidateDetail();
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const archiveProjectMutation = useMutation({
    mutationFn: () => archiveProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate(`/${locale}/projects`);
    },
  });

  const startEditing = () => {
    setEditName(project.name);
    setEditAmount(String(Math.round(project.totalAmount / 100)));
    setEditStatus(project.status);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    await updateProjectMutation.mutateAsync({
      name: editName.trim(),
      totalAmount: Number(editAmount),
      status: editStatus,
    });
    setEditing(false);
  };

  if (isLoading) {
    return <SkeletonCard className="w-full" />;
  }

  if (!detail) {
    return <div className="text-sm text-red-400">Project not found</div>;
  }

  const { project, invoices, milestones, payments } = detail;

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneName || !milestoneAmount) return;
    await addMilestoneMutation.mutateAsync({ name: milestoneName, amount: Number(milestoneAmount) });
    setMilestoneName("");
    setMilestoneAmount("");
  };

  const handleGenerateInvoice = async (milestoneId: string) => {
    await generateInvoiceMutation.mutateAsync(milestoneId);
  };

  const handleRemoveMilestone = async (milestoneId: string) => {
    await removeMilestoneMutation.mutateAsync(milestoneId);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoiceId || !paymentAmount) return;
    await recordPaymentMutation.mutateAsync({ invoiceId: paymentInvoiceId, amount: Number(paymentAmount), paymentMethod });
    setPaymentAmount("");
    setShowPaymentForm(false);
  };

  const localePath = (path: string) => `/${locale}${path}`;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400" onClick={() => navigate(localePath("/projects"))}>
        ← {t("projects.detail.back")}
      </Button>

      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardContent className="pt-6">
          {editing ? (
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-400">Name</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-400">Amount (EGP)</label>
                  <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-400">Status</label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={updateProjectMutation.isPending || !editName.trim()}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={cancelEditing}>Cancel</Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{project.name}</h2>
                  <p className="text-sm text-slate-400">{project.clientName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ProjectBadge status={project.status} />
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-400" onClick={startEditing}>Edit</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">{t("projects.contract")}</p>
                  <p className="mt-1 text-lg font-semibold text-white tabular-nums">{formatCurrency(project.totalAmount, "USD")}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">{t("projects.invoiced")}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-300 tabular-nums">{formatCurrency(project.totalInvoiced, "USD")}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">{t("projects.detail.totalPaid")}</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-300 tabular-nums">{formatCurrency(project.totalPaid, "USD")}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">{t("projects.detail.totalOutstanding")}</p>
                  <p className="mt-1 text-lg font-semibold text-amber-300 tabular-nums">{formatCurrency(project.remaining, "USD")}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {!confirmArchive ? (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400" onClick={() => setConfirmArchive(true)}>
                    Archive
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                    <span className="text-xs text-red-300">Are you sure?</span>
                    <Button size="sm" className="h-7 text-xs" variant="destructive" onClick={() => archiveProjectMutation.mutate()} disabled={archiveProjectMutation.isPending}>
                      {archiveProjectMutation.isPending ? "Archiving..." : "Confirm"}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setConfirmArchive(false)}>Cancel</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-white">{t("projects.detail.milestones")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {milestones.length === 0 && (
            <p className="text-sm text-slate-400">{t("projects.detail.noMilestones")}</p>
          )}
          {milestones.map((m: Milestone) => (
            <MilestoneRow
              key={m.id}
              milestone={m}
              onGenerateInvoice={handleGenerateInvoice}
              onRemove={handleRemoveMilestone}
            />
          ))}
          <form className="flex gap-2" onSubmit={handleAddMilestone}>
            <Input
              placeholder="Milestone name"
              value={milestoneName}
              onChange={(e) => setMilestoneName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Amount"
              value={milestoneAmount}
              onChange={(e) => setMilestoneAmount(e.target.value)}
              className="w-32"
            />
            <Button type="submit" size="sm" disabled={addMilestoneMutation.isPending}>
              {t("projects.detail.addMilestone")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-white">{t("projects.detail.invoices")}</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-slate-400">{t("projects.detail.noInvoices")}</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <TableWrapper>
                <Table>
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                      <Th className="w-20">No.</Th>
                      <Th className="w-28">{t("projects.invoiced")}</Th>
                      <Th className="w-28">{t("projects.paid")}</Th>
                      <Th className="w-24">{t("projects.status")}</Th>
                      <Th className="w-28">Issued</Th>
                      <Th className="w-28">Due</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                        <Td className="text-xs font-mono text-slate-300">{inv.invoiceNo}</Td>
                        <Td className="text-sm text-white tabular-nums">{formatCurrencyCents(inv.totalAmount, "USD")}</Td>
                        <Td className="text-sm text-emerald-300 tabular-nums">{formatCurrencyCents(inv.paidAmount, "USD")}</Td>
                        <Td><ProjectBadge status={inv.status} /></Td>
                        <Td className="text-xs text-slate-400">{inv.issuedAt ? fmtDate(new Date(inv.issuedAt)) : "-"}</Td>
                        <Td className="text-xs text-slate-400">{inv.dueDate ? fmtDate(new Date(inv.dueDate)) : "-"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrapper>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/5 shadow-soft ring-1 ring-white/5">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">{t("projects.detail.payments")}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setShowPaymentForm(!showPaymentForm)}
          >
            {t("projects.detail.recordPayment")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showPaymentForm && invoices.length > 0 && (
            <form className="flex gap-2 items-end" onSubmit={handleRecordPayment}>
              <Select value={paymentInvoiceId} onValueChange={setPaymentInvoiceId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((inv: any) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoiceNo} - {formatCurrencyCents(inv.totalAmount, "USD")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-32"
              />
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" size="sm" disabled={recordPaymentMutation.isPending || !paymentInvoiceId || !paymentAmount}>
                Save
              </Button>
            </form>
          )}

          {payments.length === 0 ? (
            <p className="text-sm text-slate-400">{t("projects.detail.noPayments")}</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <TableWrapper>
                <Table>
                  <thead>
                    <tr>
                      <Th>Date</Th>
                      <Th className="w-28">{t("projects.paid")}</Th>
                      <Th className="w-24">Method</Th>
                      <Th>Notes</Th>
                      <Th className="w-20">Receipt</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((p: Payment) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <Td className="text-xs text-slate-400">{fmtDate(new Date(p.paymentDate))}</Td>
                        <Td className="text-sm text-emerald-300 tabular-nums">{formatCurrencyCents(p.amount, "USD")}</Td>
                        <Td className="text-xs text-slate-400">{p.paymentMethod || "-"}</Td>
                        <Td className="text-xs text-slate-500">{p.notes || "-"}</Td>
                        <Td>
                          {p.receiptPdfUrl ? (
                            <a
                              href={buildReceiptPdfUrl(p.invoiceId, p.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                              PDF
                            </a>
                          ) : (
                            <span className="text-xs text-slate-600">-</span>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrapper>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ProjectsSection({ projectId }: { projectId?: string }) {
  const queryClient = useQueryClient();

  const onUnauthorized = useCallback(() => {
    window.location.reload();
  }, []);

  const clients = useClientsData(onUnauthorized);

  const { data: projects = [], isLoading, isError, error } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const d = await res.json();
      return d?.projects ?? [];
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (input: { clientId: string; name: string; totalAmount: number; projectType: "milestone" | "standard" }) =>
      createProject({ clientId: input.clientId, name: input.name, totalAmount: input.totalAmount, projectType: input.projectType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const addMilestonesMutation = useMutation({
    mutationFn: async ({ projectId, milestones: ms }: { projectId: string; milestones: { name: string; amount: number }[] }) => {
      for (const m of ms) {
        await addMilestone(projectId, m);
      }
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => archiveProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteConfirmId(null);
    },
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [createError, setCreateError] = useState("");

  const handleCreateProject = async (input: {
    clientId: string;
    name: string;
    totalAmount: number;
    projectType: "milestone" | "standard";
    milestones?: { name: string; amount: number }[];
  }) => {
    setCreateError("");
    try {
      const created = await createProjectMutation.mutateAsync(input);
      if (input.milestones && input.milestones.length > 0 && created?.id) {
        await addMilestonesMutation.mutateAsync({ projectId: created.id, milestones: input.milestones });
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  if (projectId) {
    return <ProjectDetail projectId={projectId} clients={clients.clients} />;
  }

  if (isLoading) {
    return <SkeletonTable rows={6} />;
  }

  if (isError) {
    return <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">Failed to load projects: {error?.message || "Unknown error"}</div>;
  }

  return (
    <>
      <ProjectList
        projects={projects}
        clients={clients.clients}
        onCreateProject={handleCreateProject}
        isCreating={createProjectMutation.isPending}
        createError={createError}
        onDeleteRequest={setDeleteConfirmId}
      />
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete project"
      >
        <div className="space-y-4">
          <p className="text-sm text-danger">Are you sure you want to delete this project? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteConfirmId) deleteProjectMutation.mutate(deleteConfirmId); }} disabled={deleteProjectMutation.isPending}>
              {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
