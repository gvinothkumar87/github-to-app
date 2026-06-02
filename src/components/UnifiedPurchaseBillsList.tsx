import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Purchase, InwardEntry, Supplier, Item } from '@/types';
import { Edit, FileText, Search, Trash2, Image } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type BillType = 'all' | 'purchases' | 'inward_entries';

interface UnifiedPurchaseBill {
  id: string;
  type: 'purchase' | 'inward_entry';
  bill_no: string;
  date: string;
  entry_date?: string;
  supplier_name: string;
  item_name?: string;
  amount: number;
  data: Purchase | InwardEntry;
  supplier: Supplier;
  item?: Item;
  inward_entry?: InwardEntry;
}

interface UnifiedPurchaseBillsListProps {
  onEditPurchase: (purchase: Purchase, inwardEntry: InwardEntry | null, supplier: Supplier, item: Item) => void;
  onPrintPurchase: (purchase: Purchase, inwardEntry: InwardEntry | null, supplier: Supplier, item: Item) => void;
  onEditInwardEntry: (inwardEntry: InwardEntry, supplier: Supplier, item: Item) => void;
}

export const UnifiedPurchaseBillsList = ({
  onEditPurchase,
  onPrintPurchase,
  onEditInwardEntry
}: UnifiedPurchaseBillsListProps) => {
  const [bills, setBills] = useState<UnifiedPurchaseBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [billTypeFilter, setBillTypeFilter] = useState<BillType>('all');
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();

  const getGoogleDriveViewUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const patterns = [
      /\/file\/d\/([^\/]+)/,
      /id=([^&]+)/,
      /\/d\/([^\/]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/view`;
      }
    }
    return url;
  };

  useEffect(() => {
    fetchAllBills();
  }, []);

  const fetchAllBills = async () => {
    try {
      setLoading(true);

      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (*),
          items (id, name_english, name_tamil, code, unit, gst_percentage, hsn_no),
          inward_entries!purchases_inward_entry_id_fkey (
            id, serial_no, lorry_no, driver_mobile, loading_place, empty_weight, full_weight, net_weight, entry_date, remarks, weighment_photo_url, empty_weight_photo_url
          )
        `)
        .order('created_at', { ascending: false });

      const { data: inwardEntriesData, error: inwardEntriesError } = await supabase
        .from('inward_entries')
        .select(`
          *,
          suppliers (*),
          items (id, name_english, name_tamil, code, unit, gst_percentage, hsn_no)
        `)
        .order('created_at', { ascending: false });

      if (purchasesError) throw purchasesError;
      if (inwardEntriesError) throw inwardEntriesError;

      const purchaseInwardEntryIds = new Set(
        (purchasesData || []).map((p: any) => p.inward_entry_id).filter(Boolean)
      );

      const unifiedBills: UnifiedPurchaseBill[] = [
        ...(purchasesData || []).map((purchase: any) => ({
          id: purchase.id,
          type: 'purchase' as const,
          bill_no: purchase.bill_serial_no || 'N/A',
          date: purchase.purchase_date,
          entry_date: purchase.inward_entries?.entry_date,
          supplier_name: getDisplayName(purchase.suppliers),
          item_name: getDisplayName(purchase.items),
          amount: purchase.total_amount,
          data: purchase,
          supplier: purchase.suppliers,
          item: purchase.items,
          inward_entry: purchase.inward_entries
        })),
        ...(inwardEntriesData || [])
          .filter((entry: any) => !purchaseInwardEntryIds.has(entry.id))
          .map((entry: any) => ({
            id: entry.id,
            type: 'inward_entry' as const,
            bill_no: `Entry #${entry.serial_no}`,
            date: entry.entry_date,
            entry_date: entry.entry_date,
            supplier_name: getDisplayName(entry.suppliers),
            item_name: getDisplayName(entry.items),
            amount: entry.net_weight || entry.full_weight || 0,
            data: entry,
            supplier: entry.suppliers,
            item: entry.items,
            inward_entry: entry
          }))
      ];

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

  const handleDelete = async (bill: UnifiedPurchaseBill) => {
    try {
      if (bill.type === 'purchase') {
        const { error } = await supabase
          .from('purchases')
          .delete()
          .eq('id', bill.id);
        if (error) throw error;
      } else if (bill.type === 'inward_entry') {
        const { error } = await supabase
          .from('inward_entries')
          .delete()
          .eq('id', bill.id);
        if (error) throw error;
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
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.bill_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.item_name && bill.item_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = billTypeFilter === 'all' ||
      (billTypeFilter === 'purchases' && bill.type === 'purchase') ||
      (billTypeFilter === 'inward_entries' && bill.type === 'inward_entry');

    return matchesSearch && matchesType;
  });

  const handleEdit = (bill: UnifiedPurchaseBill) => {
    if (bill.type === 'purchase') {
      onEditPurchase(bill.data as Purchase, bill.inward_entry || null, bill.supplier, bill.item!);
    } else if (bill.type === 'inward_entry') {
      onEditInwardEntry(bill.data as InwardEntry, bill.supplier, bill.item!);
    }
  };

  const handlePrint = (bill: UnifiedPurchaseBill) => {
    if (bill.type === 'purchase') {
      onPrintPurchase(bill.data as Purchase, bill.inward_entry || null, bill.supplier, bill.item!);
    }
  };

  const getBillTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase': return language === 'english' ? 'Purchase Bill' : 'கொள்முதல் பில்';
      case 'inward_entry': return language === 'english' ? 'Inward Entry' : 'உள்வரும் பதிவு';
      default: return type;
    }
  };

  const getBillTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'purchase': return 'default';
      case 'inward_entry': return 'outline';
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
          {language === 'english' ? 'Purchase Bills Management' : 'கொள்முதல் பில் மேலாண்மை'}
        </CardTitle>
        <CardDescription>
          {language === 'english'
            ? 'View, edit, and manage purchase bills and inward entries'
            : 'கொள்முதல் பில்கள் மற்றும் உள்வரும் பதிவுகளை பார்வையிடவும், திருத்தவும், நிர்வகிக்கவும்'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'english' ? 'Search by bill number or supplier...' : 'பில் எண் அல்லது சப்ளையர் மூலம் தேடுங்கள்...'}
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
              <SelectItem value="purchases">{language === 'english' ? 'Purchase Bills' : 'கொள்முதல் பில்கள்'}</SelectItem>
              <SelectItem value="inward_entries">{language === 'english' ? 'Inward Entries' : 'உள்வரும் பதிவுகள்'}</SelectItem>
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
                  <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                  <TableHead>{language === 'english' ? 'Supplier' : 'சப்ளையர்'}</TableHead>
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
                      {new Date(bill.date).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>{bill.supplier_name}</TableCell>
                    <TableCell>{bill.item_name || '-'}</TableCell>
                    <TableCell className="font-semibold">
                      {bill.type === 'inward_entry'
                        ? `${bill.amount.toFixed(2)} KG`
                        : `₹${bill.amount.toFixed(2)}`
                      }
                    </TableCell>
                    <TableCell>
                      {(bill.type === 'purchase' || bill.type === 'inward_entry') && bill.inward_entry && (
                        <div className="flex gap-2">
                          {bill.inward_entry.weighment_photo_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const viewUrl = getGoogleDriveViewUrl(bill.inward_entry!.weighment_photo_url);
                                if (viewUrl) window.open(viewUrl, '_blank');
                              }}
                              className="flex items-center gap-1"
                            >
                              <Image className="h-3 w-3" />
                              {language === 'english' ? 'Entry' : 'என்ட்ரி'}
                            </Button>
                          )}
                          {bill.inward_entry.empty_weight_photo_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const viewUrl = getGoogleDriveViewUrl(bill.inward_entry!.empty_weight_photo_url);
                                if (viewUrl) window.open(viewUrl, '_blank');
                              }}
                              className="flex items-center gap-1"
                            >
                              <Image className="h-3 w-3" />
                              {language === 'english' ? 'Empty' : 'காலி'}
                            </Button>
                          )}
                          {!bill.inward_entry.weighment_photo_url && !bill.inward_entry.empty_weight_photo_url && '-'}
                        </div>
                      )}
                      {!bill.inward_entry && '-'}
                    </TableCell>
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
                        {bill.type === 'purchase' && (
                          <Button
                            size="sm"
                            onClick={() => handlePrint(bill)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            {language === 'english' ? 'Print' : 'அச்சிடு'}
                          </Button>
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
