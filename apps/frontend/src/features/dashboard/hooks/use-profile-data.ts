import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  fetchFreelancerProfile,
  fetchUserEmail,
  updateFreelancerProfile,
  uploadFreelancerLogo,
} from "../../../lib/api-client";

class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export function useProfileData(onUnauthorized: () => void) {
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
    userEmail: ["dashboard", "userEmail"] as const,
    freelancerProfile: ["dashboard", "freelancerProfile"] as const,
  };

  const userEmailQuery = useQuery({
    queryKey: queryKeys.userEmail,
    queryFn: async () => (await fetchUserEmail()) || "",
  });

  const freelancerProfileQuery = useQuery({
    queryKey: queryKeys.freelancerProfile,
    queryFn: async () => await fetchFreelancerProfile(),
  });

  const uploadProfileLogoMutation = useMutation({
    mutationFn: uploadFreelancerLogo,
  });
  const saveProfileMutation = useMutation({
    mutationFn: updateFreelancerProfile,
  });

  const saveFreelancerProfile = useCallback(
    async (input: {
      businessName?: string;
      contactEmail?: string;
      contactPhone?: string;
      addressLine1?: string;
      addressLine2?: string;
      taxId?: string;
      defaultCurrency?: "USD" | "EUR" | "EGP" | "SAR" | "AED" | "GBP" | null;
      defaultInvoiceLanguage?: "en" | "ar" | null;
      appLanguage?: "en" | "ar" | null;
    }) => {
      setError("");
      try {
        const apiInput = { ...input };
        for (const key of Object.keys(apiInput) as Array<keyof typeof apiInput>) {
          if (apiInput[key] === null) {
            (apiInput as Record<string, unknown>)[key] = undefined;
          }
        }
        const profile = await saveProfileMutation.mutateAsync(apiInput as Parameters<typeof updateFreelancerProfile>[0]);
        if (!profile) throw new Error("Profile save returned empty response.");
        queryClient.setQueryData(queryKeys.freelancerProfile, profile);
        await queryClient.invalidateQueries({
          queryKey: queryKeys.freelancerProfile,
        });
        return profile;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not save profile right now.");
        return null;
      }
    },
    [onQueryError, queryClient, saveProfileMutation],
  );

  const uploadProfileLogo = useCallback(
    async (file: File) => {
      setError("");
      try {
        const profile = await uploadProfileLogoMutation.mutateAsync(file);
        if (!profile) throw new Error("Logo upload returned empty response.");
        queryClient.setQueryData(queryKeys.freelancerProfile, profile);
        await queryClient.invalidateQueries({
          queryKey: queryKeys.freelancerProfile,
        });
        return profile;
      } catch (mutationError) {
        onQueryError(mutationError, "Could not upload logo right now.");
        return null;
      }
    },
    [onQueryError, queryClient, uploadProfileLogoMutation],
  );

  return {
    freelancerProfile: freelancerProfileQuery.data || null,
    userEmail: userEmailQuery.data || "",
    loading: freelancerProfileQuery.isLoading || userEmailQuery.isLoading,
    error,
    setError,
    saveFreelancerProfile,
    uploadProfileLogo,
    freelancerProfileQuery,
    userEmailQuery,
  };
}
