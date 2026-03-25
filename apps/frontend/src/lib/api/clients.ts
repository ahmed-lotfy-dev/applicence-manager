import type { Client } from "../../features/dashboard/types/dashboard";
import { apiRequest, getErrorMessage, parseJsonResponse } from "./base";

export async function fetchClients(): Promise<Client[] | null> {
  const response = await apiRequest("/clients");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to fetch clients");

  const data = await parseJsonResponse<{ clients?: Client[] }>(response);
  return data?.clients || [];
}

export async function createClient(input: {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Promise<Client | null> {
  const response = await apiRequest("/clients", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to create client");

  const data = await parseJsonResponse<{ client?: Client }>(response);
  return data?.client || null;
}

export async function updateClient(
  id: string,
  input: {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
    status?: "active" | "inactive";
  },
): Promise<Client | null> {
  const response = await apiRequest(`/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (response.status === 401) return null;
  if (!response.ok)
    throw new Error(await getErrorMessage(response, "Failed to update client"));

  const data = await parseJsonResponse<{ client?: Client }>(response);
  return data?.client || null;
}

export async function archiveClient(id: string): Promise<boolean> {
  const response = await apiRequest(`/clients/${id}/archive`, {
    method: "PATCH",
  });
  if (response.status === 401) return false;
  if (!response.ok)
    throw new Error(
      await getErrorMessage(response, "Failed to archive client"),
    );
  return true;
}

export async function restoreClient(id: string): Promise<Client | null> {
  const response = await apiRequest(`/clients/${id}/restore`, {
    method: "PATCH",
  });
  if (response.status === 401) return null;
  if (!response.ok)
    throw new Error(
      await getErrorMessage(response, "Failed to restore client"),
    );
  const data = await parseJsonResponse<{ client?: Client }>(response);
  return data?.client || null;
}

export async function deleteClient(id: string): Promise<boolean> {
  const response = await apiRequest(`/clients/${id}`, {
    method: "DELETE",
  });
  if (response.status === 401) return false;
  if (!response.ok)
    throw new Error(await getErrorMessage(response, "Failed to delete client"));
  return true;
}
