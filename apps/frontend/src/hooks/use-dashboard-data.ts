import { useCallback, useEffect, useState } from 'react';
import {
  createLicense,
  createManagedApp,
  deleteLicense,
  deleteManagedApp,
  fetchActivations,
  fetchApps,
  fetchLicenses,
  fetchStats,
  fetchUserEmail,
  setLicenseStatus,
  updateLicense,
  updateManagedApp,
  updateActivationStatus,
} from '../lib/api-client';
import type { Activation, License, ManagedApp, Stats } from '../types/dashboard';

interface UseDashboardDataResult {
  activations: Activation[];
  licenses: License[];
  apps: ManagedApp[];
  stats: Stats;
  userEmail: string;
  loading: boolean;
  error: string;
  actionLoadingId: string | null;
  licenseActionLoadingId: string | null;
  isCreatingLicense: boolean;
  isCreatingApp: boolean;
  appActionLoadingId: string | null;
  licenseFilter: string;
  setLicenseFilter: (value: string) => void;
  refreshData: () => Promise<void>;
  changeStatus: (id: string, action: 'approve' | 'revoke') => Promise<void>;
  createNewLicense: (input: {
    appName: string;
    maxActivations: number;
  }) => Promise<boolean>;
  createNewApp: (name: string) => Promise<boolean>;
  updateApp: (id: string, input: { name?: string; status?: 'active' | 'inactive' }) => Promise<void>;
  removeApp: (id: string) => Promise<void>;
  updateExistingLicense: (
    id: string,
    input: { maxActivations?: number; status?: 'active' | 'revoked' },
  ) => Promise<void>;
  removeLicense: (id: string) => Promise<void>;
  changeLicenseStatus: (id: string, nextStatus: 'active' | 'revoked') => Promise<void>;
}

const EMPTY_STATS: Stats = { total: 0, active: 0, pending: 0, revoked: 0 };

