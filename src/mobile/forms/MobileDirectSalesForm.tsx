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

const MobileDirectSalesForm: React.FC = () => {
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [loadingPlace, setLoadingPlace] = useState<string>('PULIVANTHI');
  const [rate, setRate] = useState<string>('');
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

  const calculateTotalAmount = () => {
    if (!quantity || !rate || !selectedItem) return 0;
    
    const item = items.find(i => i.id === selectedItem);
    if (!item) return 0;

    const baseAmount = parseFloat(quantity) * parseFloat(rate);
    const gstAmount = baseAmount * ((item.gst_percentage || 0) / 100);
    return baseAmount + gstAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer || !selectedItem || !quantity || !rate || !billSerialNo || !lorryNo) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const item = items.find(i => i.id === selectedItem);
      const totalAmount = calculateTotalAmount();

      const tempOutwardEntry = {
        id: crypto.randomUUID(),
        serial_no: 0,
        entry_date: saleDate,
        customer_id: selectedCustomer,
        item_id: selectedItem,
        lorry_no: lorryNo,
        driver_mobile: '',
        empty_weight: 0,
        load_weight: parseFloat(quantity),
        net_weight: parseFloat(quantity),
        loading_place: loadingPlace,
        is_completed: true,
        remarks: remarks || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          outward_entry_id: tempOutwardEntry.id,
          customer_id: selectedCustomer,
          item_id: selectedItem,
          quantity: parseFloat(quantity),
          rate: parseFloat(rate),
          total_amount: totalAmount,
          bill_serial_no: billSerialNo,
          sale_date: saleDate,
          created_by: user.id
        })
        .select()
        .single();

      if (saleError) throw saleError;

      const { error: ledgerError } = await supabase
        .from('customer_ledger')
        .insert({
          customer_id: selectedCustomer,
          transaction_type: 'sale',
          reference_id: saleData.id,
          debit_amount: totalAmount,
          credit_amount: 0,
          transaction_date: saleDate,
          description: `Sale - ${billSerialNo}`
        });

      if (ledgerError) throw ledgerError;

      toast.success('Direct sale created successfully');
      navigate(`/bills/${saleData.id}/invoice`);
    } catch (error: any) {
      console.error('Error creating sale:', error);
      toast.error(error.message || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  const selectedItemObj = items.find(i => i.id === selectedItem);

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

            <div className="space-y-2">
              <Label>{language === 'english' ? 'Item *' : 'பொருள் *'}</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'english' ? 'Quantity *' : 'அளவு *'}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'english' ? 'Rate *' : 'விலை *'}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="0.00"
                />
              </div>
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

            {quantity && rate && selectedItem && (
              <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{language === 'english' ? 'Base Amount:' : 'அடிப்படை தொகை:'}</span>
                  <span className="font-semibold">
                    ₹{(parseFloat(quantity) * parseFloat(rate)).toFixed(2)}
                  </span>
                </div>
                {selectedItemObj && selectedItemObj.gst_percentage > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>GST ({selectedItemObj.gst_percentage}%):</span>
                      <span className="font-semibold">
                        ₹{((parseFloat(quantity) * parseFloat(rate)) * (selectedItemObj.gst_percentage / 100)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-bold">{language === 'english' ? 'Total:' : 'மொத்தம்:'}</span>
                      <span className="font-bold text-lg text-primary">
                        ₹{calculateTotalAmount().toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
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
