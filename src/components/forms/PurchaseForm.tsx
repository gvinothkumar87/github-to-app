import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PurchaseFormProps {
  onSuccess?: () => void;
}

export function PurchaseForm({ onSuccess }: PurchaseFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    supplier_id: "",
    item_id: "",
    quantity: "",
    rate: "",
    bill_serial_no: "",
    purchase_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchSuppliers();
    fetchItems();
  }, []);

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("is_active", true)
      .order("name_english");
    
    if (data) setSuppliers(data);
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("is_active", true)
      .order("name_english");
    
    if (data) setItems(data);
  };

  const calculateTotal = () => {
    const qty = parseFloat(formData.quantity) || 0;
    const rate = parseFloat(formData.rate) || 0;
    return (qty * rate).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.quantity || !formData.rate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const quantity = parseFloat(formData.quantity);
      const rate = parseFloat(formData.rate);
      
      if (isNaN(quantity) || isNaN(rate) || quantity <= 0 || rate <= 0) {
        throw new Error("Please enter valid quantity and rate values");
      }
      
      const purchaseData = {
        supplier_id: formData.supplier_id,
        item_id: formData.item_id,
        quantity: quantity,
        rate: rate,
        total_amount: quantity * rate,
        bill_serial_no: formData.bill_serial_no || null,
        purchase_date: formData.purchase_date,
        created_by: user?.id,
      };

      const { error } = await supabase
        .from("purchases")
        .insert([purchaseData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase added successfully",
      });

      setFormData({
        supplier_id: "",
        item_id: "",
        quantity: "",
        rate: "",
        bill_serial_no: "",
        purchase_date: new Date().toISOString().split('T')[0],
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier_id">Supplier *</Label>
          <Select
            value={formData.supplier_id}
            onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name_english}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="item_id">Item *</Label>
          <Select
            value={formData.item_id}
            onValueChange={(value) => setFormData({ ...formData, item_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name_english}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="rate">Rate *</Label>
          <Input
            id="rate"
            type="number"
            step="0.01"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="bill_serial_no">Bill No.</Label>
          <Input
            id="bill_serial_no"
            value={formData.bill_serial_no}
            onChange={(e) => setFormData({ ...formData, bill_serial_no: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="purchase_date">Purchase Date *</Label>
          <Input
            id="purchase_date"
            type="date"
            value={formData.purchase_date}
            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label>Total Amount</Label>
          <div className="text-2xl font-bold">₹{calculateTotal()}</div>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add Purchase
      </Button>
    </form>
  );
}
