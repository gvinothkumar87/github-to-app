import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { InwardEntry } from '@/types';

interface PurchaseFromTransitFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PurchaseFromTransitForm = ({ onSuccess, onCancel }: PurchaseFromTransitFormProps) => {
  const [inwardEntries, setInwardEntries] = useState<InwardEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<InwardEntry | null>(null);
  const [rate, setRate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [billSerialNo, setBillSerialNo] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();

  useEffect(() => {
    fetchCompletedEntries();
  }, []);

  const fetchCompletedEntries = async () => {
    try {
      // First get all completed inward entries
      const { data: entries, error: entriesError } = await supabase
        .from('inward_entries')
        .select(`
          *,
          suppliers (*),
          items (id, name_english, name_tamil, code, unit, unit_weight, gst_percentage, hsn_no, is_active, created_at, updated_at)
        `)
        .eq('is_completed', true)
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      // Get all purchases to filter out entries that have already been converted to purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('inward_entry_id');

      if (purchasesError) throw purchasesError;

      // Filter out entries that have already been converted to purchases
      const purchasedEntryIds = new Set(purchases?.map(p => p.inward_entry_id) || []);
      const availableEntries = (entries || []).filter(entry => !purchasedEntryIds.has(entry.id));

      setInwardEntries(availableEntries as InwardEntry[]);
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to fetch entries' : 'என்ட்ரிகளை பெறுவதில் தோல்வி',
        variant: 'destructive',
      });
      console.error('Error fetching completed entries:', error);
    }
  };

  const calculateQuantity = () => {
    if (!selectedEntry) return 0;
    const netWeight = selectedEntry.net_weight || 0;
    const unitWeight = selectedEntry.items?.unit_weight || 1;
    return netWeight / unitWeight;
  };

  const calculateTotalAmount = () => {
    if (!selectedEntry || !rate) return 0;
    const quantity = calculateQuantity();
    return quantity * parseFloat(rate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEntry || !rate) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please select an entry and enter rate' : 'என்ட்ரி மற்றும் விலையை தேர்ந்தெடுக்கவும்',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const purchaseData = {
        inward_entry_id: selectedEntry.id,
        supplier_id: selectedEntry.supplier_id,
        item_id: selectedEntry.item_id,
        quantity: calculateQuantity(),
        rate: parseFloat(rate),
        total_amount: calculateQuantity() * parseFloat(rate),
        bill_serial_no: billSerialNo || null,
        mill: selectedEntry.loading_place,
        purchase_date: purchaseDate,
        created_by: user?.id,
      };

      const { error } = await supabase
        .from('purchases')
        .insert([purchaseData]);

      if (error) throw error;

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Purchase created successfully' : 'கொள்முதல் வெற்றிகரமாக உருவாக்கப்பட்டது',
      });

      onSuccess();

    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || (language === 'english' ? 'Failed to create purchase' : 'கொள்முதல் உருவாக்கத்தில் தோல்வி'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{language === 'english' ? 'Create Purchase' : 'கொள்முதல் உருவாக்கு'}</CardTitle>
        <CardDescription>
          {language === 'english'
            ? 'Convert completed inward entry to purchase'
            : 'முடிக்கப்பட்ட உள்வரும் என்ட்ரியை கொள்முதலாக மாற்றவும்'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="inward-entry">
              {language === 'english' ? 'Select Inward Entry' : 'உள்வரும் என்ட்ரியை தேர்ந்தெடுக்கவும்'}
            </Label>
            <Select onValueChange={(value) => {
              const entry = inwardEntries.find(e => e.id === value);
              setSelectedEntry(entry || null);

              if (entry) {
                const defaultDate = entry.empty_weight_updated_at
                  ? new Date(entry.empty_weight_updated_at).toISOString().split('T')[0]
                  : entry.entry_date
                    ? new Date(entry.entry_date).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0];
                setPurchaseDate(defaultDate);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'english' ? 'Choose entry...' : 'என்ட்ரியை தேர்ந்தெடுக்கவும்...'} />
              </SelectTrigger>
              <SelectContent>
                {inwardEntries.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    S.No: {entry.serial_no} - {getDisplayName(entry.suppliers!)} - {getDisplayName(entry.items!)} ({entry.net_weight} KG)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEntry && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium">{language === 'english' ? 'Supplier' : 'சப்ளையர்'}:</Label>
                  <p>{getDisplayName(selectedEntry.suppliers!)}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">{language === 'english' ? 'Item' : 'பொருள்'}:</Label>
                  <p>{getDisplayName(selectedEntry.items!)}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">{language === 'english' ? 'Net Weight' : 'நிகர எடை'}:</Label>
                  <p>{selectedEntry.net_weight} KG</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">{language === 'english' ? 'Unit Weight' : 'யூனிட் எடை'}:</Label>
                  <p>{selectedEntry.items?.unit_weight} KG per {selectedEntry.items?.unit}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">{language === 'english' ? 'Calculated Quantity' : 'கணக்கிடப்பட்ட அளவு'}:</Label>
                  <p>{calculateQuantity().toFixed(2)} {selectedEntry.items?.unit}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">{language === 'english' ? 'Lorry No' : 'லாரி எண்'}:</Label>
                  <p>{selectedEntry.lorry_no}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">{language === 'english' ? 'Mill' : 'மில்'}:</Label>
                  <p>{selectedEntry.loading_place}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="purchase-date">
              {language === 'english' ? 'Purchase Date' : 'கொள்முதல் தேதி'}
            </Label>
            <Input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="bill-serial">
              {language === 'english' ? 'Bill Serial Number (Optional)' : 'பில் எண் (விரும்பினால்)'}
            </Label>
            <Input
              id="bill-serial"
              type="text"
              value={billSerialNo}
              onChange={(e) => setBillSerialNo(e.target.value)}
              placeholder={language === 'english' ? 'Enter bill number' : 'பில் எண்ணை உள்ளிடவும்'}
            />
          </div>

          <div>
            <Label htmlFor="rate">
              {language === 'english' ? 'Rate per Unit (₹)' : 'யூனிட் ஒன்றுக்கான விலை (₹)'}
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

          {selectedEntry && rate && (
            <div className="bg-primary/10 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>{language === 'english' ? 'Net Weight:' : 'நிகர எடை:'}</span>
                <span>{selectedEntry.net_weight} KG</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>{language === 'english' ? 'Quantity (Net÷Unit):' : 'அளவு (நிகர÷யூனிட்):'}</span>
                <span>{calculateQuantity().toFixed(2)} {selectedEntry.items?.unit}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-medium">
                  {language === 'english' ? 'Total Amount (Qty×Rate):' : 'மொத்த தொகை (அளவு×விலை):'}
                </span>
                <span className="text-lg font-bold">
                  ₹{calculateTotalAmount().toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !selectedEntry || !rate}>
              {loading
                ? (language === 'english' ? 'Creating...' : 'உருவாக்குகிறது...')
                : (language === 'english' ? 'Create Purchase' : 'கொள்முதல் உருவாக்கு')
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
