import { PageLayout } from "@/components/PageLayout";
import { StockLedgerView } from "@/components/StockLedgerView";

export default function StockLedger() {
  return (
    <PageLayout title="Stock Ledger (Inventory)">
      <div className="container mx-auto p-6">
        <StockLedgerView />
      </div>
    </PageLayout>
  );
}
