import { PageLayout } from "@/components/PageLayout";
import { SupplierLedgerView } from "@/components/SupplierLedgerView";

export default function SupplierLedger() {
  return (
    <PageLayout title="Supplier Ledger">
      <div className="container mx-auto p-6">
        <SupplierLedgerView />
      </div>
    </PageLayout>
  );
}
