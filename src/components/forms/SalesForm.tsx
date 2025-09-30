import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { OutwardEntry } from '@/types';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';

interface SalesFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const SalesForm = ({ onSuccess, onCancel }: SalesFormProps) => {
  const [outwardEntries, setOutwardEntries] = useState<OutwardEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<OutwardEntry | null>(null);
  const [rate, setRate] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [billSerialNo, setBillSerialNo] = useState('');
  const [useSpecialSerial, setUseSpecialSerial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [createdSale, setCreatedSale] = useState<any>(null);
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();

  useEffect(() => {
    fetchCompletedEntries();
  }, []);

  // Auto-generate bill serial when entry is selected or special serial checkbox changes
  useEffect(() => {
    if (selectedEntry && !billSerialNo) {
      if (useSpecialSerial) {
        generateSpecialSerial().then(serial => {
          setBillSerialNo(serial);
        });
      } else {
        generateBillSerial(selectedEntry.loading_place).then(serial => {
          setBillSerialNo(serial);
        });
      }
    }
  }, [selectedEntry, useSpecialSerial]);

  const fetchCompletedEntries = async () => {
    try {
      // First get all completed outward entries
      const { data: entries, error: entriesError } = await supabase
        .from('outward_entries')
        .select(`
          *,
          customers (id, name_english, name_tamil, code, is_active, created_at, updated_at),
          items (id, name_english, name_tamil, code, unit, unit_weight, gst_percentage, hsn_no, is_active, created_at, updated_at)
        `)
        .eq('is_completed', true)
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      // Get all sales to filter out entries that have already been converted to sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('outward_entry_id');

      if (salesError) throw salesError;

      // Filter out entries that have already been converted to sales
      const soldEntryIds = new Set(sales?.map(s => s.outward_entry_id) || []);
      const availableEntries = (entries || []).filter(entry => !soldEntryIds.has(entry.id));

      setOutwardEntries(availableEntries as OutwardEntry[]);
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
    const baseAmount = quantity * parseFloat(rate);
    const gstPercent = selectedEntry.items?.gst_percentage || 0;
    const gstAmount = baseAmount * (gstPercent / 100);
    return baseAmount + gstAmount;
  };

  const getBaseAmount = () => {
    if (!selectedEntry || !rate) return 0;
    const quantity = calculateQuantity();
    return quantity * parseFloat(rate);
  };

  const getGstAmount = () => {
    const baseAmount = getBaseAmount();
    const gstPercent = selectedEntry?.items?.gst_percentage || 0;
    return baseAmount * (gstPercent / 100);
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

  const generateBillSerial = async (loadingPlace: string) => {
    try {
      let prefix = '';
      let query = supabase.from('sales').select('bill_serial_no');
      
      if (loadingPlace === 'PULIVANTHI') {
        // For PULIVANTHI, get numeric serials like 001, 002, 003
        query = query.like('bill_serial_no', '[0-9][0-9][0-9]');
      } else if (loadingPlace === 'MATTAPARAI') {
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
          if (loadingPlace === 'PULIVANTHI') {
            const num = parseInt(serial || '0');
            maxNumber = Math.max(maxNumber, num);
          } else if (loadingPlace === 'MATTAPARAI') {
            const num = parseInt((serial || 'GRM0').replace('GRM', ''));
            maxNumber = Math.max(maxNumber, num);
          }
        });
        
        nextNumber = maxNumber + 1;
        if (loadingPlace === 'MATTAPARAI') {
          nextNumber = Math.max(50, nextNumber); // Ensure GRM starts from 050
        }
      } else {
        // Set starting numbers for new series
        if (loadingPlace === 'MATTAPARAI') {
          nextNumber = 50; // Start GRM series from 050
        }
      }
      
      const serialNumber = nextNumber.toString().padStart(3, '0');
      return loadingPlace === 'PULIVANTHI' ? serialNumber : `${prefix}${serialNumber}`;
    } catch (error) {
      console.error('Error generating bill serial:', error);
      return loadingPlace === 'PULIVANTHI' ? '001' : 'GRM050';
    }
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
      // Use provided bill serial or generate if empty
      const finalBillSerial = billSerialNo || (useSpecialSerial 
        ? await generateSpecialSerial() 
        : await generateBillSerial(selectedEntry.loading_place));
      
      // Create sale record
      const saleData = {
        outward_entry_id: selectedEntry.id,
        customer_id: selectedEntry.customer_id,
        item_id: selectedEntry.item_id,
        quantity: calculateQuantity(),
        rate: parseFloat(rate),
        total_amount: calculateTotalAmount(),
        bill_serial_no: finalBillSerial,
        sale_date: saleDate,
      };

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();

      if (saleError) throw saleError;

      // Create customer ledger entry
      const ledgerData = {
        customer_id: selectedEntry.customer_id,
        transaction_type: 'sale' as const,
        reference_id: sale.id,
        debit_amount: calculateTotalAmount(),
        credit_amount: 0,
        transaction_date: saleDate,
        description: `Sale - ${getDisplayName(selectedEntry.items!)} (${selectedEntry.lorry_no})`,
      };

      const { error: ledgerError } = await supabase
        .from('customer_ledger')
        .insert(ledgerData);

      if (ledgerError) throw ledgerError;

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Sale created successfully' : 'விற்பனை வெற்றிகரமாக உருவாக்கப்பட்டது',
      });

