import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sale, OutwardEntry, Customer, Item } from '@/types';

interface EditSaleFormProps {
  sale: Sale;
  outwardEntry: OutwardEntry;
  customer: Customer;
  item: Item;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSaleForm = ({ sale, outwardEntry, customer, item, onSuccess, onCancel }: EditSaleFormProps) => {
  const [rate, setRate] = useState(sale.rate.toString());
  const [irn, setIrn] = useState(sale.irn || '');
  const [saleDate, setSaleDate] = useState(sale.sale_date || new Date().toISOString().split('T')[0]);
  const [billSerialNo, setBillSerialNo] = useState(sale.bill_serial_no || '');
  const [loadWeight, setLoadWeight] = useState(outwardEntry.load_weight?.toString() || '');
  const [emptyWeight, setEmptyWeight] = useState(outwardEntry.empty_weight?.toString() || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();

  const calculateTotalAmount = (newRate: number) => {
    const quantity = sale.quantity;
    const baseAmount = quantity * newRate;
    const gstPercent = item.gst_percentage || 0;
    const gstAmount = baseAmount * (gstPercent / 100);
    return baseAmount + gstAmount;
  };

  const getBaseAmount = (newRate: number) => {
    return sale.quantity * newRate;
  };

  const getGstAmount = (newRate: number) => {
    const baseAmount = getBaseAmount(newRate);
    const gstPercent = item.gst_percentage || 0;
    return baseAmount * (gstPercent / 100);
  };

  const calculateNetWeight = () => {
    const load = parseFloat(loadWeight) || 0;
    const empty = parseFloat(emptyWeight) || 0;
    return load - empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rate || !billSerialNo || !saleDate) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please fill all required fields' : 'அனைத்து தேவையான புலங்களையும் நிரப்பவும்',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const newRate = parseFloat(rate);
      const newTotalAmount = calculateTotalAmount(newRate);
      const newLoadWeight = parseFloat(loadWeight) || null;
      const newEmptyWeight = parseFloat(emptyWeight) || null;
      const newNetWeight = newLoadWeight && newEmptyWeight ? newLoadWeight - newEmptyWeight : null;

      // Update sale record
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          rate: newRate,
          total_amount: newTotalAmount,
          irn: irn || null,
          sale_date: saleDate,
          bill_serial_no: billSerialNo,
        })
        .eq('id', sale.id);

      if (saleError) throw saleError;

      // Update outward entry record
      const { error: outwardError } = await supabase
        .from('outward_entries')
        .update({
          load_weight: newLoadWeight,
          empty_weight: newEmptyWeight,
          net_weight: newNetWeight,
        })
        .eq('id', outwardEntry.id);

      if (outwardError) throw outwardError;

      // Update customer ledger entry
      const { error: ledgerError } = await supabase
        .from('customer_ledger')
        .update({
          debit_amount: newTotalAmount,
          transaction_date: saleDate,
        })
        .eq('reference_id', sale.id)
        .eq('transaction_type', 'sale');

      if (ledgerError) throw ledgerError;

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Sale updated successfully' : 'விற்பனை வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
      });

      onSuccess();
      
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || (language === 'english' ? 'Failed to update sale' : 'விற்பனை புதுப்பிப்பதில் தோல்வி'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentRate = parseFloat(rate) || 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{language === 'english' ? 'Edit Sale' : 'விற்பனையை திருத்து'}</CardTitle>
        <CardDescription>
          {language === 'english' 
            ? `Editing bill ${sale.bill_serial_no}`
            : `பில் ${sale.bill_serial_no} ஐ திருத்துகிறது`
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
              <div>
                <Label className="text-xs font-medium">{language === 'english' ? 'Item' : 'பொருள்'}:</Label>
                <p>{getDisplayName(item)}</p>
              </div>
              <div>
                <Label className="text-xs font-medium">{language === 'english' ? 'Quantity' : 'அளவு'}:</Label>
                <p>{sale.quantity} {item.unit}</p>
              </div>
              <div>
                <Label className="text-xs font-medium">{language === 'english' ? 'Lorry No' : 'லாரி எண்'}:</Label>
                <p>{outwardEntry.lorry_no}</p>
              </div>
              <div>
                <Label className="text-xs font-medium">{language === 'english' ? 'GST %' : 'ஜிஎஸ்டி %'}:</Label>
                <p>{item.gst_percentage || 0}%</p>
              </div>
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

          <div>
            <Label htmlFor="rate">
              {language === 'english' ? 'Rate per Unit' : 'யூனிட் ஒன்றுக்கான விலை'}
            </Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder={language === 'english' ? 'Enter rate...' : 'விலையை உள்ளிடவும்...'}
              required
            />
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

          {currentRate > 0 && (
            <div className="bg-primary/10 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>{language === 'english' ? 'Base Amount:' : 'அடிப்படை தொகை:'}</span>
                <span>₹{getBaseAmount(currentRate).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>{language === 'english' ? 'GST Amount:' : 'ஜிஎஸ்டி தொகை:'}</span>
                <span>₹{getGstAmount(currentRate).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-medium">
                  {language === 'english' ? 'Total Amount:' : 'மொத்த தொகை:'}
                </span>
                <span className="text-lg font-bold">
                  ₹{calculateTotalAmount(currentRate).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !rate}>
              {loading 
                ? (language === 'english' ? 'Updating...' : 'புதுப்பிக்கிறது...') 
                : (language === 'english' ? 'Update Sale' : 'விற்பனையை புதுப்பிக்கவум்')
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