import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Customer } from '@/types';

interface AmountReceivedFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AmountReceivedForm = ({ onSuccess, onCancel }: AmountReceivedFormProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [selectedLedger, setSelectedLedger] = useState('');
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();

  useEffect(() => {
    fetchCustomers();
    fetchLedgers();
  }, []);

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

  const fetchLedgers = async () => {
    const { data, error } = await supabase
      .from('ledgers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to fetch ledgers' : 'லெட்ஜர்களை பெறுவதில் தோல்வி',
        variant: 'destructive',
      });
      return;
    }

    setLedgers(data || []);
  };

  const generateReceiptNo = async () => {
    const { data, error } = await supabase.rpc('generate_receipt_no');
    
    if (error) {
      throw error;
    }
    
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId || !amount || !selectedLedger) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please select customer, enter amount and select ledger' : 'வாடிக்கையாளர், தொகை மற்றும் லெட்ஜர் தேர்ந்தெடுக்கவும்',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Generate receipt number
      const receiptNo = await generateReceiptNo();

      // Create receipt record
      const receiptData = {
        receipt_no: receiptNo,
        customer_id: selectedCustomerId,
        amount: parseFloat(amount),
        receipt_date: receiptDate,
        payment_method: paymentMethod,
        remarks: remarks || null,
      };

      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert(receiptData)
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Create customer ledger entry
      const customer = customers.find(c => c.id === selectedCustomerId);
      const ledgerData = {
        customer_id: selectedCustomerId,
        transaction_type: 'receipt' as const,
        reference_id: receipt.id,
        debit_amount: 0,
        credit_amount: parseFloat(amount),
        transaction_date: receiptDate,
        description: `Receipt ${receiptNo} - ${paymentMethod}${remarks ? ` (${remarks})` : ''}`,
      };

      const { error: ledgerError } = await supabase
        .from('customer_ledger')
        .insert(ledgerData);

      if (ledgerError) throw ledgerError;

      // Create transaction in main ledger system using process_transaction function
      const selectedCustomerData = customers.find(c => c.id === selectedCustomerId);
      const selectedLedgerData = ledgers.find(l => l.id === selectedLedger);
      
      const { error: transactionError } = await supabase.rpc('process_transaction', {
        p_amount: parseFloat(amount),
        p_description: `Receipt from ${selectedCustomerData?.name_english || 'Customer'} - ${receiptNo}`,
        p_date: receiptDate,
        p_user_id: 'current_user', // Replace with actual user ID when auth is implemented
        p_type: 'income',
        p_created_by: 'current_user', // Replace with actual user ID when auth is implemented
        p_ledger_id: selectedLedger,
        p_attached_bill: receiptNo
      });

      if (transactionError) {
        console.error('Error creating main ledger transaction:', transactionError);
        toast({
          title: language === 'english' ? 'Warning' : 'எச்சரிக்கை',
          description: language === 'english' ? 'Receipt created but failed to update main ledger' : 'ரசீது உருவாக்கப்பட்டது ஆனால் முக்கிய லெட்ஜர் புதுப்பிக்கத் தவறியது',
          variant: 'destructive',
        });
      }

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' 
          ? `Receipt ${receiptNo} created and recorded in ${selectedLedgerData?.name || 'selected ledger'}` 
          : `ரசீது ${receiptNo} உருவாக்கப்பட்டு ${selectedLedgerData?.name || 'தேர்ந்தெடுக்கப்பட்ட லெட்ஜர்'} இல் பதிவு செய்யப்பட்டது`,
      });

      // Reset form
      setSelectedCustomerId('');
      setAmount('');
      setPaymentMethod('cash');
      setReceiptDate(new Date().toISOString().split('T')[0]);
      setRemarks('');
      setSelectedLedger('');
      
      onSuccess();
      
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || (language === 'english' ? 'Failed to create receipt' : 'ரசீது உருவாக்கத்தில் தோல்வி'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{language === 'english' ? 'Amount Received' : 'பெற்ற தொகை'}</CardTitle>
        <CardDescription>
          {language === 'english' 
            ? 'Record payment received from customer'
            : 'வாடிக்கையாளரிடமிருந்து பெற்ற பணத்தை பதிவு செய்யவும்'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="amount">
              {language === 'english' ? 'Amount' : 'தொகை'}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={language === 'english' ? 'Enter amount...' : 'தொகையை உள்ளிடவும்...'}
              required
            />
          </div>

          <div>
            <Label htmlFor="receipt-date">
              {language === 'english' ? 'Receipt Date' : 'ரசீது தேதி'}
            </Label>
            <Input
              id="receipt-date"
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="payment-method">
              {language === 'english' ? 'Payment Method' : 'கட்டண முறை'}
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  {language === 'english' ? 'Cash' : 'பணம்'}
                </SelectItem>
                <SelectItem value="cheque">
                  {language === 'english' ? 'Cheque' : 'காசோலை'}
                </SelectItem>
                <SelectItem value="bank_transfer">
                  {language === 'english' ? 'Bank Transfer' : 'வங்கி பரிமாற்றம்'}
                </SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">
                  {language === 'english' ? 'Card' : 'கார்டு'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="ledger">
              {language === 'english' ? 'Select Ledger' : 'லெட்ஜர் தேர்ந்தெடுக்கவும்'} *
            </Label>
            <Select value={selectedLedger} onValueChange={setSelectedLedger}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'english' ? 'Choose ledger to record payment...' : 'பணம் பதிவு செய்ய லெட்ஜர் தேர்ந்தெடுக்கவும்...'} />
              </SelectTrigger>
              <SelectContent>
                {ledgers.map((ledger) => (
                  <SelectItem key={ledger.id} value={ledger.id}>
                    {getDisplayName(ledger)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="remarks">
              {language === 'english' ? 'Remarks (Optional)' : 'குறிப்புகள் (விருப்பமான)'}
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={language === 'english' ? 'Enter any additional notes...' : 'கூடுதல் குறிப்புகள் உள்ளிடவும்...'}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !selectedCustomerId || !amount || !selectedLedger}>
              {loading 
                ? (language === 'english' ? 'Creating...' : 'உருவாக்குகிறது...') 
                : (language === 'english' ? 'Create Receipt' : 'ரசீது உருவாக்கு')
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