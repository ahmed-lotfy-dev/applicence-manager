import { FreelanceOpsProvider } from "../hooks/FreelanceOpsContext";
import { BrandingSection } from "./BrandingSection";
import { ClientsSection } from "./ClientsSection";
import { InvoicesSection } from "./InvoicesSection";
import { FreelanceOpsDialogs } from "./FreelanceOpsDialogs";
import type { FreelanceOpsPanelProps } from "./FreelanceOpsPanel.types";

export function FreelanceOpsPanel(props: FreelanceOpsPanelProps) {
  const { view = "all" } = props;

  const showBranding = view === "all" || view === "branding";
  const showClients = view === "all" || view === "clients";
  const showInvoices = view === "all" || view === "invoices";
  const showBothOpsCards = showClients && showInvoices;

  return (
    <FreelanceOpsProvider props={props}>
      <section className="space-y-4">
        {showBranding && <BrandingSection />}

        <div
          className={`grid grid-cols-1 gap-4 ${showBothOpsCards ? "xl:grid-cols-2" : ""}`}
        >
          {showClients && <ClientsSection />}
          {showInvoices && <InvoicesSection />}
        </div>

        <FreelanceOpsDialogs />
      </section>
    </FreelanceOpsProvider>
  );
}
