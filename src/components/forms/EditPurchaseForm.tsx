import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Purchase, Supplier, Item } from "@/types";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditPurchaseFormProps {
  purchase: Purchase;
  supplier: Supplier;
  item: Item;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditPurchaseForm = ({ purchase, supplier, item, onSuccess, onCancel }: EditPurchaseFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(supplier.id);
  const [selectedItemId, setSelectedItemId] = useState<string>(item.id);

  useEffect(() => {
    const fetchSuppliersAndItems = async () => {
      try {
        const [suppRes, itemRes] = await Promise.all([
          supabase.from('suppliers').select('*').eq('is_active', true).order('name_english'),
          supabase.from('items').select('*').eq('is_active', true).order('name_english')
        ]);
        if (suppRes.data) setSuppliers(suppRes.data);
        if (itemRes.data) setItemsList(itemRes.data);
      } catch (err) {
        console.error('Error fetching suppliers/items:', err);
      }
    };
    fetchSuppliersAndItems();
  }, []);

  const [formData, setFormData] = useState({
    quantity: purchase.quantity.toString(),
    rate: purchase.rate.toString(),
    bill_serial_no: purchase.bill_serial_no || "",
    purchase_date: purchase.purchase_date,
    mill: purchase.mill,
  });

  const calculateTotal = () => {
    const qty = parseFloat(formData.quantity) || 0;
    const rate = parseFloat(formData.rate) || 0;
    return (qty * rate).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quantity || !formData.rate) {
      toast({
        title: language === 'english' ? "Error" : "பிழை",
        description: language === 'english' ? "Please fill in all required fields" : "தேவையான அனைத்து புலங்களையும் நிரப்பவும்",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const quantity = parseFloat(formData.quantity);
      const rate = parseFloat(formData.rate);
      
      if (isNaN(quantity) || isNaN(rate) || quantity <= 0 || rate <= 0) {
        throw new Error(language === 'english' ? "Please enter valid quantity and rate values" : "சரியான அளவு மற்றும் விலை மதிப்புகளை உள்ளிடவும்");
      }
      
      const purchaseData = {
        supplier_id: selectedSupplierId,
        item_id: selectedItemId,
        quantity: quantity,
        rate: rate,
        total_amount: quantity * rate,
        bill_serial_no: formData.bill_serial_no || null,
        mill: formData.mill,
        purchase_date: formData.purchase_date,
      };

      const { error } = await supabase
        .from("purchases")
        .update(purchaseData)
        .eq('id', purchase.id);

      if (error) throw error;

      toast({
        title: language === 'english' ? "Success" : "வெற்றி",
        description: language === 'english' ? "Purchase updated successfully" : "கொள்முதல் வெற்றிகரமாக புதுப்பிக்கப்பட்டது",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: language === 'english' ? "Error" : "பிழை",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{language === 'english' ? 'Edit Purchase' : 'கொள்முதல் திருத்து'}</CardTitle>
        <CardDescription>
          {language === 'english' 
            ? `Editing purchase from ${getDisplayName(supplier)}`
            : `${getDisplayName(supplier)} இன் கொள்முதலை திருத்துகிறது`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier_id">{language === 'english' ? 'Supplier *' : 'சப்ளையர் *'}</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select Supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {getDisplayName(s)} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="item_id">{language === 'english' ? 'Product *' : 'தயாரிப்பு *'}</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>
                <SelectContent>
                  {itemsList.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {getDisplayName(i)} ({i.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purchase_date">{language === 'english' ? 'Purchase Date *' : 'கொள்முதல் தேதி *'}</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="bill_serial_no">{language === 'english' ? 'Bill No.' : 'பில் எண்'}</Label>
              <Input
                id="bill_serial_no"
                value={formData.bill_serial_no}
                onChange={(e) => setFormData({ ...formData, bill_serial_no: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="quantity">{language === 'english' ? 'Quantity *' : 'அளவு *'}</Label>
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
              <Label htmlFor="rate">{language === 'english' ? 'Rate *' : 'விலை *'}</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label>{language === 'english' ? 'Total Amount' : 'மொத்த தொகை'}</Label>
              <div className="text-2xl font-bold">₹{calculateTotal()}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === 'english' ? 'Update Purchase' : 'கொள்முதல் புதுப்பி'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              {language === 'english' ? 'Cancel' : 'ரத்து'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
