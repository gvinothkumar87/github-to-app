import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sale, OutwardEntry, Customer, Item } from '@/types';
import { Edit, FileText, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BillsListProps {
  onEditSale: (sale: Sale, outwardEntry: OutwardEntry, customer: Customer, item: Item) => void;
  onPrintSale: (sale: Sale, outwardEntry: OutwardEntry, customer: Customer, item: Item) => void;
}

export const BillsList = ({ onEditSale, onPrintSale }: BillsListProps) => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { language, getDisplayName } = useLanguage();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data: salesData, error } = await supabase
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

      if (error) throw error;

      setSales(salesData || []);
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to fetch sales' : 'விற்பனைகளை பெறுவதில் தோல்வி',
        variant: 'destructive',
      });
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => 
    (sale.bill_serial_no && sale.bill_serial_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sale.customers && getDisplayName(sale.customers).toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sale.items && getDisplayName(sale.items).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (sale: any) => {
    onEditSale(sale, sale.outward_entries, sale.customers, sale.items);
  };

  const handlePrint = (sale: any) => {
    onPrintSale(sale, sale.outward_entries, sale.customers, sale.items);
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
          {language === 'english' ? 'All Bills' : 'அனைத்து பில்கள்'}
        </CardTitle>
        <CardDescription>
          {language === 'english' 
            ? 'View, edit, and reprint bills'
            : 'பில்களை பார்வையிடவும், திருத்தவும், மீண்டும் அச்சிடவும்'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'english' ? 'Search by bill number, customer, or item...' : 'பில் எண், வாடிக்கையாளர் அல்லது பொருளால் தேடுங்கள்...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm 
              ? (language === 'english' ? 'No bills found matching your search.' : 'உங்கள் தேடலுக்கு பொருந்தும் பில்கள் எதுவும் இல்லை.')
              : (language === 'english' ? 'No bills created yet.' : 'இன்னும் பில்கள் எதுவும் உருவாக்கப்படவில்லை.')
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'english' ? 'Bill No' : 'பில் எண்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                  <TableHead>{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Quantity' : 'அளவு'}</TableHead>
                  <TableHead>{language === 'english' ? 'Rate' : 'விலை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Total' : 'மொத்தம்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Actions' : 'செயல்கள்'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.bill_serial_no}</TableCell>
                    <TableCell>{new Date(sale.sale_date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{getDisplayName(sale.customers)}</TableCell>
                    <TableCell>{getDisplayName(sale.items)}</TableCell>
                    <TableCell>{sale.quantity} {sale.items?.unit}</TableCell>
                    <TableCell>₹{sale.rate.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">₹{sale.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(sale)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          {language === 'english' ? 'Edit' : 'திருத்து'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePrint(sale)}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          {language === 'english' ? 'Print' : 'அச்சிடு'}
                        </Button>
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