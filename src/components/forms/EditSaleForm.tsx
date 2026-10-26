import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useLocations } from '@/hooks/useLocations';
import { ShipToAddressSelect } from '@/components/ShipToAddressSelect';
import { validateBillSequence } from '@/utils/billValidation';

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
  const { locations } = useLocations();
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

  const [shipToAddressId, setShipToAddressId] = useState<string | null>(sale.ship_to_address_id || null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customer.id);
  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || customer;
  const selectableCustomers = customers.some(c => c.id === customer.id) ? customers : [customer, ...customers];

  useEffect(() => {
    const fetchCustomersAndItems = async () => {
      try {
        const [custRes, itemRes] = await Promise.all([
          supabase.from('customers').select('*').eq('is_active', true).order('name_english'),
          supabase.from('items').select('*').eq('is_active', true).order('name_english')
        ]);
        if (custRes.data) {
          setCustomers(custRes.data);
        } else {
          setCustomers([]);
        }
        if (itemRes.data) setItemsList(itemRes.data);
      } catch (err) {
        console.error('Error fetching customers/items:', err);
      }
    };
    fetchCustomersAndItems();
  }, []);

  const [loadingPlace, setLoadingPlace] = useState(sale.loading_place || outwardEntry?.loading_place || '');
  const [lorryNo, setLorryNo] = useState(sale.lorry_no || outwardEntry?.lorry_no || '');
  const [driverMobile, setDriverMobile] = useState(outwardEntry?.driver_mobile || '');
  const [remarks, setRemarks] = useState(outwardEntry?.remarks || '');
  const [irn, setIrn] = useState(sale.irn || '');
  const [saleDate, setSaleDate] = useState(sale.sale_date || new Date().toISOString().split('T')[0]);
  const [billSerialNo, setBillSerialNo] = useState(sale.bill_serial_no || '');
  const [loadWeight, setLoadWeight] = useState(outwardEntry?.load_weight?.toString() || '');
  const [emptyWeight, setEmptyWeight] = useState(outwardEntry?.empty_weight?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [generatingSpecialSerial, setGeneratingSpecialSerial] = useState(false);
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();

  const changeToSpecialSeries = async () => {
    setGeneratingSpecialSerial(true);
    try {
      let maxSerial = 0;
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from('sales_bill_numbers')
          .select('bill_serial_no').like('bill_serial_no', 'D%')
          .order('bill_serial_no').range(offset, offset + 999);
        if (error) throw error;
        for (const bill of data || []) {
          const match = bill.bill_serial_no?.match(/^D(\d+)$/);
          if (match) maxSerial = Math.max(maxSerial, Number(match[1]));
        }
        if (!data || data.length < 1000) break;
      }
      setBillSerialNo(`D${String(maxSerial + 1).padStart(3, '0')}`);
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || 'Failed to generate special bill number',
        variant: 'destructive',
      });
    } finally {
      setGeneratingSpecialSerial(false);
    }
  };

  const updateLineItem = (id: string, field: 'rate' | 'quantity', value: string) => {
    setLineItems(lineItems.map(li => 
      li.id === id ? { ...li, [field]: field === 'quantity' ? Number(value) : value } : li
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
    
    if (!billSerialNo.trim() || !saleDate || !loadingPlace || !lorryNo.trim()) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please fill all required fields' : 'அனைத்து தேவையான புலங்களையும் நிரப்பவும்',
        variant: 'destructive',
      });
      return;
    }

    // Validate quantities and rates before saving.
    const hasEmptyRates = lineItems.some(li => !Number.isFinite(Number(li.rate)) || Number(li.rate) <= 0 || !Number.isFinite(li.quantity) || li.quantity <= 0);
    if (hasEmptyRates) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please enter valid quantities and rates for all items' : 'அனைத்து பொருட்களுக்கும் சரியான விலைகளை உள்ளிடவும்',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Exclude every row of this invoice, including grouped products.
      const editedIds = new Set(lineItems.map(line => line.sale_id));
      const existingBills: { bill_serial_no: string; sale_date: string }[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data: bills, error } = await supabase.from('sales')
          .select('id, bill_serial_no, sale_date').order('id').range(offset, offset + 999);
        if (error) throw error;
        existingBills.push(...(bills || []).filter(bill => !editedIds.has(bill.id)));
        if (!bills || bills.length < 1000) break;
      }
      const validation = validateBillSequence(billSerialNo.trim(), saleDate, existingBills, /^D\d+$/i.test(billSerialNo.trim()));
      if (!validation.isValid) throw new Error(language === 'english' ? validation.errorEn : validation.errorTa);

      // If the bill number has changed, clear the old E-Invoice and E-Way Bill details
      if (billSerialNo !== sale.bill_serial_no) {
        const saleIds = lineItems.map(item => item.sale_id);
        const { error: clearError } = await supabase
          .from('sales')
          .update({
            irn: null,
            ack_no: null,
            ack_date: null,
            signed_invoice: null,
            signed_qrcode: null,
            einvoice_status: null,
            eway_bill_no: null,
            eway_bill_date: null,
            eway_bill_status: null
          })
          .in('id', saleIds);
          
        if (clearError) throw clearError;
      }

      // Update each sale in the line items
      for (const lineItem of lineItems) {
        const newRate = parseFloat(lineItem.rate);
        const baseAmount = lineItem.quantity * newRate;
        const gstPercent = lineItem.item.gst_percentage || 0;
        const gstAmount = baseAmount * (gstPercent / 100);
        const totalAmount = baseAmount + gstAmount;

        const saleData = {
          customer_id: selectedCustomerId,
          ship_to_address_id: shipToAddressId,
          item_id: lineItem.item.id,
          quantity: lineItem.quantity.toString(),
          loading_place: loadingPlace,
          lorry_no: lorryNo,
          rate: newRate.toString(),
          total_amount: totalAmount.toString(),
          base_amount: baseAmount.toString(),
          gst_amount: gstAmount.toString(),
          irn: billSerialNo !== sale.bill_serial_no ? null : (irn || null),
          bill_serial_no: billSerialNo.trim(),
          sale_date: saleDate
        };

        // For first item, update outward entry if it exists
        const outwardEntryData = (lineItem.id === lineItems[0].id && outwardEntry) ? {
          loading_place: loadingPlace,
          lorry_no: lorryNo,
          driver_mobile: driverMobile,
          remarks,
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
          <div className="bg-muted p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label htmlFor="customerSelect" className="text-xs font-medium">
                  {language === 'english' ? 'Customer / Supplier *' : 'வாடிக்கையாளர் / சப்ளையர் *'}
                </Label>
                <Select value={selectedCustomerId} onValueChange={id => { setSelectedCustomerId(id); setShipToAddressId(null); }}>
                  <SelectTrigger id="customerSelect" className="w-full mt-1 bg-background">
                    <SelectValue placeholder={language === 'english' ? 'Select customer' : 'வாடிக்கையாளரை தேர்ந்தெடுக்கவும்'}>
                      {currentCustomer ? `${getDisplayName(currentCustomer)} (${currentCustomer.code})` : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {selectableCustomers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {getDisplayName(c)} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                disabled={loading || generatingSpecialSerial}
                placeholder={language === 'english' ? 'Enter bill number...' : 'பில் எண்ணை உள்ளிடவும்...'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="loadingPlace">Loading Place *</Label><Select value={loadingPlace} onValueChange={setLoadingPlace}>
              <SelectTrigger id="loadingPlace"><SelectValue placeholder="Select loading place" /></SelectTrigger>
              <SelectContent>
                {loadingPlace && !locations.some(location => location.location_code === loadingPlace) && <SelectItem value={loadingPlace}>{loadingPlace}</SelectItem>}
                {locations.map(location => <SelectItem key={location.id} value={location.location_code}>{location.location_name}</SelectItem>)}
              </SelectContent>
            </Select></div>
            <div><Label htmlFor="lorryNo">Lorry Number *</Label><Input id="lorryNo" value={lorryNo} onChange={e => setLorryNo(e.target.value)} required /></div>
            {outwardEntry && <>
              <div><Label htmlFor="driverMobile">Driver Mobile</Label><Input id="driverMobile" value={driverMobile} onChange={e => setDriverMobile(e.target.value)} /></div>
              <div><Label htmlFor="remarks">Remarks</Label><Input id="remarks" value={remarks} onChange={e => setRemarks(e.target.value)} /></div>
            </>}
          </div>
          <Button type="button" variant="outline" onClick={changeToSpecialSeries} disabled={loading || generatingSpecialSerial}>
            {generatingSpecialSerial
              ? (language === 'english' ? 'Generating special number...' : 'சிறப்பு எண் உருவாக்கப்படுகிறது...')
              : (language === 'english' ? 'Change to Special Series' : 'சிறப்பு எண் வரிசைக்கு மாற்று')}
          </Button>
          <p className="text-sm text-muted-foreground">Regular bill numbers must follow date order within their series and financial year. Special serials (D001, D002, …) are exempt from date order.</p>

          <ShipToAddressSelect customerId={selectedCustomerId} customer={currentCustomer} value={shipToAddressId} onChange={id => setShipToAddressId(id)} />
          {/* Products Section */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-base font-semibold">
              {language === 'english' ? 'Products' : 'தயாரிப்புகள்'}
            </Label>

            {lineItems.map((lineItem, index) => (
              <div key={lineItem.id} className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-medium">
                          {language === 'english' ? 'Product *' : 'தயாரிப்பு *'}
                        </Label>
                        {lineItem.sale_date && isMultiProduct && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {new Date(lineItem.sale_date).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                      <Select 
                        value={lineItem.item.id} 
                        onValueChange={(val) => {
                          const selectedItem = itemsList.find(i => i.id === val);
                          if (selectedItem) {
                            setLineItems(lineItems.map(li => 
                              li.id === lineItem.id ? { 
                                ...li, 
                                item: selectedItem,
                                unit: selectedItem.unit
                              } : li
                            ));
                          }
                        }}
                      >
                        <SelectTrigger className="w-full bg-background mt-1">
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
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`quantity-${lineItem.id}`}>Quantity ({lineItem.unit})</Label>
                    <Input id={`quantity-${lineItem.id}`} type="number" min="0.001" step="any" value={lineItem.quantity} onChange={e => updateLineItem(lineItem.id, 'quantity', e.target.value)} required />
                  </div>
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
            <Button type="submit" disabled={loading || generatingSpecialSerial}>
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
