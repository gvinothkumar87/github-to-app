import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Customer, Item } from '@/types';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { useLanguage } from '@/contexts/LanguageContext';

interface DirectSalesFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const DirectSalesForm = ({ onSuccess, onCancel }: DirectSalesFormProps) => {
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
  const [showInvoice, setShowInvoice] = useState(false);
  const [createdSale, setCreatedSale] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
  }, []);

  // Auto-generate bill serial when loading place or special serial checkbox changes
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
      // For special serial, get D prefixed serials like D001, D002, D003
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
        // For PULIVANTHI, get numeric serials without leading zeros
        query = query.or('bill_serial_no.like.[0-9]%,bill_serial_no.like.[1-9][0-9]%');
      } else if (location === 'MATTAPARAI') {
        // For MATTAPARAI, get GRM prefixed serials like GRM050, GRM051, GRM052
        prefix = 'GRM';
        query = query.like('bill_serial_no', 'GRM%');
      }
      
      // Get all existing bills to find the highest number (not just the latest)
      const { data: existingBills } = await query;
      
      let nextNumber = 1;
      if (existingBills && existingBills.length > 0) {
        let maxNumber = 0;
        
        existingBills.forEach(bill => {
          const serial = bill.bill_serial_no;
          if (location === 'PULIVANTHI') {
            // Parse as integer to get the number without leading zeros
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
          nextNumber = Math.max(50, nextNumber); // Ensure GRM starts from 050
        }
      } else {
        // Set starting numbers for new series
        if (location === 'MATTAPARAI') {
          nextNumber = 50; // Start GRM series from 050
        }
      }
      
      // For PULIVANTHI: return number without leading zeros (e.g., 1, 2, 46)
      // For MATTAPARAI: return with GRM prefix and padded (e.g., GRM050)
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
    const gstAmount = baseAmount * (item.gst_percentage / 100);
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

      // Create a temporary outward entry for invoice generation
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

      // Insert sale record (direct sales don't need outward_entry_id)
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: selectedCustomer,
          item_id: selectedItem,
          quantity: parseFloat(quantity),
          rate: parseFloat(rate),
          total_amount: totalAmount,
          bill_serial_no: billSerialNo,
          sale_date: saleDate,
          loading_place: loadingPlace, // Store loading place for invoice generation
          lorry_no: lorryNo, // Store lorry number for invoice display
          created_by: user.id
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create customer ledger entry
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

      toast.success('Sale created successfully');
      
      // Prepare data for invoice
      const customer = customers.find(c => c.id === selectedCustomer);
      setCreatedSale({
        sale: saleData,
        outwardEntry: tempOutwardEntry,
        customer,
        item
      });
      setShowInvoice(true);
    } catch (error: any) {
      console.error('Error creating sale:', error);
      toast.error(error.message || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  if (showInvoice && createdSale) {
    return (
      <InvoiceGenerator
        sale={createdSale.sale}
        outwardEntry={createdSale.outwardEntry}
        customer={createdSale.customer}
        item={createdSale.item}
        onClose={() => {
          setShowInvoice(false);
          onSuccess();
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Direct Sales Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
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
              <Label htmlFor="item">Item *</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
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

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Rate *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="Enter rate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loadingPlace">
                {language === 'english' ? 'Loading Place *' : 'ஏற்றும் இடம் *'}
              </Label>
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
                  {language === 'english' ? 'Use Special Serial (D-series)' : 'சிறப்பு வரிசை பயன்படுத்து (D-தொடர்)'}
                </Label>
              </div>
              <Label htmlFor="billSerialNo">
                {language === 'english' ? 'Bill Serial Number *' : 'பில் வரிசை எண் *'}
              </Label>
              <Input
                id="billSerialNo"
                type="text"
                value={billSerialNo}
                onChange={(e) => setBillSerialNo(e.target.value)}
                placeholder={language === 'english' ? 'Enter bill serial number' : 'பில் வரிசை எண்ணை உள்ளிடவும்'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lorryNo">Lorry Number *</Label>
              <Input
                id="lorryNo"
                type="text"
                value={lorryNo}
                onChange={(e) => setLorryNo(e.target.value.toUpperCase())}
                placeholder="Enter lorry number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleDate">Sale Date</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any remarks"
              rows={3}
            />
          </div>

          {quantity && rate && selectedItem && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Base Amount:</span>
                <span className="font-semibold">
                  ₹{(parseFloat(quantity) * parseFloat(rate)).toFixed(2)}
                </span>
              </div>
              {items.find(i => i.id === selectedItem)?.gst_percentage > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>GST ({items.find(i => i.id === selectedItem)?.gst_percentage}%):</span>
                    <span className="font-semibold">
                      ₹{((parseFloat(quantity) * parseFloat(rate)) * (items.find(i => i.id === selectedItem)?.gst_percentage / 100)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold">Total Amount:</span>
                    <span className="font-bold text-lg">
                      ₹{calculateTotalAmount().toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Sale'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};