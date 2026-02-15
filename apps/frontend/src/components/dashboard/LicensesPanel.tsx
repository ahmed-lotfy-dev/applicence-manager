import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { License, ManagedApp } from '../../types/dashboard';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableWrapper, Td, Th } from '../ui/table';

interface LicensesPanelProps {
  licenses: License[];
  apps: ManagedApp[];
  filterValue: string;
  onFilterChange: (value: string) => void;
  onCreateApp: (name: string) => Promise<boolean>;
  onUpdateApp: (id: string, input: { name?: string; status?: 'active' | 'inactive' }) => Promise<void>;
  onRemoveApp: (id: string) => Promise<void>;
  onCreateLicense: (input: { appName: string; maxActivations: number }) => Promise<boolean>;
  onUpdateLicense: (
    id: string,
    input: { maxActivations?: number; status?: 'active' | 'revoked' },
  ) => Promise<void>;
  onRemoveLicense: (id: string) => Promise<void>;
  onChangeLicenseStatus: (id: string, nextStatus: 'active' | 'revoked') => Promise<void>;
  isCreatingLicense: boolean;
  isCreatingApp: boolean;
  appActionLoadingId: string | null;
  licenseActionLoadingId: string | null;
}

interface AppSummary {
  appName: string;
  licenses: number;
  activeActivations: number;
  maxActivations: number;
}

interface EditAppState {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

interface EditLicenseState {
  id: string;
  maxActivations: string;
  status: 'active' | 'revoked';
}

function buildAppSummaries(licenses: License[]): AppSummary[] {
  const map = new Map<string, AppSummary>();

  for (const license of licenses) {
    const current = map.get(license.appName) || {
      appName: license.appName,
      licenses: 0,
      activeActivations: 0,
      maxActivations: 0,
    };

    current.licenses += 1;
    current.activeActivations += license.activeActivations;
    current.maxActivations += license.maxActivations;

    map.set(license.appName, current);
  }

  return Array.from(map.values()).sort((a, b) => a.appName.localeCompare(b.appName));
}

export function LicensesPanel({
  licenses,
  apps,
  filterValue,
  onFilterChange,
  onCreateApp,
  onUpdateApp,
  onRemoveApp,
  onCreateLicense,
  onUpdateLicense,
  onRemoveLicense,
  onChangeLicenseStatus,
  isCreatingLicense,
  isCreatingApp,
  appActionLoadingId,
  licenseActionLoadingId,
}: LicensesPanelProps) {
  const summaries = useMemo(() => buildAppSummaries(licenses), [licenses]);

  const [newAppName, setNewAppName] = useState('');
  const [createLicenseOpen, setCreateLicenseOpen] = useState(false);
  const [createLicenseAppId, setCreateLicenseAppId] = useState('');
  const [createLicenseMax, setCreateLicenseMax] = useState('1');
  const [editingApp, setEditingApp] = useState<EditAppState | null>(null);
  const [editingLicense, setEditingLicense] = useState<EditLicenseState | null>(null);

  const handleCreateApp = async (event: FormEvent) => {
    event.preventDefault();
    const name = newAppName.trim();
    if (!name) return;

    const ok = await onCreateApp(name);
    if (ok) {
      setNewAppName('');
    }
  };

  const handleCreateLicense = async (event: FormEvent) => {
    event.preventDefault();

    const app = apps.find((item) => item.id === createLicenseAppId);
    const maxActivations = Number(createLicenseMax);
    if (!app || Number.isNaN(maxActivations) || maxActivations < 1) return;

    const ok = await onCreateLicense({
      appName: app.name,
      maxActivations,
    });

    if (ok) {
      setCreateLicenseOpen(false);
      setCreateLicenseAppId('');
      setCreateLicenseMax('1');
    }
  };

  const handleSubmitEditApp = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingApp) return;

    const name = editingApp.name.trim();
    if (!name) return;

