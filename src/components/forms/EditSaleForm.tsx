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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rate) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please enter rate' : 'விலையை உள்ளிடவும்',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const newRate = parseFloat(rate);
      const newTotalAmount = calculateTotalAmount(newRate);

      // Update sale record
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          rate: newRate,
          total_amount: newTotalAmount,
        })
        .eq('id', sale.id);

      if (saleError) throw saleError;

      // Update customer ledger entry
      const { error: ledgerError } = await supabase
        .from('customer_ledger')
        .update({
          debit_amount: newTotalAmount,
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
              <div>
                <Label className="text-xs font-medium">{language === 'english' ? 'Bill No' : 'பில் எண்'}:</Label>
                <p>{sale.bill_serial_no}</p>
              </div>
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