import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Trash2 } from 'lucide-react';

interface Receipt {
  id: string;
  receipt_no: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  receipt_date: string;
  remarks?: string;
  created_by: string;
  created_at: string;
}

interface Customer {
  id: string;
  name_english: string;
  name_tamil?: string;
}

export const ReceiptsList = () => {
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch receipts
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('receipts')
        .select('*')
        .order('receipt_date', { ascending: false });

      if (receiptsError) throw receiptsError;

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true);

      if (customersError) throw customersError;

      setReceipts(receiptsData || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to fetch receipts' : 'ரசீதுகளை பெறுவதில் தோல்வி',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? getDisplayName(customer) : 'Unknown Customer';
  };

  const handleDeleteReceipt = async (receiptId: string, receiptNo: string) => {
    if (!confirm(
      language === 'english'
        ? `Are you sure you want to delete receipt ${receiptNo}?`
        : `ரசீது ${receiptNo} ஐ நீக்க விரும்புகிறீர்களா?`
    )) {
      return;
    }

    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', receiptId);

      if (error) throw error;

      setReceipts(receipts.filter(r => r.id !== receiptId));

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Receipt deleted successfully' : 'ரசீது வெற்றிகரமாக நீக்கப்பட்டது',
      });
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to delete receipt' : 'ரசீதை நீக்குவதில் தோல்வி',
        variant: 'destructive',
      });
    }
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCustomerName(receipt.customer_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          {language === 'english' ? 'Loading receipts...' : 'ரசீதுகளை ஏற்றுகிறது...'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'english' ? 'All Receipts' : 'அனைத்து ரசீதுகள்'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'english' ? 'Search by receipt no, customer or payment method...' : 'ரசீது எண், வாடிக்கையாளர் அல்லது கட்டண முறையால் தேடுங்கள்...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Receipts Table or Empty State */}
          {filteredReceipts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {searchTerm
                ? (language === 'english' ? 'No receipts found matching your search.' : 'உங்கள் தேடலுக்கு பொருந்தும் ரசீதுகள் எதுவும் இல்லை.')
                : (language === 'english' ? 'No receipts created yet.' : 'இன்னும் ரசீதுகள் எதுவும் உருவாக்கப்படவில்லை.')
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {language === 'english' ? 'Receipt No' : 'ரசீது எண்'}
                    </TableHead>
                    <TableHead>
                      {language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}
                    </TableHead>
                    <TableHead>
                      {language === 'english' ? 'Amount' : 'தொகை'}
                    </TableHead>
                    <TableHead>
                      {language === 'english' ? 'Payment Method' : 'கட்டண முறை'}
                    </TableHead>
                    <TableHead>
                      {language === 'english' ? 'Date' : 'தேதி'}
                    </TableHead>
                    <TableHead>
                      {language === 'english' ? 'Remarks' : 'குறிப்புகள்'}
                    </TableHead>
                    <TableHead>
                      {language === 'english' ? 'Action' : 'செயல்'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map(receipt => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-semibold">
                        {receipt.receipt_no}
                      </TableCell>
                      <TableCell>
                        {getCustomerName(receipt.customer_id)}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        ₹{receipt.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {language === 'english' && receipt.payment_method === 'cash' ? 'Cash' : ''}
                          {language === 'english' && receipt.payment_method === 'cheque' ? 'Cheque' : ''}
                          {language === 'english' && receipt.payment_method === 'bank_transfer' ? 'Bank Transfer' : ''}
                          {language === 'english' && receipt.payment_method === 'upi' ? 'UPI' : ''}
                          {language === 'english' && receipt.payment_method === 'card' ? 'Card' : ''}
                          {language === 'english' && receipt.payment_method === 'online' ? 'Online' : ''}

                          {language === 'tamil' && receipt.payment_method === 'cash' ? 'பணம்' : ''}
                          {language === 'tamil' && receipt.payment_method === 'cheque' ? 'காசோலை' : ''}
                          {language === 'tamil' && receipt.payment_method === 'bank_transfer' ? 'வங்கி பரிமாற்றம்' : ''}
                          {language === 'tamil' && receipt.payment_method === 'upi' ? 'UPI' : ''}
                          {language === 'tamil' && receipt.payment_method === 'card' ? 'கார்டு' : ''}
                          {language === 'tamil' && receipt.payment_method === 'online' ? 'ஆன்லைன்' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(receipt.receipt_date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {receipt.remarks ? receipt.remarks.substring(0, 30) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteReceipt(receipt.id, receipt.receipt_no)}
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          {language === 'english' ? 'Delete' : 'நீக்கு'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptsList;
