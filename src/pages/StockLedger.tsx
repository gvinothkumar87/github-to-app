import { StockLedgerView } from "@/components/StockLedgerView";

export default function StockLedger() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Stock Ledger (Inventory)</h1>
      <StockLedgerView />
    </div>
  );
}
