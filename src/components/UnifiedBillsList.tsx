import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sale, OutwardEntry, Customer, Item, DebitNote, CreditNote } from '@/types';
import { Edit, FileText, Search, Trash2, Image } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type BillType = 'all' | 'sales' | 'debit_notes' | 'credit_notes' | 'outward_entries';

interface UnifiedBill {
  id: string;
  type: 'sale' | 'debit_note' | 'credit_note' | 'outward_entry';
  bill_no: string;
  date: string;
  entry_date?: string;
  customer_name: string;
  item_name?: string;
  amount: number;
  data: Sale | DebitNote | CreditNote | OutwardEntry;
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

  // Helper function to extract Google Drive file ID and create direct view URL
  const getGoogleDriveViewUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    
    // Extract file ID from various Google Drive URL formats
    const patterns = [
      /\/file\/d\/([^\/]+)/,
      /id=([^&]+)/,
      /\/d\/([^\/]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        // Use direct view URL format that bypasses Google Drive's security headers
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }
    
    return url; // Fallback to original URL if no pattern matches
  };

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
            id, serial_no, lorry_no, driver_mobile, loading_place, empty_weight, load_weight, net_weight, entry_date, remarks, weighment_photo_url, load_weight_photo_url
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

      // Fetch all outward entries (including those without sales)
      const { data: outwardEntriesData, error: outwardEntriesError } = await supabase
        .from('outward_entries')
        .select(`
          *,
          customers (id, name_english, name_tamil, code, contact_person, phone, email, address_english, address_tamil, gstin, pin_code, state_code, place_of_supply),
          items (id, name_english, name_tamil, code, unit, gst_percentage, hsn_no)
        `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;
      if (debitNotesError) throw debitNotesError;
      if (creditNotesError) throw creditNotesError;
      if (outwardEntriesError) throw outwardEntriesError;

      // Get IDs of outward entries that have sales bills
      const salesOutwardEntryIds = new Set(
        (salesData || []).map((sale: any) => sale.outward_entry_id).filter(Boolean)
      );

      // Group sales by bill_serial_no for multi-product bills
      const groupedSales: any[] = [];
      const billMap = new Map();

      (salesData || []).forEach((sale: any) => {
        if (!sale.bill_serial_no) {
          groupedSales.push(sale);
          return;
        }

        if (!billMap.has(sale.bill_serial_no)) {
          // First sale with this bill_serial_no
          billMap.set(sale.bill_serial_no, {
            ...sale,
            _allSales: [sale], // Store all sales with same bill number
            _isGrouped: true
          });
        } else {
          // Additional sale with same bill_serial_no - add to group
          const existingBill = billMap.get(sale.bill_serial_no);
          existingBill._allSales.push(sale);
          // Update totals
          existingBill.total_amount += sale.total_amount;
        }
      });

      // Add grouped bills to the list
      billMap.forEach(bill => groupedSales.push(bill));

      // Transform data into unified format
      const unifiedBills: UnifiedBill[] = [
        ...groupedSales.map((sale: any) => ({
          id: sale.id,
          type: 'sale' as const,
          bill_no: sale.bill_serial_no || 'N/A',
          date: sale.sale_date,
          entry_date: sale.outward_entries?.entry_date,
          customer_name: getDisplayName(sale.customers),
          item_name: sale._isGrouped && sale._allSales?.length > 1 
            ? `${sale._allSales.length} ${language === 'english' ? 'items' : 'பொருட்கள்'}`
            : getDisplayName(sale.items),
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
        })),
        ...(outwardEntriesData || [])
          .filter((entry: any) => !salesOutwardEntryIds.has(entry.id))
          .map((entry: any) => ({
            id: entry.id,
            type: 'outward_entry' as const,
            bill_no: `Entry #${entry.serial_no}`,
            date: entry.entry_date,
            entry_date: entry.entry_date,
            customer_name: getDisplayName(entry.customers),
            item_name: getDisplayName(entry.items),
            amount: entry.net_weight || 0,
            data: entry,
            customer: entry.customers,
            item: entry.items,
            outward_entry: entry
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
      let deletedCount = 0;

      if (bill.type === 'sale') {
        const saleData = bill.data as any;
        const grouped = saleData._isGrouped && saleData._allSales?.length > 1;
        const saleIds = grouped ? saleData._allSales.map((s: any) => s.id) : [bill.id];

        // 1) Delete related customer_ledger rows FIRST (required by DB trigger)
        const { error: ledgerErr } = await supabase
          .from('customer_ledger')
          .delete()
          .in('reference_id', saleIds)
          .eq('transaction_type', 'sale')
          .select('id');
        if (ledgerErr) throw ledgerErr;

        // 2) Then delete sale rows
        if (grouped) {
          const { data: deleted, error: saleDelErr } = await supabase
            .from('sales')
            .delete()
            .eq('bill_serial_no', saleData.bill_serial_no)
            .select('id');
          if (saleDelErr) throw saleDelErr;
          deletedCount += deleted?.length || 0;
        } else {
          const { data: deleted, error: saleDelErr } = await supabase
            .from('sales')
            .delete()
            .eq('id', bill.id)
            .select('id');
          if (saleDelErr) throw saleDelErr;
          deletedCount += deleted?.length || 0;
        }
      } else if (bill.type === 'credit_note') {
        // 1) Delete ledger first
        const { error: ledgerErr } = await supabase
          .from('customer_ledger')
          .delete()
          .eq('reference_id', bill.id)
          .eq('transaction_type', 'credit_note')
          .select('id');
        if (ledgerErr) throw ledgerErr;

        // 2) Delete credit note
        const { data: deleted, error: delErr } = await supabase
          .from('credit_notes')
          .delete()
          .eq('id', bill.id)
          .select('id');
        if (delErr) throw delErr;
        deletedCount += deleted?.length || 0;
      } else if (bill.type === 'debit_note') {
        // 1) Delete ledger first
        const { error: ledgerErr } = await supabase
          .from('customer_ledger')
          .delete()
          .eq('reference_id', bill.id)
          .eq('transaction_type', 'debit_note')
          .select('id');
        if (ledgerErr) throw ledgerErr;

        // 2) Delete debit note
        const { data: deleted, error: delErr } = await supabase
          .from('debit_notes')
          .delete()
          .eq('id', bill.id)
          .select('id');
        if (delErr) throw delErr;
        deletedCount += deleted?.length || 0;
      } else if (bill.type === 'outward_entry') {
        const { data: deleted, error: deleteError } = await supabase
          .from('outward_entries')
          .delete()
          .eq('id', bill.id)
          .select('id');
        if (deleteError) throw deleteError;
        deletedCount += deleted?.length || 0;
      }

      if (deletedCount === 0) {
        throw new Error(
          language === 'english'
            ? 'No rows deleted. You might not have permission.'
            : 'எந்த வரியும் நீக்கப்படவில்லை. உங்களுக்கு அனுமதி இருக்காமல் இருக்கலாம்.'
        );
      }

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Entry deleted successfully' : 'என்ட்ரி வெற்றிகரமாக நீக்கப்பட்டது',
      });

      fetchAllBills();
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || (language === 'english' ? 'Failed to delete entry' : 'என்ட்ரி நீக்குவதில் தோல்வி'),
        variant: 'destructive',
      });
      console.error('Error deleting entry:', error);
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.bill_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bill.item_name && bill.item_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = billTypeFilter === 'all' || 
                       (billTypeFilter === 'sales' && bill.type === 'sale') ||
                       (billTypeFilter === 'debit_notes' && bill.type === 'debit_note') ||
                       (billTypeFilter === 'credit_notes' && bill.type === 'credit_note') ||
                       (billTypeFilter === 'outward_entries' && bill.type === 'outward_entry');
    
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
      case 'outward_entry': return language === 'english' ? 'Outward Entry' : 'அவுட்வர்ட் என்ட்ரி';
      default: return type;
    }
  };

  const getBillTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'sale': return 'default';
      case 'debit_note': return 'destructive';
      case 'credit_note': return 'secondary';
      case 'outward_entry': return 'outline';
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
              <SelectItem value="all">{language === 'english' ? 'All Entries' : 'அனைத்து என்ட்ரிகள்'}</SelectItem>
              <SelectItem value="sales">{language === 'english' ? 'Sales Bills' : 'விற்பனை பில்கள்'}</SelectItem>
              <SelectItem value="debit_notes">{language === 'english' ? 'Debit Notes' : 'டெபிட் நோட்கள்'}</SelectItem>
              <SelectItem value="credit_notes">{language === 'english' ? 'Credit Notes' : 'கிரெடிட் நோட்கள்'}</SelectItem>
              <SelectItem value="outward_entries">{language === 'english' ? 'Outward Entries' : 'அவுட்வர்ட் என்ட்ரிகள்'}</SelectItem>
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
                  <TableHead>{language === 'english' ? 'Entry/Bill No' : 'என்ட்ரி/பில் எண்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Entry Date' : 'என்ட்ரி தேதி'}</TableHead>
                  <TableHead>{language === 'english' ? 'Bill Date' : 'பில் தேதி'}</TableHead>
                  <TableHead>{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Amount/Weight' : 'தொகை/எடை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Images' : 'படங்கள்'}</TableHead>
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
                      {bill.entry_date ? new Date(bill.entry_date).toLocaleDateString('en-IN') : '-'}
                    </TableCell>
                    <TableCell>
                      {bill.type === 'outward_entry' ? '-' : new Date(bill.date).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>{bill.customer_name}</TableCell>
                    <TableCell>{bill.item_name || '-'}</TableCell>
                    <TableCell className="font-semibold">
                      {bill.type === 'outward_entry' 
                        ? `${bill.amount.toFixed(2)} KG` 
                        : `₹${bill.amount.toFixed(2)}`
                      }
                    </TableCell>
                     <TableCell>
                      {(bill.type === 'sale' || bill.type === 'outward_entry') && bill.outward_entry && (
                        <div className="flex gap-2">
                          {bill.outward_entry.weighment_photo_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const viewUrl = getGoogleDriveViewUrl(bill.outward_entry!.weighment_photo_url);
                                if (viewUrl) window.open(viewUrl, '_blank');
                              }}
                              className="flex items-center gap-1"
                            >
                              <Image className="h-3 w-3" />
                              {language === 'english' ? 'Entry' : 'என்ட்ரி'}
                            </Button>
                          )}
                          {bill.outward_entry.load_weight_photo_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const viewUrl = getGoogleDriveViewUrl(bill.outward_entry!.load_weight_photo_url);
                                if (viewUrl) window.open(viewUrl, '_blank');
                              }}
                              className="flex items-center gap-1"
                            >
                              <Image className="h-3 w-3" />
                              {language === 'english' ? 'Load' : 'லோட்'}
                            </Button>
                          )}
                          {!bill.outward_entry.weighment_photo_url && !bill.outward_entry.load_weight_photo_url && '-'}
                        </div>
                      )}
                      {bill.type !== 'sale' && bill.type !== 'outward_entry' && '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {bill.type !== 'outward_entry' && (
                          <>
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
                          </>
                        )}
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