export function useDashboardData(onUnauthorized: () => void): UseDashboardDataResult {
  const [activations, setActivations] = useState<Activation[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [apps, setApps] = useState<ManagedApp[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [licenseActionLoadingId, setLicenseActionLoadingId] = useState<string | null>(null);
  const [isCreatingLicense, setIsCreatingLicense] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [appActionLoadingId, setAppActionLoadingId] = useState<string | null>(null);
  const [licenseFilter, setLicenseFilter] = useState('');

  const refreshApps = useCallback(async () => {
    try {
      const nextApps = await fetchApps();
      if (nextApps === null) {
        onUnauthorized();
        return;
      }
      setApps(nextApps);
    } catch {
      setError('Failed to fetch apps.');
    }
  }, [onUnauthorized]);

  const refreshLicenses = useCallback(async () => {
    try {
      const nextLicenses = await fetchLicenses(licenseFilter);
      if (nextLicenses === null) {
        onUnauthorized();
        return;
      }
      setLicenses(nextLicenses);
    } catch {
      setError('Failed to fetch licenses.');
    }
  }, [licenseFilter, onUnauthorized]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [nextActivations, nextStats, nextUserEmail] = await Promise.all([
        fetchActivations(),
        fetchStats(),
        fetchUserEmail(),
      ]);

      if (nextActivations === null || nextStats === null) {
        onUnauthorized();
        return;
      }

      setActivations(nextActivations);
      setStats(nextStats);
      setUserEmail(nextUserEmail || '');
    } catch {
      setError('Failed to refresh dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  const changeStatus = useCallback(
    async (id: string, action: 'approve' | 'revoke') => {
      setActionLoadingId(id);
      setError('');

      try {
        const ok = await updateActivationStatus(id, action);
        if (!ok) {
          onUnauthorized();
          return;
        }

        await refreshData();
        await refreshLicenses();
      } catch {
        setError(`Could not ${action} activation right now.`);
      } finally {
        setActionLoadingId(null);
      }
    },
    [onUnauthorized, refreshData, refreshLicenses],
  );

  const createNewLicense = useCallback(
    async (input: { appName: string; maxActivations: number }) => {
      setIsCreatingLicense(true);
      setError('');

      try {
        const ok = await createLicense(input);
        if (!ok) {
          onUnauthorized();
          return false;
        }

        await refreshLicenses();
        return true;
      } catch {
        setError('Could not create license right now.');
        return false;
      } finally {
        setIsCreatingLicense(false);
      }
    },
    [onUnauthorized, refreshLicenses],
  );

  const createNewApp = useCallback(
    async (name: string) => {
      setIsCreatingApp(true);
      setError('');

      try {
        const ok = await createManagedApp(name);
        if (!ok) {
          onUnauthorized();
          return false;
        }

        await refreshApps();
        return true;
      } catch {
        setError('Could not create app right now.');
        return false;
      } finally {
        setIsCreatingApp(false);
      }
    },
    [onUnauthorized, refreshApps],
  );

  const updateApp = useCallback(
    async (id: string, input: { name?: string; status?: 'active' | 'inactive' }) => {
      setAppActionLoadingId(id);
      setError('');

      try {
        const ok = await updateManagedApp(id, input);
        if (!ok) {
          onUnauthorized();
          return;
        }
        await refreshApps();
        await refreshLicenses();
        await refreshData();
      } catch {
        setError('Could not update app right now.');
      } finally {
        setAppActionLoadingId(null);
      }
    },
    [onUnauthorized, refreshApps, refreshData, refreshLicenses],
  );

  const removeApp = useCallback(
    async (id: string) => {
      setAppActionLoadingId(id);
      setError('');

      try {
        const ok = await deleteManagedApp(id);
        if (!ok) {
          onUnauthorized();
          return;
        }

        await refreshLicenses();
        await refreshData();
        await refreshApps();
      } catch {
        setError('Could not remove app right now.');
      } finally {
        setAppActionLoadingId(null);
      }
    },
    [onUnauthorized, refreshApps, refreshData, refreshLicenses],
  );

  const changeLicenseStatus = useCallback(
    async (id: string, nextStatus: 'active' | 'revoked') => {
      setLicenseActionLoadingId(id);
      setError('');

      try {
        const ok = await setLicenseStatus(id, nextStatus);
        if (!ok) {
          onUnauthorized();
          return;
        }
        await refreshLicenses();
      } catch {
        setError(`Could not set license to ${nextStatus}.`);
      } finally {
        setLicenseActionLoadingId(null);
      }
    },
    [onUnauthorized, refreshLicenses],
  );

  const updateExistingLicense = useCallback(
    async (id: string, input: { maxActivations?: number; status?: 'active' | 'revoked' }) => {
      setLicenseActionLoadingId(id);
      setError('');

      try {
        const ok = await updateLicense(id, input);
        if (!ok) {
          onUnauthorized();
          return;
        }
        await refreshLicenses();
      } catch {
        setError('Could not update license right now.');
      } finally {
        setLicenseActionLoadingId(null);
      }
    },
    [onUnauthorized, refreshLicenses],
  );

  const removeLicense = useCallback(
    async (id: string) => {
      setLicenseActionLoadingId(id);
      setError('');

      try {
        const ok = await deleteLicense(id);
        if (!ok) {
          onUnauthorized();
          return;
        }
        await refreshLicenses();
        await refreshData();
      } catch {
        setError('Could not remove license right now.');
      } finally {
        setLicenseActionLoadingId(null);
      }
    },
    [onUnauthorized, refreshData, refreshLicenses],
  );

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    void refreshLicenses();
  }, [refreshLicenses]);

  useEffect(() => {
    void refreshApps();
  }, [refreshApps]);

  return {
    activations,
    stats,
    licenses,
    apps,
    userEmail,
    loading,
    error,
    actionLoadingId,
    licenseActionLoadingId,
    isCreatingLicense,
    isCreatingApp,
    appActionLoadingId,
    licenseFilter,
    setLicenseFilter,
    refreshData,
    changeStatus,
    createNewLicense,
    createNewApp,
    updateApp,
    removeApp,
    updateExistingLicense,
    removeLicense,
    changeLicenseStatus,
  };
}
