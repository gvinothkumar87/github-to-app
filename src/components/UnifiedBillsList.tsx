import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sale, OutwardEntry, Customer, Item, DebitNote, CreditNote } from '@/types';
import { Edit, FileText, Search, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type BillType = 'all' | 'sales' | 'debit_notes' | 'credit_notes';

interface UnifiedBill {
  id: string;
  type: 'sale' | 'debit_note' | 'credit_note';
  bill_no: string;
  date: string;
  entry_date?: string;
  customer_name: string;
  amount: number;
  data: Sale | DebitNote | CreditNote;
  customer: Customer;
  item?: Item;
  outward_entry?: OutwardEntry;
}

interface UnifiedBillsListProps {
  onEditSale: (sale: Sale, outwardEntry: OutwardEntry, customer: Customer, item: Item) => void;
  onPrintSale: (sale: Sale, outwardEntry: OutwardEntry, customer: Customer, item: Item) => void;
  onEditDebitNote: (debitNote: DebitNote, customer: Customer) => void;
  onPrintDebitNote: (debitNote: DebitNote, customer: Customer) => void;
  onEditCreditNote: (creditNote: CreditNote, customer: Customer) => void;
  onPrintCreditNote: (creditNote: CreditNote, customer: Customer) => void;
}

export const UnifiedBillsList = ({ 
  onEditSale, 
  onPrintSale, 
  onEditDebitNote, 
  onPrintDebitNote, 
  onEditCreditNote, 
  onPrintCreditNote 
}: UnifiedBillsListProps) => {
  const [bills, setBills] = useState<UnifiedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [billTypeFilter, setBillTypeFilter] = useState<BillType>('all');
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();

  useEffect(() => {
    fetchAllBills();
  }, []);

  const fetchAllBills = async () => {
    try {
      setLoading(true);
      
      // Fetch sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          customers (id, name_english, name_tamil, code, contact_person, phone, email, address_english, address_tamil, gstin, pin_code, state_code, place_of_supply),
          items (id, name_english, name_tamil, code, unit, gst_percentage, hsn_no),
          outward_entries!sales_outward_entry_id_fkey (
            id, serial_no, lorry_no, driver_mobile, loading_place, empty_weight, load_weight, net_weight, entry_date, remarks
          )
        `)
        .order('created_at', { ascending: false });

      // Fetch debit notes
      const { data: debitNotesData, error: debitNotesError } = await supabase
        .from('debit_notes')
        .select(`
          *,
          customers (id, name_english, name_tamil, code, contact_person, phone, email, address_english, address_tamil, gstin, pin_code, state_code, place_of_supply)
        `)
        .order('created_at', { ascending: false });

      // Fetch credit notes
      const { data: creditNotesData, error: creditNotesError } = await supabase
        .from('credit_notes')
        .select(`
          *,
          customers (id, name_english, name_tamil, code, contact_person, phone, email, address_english, address_tamil, gstin, pin_code, state_code, place_of_supply)
        `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;
      if (debitNotesError) throw debitNotesError;
      if (creditNotesError) throw creditNotesError;

      // Transform data into unified format
      const unifiedBills: UnifiedBill[] = [
        ...(salesData || []).map((sale: any) => ({
          id: sale.id,
          type: 'sale' as const,
          bill_no: sale.bill_serial_no || 'N/A',
          date: sale.sale_date,
          entry_date: sale.outward_entries?.entry_date,
          customer_name: getDisplayName(sale.customers),
          amount: sale.total_amount,
          data: sale,
          customer: sale.customers,
          item: sale.items,
          outward_entry: sale.outward_entries
        })),
        ...(debitNotesData || []).map((debitNote: any) => ({
          id: debitNote.id,
          type: 'debit_note' as const,
          bill_no: debitNote.note_no,
          date: debitNote.note_date,
          customer_name: getDisplayName(debitNote.customers),
          amount: debitNote.amount,
          data: debitNote,
          customer: debitNote.customers
        })),
        ...(creditNotesData || []).map((creditNote: any) => ({
          id: creditNote.id,
          type: 'credit_note' as const,
          bill_no: creditNote.note_no,
          date: creditNote.note_date,
          customer_name: getDisplayName(creditNote.customers),
          amount: creditNote.amount,
          data: creditNote,
          customer: creditNote.customers
        }))
      ];

      // Sort by date (newest first)
      unifiedBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setBills(unifiedBills);
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to fetch bills' : 'பில்களை பெறுவதில் தோல்வி',
        variant: 'destructive',
      });
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bill: UnifiedBill) => {
    try {
      let error;
      
      if (bill.type === 'sale') {
        const { error: deleteError } = await supabase
          .from('sales')
          .delete()
          .eq('id', bill.id);
        error = deleteError;
      } else if (bill.type === 'debit_note') {
        const { error: deleteError } = await supabase
          .from('debit_notes')
          .delete()
          .eq('id', bill.id);
        error = deleteError;
      } else if (bill.type === 'credit_note') {
        const { error: deleteError } = await supabase
          .from('credit_notes')
          .delete()
          .eq('id', bill.id);
        error = deleteError;
      }

      if (error) throw error;

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Bill deleted successfully' : 'பில் வெற்றிகரமாக நீக்கப்பட்டது',
      });

      // Refresh the list
      fetchAllBills();
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to delete bill' : 'பில் நீக்குவதில் தோல்வி',
        variant: 'destructive',
      });
      console.error('Error deleting bill:', error);
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.bill_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = billTypeFilter === 'all' || 
                       (billTypeFilter === 'sales' && bill.type === 'sale') ||
                       (billTypeFilter === 'debit_notes' && bill.type === 'debit_note') ||
                       (billTypeFilter === 'credit_notes' && bill.type === 'credit_note');
    
    return matchesSearch && matchesType;
  });

  const handleEdit = (bill: UnifiedBill) => {
    if (bill.type === 'sale') {
      onEditSale(bill.data as Sale, bill.outward_entry!, bill.customer, bill.item!);
    } else if (bill.type === 'debit_note') {
      onEditDebitNote(bill.data as DebitNote, bill.customer);
    } else if (bill.type === 'credit_note') {
      onEditCreditNote(bill.data as CreditNote, bill.customer);
    }
  };

  const handlePrint = (bill: UnifiedBill) => {
    if (bill.type === 'sale') {
      onPrintSale(bill.data as Sale, bill.outward_entry!, bill.customer, bill.item!);
    } else if (bill.type === 'debit_note') {
      onPrintDebitNote(bill.data as DebitNote, bill.customer);
    } else if (bill.type === 'credit_note') {
      onPrintCreditNote(bill.data as CreditNote, bill.customer);
    }
  };

  const getBillTypeLabel = (type: string) => {
    switch (type) {
      case 'sale': return language === 'english' ? 'Sales Bill' : 'விற்பனை பில்';
      case 'debit_note': return language === 'english' ? 'Debit Note' : 'டெபிட் நோட்';
      case 'credit_note': return language === 'english' ? 'Credit Note' : 'கிரெடிட் நோட்';
      default: return type;
    }
  };

  const getBillTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'sale': return 'default';
      case 'debit_note': return 'destructive';
      case 'credit_note': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            {language === 'english' ? 'Loading bills...' : 'பில்களை ஏற்றுகிறது...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {language === 'english' ? 'All Bills Management' : 'அனைத்து பில் மேலாண்மை'}
        </CardTitle>
        <CardDescription>
          {language === 'english' 
            ? 'View, edit, and manage sales bills, debit notes, and credit notes'
            : 'விற்பனை பில்கள், டெபிட் நோட்கள் மற்றும் கிரெடிட் நோட்களை பார்வையிடவும், திருத்தவும், நிர்வகிக்கவும்'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'english' ? 'Search by bill number or customer...' : 'பில் எண் அல்லது வாடிக்கையாளர் மூலம் தேடுங்கள்...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={billTypeFilter} onValueChange={(value) => setBillTypeFilter(value as BillType)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'english' ? 'All Bills' : 'அனைத்து பில்கள்'}</SelectItem>
              <SelectItem value="sales">{language === 'english' ? 'Sales Bills' : 'விற்பனை பில்கள்'}</SelectItem>
              <SelectItem value="debit_notes">{language === 'english' ? 'Debit Notes' : 'டெபிட் நோட்கள்'}</SelectItem>
              <SelectItem value="credit_notes">{language === 'english' ? 'Credit Notes' : 'கிரெடிட் நோட்கள்'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredBills.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || billTypeFilter !== 'all'
              ? (language === 'english' ? 'No bills found matching your criteria.' : 'உங்கள் தேடல் நிபந்தனைகளுக்கு பொருந்தும் பில்கள் எதுவும் இல்லை.')
              : (language === 'english' ? 'No bills created yet.' : 'இன்னும் பில்கள் எதுவும் உருவாக்கப்படவில்லை.')
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'english' ? 'Type' : 'வகை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Bill No' : 'பில் எண்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Entry Date' : 'என்ட்ரி தேதி'}</TableHead>
                  <TableHead>{language === 'english' ? 'Bill Date' : 'பில் தேதி'}</TableHead>
                  <TableHead>{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Amount' : 'தொகை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Actions' : 'செயல்கள்'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={`${bill.type}-${bill.id}`}>
                    <TableCell>
                      <Badge variant={getBillTypeBadgeVariant(bill.type) as any}>
                        {getBillTypeLabel(bill.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{bill.bill_no}</TableCell>
                    <TableCell>
                      {bill.entry_date ? new Date(bill.entry_date).toLocaleDateString('en-IN') : (bill.type === 'sale' ? 'N/A' : '-')}
                    </TableCell>
                    <TableCell>{new Date(bill.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{bill.customer_name}</TableCell>
                    <TableCell className="font-semibold">₹{bill.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(bill)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          {language === 'english' ? 'Edit' : 'திருத்து'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePrint(bill)}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          {language === 'english' ? 'Print' : 'அச்சிடு'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              {language === 'english' ? 'Delete' : 'நீக்கு'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {language === 'english' ? 'Confirm Deletion' : 'நீக்குதலை உறுதிப்படுத்தவும்'}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === 'english' 
                                  ? `Are you sure you want to delete ${getBillTypeLabel(bill.type)} ${bill.bill_no}? This action cannot be undone.`
                                  : `நீங்கள் ${getBillTypeLabel(bill.type)} ${bill.bill_no} ஐ நீக்க விரும்புகிறீர்களா? இந்த செயலை மாற்ற முடியாது.`
                                }
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {language === 'english' ? 'Cancel' : 'ரத்து'}
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(bill)}>
                                {language === 'english' ? 'Delete' : 'நீக்கு'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};