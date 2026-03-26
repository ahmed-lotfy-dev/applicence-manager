import { createContext, useContext } from "react";
import { useLicensingData } from "./use-licensing-data";

interface LicensingDataContextValue {
  activations: ReturnType<typeof useLicensingData>["activations"];
  licenses: ReturnType<typeof useLicensingData>["licenses"];
  apps: ReturnType<typeof useLicensingData>["apps"];
  stats: ReturnType<typeof useLicensingData>["stats"];
  loading: ReturnType<typeof useLicensingData>["loading"];
  error: ReturnType<typeof useLicensingData>["error"];
  setError: ReturnType<typeof useLicensingData>["setError"];
  actionLoadingId: ReturnType<typeof useLicensingData>["actionLoadingId"];
  licenseActionLoadingId: ReturnType<typeof useLicensingData>["licenseActionLoadingId"];
  appActionLoadingId: ReturnType<typeof useLicensingData>["appActionLoadingId"];
  isCreatingLicense: ReturnType<typeof useLicensingData>["isCreatingLicense"];
  isCreatingApp: ReturnType<typeof useLicensingData>["isCreatingApp"];
  createNewApp: ReturnType<typeof useLicensingData>["createNewApp"];
  updateApp: ReturnType<typeof useLicensingData>["updateApp"];
  removeApp: ReturnType<typeof useLicensingData>["removeApp"];
  createNewLicense: ReturnType<typeof useLicensingData>["createNewLicense"];
  updateExistingLicense: ReturnType<typeof useLicensingData>["updateExistingLicense"];
  removeLicense: ReturnType<typeof useLicensingData>["removeLicense"];
  changeLicenseStatus: ReturnType<typeof useLicensingData>["changeLicenseStatus"];
  changeStatus: ReturnType<typeof useLicensingData>["changeStatus"];
  deleteActivation: ReturnType<typeof useLicensingData>["deleteActivation"];
  activationsQuery: ReturnType<typeof useLicensingData>["activationsQuery"];
  statsQuery: ReturnType<typeof useLicensingData>["statsQuery"];
  appsQuery: ReturnType<typeof useLicensingData>["appsQuery"];
  licensesQuery: ReturnType<typeof useLicensingData>["licensesQuery"];
}

const LicensingDataContext = createContext<LicensingDataContextValue | null>(null);

interface LicensingDataProviderProps {
  onUnauthorized: () => void;
  children: React.ReactNode;
}

export function LicensingDataProvider({
  onUnauthorized,
  children,
}: LicensingDataProviderProps) {
  const data = useLicensingData(onUnauthorized);
  return (
    <LicensingDataContext.Provider value={data}>
      {children}
    </LicensingDataContext.Provider>
  );
}

export function useLicensingDataContext(): LicensingDataContextValue {
  const ctx = useContext(LicensingDataContext);
  if (!ctx) {
    throw new Error(
      "useLicensingDataContext must be used inside LicensingDataProvider",
    );
  }
  return ctx;
}