      // Set created sale and show invoice
      setCreatedSale(sale);
      setShowInvoice(true);
      
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || (language === 'english' ? 'Failed to create sale' : 'விற்பனை உருவாக்கத்தில் தோல்வி'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (showInvoice && createdSale && selectedEntry) {
    return (
      <InvoiceGenerator
        sale={createdSale}
        outwardEntry={selectedEntry}
        customer={selectedEntry.customers!}
        item={selectedEntry.items!}
        onClose={() => {
          setShowInvoice(false);
          setCreatedSale(null);
          onSuccess();
        }}
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{language === 'english' ? 'Create Sale' : 'விற்பனை உருவாக்கு'}</CardTitle>
        <CardDescription>
          {language === 'english' 
            ? 'Convert completed outward entry to sale'
            : 'முடிக்கப்பட்ட வெளிச்செல்லும் என்ட்ரியை விற்பனையாக மாற்றவும்'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="outward-entry">
              {language === 'english' ? 'Select Outward Entry' : 'வெளிச்செல்லும் என்ட்ரியை தேர்ந்தெடுக்கவும்'}
            </Label>
            <Select onValueChange={(value) => {
              const entry = outwardEntries.find(e => e.id === value);
              setSelectedEntry(entry || null);
              setBillSerialNo(''); // Reset bill serial to trigger auto-generation
              setUseSpecialSerial(false); // Reset special serial checkbox
            }}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'english' ? 'Choose entry...' : 'என்ட்ரியை தேர்ந்தெடுக்கவும்...'} />
              </SelectTrigger>
              <SelectContent>
                {outwardEntries.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    S.No: {entry.serial_no} - {getDisplayName(entry.customers!)} - {getDisplayName(entry.items!)} ({entry.net_weight} KG)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEntry && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium">{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}:</Label>
                  <p>{getDisplayName(selectedEntry.customers!)}</p>
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
                  <Label className="text-xs font-medium">{language === 'english' ? 'GST %' : 'ஜிஎஸ்டி %'}:</Label>
                  <p>{selectedEntry.items?.gst_percentage || 0}%</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">{language === 'english' ? 'Loading Place' : 'ஏற்றும் இடம்'}:</Label>
                  <p>{selectedEntry.loading_place}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="sale-date">
              {language === 'english' ? 'Sale Date' : 'விற்பனை தேதி'}
            </Label>
            <Input
              id="sale-date"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="use-special-serial" className="flex items-center gap-2 cursor-pointer">
              <input
                id="use-special-serial"
                type="checkbox"
                checked={useSpecialSerial}
                onChange={(e) => {
                  setUseSpecialSerial(e.target.checked);
                  setBillSerialNo(''); // Reset to trigger auto-generation
                }}
                className="rounded border-gray-300"
              />
              {language === 'english' ? 'Use Special Serial (D001)' : 'சிறப்பு எண் பயன்படுத்தவும் (D001)'}
            </Label>
          </div>

          <div>
            <Label htmlFor="bill-serial">
              {language === 'english' ? 'Bill Serial Number' : 'பில் எண்'}
            </Label>
            <Input
              id="bill-serial"
              type="text"
              value={billSerialNo}
              onChange={(e) => setBillSerialNo(e.target.value)}
              placeholder={language === 'english' ? 'Auto-generated' : 'தானாக உருவாக்கப்பட்டது'}
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
                <span>{language === 'english' ? 'Bill Quantity (Net÷Unit):' : 'பில் அளவு (நிகர÷யூனிட்):'}</span>
                <span>{calculateQuantity().toFixed(2)} {selectedEntry.items?.unit}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>{language === 'english' ? 'Base Amount (Qty×Rate):' : 'அடிப்படை தொகை (அளவு×விலை):'}</span>
                <span>₹{getBaseAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>{language === 'english' ? 'GST Amount:' : 'ஜிஎஸ்டி தொகை:'}</span>
                <span>₹{getGstAmount().toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-medium">
                  {language === 'english' ? 'Total Amount (Base+GST):' : 'மொத்த தொகை (அடிப்படை+ஜிஎஸ்டி):'}
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
                : (language === 'english' ? 'Create Sale' : 'விற்பனை உருவாக்கு')
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