import { PageLayout } from "@/components/PageLayout";
import { SupplierForm } from "@/components/forms/SupplierForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Supplier } from "@/types";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const { getDisplayName } = useLanguage();

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .order("name_english");
    
    if (data) setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setActiveTab("add");
  };

  const handleFormSuccess = () => {
    setEditingSupplier(undefined);
    setActiveTab("list");
    fetchSuppliers();
  };

  const handleFormCancel = () => {
    setEditingSupplier(undefined);
    setActiveTab("list");
  };

  return (
    <PageLayout title="Suppliers Management">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Suppliers Management</h1>
        
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          if (value === "add") setEditingSupplier(undefined);
        }} className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="list">Suppliers List</TabsTrigger>
            <TabsTrigger value="add">Add Supplier</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>All Suppliers</CardTitle>
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
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>GSTIN</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell>{supplier.code}</TableCell>
                          <TableCell>{getDisplayName(supplier)}</TableCell>
                          <TableCell>{supplier.contact_person || "-"}</TableCell>
                          <TableCell>{supplier.phone || "-"}</TableCell>
                          <TableCell>{supplier.gstin || "-"}</TableCell>
                          <TableCell>
                            <span className={supplier.is_active ? "text-green-600" : "text-red-600"}>
                              {supplier.is_active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(supplier)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </TableCell>
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
                <CardTitle>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</CardTitle>
              </CardHeader>
              <CardContent>
                <SupplierForm
                  supplier={editingSupplier}
                  onSuccess={handleFormSuccess}
                  onCancel={editingSupplier ? handleFormCancel : undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
