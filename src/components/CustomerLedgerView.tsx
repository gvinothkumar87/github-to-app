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
import { Customer, CustomerLedger } from '@/types';
import { format } from 'date-fns';

export const CustomerLedgerView = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedger[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<number>(0);
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

    // Fetch related bill numbers for each entry
    const entriesWithBillNo = await Promise.all((data || []).map(async (entry) => {
      let billNo = '';
      
      try {
        if (entry.transaction_type === 'sale') {
          const { data: sale } = await supabase
            .from('sales')
            .select('bill_serial_no')
            .eq('id', entry.reference_id)
            .maybeSingle();
          billNo = sale?.bill_serial_no || '';
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
            .select('note_no')
            .eq('id', entry.reference_id)
            .maybeSingle();
          billNo = note?.note_no || '';
        } else if (entry.transaction_type === 'credit_note') {
          const { data: note } = await supabase
            .from('credit_notes')
            .select('note_no')
            .eq('id', entry.reference_id)
            .maybeSingle();
          billNo = note?.note_no || '';
        }
      } catch (err) {
        console.error('Error fetching bill number:', err);
      }

      const description = entry.description 
        ? (billNo ? `${entry.description} - Bill: ${billNo}` : entry.description)
        : (billNo ? `Bill: ${billNo}` : '');

      return { ...entry, description };
    }));

    // Recompute running balance on the client to ensure correctness
    const sorted = (entriesWithBillNo || []).sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    let running = 0;
    const entriesWithBalance = sorted.map((e) => {
      const debit = Number(e.debit_amount) || 0;
      const credit = Number(e.credit_amount) || 0;
      running = running + debit - credit;
      return { ...e, debit_amount: debit, credit_amount: credit, balance: running } as CustomerLedger;
    });

    setLedgerEntries(entriesWithBalance);
    setCustomerBalance(running);
    
    setLoading(false);
  };

  const getTotalDebit = () => {
    return ledgerEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
  };

  const getTotalCredit = () => {
    return ledgerEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
  };

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
                    <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                    <TableHead>{language === 'english' ? 'Type' : 'வகை'}</TableHead>
                    <TableHead>{language === 'english' ? 'Description' : 'விளக்கம்'}</TableHead>
                    <TableHead className="text-right">{language === 'english' ? 'Debit (₹)' : 'கடன் (₹)'}</TableHead>
                    <TableHead className="text-right">{language === 'english' ? 'Credit (₹)' : 'வரவு (₹)'}</TableHead>
                    <TableHead className="text-right">{language === 'english' ? 'Balance (₹)' : 'மீதி (₹)'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.transaction_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.transaction_type === 'sale' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {entry.transaction_type === 'sale' 
                            ? (language === 'english' ? 'Sale' : 'விற்பனை')
                            : (language === 'english' ? 'Receipt' : 'ரசீது')
                          }
                        </span>
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right">
                        {entry.debit_amount > 0 ? `₹${entry.debit_amount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit_amount > 0 ? `₹${entry.credit_amount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={entry.balance >= 0 ? 'text-red-600' : 'text-green-600'}>
                          ₹{Math.abs(entry.balance).toFixed(2)}
                        </span>
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