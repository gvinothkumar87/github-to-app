import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  const { getDisplayName } = useLanguage();
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
  const [loading, setLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [createdSale, setCreatedSale] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
    generateBillSerial(loadingPlace);
  }, []);

  useEffect(() => {
    if (loadingPlace) {
      generateBillSerial(loadingPlace);
    }
  }, [loadingPlace]);

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

  const generateBillSerial = async (location: string) => {
    try {
      let prefix = '';
      if (location === 'PULIVANTHI') {
        prefix = 'G';
      } else if (location === 'MATTAPARAI') {
        prefix = 'M';
      }

      const { data, error } = await supabase
        .from('sales')
        .select('bill_serial_no')
        .like('bill_serial_no', `${prefix}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      let nextNumber = 1;
      if (data?.bill_serial_no) {
        const currentNumber = parseInt(data.bill_serial_no.substring(1));
        nextNumber = currentNumber + 1;
      }

      const newSerial = `${prefix}${nextNumber.toString().padStart(6, '0')}`;
      setBillSerialNo(newSerial);
    } catch (error) {
      console.error('Error generating bill serial:', error);
      setBillSerialNo(`${location === 'PULIVANTHI' ? 'G' : 'M'}000001`);
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

      // Insert sale record
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
              <Label htmlFor="loadingPlace">Loading Place *</Label>
              <Select value={loadingPlace} onValueChange={setLoadingPlace}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PULIVANTHI">PULIVANTHI</SelectItem>
                  <SelectItem value="MATTAPARAI">MATTAPARAI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billSerialNo">Bill Serial Number *</Label>
              <Input
                id="billSerialNo"
                type="text"
                value={billSerialNo}
                onChange={(e) => setBillSerialNo(e.target.value)}
                placeholder="Enter bill serial number"
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