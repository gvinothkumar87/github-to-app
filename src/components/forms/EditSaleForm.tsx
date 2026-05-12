import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sale, OutwardEntry, Customer, Item } from '@/types';
import { Trash2 } from 'lucide-react';
import { generateUUID } from '@/lib/utils';

interface EditSaleFormProps {
  sale: any; // Can be a single sale or grouped sale with _allSales
  outwardEntry: OutwardEntry | null;
  customer: Customer;
  item: Item;
  onSuccess: () => void;
  onCancel: () => void;
}

interface LineItemEdit {
  id: string;
  sale_id: string;
  item: Item;
  quantity: number;
  rate: string;
  unit: string;
  sale_date?: string;
}

export const EditSaleForm = ({ sale, outwardEntry, customer, item, onSuccess, onCancel }: EditSaleFormProps) => {
  const isMultiProduct = sale._isGrouped && sale._allSales && sale._allSales.length > 1;
  
  // Initialize line items for editing
  const [lineItems, setLineItems] = useState<LineItemEdit[]>(() => {
    if (isMultiProduct) {
      return sale._allSales.map((s: any) => ({
        id: generateUUID(),
        sale_id: s.id,
        item: s.items,
        quantity: s.quantity,
        rate: s.rate.toString(),
        unit: s.items?.unit || 'KG',
        sale_date: s.sale_date
      }));
    } else {
      return [{
        id: generateUUID(),
        sale_id: sale.id,
        item: item,
        quantity: sale.quantity,
        rate: sale.rate.toString(),
        unit: item.unit,
        sale_date: sale.sale_date
      }];
    }
  });

  const [irn, setIrn] = useState(sale.irn || '');
  const [saleDate, setSaleDate] = useState(sale.sale_date || new Date().toISOString().split('T')[0]);
  const [billSerialNo, setBillSerialNo] = useState(sale.bill_serial_no || '');
  const [loadWeight, setLoadWeight] = useState(outwardEntry?.load_weight?.toString() || '');
  const [emptyWeight, setEmptyWeight] = useState(outwardEntry?.empty_weight?.toString() || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();

  const updateLineItem = (id: string, field: 'rate', value: string) => {
    setLineItems(lineItems.map(li => 
      li.id === id ? { ...li, [field]: value } : li
    ));
  };

  const calculateLineItemTotal = (lineItem: LineItemEdit) => {
    const rate = parseFloat(lineItem.rate) || 0;
    const baseAmount = lineItem.quantity * rate;
    const gstPercent = lineItem.item.gst_percentage || 0;
    const gstAmount = baseAmount * (gstPercent / 100);
    return baseAmount + gstAmount;
  };

  const calculateGrandTotal = () => {
    return lineItems.reduce((total, li) => total + calculateLineItemTotal(li), 0);
  };

  const calculateNetWeight = () => {
    const load = parseFloat(loadWeight) || 0;
    const empty = parseFloat(emptyWeight) || 0;
    return load - empty;
  };

  const deleteLineItem = async (lineItemId: string, saleId: string) => {
    if (lineItems.length === 1) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' 
          ? 'Cannot delete the only item. Delete the entire bill from the main list instead.'
          : 'ஒரே ஒரு பொருளை நீக்க முடியாது. அதற்கு பதிலாக முழு பில்லையும் நீக்கவும்.',
        variant: 'destructive',
      });
      return;
    }

    if (!window.confirm(language === 'english' ? 'Are you sure you want to delete this item?' : 'இந்த பொருளை நீக்க விரும்புகிறீர்களா?')) {
      return;
    }

    setLoading(true);
    try {
      // 1. Delete ledger
      const { error: ledgerErr } = await supabase
        .from('customer_ledger')
        .delete()
        .eq('reference_id', saleId)
        .eq('transaction_type', 'sale');
      if (ledgerErr) throw ledgerErr;

      // 2. Delete sale
      const { error: saleErr } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);
      if (saleErr) throw saleErr;

      // 3. Update state
      setLineItems(lineItems.filter(li => li.id !== lineItemId));
      
      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Item deleted successfully' : 'பொருள் வெற்றிகரமாக நீக்கப்பட்டது',
      });
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || 'Failed to delete item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!billSerialNo || !saleDate) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please fill all required fields' : 'அனைத்து தேவையான புலங்களையும் நிரப்பவும்',
        variant: 'destructive',
      });
      return;
    }

    // Validate all line items have rates
    const hasEmptyRates = lineItems.some(li => !li.rate || parseFloat(li.rate) <= 0);
    if (hasEmptyRates) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please enter valid rates for all items' : 'அனைத்து பொருட்களுக்கும் சரியான விலைகளை உள்ளிடவும்',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Update each sale in the line items
      for (const lineItem of lineItems) {
        const newRate = parseFloat(lineItem.rate);
        const baseAmount = lineItem.quantity * newRate;
        const gstPercent = lineItem.item.gst_percentage || 0;
        const gstAmount = baseAmount * (gstPercent / 100);
        const totalAmount = baseAmount + gstAmount;

        const saleData = {
          rate: newRate.toString(),
          total_amount: totalAmount.toString(),
          base_amount: baseAmount.toString(),
          gst_amount: gstAmount.toString(),
          irn: irn || null,
          bill_serial_no: billSerialNo,
          sale_date: saleDate
        };

        // For first item, update outward entry if it exists
        const outwardEntryData = (lineItem.id === lineItems[0].id && outwardEntry) ? {
          load_weight: loadWeight || null,
          empty_weight: emptyWeight || null
        } : null;

        const { data, error } = await supabase.rpc('update_sale_with_ledger', {
          p_sale_id: lineItem.sale_id,
          p_sale_data: saleData,
          p_outward_entry_data: outwardEntryData,
          p_user_id: user.id
        });

        if (error) throw error;
        
        const result = data as any;
        if (result?.error) throw new Error(result.error);
      }

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' 
          ? `${lineItems.length} item(s) updated successfully`
          : `${lineItems.length} பொருட்கள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன`,
      });

      onSuccess();
      
    } catch (error: any) {
      console.error("Error updating sale:", error);
      
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || (language === 'english' ? 'Failed to update sale' : 'விற்பனை புதுப்பிப்பதில் தோல்வி'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{language === 'english' ? 'Edit Sale' : 'விற்பனையை திருத்து'}</CardTitle>
        <CardDescription>
          {language === 'english' 
            ? `Editing bill ${sale.bill_serial_no}${isMultiProduct ? ` (${lineItems.length} items)` : ''}`
            : `பில் ${sale.bill_serial_no}${isMultiProduct ? ` (${lineItems.length} பொருட்கள்)` : ''} ஐ திருத்துகிறது`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sale Details */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs font-medium">{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}:</Label>
                <p>{getDisplayName(customer)}</p>
              </div>
              {outwardEntry && (
                <div>
                  <Label className="text-xs font-medium">{language === 'english' ? 'Lorry No' : 'லாரி எண்'}:</Label>
                  <p>{outwardEntry.lorry_no}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="saleDate">
                {language === 'english' ? 'Sale Date' : 'விற்பனை தேதி'}
              </Label>
              <Input
                id="saleDate"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="billSerialNo">
                {language === 'english' ? 'Bill Serial Number' : 'பில் எண்'}
              </Label>
              <Input
                id="billSerialNo"
                type="text"
                value={billSerialNo}
                onChange={(e) => setBillSerialNo(e.target.value)}
                placeholder={language === 'english' ? 'Enter bill number...' : 'பில் எண்ணை உள்ளிடவும்...'}
                required
              />
            </div>
          </div>

          {/* Products Section */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-base font-semibold">
              {language === 'english' ? 'Products' : 'தயாரிப்புகள்'}
            </Label>

            {lineItems.map((lineItem, index) => (
              <div key={lineItem.id} className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getDisplayName(lineItem.item)}</p>
                      {lineItem.sale_date && isMultiProduct && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {new Date(lineItem.sale_date).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lineItem.quantity} {lineItem.unit} @ GST {lineItem.item.gst_percentage}%
                    </p>
                  </div>
                  {isMultiProduct && lineItems.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteLineItem(lineItem.id, lineItem.sale_id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`rate-${lineItem.id}`} className="text-sm">
                      {language === 'english' ? 'Rate' : 'விலை'}
                    </Label>
                    <Input
                      id={`rate-${lineItem.id}`}
                      type="number"
                      step="0.01"
                      value={lineItem.rate}
                      onChange={(e) => updateLineItem(lineItem.id, 'rate', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm">{language === 'english' ? 'Total' : 'மொத்தம்'}</Label>
                    <div className="p-2 bg-background rounded border text-center font-semibold">
                      ₹{calculateLineItemTotal(lineItem).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="emptyWeight">
                {language === 'english' ? 'Empty Weight (KG)' : 'வெற்று எடை (கிலோ)'}
              </Label>
              <Input
                id="emptyWeight"
                type="number"
                step="0.01"
                value={emptyWeight}
                onChange={(e) => setEmptyWeight(e.target.value)}
                placeholder={language === 'english' ? 'Enter empty weight...' : 'வெற்று எடையை உள்ளிடவும்...'}
              />
            </div>

            <div>
              <Label htmlFor="loadWeight">
                {language === 'english' ? 'Load Weight (KG)' : 'ஏற்றிய எடை (கிலோ)'}
              </Label>
              <Input
                id="loadWeight"
                type="number"
                step="0.01"
                value={loadWeight}
                onChange={(e) => setLoadWeight(e.target.value)}
                placeholder={language === 'english' ? 'Enter load weight...' : 'ஏற்றிய எடையை உள்ளிடவும்...'}
              />
            </div>

            <div>
              <Label>
                {language === 'english' ? 'Net Weight (KG)' : 'நிகர எடை (கிலோ)'}
              </Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {calculateNetWeight().toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="irn">
              {language === 'english' ? 'IRN (Invoice Reference Number)' : 'IRN (விலைப்பட்டியல் குறிப்பு எண்)'}
            </Label>
            <Input
              id="irn"
              type="text"
              value={irn}
              onChange={(e) => setIrn(e.target.value)}
              placeholder={language === 'english' ? 'Enter IRN...' : 'IRN ஐ உள்ளிடவும்...'}
            />
          </div>

          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-lg">
                {language === 'english' ? 'Grand Total:' : 'மொத்த தொகை:'}
              </span>
              <span className="text-xl font-bold">
                ₹{calculateGrandTotal().toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading 
                ? (language === 'english' ? 'Updating...' : 'புதுப்பிக்கிறது...') 
                : (language === 'english' ? 'Update Sale' : 'விற்பனையை புதுப்பிக்கவும்')
              }
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              {language === 'english' ? 'Cancel' : 'ரத்து'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
