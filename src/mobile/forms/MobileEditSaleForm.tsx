import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

export const MobileEditSaleForm = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [sale, setSale] = useState<any>(null);

  const { data: sales } = useEnhancedOfflineData('sales');
  const { data: customers } = useEnhancedOfflineData('customers');
  const { data: items } = useEnhancedOfflineData('items');
  const { data: outwardEntries } = useEnhancedOfflineData('outward_entries');
  const { update } = useEnhancedOfflineData('sales');

  useEffect(() => {
    if (saleId && sales.length > 0) {
      const foundSale = sales.find((s: any) => s.id === saleId);
      if (foundSale) {
        setSale(foundSale);
        setRate((foundSale as any).rate.toString());
      }
    }
  }, [saleId, sales]);

  const customer = sale ? customers.find((c: any) => c.id === sale.customer_id) : null;
  const item = sale ? items.find((i: any) => i.id === sale.item_id) : null;
  const outwardEntry = sale ? outwardEntries.find((e: any) => e.id === sale.outward_entry_id) : null;

  const calculateTotalAmount = (newRate: number) => {
    if (!sale || !item) return 0;
    const quantity = sale.quantity;
    const baseAmount = quantity * newRate;
    const gstPercent = (item as any).gst_percentage || 0;
    const gstAmount = baseAmount * (gstPercent / 100);
    return baseAmount + gstAmount;
  };

  const getBaseAmount = (newRate: number) => {
    if (!sale) return 0;
    return sale.quantity * newRate;
  };

  const getGstAmount = (newRate: number) => {
    const baseAmount = getBaseAmount(newRate);
    const gstPercent = (item as any)?.gst_percentage || 0;
    return baseAmount * (gstPercent / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rate || !sale) {
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

      await update(sale.id, {
        rate: newRate,
        total_amount: newTotalAmount,
      });

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Sale updated successfully' : 'விற்பனை வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
      });

      navigate('/bills');
      
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

  if (!sale || !customer || !item || !outwardEntry) {
    return (
      <MobileLayout 
        title={language === 'english' ? 'Edit Sale' : 'விற்பனையை திருத்து'}
      >
        <Card>
          <CardContent className="p-6 text-center">
            {language === 'english' ? 'Loading sale details...' : 'விற்பனை விவரங்களை ஏற்றுகிறது...'}
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title={language === 'english' ? 'Edit Sale' : 'விற்பனையை திருத்து'}
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'english' 
                ? `Editing Bill ${sale.bill_serial_no}`
                : `பில் ${sale.bill_serial_no} ஐ திருத்துகிறது`
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sale Details */}
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        {language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}
                      </Label>
                      <p className="font-medium">{getDisplayName(customer as any)}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        {language === 'english' ? 'Item' : 'பொருள்'}
                      </Label>
                      <p className="font-medium">{getDisplayName(item as any)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">
                          {language === 'english' ? 'Quantity' : 'அளவு'}
                        </Label>
                        <p className="font-medium">{sale.quantity} {(item as any).unit}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">
                          {language === 'english' ? 'GST %' : 'ஜிஎஸ்டி %'}
                        </Label>
                        <p className="font-medium">{(item as any).gst_percentage || 0}%</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        {language === 'english' ? 'Lorry No' : 'லாரி எண்'}
                      </Label>
                      <p className="font-medium">{(outwardEntry as any).lorry_no}</p>
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
                    <span className="text-lg font-bold text-primary">
                      ₹{calculateTotalAmount(currentRate).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading || !rate} className="flex-1">
                  {loading 
                    ? (language === 'english' ? 'Updating...' : 'புதுப்பிக்கிறது...') 
                    : (language === 'english' ? 'Update Sale' : 'விற்பனையை புதுப்பிக்கவும்')
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/bills')}
                  className="flex-1"
                >
                  {language === 'english' ? 'Cancel' : 'ரத்து'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default MobileEditSaleForm;