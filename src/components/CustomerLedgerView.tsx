import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Customer, CustomerLedger, Sale, OutwardEntry, DebitNote, CreditNote, Item } from '@/types';
import { format } from 'date-fns';
import { Printer, FileText, ArrowLeft } from 'lucide-react';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { DebitNoteInvoiceGenerator } from '@/components/DebitNoteInvoiceGenerator';
import { CreditNoteInvoiceGenerator } from '@/components/CreditNoteInvoiceGenerator';

export const CustomerLedgerView = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<number>(0);

  // Printing states
  const [printingSale, setPrintingSale] = useState<{
    sale: Sale;
    outwardEntry?: OutwardEntry;
    customer?: Customer;
    item?: Item;
  } | null>(null);

  const [printingDebitNote, setPrintingDebitNote] = useState<{
    debitNote: DebitNote;
    customer?: Customer;
    item?: Item;
  } | null>(null);

  const [printingCreditNote, setPrintingCreditNote] = useState<{
    creditNote: CreditNote;
    customer?: Customer;
    item?: Item;
  } | null>(null);

  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchLedgerEntries();
    }
  }, [selectedCustomerId, dateFrom, dateTo]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('name_english', { ascending: true });

    if (error) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to fetch customers' : 'வாடிக்கையாளர்களை பெறுவதில் தோல்வி',
        variant: 'destructive',
      });
      return;
    }

    setCustomers(data || []);
  };

  const fetchLedgerEntries = async () => {
    if (!selectedCustomerId) return;

    setLoading(true);
    
    // Fetch customer to get opening balance
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('opening_balance')
      .eq('id', selectedCustomerId)
      .single();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
    }

    let query = supabase
      .from('customer_ledger')
      .select(`
        *,
        customers (id, name_english, name_tamil, code)
      `)
      .eq('customer_id', selectedCustomerId)
      .order('transaction_date', { ascending: true });

    if (dateFrom) {
      query = query.gte('transaction_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('transaction_date', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to fetch ledger entries' : 'லெட்ஜர் என்ட்ரிகளை பெறுவதில் தோல்வி',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

    const defaultItem: Item = {
      id: '',
      name_english: 'Product',
      name_tamil: undefined,
      code: 'N/A',
      unit: 'KG',
      unit_weight: 1,
      hsn_no: '',
      gst_percentage: 18,
      description_english: undefined,
      description_tamil: undefined,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Fetch related bill numbers, entry dates, quantity, rate, and full record data for each entry
    const entriesWithDetails = await Promise.all((data || []).map(async (entry) => {
      let billNo = '';
      let entryDate = '';
      let quantity: number | null = null;
      let rate: number | null = null;
      let fullData: any = {};
      
      try {
        if (entry.transaction_type === 'sale') {
          const { data: sale } = await supabase
            .from('sales')
            .select(`
              *,
              customers (*),
              items (*),
              outward_entries!sales_outward_entry_id_fkey (*)
            `)
            .eq('id', entry.reference_id)
            .maybeSingle();

          if (sale) {
            billNo = sale.bill_serial_no || '';
            entryDate = (sale.outward_entries as any)?.entry_date || '';
            quantity = sale.quantity ?? null;
            rate = sale.rate ?? null;
            fullData = {
              sale,
              outwardEntry: sale.outward_entries,
              customer: sale.customers || selectedCustomerObj,
              item: sale.items || defaultItem
            };
          }
        } else if (entry.transaction_type === 'receipt') {
          const { data: receipt } = await supabase
            .from('receipts')
            .select('receipt_no')
            .eq('id', entry.reference_id)
            .maybeSingle();
          billNo = receipt?.receipt_no || '';
        } else if (entry.transaction_type === 'debit_note') {
          const { data: note } = await supabase
            .from('debit_notes')
            .select(`
              *,
              customers (*),
              items (*)
            `)
            .eq('id', entry.reference_id)
            .maybeSingle();

          if (note) {
            billNo = note.note_no || '';
            fullData = {
              debitNote: note,
              customer: note.customers || selectedCustomerObj,
              item: note.items || defaultItem
            };
          }
        } else if (entry.transaction_type === 'credit_note') {
          const { data: note } = await supabase
            .from('credit_notes')
            .select(`
              *,
              customers (*),
              items (*)
            `)
            .eq('id', entry.reference_id)
            .maybeSingle();

          if (note) {
            billNo = note.note_no || '';
            fullData = {
              creditNote: note,
              customer: note.customers || selectedCustomerObj,
              item: note.items || defaultItem
            };
          }
        }
      } catch (err) {
        console.error('Error fetching entry details:', err);
      }

      const description = entry.description 
        ? (billNo ? `${entry.description} - Bill: ${billNo}` : entry.description)
        : (billNo ? `Bill: ${billNo}` : '');

      return {
        ...entry,
        description,
        entry_date: entryDate,
        billNo,
        quantity,
        rate,
        fullData
      };
    }));

    // Recompute running balance on the client to ensure correctness, starting with opening balance
    const sorted = (entriesWithDetails || []).sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    const openingBalance = customerData?.opening_balance || 0;
    let running = openingBalance;
    const entriesWithBalance = sorted.map((e) => {
      const debit = Number(e.debit_amount) || 0;
      const credit = Number(e.credit_amount) || 0;
      running = running + debit - credit;
      return { ...e, debit_amount: debit, credit_amount: credit, balance: running };
    });

    setLedgerEntries(entriesWithBalance);
    setCustomerBalance(running);
    setLoading(false);
  };

  const handlePrintEntry = (entry: any) => {
    if (!entry.fullData) return;

    if (entry.transaction_type === 'sale' && entry.fullData.sale) {
      setPrintingSale({
        sale: entry.fullData.sale,
        outwardEntry: entry.fullData.outwardEntry,
        customer: entry.fullData.customer,
        item: entry.fullData.item,
      });
    } else if (entry.transaction_type === 'debit_note' && entry.fullData.debitNote) {
      setPrintingDebitNote({
        debitNote: entry.fullData.debitNote,
        customer: entry.fullData.customer,
        item: entry.fullData.item,
      });
    } else if (entry.transaction_type === 'credit_note' && entry.fullData.creditNote) {
      setPrintingCreditNote({
        creditNote: entry.fullData.creditNote,
        customer: entry.fullData.customer,
        item: entry.fullData.item,
      });
    }
  };

  const getTotalDebit = () => {
    return ledgerEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
  };

  const getTotalCredit = () => {
    return ledgerEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
  };

  // Render print view if any bill printing state is active
  if (printingSale) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrintingSale(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'english' ? 'Back to Customer Ledger' : 'வாடிக்கையாளர் லெட்ஜருக்குத் திரும்பு'}
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {language === 'english' ? 'Print Sales Bill' : 'விற்பனை பில் அச்சிடு'}
            </h1>
          </div>
        </div>
        <InvoiceGenerator
          sale={printingSale.sale}
          outwardEntry={printingSale.outwardEntry}
          customer={printingSale.customer}
          item={printingSale.item}
          onClose={() => setPrintingSale(null)}
        />
      </div>
    );
  }

  if (printingDebitNote) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrintingDebitNote(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'english' ? 'Back to Customer Ledger' : 'வாடிக்கையாளர் லெட்ஜருக்குத் திரும்பு'}
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {language === 'english' ? 'Print Debit Note' : 'டெபிட் நோட் அச்சிடு'}
            </h1>
          </div>
        </div>
        <DebitNoteInvoiceGenerator
          debitNote={printingDebitNote.debitNote}
          customer={printingDebitNote.customer}
          item={printingDebitNote.item}
          onClose={() => setPrintingDebitNote(null)}
        />
      </div>
    );
  }

  if (printingCreditNote) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrintingCreditNote(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'english' ? 'Back to Customer Ledger' : 'வாடிக்கையாளர் லெட்ஜருக்குத் திரும்பு'}
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {language === 'english' ? 'Print Credit Note' : 'கிரெடிட் நோட் அச்சிடு'}
            </h1>
          </div>
        </div>
        <CreditNoteInvoiceGenerator
          creditNote={printingCreditNote.creditNote}
          customer={printingCreditNote.customer}
          item={printingCreditNote.item}
          onClose={() => setPrintingCreditNote(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{language === 'english' ? 'Customer Ledger' : 'வாடிக்கையாளர் லெட்ஜர்'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="customer">
                {language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}
              </Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'english' ? 'Choose customer...' : 'வாடிக்கையாளரை தேர்ந்தெடுக்கவும்...'} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {getDisplayName(customer)} {customer.code && `(${customer.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-from">
                {language === 'english' ? 'From Date' : 'தொடக்க தேதி'}
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date-to">
                {language === 'english' ? 'To Date' : 'முடிவு தேதி'}
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={fetchLedgerEntries} disabled={!selectedCustomerId}>
                {language === 'english' ? 'View Ledger' : 'லெட்ஜரைப் பார்க்கவும்'}
              </Button>
            </div>
          </div>

          {selectedCustomerId && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">₹{getTotalDebit().toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'english' ? 'Total Sales' : 'மொத்த விற்பனை'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{getTotalCredit().toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'english' ? 'Total Received' : 'மொத்த பெற்றது'}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${customerBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{Math.abs(customerBalance).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'english' 
                    ? (customerBalance >= 0 ? 'Balance Due' : 'Advance')
                    : (customerBalance >= 0 ? 'செலுத்த வேண்டிய தொகை' : 'முன்பணம்')
                  }
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {ledgerEntries.length} {language === 'english' ? 'Entries' : 'என்ட்ரிகள்'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'english' ? 'Total Transactions' : 'மொத்த பரிவர்த்தனைகள்'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              {language === 'english' ? 'Loading...' : 'ஏற்றுகிறது...'}
            </div>
          </CardContent>
        </Card>
      ) : ledgerEntries.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'english' ? 'Entry Date' : 'என்ட்ரி தேதி'}</TableHead>
                    <TableHead>{language === 'english' ? 'Bill Date' : 'பில் தேதி'}</TableHead>
                    <TableHead>{language === 'english' ? 'Type' : 'வகை'}</TableHead>
                    <TableHead>{language === 'english' ? 'Description / Bill' : 'விளக்கம் / பில்'}</TableHead>
                    <TableHead className="text-right">{language === 'english' ? 'Quantity' : 'அளவு'}</TableHead>
                    <TableHead className="text-right">{language === 'english' ? 'Rate (₹)' : 'விலை (₹)'}</TableHead>
                    <TableHead className="text-right">{language === 'english' ? 'Debit (₹)' : 'கடன் (₹)'}</TableHead>
                    <TableHead className="text-right">{language === 'english' ? 'Credit (₹)' : 'வரவு (₹)'}</TableHead>
                    <TableHead className="text-right">{language === 'english' ? 'Balance (₹)' : 'மீதி (₹)'}</TableHead>
                    <TableHead className="text-center">{language === 'english' ? 'Action' : 'செயல்'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.entry_date ? format(new Date(entry.entry_date), 'dd/MM/yyyy') : (entry.transaction_type === 'sale' ? 'N/A' : '-')}
                      </TableCell>
                      <TableCell>{format(new Date(entry.transaction_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.transaction_type === 'sale' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                            : entry.transaction_type === 'receipt'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : entry.transaction_type === 'debit_note'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {entry.transaction_type === 'sale' 
                            ? (language === 'english' ? 'Sale' : 'விற்பனை')
                            : entry.transaction_type === 'receipt'
                            ? (language === 'english' ? 'Receipt' : 'ரசீது')
                            : entry.transaction_type === 'debit_note'
                            ? (language === 'english' ? 'Debit Note' : 'டெபிட் நோட்')
                            : (language === 'english' ? 'Credit Note' : 'கிரெடிட் நோட்')
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        {entry.fullData && (entry.fullData.sale || entry.fullData.debitNote || entry.fullData.creditNote) ? (
                          <button
                            type="button"
                            onClick={() => handlePrintEntry(entry)}
                            className="text-primary hover:underline font-medium cursor-pointer text-left flex items-center gap-1 group"
                            title={language === 'english' ? 'Click to view / print bill' : 'பில் பார்க்க / அச்சிட கிளிக் செய்யவும்'}
                          >
                            <span>{entry.description}</span>
                            <Printer className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 inline ml-1" />
                          </button>
                        ) : (
                          entry.description || '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.quantity !== undefined && entry.quantity !== null ? `${entry.quantity} KG` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.rate !== undefined && entry.rate !== null ? `₹${entry.rate}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.debit_amount > 0 ? `₹${entry.debit_amount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.credit_amount > 0 ? `₹${entry.credit_amount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={entry.balance >= 0 ? 'text-red-600' : 'text-green-600'}>
                          ₹{Math.abs(entry.balance).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.fullData && (entry.fullData.sale || entry.fullData.debitNote || entry.fullData.creditNote) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintEntry(entry)}
                            className="h-8 px-2 text-xs flex items-center gap-1 mx-auto"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            {language === 'english' ? 'Print' : 'அச்சிடு'}
                          </Button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : selectedCustomerId ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              {language === 'english' ? 'No transactions found for selected filters' : 'தேர்ந்தெடுக்கப்பட்ட வடிப்பானுக்கு எந்த பரிவர்த்தனையும் இல்லை'}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};