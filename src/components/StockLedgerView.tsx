import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

export function StockLedgerView() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedMill, setSelectedMill] = useState("MATTAPARAI");
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [currentStock, setCurrentStock] = useState(0);
  const [openingStock, setOpeningStock] = useState(0);
  const { getDisplayName } = useLanguage();

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      fetchStockLedger();
    }
  }, [selectedItem, selectedMill]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("is_active", true)
      .order("name_english");
    
    if (data) setItems(data);
    setLoading(false);
  };

  const fetchStockLedger = async () => {
    setLoading(true);
    
    // Get item opening stock
    const { data: itemData } = await supabase
      .from("items")
      .select("opening_stock")
      .eq("id", selectedItem)
      .single();
    
    setOpeningStock(itemData?.opening_stock || 0);
    
    // Get stock ledger entries for selected mill
    const { data } = await supabase
      .from("stock_ledger")
      .select("*")
      .eq("item_id", selectedItem)
      .eq("mill", selectedMill)
      .order("transaction_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      setLedgerEntries(data);
      setCurrentStock(data[data.length - 1].running_stock || 0);
    } else {
      setLedgerEntries([]);
      setCurrentStock(itemData?.opening_stock || 0);
    }
    setLoading(false);
  };

  if (loading && !selectedItem) {
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
          <CardTitle>Stock Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Select Item</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {getDisplayName(item)} - {item.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Select Mill</Label>
                <Select value={selectedMill} onValueChange={setSelectedMill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATTAPARAI">MATTAPARAI</SelectItem>
                    <SelectItem value="PULIVANTHI">PULIVANTHI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedItem && (
              <div className="space-y-2">
                <div className="text-lg">
                  <span className="font-medium">Opening Stock:</span> {openingStock.toFixed(2)} {items.find(i => i.id === selectedItem)?.unit}
                </div>
                <div className="text-xl font-semibold">
                  Current Stock: {currentStock.toFixed(2)} {items.find(i => i.id === selectedItem)?.unit}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedItem && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Mill</TableHead>
                  <TableHead className="text-right">In</TableHead>
                  <TableHead className="text-right">Out</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Opening Stock Entry */}
                    {selectedItem && openingStock > 0 && (
                      <TableRow className="bg-muted/30">
                        <TableCell>-</TableCell>
                        <TableCell className="font-semibold">Opening Stock</TableCell>
                        <TableCell>Initial stock balance</TableCell>
                        <TableCell>{selectedMill}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          {openingStock.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right font-semibold">
                          {openingStock.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {/* Ledger Entries */}
                    {ledgerEntries.length === 0 && openingStock === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No stock movements found
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{format(new Date(entry.transaction_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="capitalize">{entry.transaction_type}</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell>{entry.mill}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {entry.quantity_in > 0 ? entry.quantity_in.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {entry.quantity_out > 0 ? entry.quantity_out.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {entry.running_stock.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}