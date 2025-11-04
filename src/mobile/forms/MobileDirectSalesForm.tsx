import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { Customer, Item } from '@/types';

interface LineItem {
  id: string;
  item_id: string;
  quantity: string;
  rate: string;
}

const MobileDirectSalesForm: React.FC = () => {
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{
    id: crypto.randomUUID(),
    item_id: '',
    quantity: '',
    rate: ''
  }]);
  const [loadingPlace, setLoadingPlace] = useState<string>('PULIVANTHI');
  const [billSerialNo, setBillSerialNo] = useState<string>('');
  const [lorryNo, setLorryNo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [useSpecialSerial, setUseSpecialSerial] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
  }, []);

  useEffect(() => {
    if (useSpecialSerial) {
      generateSpecialSerial().then(serial => {
        setBillSerialNo(serial);
      });
    } else if (loadingPlace) {
      generateBillSerial(loadingPlace).then(serial => {
        setBillSerialNo(serial);
      });
    }
  }, [loadingPlace, useSpecialSerial]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name_english');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_active', true)
        .order('name_english');
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
    }
  };

  const generateSpecialSerial = async () => {
    try {
      const { data: existingBills } = await supabase
        .from('sales')
        .select('bill_serial_no')
        .like('bill_serial_no', 'D%');
      
      let nextNumber = 1;
      if (existingBills && existingBills.length > 0) {
        let maxNumber = 0;
        
        existingBills.forEach(bill => {
          const serial = bill.bill_serial_no;
          const num = parseInt((serial || 'D0').replace('D', ''));
          maxNumber = Math.max(maxNumber, num);
        });
        
        nextNumber = maxNumber + 1;
      }
      
      const serialNumber = nextNumber.toString().padStart(3, '0');
      return `D${serialNumber}`;
    } catch (error) {
      console.error('Error generating special serial:', error);
      return 'D001';
    }
  };

  const generateBillSerial = async (location: string) => {
    try {
      let prefix = '';
      let query = supabase.from('sales').select('bill_serial_no');
      
      if (location === 'PULIVANTHI') {
        query = query.or('bill_serial_no.like.[0-9]%,bill_serial_no.like.[1-9][0-9]%');
      } else if (location === 'MATTAPARAI') {
        prefix = 'GRM';
        query = query.like('bill_serial_no', 'GRM%');
      }
      
      const { data: existingBills } = await query;
      
      let nextNumber = 1;
      if (existingBills && existingBills.length > 0) {
        let maxNumber = 0;
        
        existingBills.forEach(bill => {
          const serial = bill.bill_serial_no;
          if (location === 'PULIVANTHI') {
            const num = parseInt(serial || '0');
            if (!isNaN(num)) {
              maxNumber = Math.max(maxNumber, num);
            }
          } else if (location === 'MATTAPARAI') {
            const num = parseInt((serial || 'GRM0').replace('GRM', ''));
            maxNumber = Math.max(maxNumber, num);
          }
        });
        
        nextNumber = maxNumber + 1;
        if (location === 'MATTAPARAI') {
          nextNumber = Math.max(50, nextNumber);
        }
      } else {
        if (location === 'MATTAPARAI') {
          nextNumber = 50;
        }
      }
      
      if (location === 'PULIVANTHI') {
        return nextNumber.toString();
      } else {
        const serialNumber = nextNumber.toString().padStart(3, '0');
        return `${prefix}${serialNumber}`;
      }
    } catch (error) {
      console.error('Error generating bill serial:', error);
      return location === 'PULIVANTHI' ? '1' : 'GRM050';
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: crypto.randomUUID(),
      item_id: '',
      quantity: '',
      rate: ''
    }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateLineItemTotal = (lineItem: LineItem) => {
    if (!lineItem.quantity || !lineItem.rate || !lineItem.item_id) return 0;
    
    const item = items.find(i => i.id === lineItem.item_id);
    if (!item) return 0;

    const baseAmount = parseFloat(lineItem.quantity) * parseFloat(lineItem.rate);
    const gstAmount = baseAmount * (item.gst_percentage / 100);
    return baseAmount + gstAmount;
  };

  const calculateGrandTotal = () => {
    return lineItems.reduce((total, lineItem) => total + calculateLineItemTotal(lineItem), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all line items
    const hasEmptyFields = lineItems.some(item => !item.item_id || !item.quantity || !item.rate);
    if (!selectedCustomer || hasEmptyFields || !billSerialNo || !lorryNo) {
      toast.error(language === 'english' ? 'Please fill in all required fields for all products' : 'அனைத்து தயாரிப்புகளுக்கும் தேவையான புலங்களை நிரப்பவும்');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const grandTotal = calculateGrandTotal();
      const createdSales = [];

      // Create a sale record for each line item
      for (const lineItem of lineItems) {
        const item = items.find(i => i.id === lineItem.item_id);
        if (!item) continue;
        
        // Calculate amounts for this line item
        const baseAmount = parseFloat(lineItem.quantity) * parseFloat(lineItem.rate);
        const gstAmount = baseAmount * ((item?.gst_percentage || 0) / 100);
        const totalAmount = baseAmount + gstAmount;

        // Prepare sale data
        const saleData = {
          outward_entry_id: null,
          customer_id: selectedCustomer,
          item_id: lineItem.item_id,
          quantity: parseFloat(lineItem.quantity),
          rate: parseFloat(lineItem.rate),
          total_amount: totalAmount,
          base_amount: baseAmount,
          gst_amount: gstAmount,
          sale_date: saleDate,
          bill_serial_no: billSerialNo,
          irn: null,
          user_id: user.id,
          created_by: user.id,
          loading_place: loadingPlace,
          lorry_no: lorryNo
        };

        // For the first item, create with ledger entry
        if (createdSales.length === 0) {
          const ledgerData = {
            customer_id: selectedCustomer,
            debit_amount: grandTotal,
            credit_amount: 0,
            transaction_date: saleDate,
            description: `Direct Sale - Bill #${billSerialNo} (${lineItems.length} items)`
          };

          const { data, error } = await supabase.rpc('create_sale_with_ledger', {
            p_sale_data: saleData,
            p_ledger_data: ledgerData
          });

          if (error) throw error;
          const result = data as any;
          if (result?.error) throw new Error(result.error);
          createdSales.push(result.sale_id);
        } else {
          // Subsequent items - create without ledger
          const { data: saleRecord, error } = await supabase
            .from('sales')
            .insert(saleData)
            .select()
            .single();

          if (error) throw error;
          createdSales.push(saleRecord.id);
        }
      }

      toast.success(language === 'english' 
        ? `Direct sale with ${lineItems.length} item(s) created successfully`
        : `${lineItems.length} பொருட்களுடன் நேரடி விற்பனை வெற்றிகரமாக உருவாக்கப்பட்டது`
      );
      navigate('/');

    } catch (error: any) {
      console.error('Error creating direct sale:', error);
      
      // Log the failed transaction
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.rpc('log_failed_transaction', {
          p_user_id: user?.id,
          p_transaction_type: 'mobile_direct_sale_multi',
          p_attempted_data: {
            customer_id: selectedCustomer,
            line_items: lineItems.map(item => ({
              item_id: item.item_id,
              quantity: item.quantity,
              rate: item.rate
            })),
            bill_serial_no: billSerialNo
          } as any,
          p_error_message: error.message
        });
      } catch (logError) {
        console.error("Failed to log error:", logError);
      }

      toast.error(error.message || (language === 'english' ? 'Failed to create sale' : 'விற்பனை உருவாக்குவதில் தோல்வி'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout 
      title={language === 'english' ? 'Direct Sales Entry' : 'நேரடி விற்பனை'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>{language === 'english' ? 'Customer *' : 'வாடிக்கையாளர் *'}</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'english' ? 'Select customer' : 'வாடிக்கையாளரைத் தேர்ந்தெடுக்கவும்'} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {getDisplayName(customer)} ({customer.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Line Items Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">
                  {language === 'english' ? 'Products *' : 'தயாரிப்புகள் *'}
                </Label>
                <Button type="button" onClick={addLineItem} variant="outline" size="sm">
                  + {language === 'english' ? 'Add' : 'சேர்'}
                </Button>
              </div>

              {lineItems.map((lineItem, index) => (
                <div key={lineItem.id} className="p-3 bg-muted rounded-lg space-y-3 relative">
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeLineItem(lineItem.id)}
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    >
                      ×
                    </Button>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {language === 'english' ? `Item ${index + 1}` : `பொருள் ${index + 1}`} *
                    </Label>
                    <Select 
                      value={lineItem.item_id} 
                      onValueChange={(value) => updateLineItem(lineItem.id, 'item_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'english' ? 'Select item' : 'பொருளைத் தேர்ந்தெடுக்கவும்'} />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {getDisplayName(item)} ({item.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="text-sm">{language === 'english' ? 'Qty' : 'அளவு'} *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={lineItem.quantity}
                        onChange={(e) => updateLineItem(lineItem.id, 'quantity', e.target.value)}
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">{language === 'english' ? 'Rate' : 'விலை'} *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={lineItem.rate}
                        onChange={(e) => updateLineItem(lineItem.id, 'rate', e.target.value)}
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">{language === 'english' ? 'Total' : 'மொத்தம்'}</Label>
                      <div className="p-2 bg-background rounded border text-center text-sm font-semibold">
                        ₹{calculateLineItemTotal(lineItem).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>{language === 'english' ? 'Loading Place *' : 'ஏற்றும் இடம் *'}</Label>
              <Select value={loadingPlace} onValueChange={setLoadingPlace}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PULIVANTHI">
                    {language === 'english' ? 'PULIVANTHI' : 'புலியந்தி'}
                  </SelectItem>
                  <SelectItem value="MATTAPARAI">
                    {language === 'english' ? 'MATTAPARAI' : 'மட்டப்பாறை'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox 
                  id="specialSerial" 
                  checked={useSpecialSerial}
                  onCheckedChange={(checked) => setUseSpecialSerial(checked as boolean)}
                />
                <Label htmlFor="specialSerial" className="text-sm font-normal cursor-pointer">
                  {language === 'english' ? 'Use Special Serial (D-series)' : 'சிறப்பு வரிசை (D-தொடர்)'}
                </Label>
              </div>
              <Label>{language === 'english' ? 'Bill Serial *' : 'பில் எண் *'}</Label>
              <Input
                type="text"
                value={billSerialNo}
                onChange={(e) => setBillSerialNo(e.target.value)}
                placeholder={language === 'english' ? 'Bill serial' : 'பில் எண்'}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'english' ? 'Lorry Number *' : 'லாரி எண் *'}</Label>
              <Input
                type="text"
                value={lorryNo}
                onChange={(e) => setLorryNo(e.target.value.toUpperCase())}
                placeholder={language === 'english' ? 'TN00XX0000' : 'டிஎன்00XX0000'}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'english' ? 'Sale Date' : 'விற்பனை தேதி'}</Label>
              <Input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'english' ? 'Remarks' : 'குறிப்புகள்'}</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={language === 'english' ? 'Optional remarks' : 'விருப்ப குறிப்புகள்'}
                rows={2}
              />
            </div>

            {lineItems.some(item => item.item_id && item.quantity && item.rate) && (
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">
                    {language === 'english' ? 'Grand Total:' : 'மொத்த தொகை:'}
                  </span>
                  <span className="text-xl font-bold text-primary">
                    ₹{calculateGrandTotal().toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {lineItems.length} {language === 'english' ? 'product(s)' : 'தயாரிப்பு(கள்)'} • 
                  {language === 'english' ? ' Total Qty: ' : ' மொத்த அளவு: '}
                  {lineItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0).toFixed(2)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? (language === 'english' ? 'Creating...' : 'உருவாக்குகிறது...') : (language === 'english' ? 'Create Sale' : 'விற்பனை உருவாக்கு')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {language === 'english' ? 'Cancel' : 'ரத்து'}
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
};

export default MobileDirectSalesForm;
