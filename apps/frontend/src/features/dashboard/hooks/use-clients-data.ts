import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  archiveClient,
  createClient,
  deleteClient,
  fetchClients,
  restoreClient,
  updateClient,
} from "../../../lib/api-client";
import type { Client } from "../types/dashboard";

class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

function requireAuthValue<T>(value: T | null): T {
  if (value === null) throw new UnauthorizedError();
  return value;
}

export function useClientsData(onUnauthorized: () => void) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const onQueryError = useCallback(
    (queryError: unknown, fallback: string) => {
      if (queryError instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }
      if (queryError instanceof Error) {
        setError(queryError.message || fallback);
      } else {
        setError(fallback);
      }
    },
    [onUnauthorized],
  );

  const queryKeys = {
    clients: ["dashboard", "clients"] as const,
  };

  const clientsQuery = useQuery({
    queryKey: queryKeys.clients,
    queryFn: async () => requireAuthValue(await fetchClients()),
  });

  const createClientMutation = useMutation({ mutationFn: createClient });

  const createNewClient = useCallback(
    async (input: {
      name: string;
      email?: string;
      phone?: string;
      notes?: string;
    }) => {
      setError("");
      try {
        const created = await createClientMutation.mutateAsync(input);
        if (!created) throw new UnauthorizedError();
        await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        return created;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not create client right now.");
        return null;
      }
    },
    [createClientMutation, onQueryError, queryClient],
  );

  const removeClient = useCallback(
    async (id: string) => {
      setError("");
      try {
        const ok = await archiveClient(id);
        if (!ok) throw new UnauthorizedError();
        await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        return true;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not archive client right now.");
        return false;
      }
    },
    [onQueryError, queryClient],
  );

  const restoreExistingClient = useCallback(
    async (id: string) => {
      setError("");
      try {
        const restored = await restoreClient(id);
        if (!restored) throw new UnauthorizedError();
        await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        return restored;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not restore client right now.");
        return null;
      }
    },
    [onQueryError, queryClient],
  );

  const hardDeleteExistingClient = useCallback(
    async (id: string) => {
      setError("");
      try {
        const ok = await deleteClient(id);
        if (!ok) throw new UnauthorizedError();
        await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        return { ok: true as const };
      } catch (mutationError) {
        const message =
          mutationError instanceof Error && mutationError.message
            ? mutationError.message
            : "Could not permanently delete client right now.";
        onQueryError(mutationError, message);
        return { ok: false as const, error: message };
      }
    },
    [onQueryError, queryClient],
  );

  const updateExistingClient = useCallback(
    async (
      id: string,
      input: {
        name?: string;
        email?: string;
        phone?: string;
        notes?: string;
        status?: "active" | "inactive";
      },
    ) => {
      setError("");
      try {
        const updated = await updateClient(id, input);
        if (!updated) throw new UnauthorizedError();
        await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        return updated;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not update client right now.");
        return null;
      }
    },
    [onQueryError, queryClient],
  );

  return {
    clients: clientsQuery.data || [],
    loading: clientsQuery.isLoading,
    error,
    setError,
    isCreatingClient: createClientMutation.isPending,
    createNewClient,
    removeClient,
    restoreExistingClient,
    hardDeleteClient: hardDeleteExistingClient,
    updateExistingClient,
    clientsQuery,
  };
}