    await onUpdateApp(editingApp.id, { name, status: editingApp.status });
    setEditingApp(null);
  };

  const handleSubmitEditLicense = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingLicense) return;

    const maxActivations = Number(editingLicense.maxActivations);
    if (Number.isNaN(maxActivations) || maxActivations < 1) return;

    await onUpdateLicense(editingLicense.id, {
      maxActivations,
      status: editingLicense.status,
    });
    setEditingLicense(null);
  };

  return (
    <section className="mb-6 space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-white/5 md:flex-row md:items-center md:justify-between px-8 py-6">
          <div>
            <CardTitle className="text-xl text-white">Licenses</CardTitle>
            <p className="mt-1 text-sm text-slate-400">Manage products, seats, and generated license keys.</p>
          </div>
          <div className="w-full md:w-auto">
            <Input
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Filter by app name"
              className="w-full md:w-72 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl h-10"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleCreateApp} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] bg-white/2 p-4 rounded-2xl border border-white/5">
            <Input
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              placeholder="Add new app (example: deep-store)"
              className="bg-white/5 border-white/10"
              required
            />
            <Button type="submit" variant="secondary" disabled={isCreatingApp} className="rounded-xl px-6">
              {isCreatingApp ? 'Adding...' : 'Add App'}
            </Button>
          </form>

          <div className="flex flex-wrap gap-3">
            {apps.length === 0 && <p className="text-sm text-text-muted italic ml-1">No apps created yet.</p>}
            {apps.map((app) => (
              <div key={app.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-2 shadow-soft transition-all hover:scale-[1.02]">
                <span className="text-sm font-bold text-slate-200">{app.name}</span>
                <Badge variant={app.status === 'active' ? 'success' : 'muted'} className="rounded-full px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider">{app.status}</Badge>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400"
                  disabled={appActionLoadingId === app.id}
                  onClick={() => setEditingApp({ id: app.id, name: app.name, status: app.status })}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                  disabled={appActionLoadingId === app.id}
                  onClick={() => {
                    void onRemoveApp(app.id);
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {summaries.length === 0 ? (
              <p className="text-sm text-text-muted ml-1">No license summaries available yet.</p>
            ) : (
              summaries.map((summary) => (
                <div key={summary.appName} className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10 hover:shadow-soft text-left">
                  <p className="text-base font-bold text-white">{summary.appName}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Total Licenses</span>
                      <span className="text-slate-200 font-bold">{summary.licenses}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Seats Usage</span>
                      <span className="text-slate-200 font-bold">{summary.activeActivations} / {summary.maxActivations}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (summary.activeActivations / summary.maxActivations) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>License Inventory</CardTitle>
          <Button onClick={() => setCreateLicenseOpen(true)} disabled={apps.length === 0}>
            New License
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <TableWrapper>
            <Table>
              <thead className="border-b border-white/5 bg-white/5">
                <tr>
                  <Th>App</Th>
                  <Th>License Key</Th>
                  <Th>Status</Th>
                  <Th>Usage</Th>
                  <Th>Remaining</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {licenses.length === 0 ? (
                  <tr>
                    <Td colSpan={6} className="py-8 text-center text-text-muted">
                      No licenses found.
                    </Td>
                  </tr>
                ) : (
                  licenses.map((license) => (
                    <tr key={license.id} className="hover:bg-bg-light/30">
                      <Td className="text-base font-bold tracking-tight text-text">{license.appName}</Td>
                      <Td className="font-mono text-primary-light">{license.licenseKey}</Td>
                      <Td>
                        <Badge variant={license.status === 'active' ? 'success' : 'danger'}>{license.status}</Badge>
                      </Td>
                      <Td className="text-text-muted">
                        {license.activeActivations} / {license.maxActivations}
                      </Td>
                      <Td className="text-text-muted">{license.remainingActivations}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={licenseActionLoadingId === license.id}
                            onClick={() =>
                              setEditingLicense({
                                id: license.id,
                                maxActivations: String(license.maxActivations),
                                status: license.status,
                              })
                            }
                          >
                            Edit
                          </Button>
                          {license.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={licenseActionLoadingId === license.id}
                              onClick={() => {
                                void onChangeLicenseStatus(license.id, 'revoked');
                              }}
                            >
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={licenseActionLoadingId === license.id}
                              onClick={() => {
                                void onChangeLicenseStatus(license.id, 'active');
                              }}
                            >
                              Activate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={licenseActionLoadingId === license.id}
                            onClick={() => {
                              void onRemoveLicense(license.id);
                            }}
                          >
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
        </CardContent>
      </Card>

      <Dialog open={createLicenseOpen} onOpenChange={setCreateLicenseOpen} title="Create License">
        <form onSubmit={handleCreateLicense} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-license-app">App</Label>
            <select
              id="create-license-app"
              value={createLicenseAppId}
              onChange={(e) => setCreateLicenseAppId(e.target.value)}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/60"
              required
            >
              <option value="">Select app</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-license-max">Max activations</Label>
            <Input
              id="create-license-max"
              type="number"
              min={1}
              value={createLicenseMax}
              onChange={(e) => setCreateLicenseMax(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateLicenseOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingLicense}>
              {isCreatingLicense ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={editingApp !== null} onOpenChange={(open) => !open && setEditingApp(null)} title="Edit App">
        {editingApp && (
          <form onSubmit={handleSubmitEditApp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-app-name">App name</Label>
              <Input
                id="edit-app-name"
                value={editingApp.name}
                onChange={(e) => setEditingApp((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-app-status">Status</Label>
              <select
                id="edit-app-status"
                value={editingApp.status}
                onChange={(e) =>
                  setEditingApp((prev) => (prev ? { ...prev, status: e.target.value as 'active' | 'inactive' } : prev))
                }
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/60"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingApp(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={appActionLoadingId === editingApp.id}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      <Dialog
        open={editingLicense !== null}
        onOpenChange={(open) => !open && setEditingLicense(null)}
        title="Edit License"
      >
        {editingLicense && (
          <form onSubmit={handleSubmitEditLicense} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-license-max">Max activations</Label>
              <Input
                id="edit-license-max"
                type="number"
                min={1}
                value={editingLicense.maxActivations}
                onChange={(e) =>
                  setEditingLicense((prev) => (prev ? { ...prev, maxActivations: e.target.value } : prev))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-license-status">Status</Label>
              <select
                id="edit-license-status"
                value={editingLicense.status}
                onChange={(e) =>
                  setEditingLicense((prev) => (prev ? { ...prev, status: e.target.value as 'active' | 'revoked' } : prev))
                }
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/60"
              >
                <option value="active">active</option>
                <option value="revoked">revoked</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingLicense(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={licenseActionLoadingId === editingLicense.id}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </section>
  );
}
