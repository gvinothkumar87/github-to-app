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

interface LineItem {
  id: string;
  item_id: string;
  quantity: string;
  rate: string;
}

export const DirectSalesForm = ({ onSuccess, onCancel }: DirectSalesFormProps) => {
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
      toast.error('Please fill in all required fields for all products');
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

        // Prepare sale data for RPC
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
          created_by: user.id,
          loading_place: loadingPlace,
          lorry_no: lorryNo
        };

        // For the first item, create with ledger entry
        // For subsequent items, create without ledger to avoid duplicate ledger entries
        if (createdSales.length === 0) {
          // First item - create with ledger entry for the grand total
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

      // Fetch all created sales for invoice
      const { data: salesData, error: fetchError } = await supabase
        .from("sales")
        .select(`
          *,
          customers(*),
          items(*)
        `)
        .in('id', createdSales);

      if (fetchError) throw fetchError;

      // Calculate total quantity across all items
      const totalQuantity = lineItems.reduce((sum, item) => sum + parseFloat(item.quantity), 0);

      // Create temp outward entry for invoice
      const tempOutwardEntry = {
        id: crypto.randomUUID(),
        serial_no: 0,
        entry_date: saleDate,
        customer_id: selectedCustomer,
        item_id: lineItems[0].item_id,
        lorry_no: lorryNo,
        driver_mobile: '',
        empty_weight: 0,
        load_weight: totalQuantity,
        net_weight: totalQuantity,
        loading_place: loadingPlace,
        is_completed: true,
        remarks: remarks || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const customer = customers.find(c => c.id === selectedCustomer);
      const firstItem = items.find(i => i.id === lineItems[0].item_id);
      
      setCreatedSale({
        sales: salesData, // Multiple sales
        sale: salesData[0], // First sale for compatibility
        outwardEntry: tempOutwardEntry,
        customer,
        item: firstItem
      });
      setShowInvoice(true);
      toast.success(`Direct sale with ${lineItems.length} item(s) created successfully`);

    } catch (error: any) {
      console.error('Error creating direct sale:', error);
      
      // Log the failed transaction
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.rpc('log_failed_transaction', {
          p_user_id: user?.id,
          p_transaction_type: 'direct_sale_multi',
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

          </div>

          {/* Line Items Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Products *</Label>
              <Button type="button" onClick={addLineItem} variant="outline" size="sm">
                + Add Product
              </Button>
            </div>

            {lineItems.map((lineItem, index) => (
              <div key={lineItem.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg relative">
                {lineItems.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeLineItem(lineItem.id)}
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2"
                  >
                    ×
                  </Button>
                )}
                
                <div className="space-y-2">
                  <Label>Item {index + 1} *</Label>
                  <Select 
                    value={lineItem.item_id} 
                    onValueChange={(value) => updateLineItem(lineItem.id, 'item_id', value)}
                  >
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
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={lineItem.quantity}
                    onChange={(e) => updateLineItem(lineItem.id, 'quantity', e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rate *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={lineItem.rate}
                    onChange={(e) => updateLineItem(lineItem.id, 'rate', e.target.value)}
                    placeholder="Enter rate"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="p-2 bg-background rounded border text-center font-semibold">
                    ₹{calculateLineItemTotal(lineItem).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">

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

          {lineItems.some(item => item.item_id && item.quantity && item.rate) && (
            <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Grand Total:</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{calculateGrandTotal().toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {lineItems.length} product(s) • Total Qty: {lineItems.reduce((sum, item) => 
                  sum + (parseFloat(item.quantity) || 0), 0
                ).toFixed(2)}
              </div>
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