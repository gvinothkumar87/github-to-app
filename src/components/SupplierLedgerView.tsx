import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

export function SupplierLedgerView() {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const { getDisplayName } = useLanguage();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (selectedSupplier) {
      fetchLedger();
    }
  }, [selectedSupplier]);

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("is_active", true)
      .order("name_english");
    
    if (data) setSuppliers(data);
    setLoading(false);
  };

  const fetchLedger = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("supplier_ledger")
      .select("*")
      .eq("supplier_id", selectedSupplier)
      .order("transaction_date", { ascending: false });

    if (data && data.length > 0) {
      // Fetch related bill numbers for each entry
      const entriesWithBillNo = await Promise.all(data.map(async (entry) => {
        let billNo = '';
        
        try {
          if (entry.transaction_type === 'purchase') {
            const { data: purchase } = await supabase
              .from('purchases')
              .select('bill_serial_no')
              .eq('id', entry.reference_id)
              .maybeSingle();
            billNo = purchase?.bill_serial_no || '';
          } else if (entry.transaction_type === 'payment') {
            const { data: payment } = await supabase
              .from('supplier_payments')
              .select('payment_no')
              .eq('id', entry.reference_id)
              .maybeSingle();
            billNo = payment?.payment_no || '';
          }
        } catch (err) {
          console.error('Error fetching bill number:', err);
        }

        const description = entry.description 
          ? (billNo ? `${entry.description} - Bill: ${billNo}` : entry.description)
          : (billNo ? `Bill: ${billNo}` : '');

        return { ...entry, description };
      }));

      setLedgerEntries(entriesWithBillNo);
      setBalance(entriesWithBillNo[0].balance || 0);
    } else {
      setLedgerEntries([]);
      setBalance(0);
    }
    setLoading(false);
  };

  if (loading && !selectedSupplier) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Supplier Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {getDisplayName(supplier)} - {supplier.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSupplier && (
              <div className="text-xl font-semibold">
                Current Balance: ₹{balance.toFixed(2)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedSupplier && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : ledgerEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.transaction_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right">
                        {entry.debit_amount > 0 ? `₹${entry.debit_amount.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit_amount > 0 ? `₹${entry.credit_amount.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{entry.balance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
