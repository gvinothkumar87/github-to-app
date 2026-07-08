import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { InwardEntry, Supplier, Item } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditInwardEntryFormProps {
  inwardEntry: InwardEntry;
  supplier: Supplier;
  item: Item;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditInwardEntryForm = ({ inwardEntry, supplier, item, onSuccess, onCancel }: EditInwardEntryFormProps) => {
  const [entryDate, setEntryDate] = useState(inwardEntry.entry_date);
  const [lorryNo, setLorryNo] = useState(inwardEntry.lorry_no);
  const [driverMobile, setDriverMobile] = useState(inwardEntry.driver_mobile);
  const [loadingPlace, setLoadingPlace] = useState(inwardEntry.loading_place);
  const [fullWeight, setFullWeight] = useState(inwardEntry.full_weight.toString());
  const [emptyWeight, setEmptyWeight] = useState(inwardEntry.empty_weight?.toString() || '');
  const [remarks, setRemarks] = useState(inwardEntry.remarks || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(inwardEntry.supplier_id);
  const [selectedItemId, setSelectedItemId] = useState<string>(inwardEntry.item_id);

  useEffect(() => {
    const fetchSuppliersAndItems = async () => {
      try {
        const [suppRes, itemRes] = await Promise.all([
          supabase.from('suppliers').select('*').eq('is_active', true).order('name_english'),
          supabase.from('items').select('*').eq('is_active', true).order('name_english')
        ]);
        if (suppRes.data) setSuppliers(suppRes.data);
        if (itemRes.data) setItemsList(itemRes.data);
      } catch (err) {
        console.error('Error fetching suppliers/items:', err);
      }
    };
    fetchSuppliersAndItems();
  }, []);

  const calculateNetWeight = () => {
    const full = parseFloat(fullWeight) || 0;
    const empty = parseFloat(emptyWeight) || 0;
    return full - empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entryDate || !lorryNo || !driverMobile || !fullWeight) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please fill all required fields' : 'அனைத்து தேவையான புலங்களையும் நிரப்பவும்',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const newFullWeight = parseFloat(fullWeight);
      const newEmptyWeight = emptyWeight ? parseFloat(emptyWeight) : null;
      const newNetWeight = newEmptyWeight ? newFullWeight - newEmptyWeight : null;

      // Update inward entry record
      const { error: inwardError } = await supabase
        .from('inward_entries')
        .update({
          supplier_id: selectedSupplierId,
          item_id: selectedItemId,
          entry_date: entryDate,
          lorry_no: lorryNo,
          driver_mobile: driverMobile,
          loading_place: loadingPlace,
          full_weight: newFullWeight,
          empty_weight: newEmptyWeight,
          net_weight: newNetWeight,
          remarks: remarks || null,
          is_completed: newEmptyWeight ? true : false,
        })
        .eq('id', inwardEntry.id);

      if (inwardError) throw inwardError;

      // Check if there is an associated purchase
      const { data: assocPurchase } = await supabase
        .from('purchases')
        .select('*')
        .eq('inward_entry_id', inwardEntry.id)
        .maybeSingle();

      if (assocPurchase) {
        const qty = assocPurchase.quantity;
        const rate = parseFloat(assocPurchase.rate);
        const totalAmount = qty * rate;

        const { error: purchaseError } = await supabase
          .from('purchases')
          .update({
            supplier_id: selectedSupplierId,
            item_id: selectedItemId,
            quantity: qty,
            rate: rate,
            total_amount: totalAmount,
            purchase_date: entryDate
          })
          .eq('id', assocPurchase.id);

        if (purchaseError) throw purchaseError;
      }

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Inward entry updated successfully' : 'உள்வரும் பதிவு வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
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
        <CardTitle>{language === 'english' ? 'Edit Inward Entry' : 'உள்வரும் பதிவை திருத்து'}</CardTitle>
        <CardDescription>
          {language === 'english' 
            ? `Editing entry #${inwardEntry.serial_no}`
            : `பதிவு #${inwardEntry.serial_no} ஐ திருத்துகிறது`
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
                <p className="font-bold text-base mt-1">#{inwardEntry.serial_no}</p>
              </div>
              <div>
                <Label htmlFor="supplierSelect" className="text-xs font-medium">
                  {language === 'english' ? 'Supplier *' : 'சப்ளையர் *'}
                </Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger id="supplierSelect" className="w-full bg-background mt-1">
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {getDisplayName(s)} ({s.code})
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
              {language === 'english' ? 'Mill (Loading Place)' : 'மில் (ஏற்றும் இடம்)'}
            </Label>
            <Input
              id="loadingPlace"
              type="text"
              value={loadingPlace}
              onChange={(e) => setLoadingPlace(e.target.value)}
              placeholder={language === 'english' ? 'Enter mill...' : 'மில்லை உள்ளிடவும்...'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fullWeight">
                {language === 'english' ? 'Full Weight (KG)' : 'முழு எடை (கிலோ)'} *
              </Label>
              <Input
                id="fullWeight"
                type="number"
                step="0.01"
                value={fullWeight}
                onChange={(e) => setFullWeight(e.target.value)}
                placeholder={language === 'english' ? 'Enter full weight...' : 'முழு எடையை உள்ளிடவும்...'}
                required
              />
            </div>

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
              <Label>
                {language === 'english' ? 'Net Weight (KG)' : 'நிகர எடை (கிலோ)'}
              </Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                {emptyWeight ? calculateNetWeight().toFixed(2) : '-'}
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
