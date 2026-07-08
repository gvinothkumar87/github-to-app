import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { OutwardEntry, Customer, Item } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditOutwardEntryFormProps {
  outwardEntry: OutwardEntry;
  customer: Customer;
  item: Item;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditOutwardEntryForm = ({ outwardEntry, customer, item, onSuccess, onCancel }: EditOutwardEntryFormProps) => {
  const [entryDate, setEntryDate] = useState(outwardEntry.entry_date);
  const [lorryNo, setLorryNo] = useState(outwardEntry.lorry_no);
  const [driverMobile, setDriverMobile] = useState(outwardEntry.driver_mobile);
  const [loadingPlace, setLoadingPlace] = useState(outwardEntry.loading_place);
  const [emptyWeight, setEmptyWeight] = useState(outwardEntry.empty_weight.toString());
  const [loadWeight, setLoadWeight] = useState(outwardEntry.load_weight?.toString() || '');
  const [remarks, setRemarks] = useState(outwardEntry.remarks || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(outwardEntry.customer_id);
  const [selectedItemId, setSelectedItemId] = useState<string>(outwardEntry.item_id);

  useEffect(() => {
    const fetchCustomersAndItems = async () => {
      try {
        const [custRes, itemRes] = await Promise.all([
          supabase.from('customers').select('*').eq('is_active', true).order('name_english'),
          supabase.from('items').select('*').eq('is_active', true).order('name_english')
        ]);
        if (custRes.data) setCustomers(custRes.data);
        if (itemRes.data) setItemsList(itemRes.data);
      } catch (err) {
        console.error('Error fetching customers/items:', err);
      }
    };
    fetchCustomersAndItems();
  }, []);

  const calculateNetWeight = () => {
    const load = parseFloat(loadWeight) || 0;
    const empty = parseFloat(emptyWeight) || 0;
    return load - empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entryDate || !lorryNo || !driverMobile || !emptyWeight) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please fill all required fields' : 'அனைத்து தேவையான புலங்களையும் நிரப்பவும்',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const newEmptyWeight = parseFloat(emptyWeight);
      const newLoadWeight = loadWeight ? parseFloat(loadWeight) : null;
      const newNetWeight = newLoadWeight && newEmptyWeight ? newLoadWeight - newEmptyWeight : null;

      // Update outward entry record
      const { error: outwardError } = await supabase
        .from('outward_entries')
        .update({
          customer_id: selectedCustomerId,
          item_id: selectedItemId,
          entry_date: entryDate,
          lorry_no: lorryNo,
          driver_mobile: driverMobile,
          loading_place: loadingPlace,
          empty_weight: newEmptyWeight,
          load_weight: newLoadWeight,
          net_weight: newNetWeight,
          remarks: remarks || null,
          is_completed: newLoadWeight ? true : false,
        })
        .eq('id', outwardEntry.id);

      if (outwardError) throw outwardError;

      // Check if there is an associated sale
      const { data: assocSale } = await supabase
        .from('sales')
        .select('id')
        .eq('outward_entry_id', outwardEntry.id)
        .maybeSingle();

      if (assocSale) {
        // If customer or product changed, clear E-Invoice/E-Way Bill details
        if (selectedCustomerId !== outwardEntry.customer_id || selectedItemId !== outwardEntry.item_id) {
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
            .eq('id', assocSale.id);
            
          if (clearError) throw clearError;
        }

        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || '';

        const selectedItemObj = itemsList.find(i => i.id === selectedItemId);
        const gstPercent = selectedItemObj?.gst_percentage || 0;

        const { data: fullSale } = await supabase
          .from('sales')
          .select('*')
          .eq('id', assocSale.id)
          .single();

        if (fullSale) {
          const qty = fullSale.quantity;
          const rate = parseFloat(fullSale.rate);
          const baseAmount = qty * rate;
          const gstAmount = baseAmount * (gstPercent / 100);
          const totalAmount = baseAmount + gstAmount;

          const saleData = {
            customer_id: selectedCustomerId,
            item_id: selectedItemId,
            rate: rate.toString(),
            total_amount: totalAmount.toString(),
            base_amount: baseAmount.toString(),
            gst_amount: gstAmount.toString(),
            irn: selectedCustomerId !== outwardEntry.customer_id || selectedItemId !== outwardEntry.item_id ? null : (fullSale.irn || null),
            bill_serial_no: fullSale.bill_serial_no,
            sale_date: entryDate
          };

          const outwardEntryData = {
            empty_weight: newEmptyWeight,
            load_weight: newLoadWeight
          };

          const { data: rpcResult, error: rpcError } = await supabase.rpc('update_sale_with_ledger', {
            p_sale_id: fullSale.id,
            p_sale_data: saleData,
            p_outward_entry_data: outwardEntryData,
            p_user_id: userId
          });

          if (rpcError) throw rpcError;
          const rpcRes = rpcResult as any;
          if (rpcRes?.error) throw new Error(rpcRes.error);
        }
      }

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Outward entry updated successfully' : 'வெளிச்செல்லும் பதிவு வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
      });

      onSuccess();
      
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || (language === 'english' ? 'Failed to update entry' : 'பதிவை புதுப்பிப்பதில் தோல்வி'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{language === 'english' ? 'Edit Outward Entry' : 'வெளிச்செல்லும் பதிவை திருத்து'}</CardTitle>
        <CardDescription>
          {language === 'english' 
            ? `Editing entry #${outwardEntry.serial_no}`
            : `பதிவு #${outwardEntry.serial_no} ஐ திருத்துகிறது`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Entry Details */}
          <div className="bg-muted p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-xs font-medium">{language === 'english' ? 'Serial No' : 'வ.எண்'}:</Label>
                <p className="font-bold text-base mt-1">#{outwardEntry.serial_no}</p>
              </div>
              <div>
                <Label htmlFor="customerSelect" className="text-xs font-medium">
                  {language === 'english' ? 'Customer *' : 'வாடிக்கையாளர் *'}
                </Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="customerSelect" className="w-full bg-background mt-1">
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {getDisplayName(c)} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="itemSelect" className="text-xs font-medium">
                  {language === 'english' ? 'Product/Item *' : 'தயாரிப்பு/பொருள் *'}
                </Label>
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger id="itemSelect" className="w-full bg-background mt-1">
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
            </div>
          </div>

          <div>
            <Label htmlFor="entryDate">
              {language === 'english' ? 'Entry Date' : 'பதிவு தேதி'} *
            </Label>
            <Input
              id="entryDate"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lorryNo">
                {language === 'english' ? 'Lorry Number' : 'லாரி எண்'} *
              </Label>
              <Input
                id="lorryNo"
                type="text"
                value={lorryNo}
                onChange={(e) => setLorryNo(e.target.value)}
                placeholder={language === 'english' ? 'Enter lorry number...' : 'லாரி எண்ணை உள்ளிடவும்...'}
                required
              />
            </div>

            <div>
              <Label htmlFor="driverMobile">
                {language === 'english' ? 'Driver Mobile' : 'ஓட்டுநர் மொபைல்'} *
              </Label>
              <Input
                id="driverMobile"
                type="text"
                value={driverMobile}
                onChange={(e) => setDriverMobile(e.target.value)}
                placeholder={language === 'english' ? 'Enter driver mobile...' : 'ஓட்டுநர் மொபைலை உள்ளிடவும்...'}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="loadingPlace">
              {language === 'english' ? 'Loading Place' : 'ஏற்றும் இடம்'}
            </Label>
            <Input
              id="loadingPlace"
              type="text"
              value={loadingPlace}
              onChange={(e) => setLoadingPlace(e.target.value)}
              placeholder={language === 'english' ? 'Enter loading place...' : 'ஏற்றும் இடத்தை உள்ளிடவும்...'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="emptyWeight">
                {language === 'english' ? 'Empty Weight (KG)' : 'வெற்று எடை (கிலோ)'} *
              </Label>
              <Input
                id="emptyWeight"
                type="number"
                step="0.01"
                value={emptyWeight}
                onChange={(e) => setEmptyWeight(e.target.value)}
                placeholder={language === 'english' ? 'Enter empty weight...' : 'வெற்று எடையை உள்ளிடவும்...'}
                required
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
              <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                {loadWeight ? calculateNetWeight().toFixed(2) : '-'}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="remarks">
              {language === 'english' ? 'Remarks' : 'குறிப்புகள்'}
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={language === 'english' ? 'Enter remarks...' : 'குறிப்புகளை உள்ளிடவும்...'}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading 
                ? (language === 'english' ? 'Updating...' : 'புதுப்பிக்கிறது...') 
                : (language === 'english' ? 'Update Entry' : 'பதிவை புதுப்பிக்கவும்')
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
