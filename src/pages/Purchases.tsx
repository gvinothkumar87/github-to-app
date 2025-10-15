import { PageLayout } from "@/components/PageLayout";
import { PurchaseForm } from "@/components/forms/PurchaseForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("purchases")
      .select(`
        *,
        suppliers (name_english),
        items (name_english, unit)
      `)
      .order("purchase_date", { ascending: false });
    
    if (data) setPurchases(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  return (
    <PageLayout title="Purchase Management">
      <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Purchase Management</h1>
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="list">Purchase List</TabsTrigger>
          <TabsTrigger value="add">Add Purchase</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Bill No</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{format(new Date(purchase.purchase_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{purchase.bill_serial_no || "-"}</TableCell>
                        <TableCell>{purchase.suppliers?.name_english}</TableCell>
                        <TableCell>{purchase.items?.name_english}</TableCell>
                        <TableCell className="text-right">
                          {purchase.quantity} {purchase.items?.unit}
                        </TableCell>
                        <TableCell className="text-right">₹{purchase.rate.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{purchase.total_amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              <PurchaseForm onSuccess={fetchPurchases} />
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
