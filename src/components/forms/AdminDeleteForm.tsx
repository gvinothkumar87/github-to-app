import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OutwardEntry, Customer, Item, Sale } from '@/types';
import { Trash2, AlertTriangle, Package, Truck, Receipt, Eye, Loader2, Edit, ExternalLink } from 'lucide-react';
import { EditSaleForm } from './EditSaleForm';
import { EditOutwardEntryForm } from './EditOutwardEntryForm';
import { format } from 'date-fns';

interface AdminDeleteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ExtendedOutwardEntry extends OutwardEntry {
  sales?: Sale[];
}

export const AdminDeleteForm: React.FC<AdminDeleteFormProps> = ({ onSuccess, onCancel }) => {
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  
  const [entries, setEntries] = useState<ExtendedOutwardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<ExtendedOutwardEntry | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      // Fetch outward entries with related data
      const { data: entriesData, error: entriesError } = await supabase
        .from('outward_entries')
        .select(`
          *,
          customers!inner(id, name_english, name_tamil, code, is_active, created_at, updated_at, address_english, address_tamil, contact_person, phone, email, gstin, state_code, place_of_supply, pin_code),
          items!inner(id, name_english, name_tamil, code, unit, gst_percentage, is_active, created_at, updated_at, hsn_no, description_english, description_tamil, unit_weight)
        `)
        .order('entry_date', { ascending: false })
        .order('serial_no', { ascending: false })
        .limit(50);

      if (entriesError) throw entriesError;

      // Fetch sales data for each entry
      const entriesWithSales = await Promise.all(
        (entriesData || []).map(async (entry) => {
          const { data: salesData } = await supabase
            .from('sales')
            .select('*')
            .eq('outward_entry_id', entry.id);

          return {
            ...entry,
            sales: salesData || []
          };
        })
      );

      setEntries(entriesWithSales as ExtendedOutwardEntry[]);
    } catch (error: any) {
      console.error('Error fetching entries:', error);
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getEntryStatus = (entry: ExtendedOutwardEntry) => {
    if (entry.sales && entry.sales.length > 0) {
      return { 
        status: 'billed', 
        label: language === 'english' ? 'Billed' : 'பில் போடப்பட்டது',
        color: 'bg-green-500'
      };
    } else if (entry.is_completed && entry.load_weight) {
      return { 
        status: 'completed', 
        label: language === 'english' ? 'Load Weight Added' : 'லோட் எடை சேர்க்கப்பட்டது',
        color: 'bg-blue-500'
      };
    } else {
      return { 
        status: 'pending', 
        label: language === 'english' ? 'Pending Load Weight' : 'லோட் எடை நிலுவையில்',
        color: 'bg-yellow-500'
      };
    }
  };

  const handleDelete = async (entry: ExtendedOutwardEntry) => {
    setDeletingId(entry.id);
    try {
      // Delete customer ledger entries first
      if (entry.sales && entry.sales.length > 0) {
        const saleIds = entry.sales.map(s => s.id);
        
        const { error: ledgerError } = await supabase
          .from('customer_ledger')
          .delete()
          .in('reference_id', saleIds);

        if (ledgerError) throw new Error(`Error deleting ledger entries: ${ledgerError.message}`);

        // Delete sales
        const { error: salesError } = await supabase
          .from('sales')
          .delete()
          .eq('outward_entry_id', entry.id);

        if (salesError) throw new Error(`Error deleting sales: ${salesError.message}`);
      }

      // Delete credit notes related to sales
      if (entry.sales && entry.sales.length > 0) {
        const billNos = entry.sales.map(s => s.bill_serial_no).filter(Boolean);
        if (billNos.length > 0) {
          const { error: creditNotesError } = await supabase
            .from('credit_notes')
            .delete()
            .in('reference_bill_no', billNos);

          if (creditNotesError) throw new Error(`Error deleting credit notes: ${creditNotesError.message}`);
        }
      }

      // Delete debit notes related to sales
      if (entry.sales && entry.sales.length > 0) {
        const billNos = entry.sales.map(s => s.bill_serial_no).filter(Boolean);
        if (billNos.length > 0) {
          const { error: debitNotesError } = await supabase
            .from('debit_notes')
            .delete()
            .in('reference_bill_no', billNos);

          if (debitNotesError) throw new Error(`Error deleting debit notes: ${debitNotesError.message}`);
        }
      }

      // Delete the outward entry
      const { error: entryError } = await supabase
        .from('outward_entries')
        .delete()
        .eq('id', entry.id);

      if (entryError) throw new Error(`Error deleting outward entry: ${entryError.message}`);

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' 
          ? `Entry ${entry.serial_no} and all related records (including credit/debit notes) deleted successfully`
          : `என்ட்ரி ${entry.serial_no} மற்றும் அனைத்து தொடர்புடைய பதிவுகளும் (கிரெடிட்/டெபிட் நோட்கள் உட்பட) வெற்றிகரமாக நீக்கப்பட்டன`,
      });

      fetchEntries();
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">
              {language === 'english' ? 'Loading entries...' : 'என்ட்ரிகள் ஏற்றப்படுகின்றன...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show edit form if editing
  if (editingEntry) {
    // If entry has sales, show EditSaleForm
    if (editingEntry.sales && editingEntry.sales.length > 0) {
      return (
        <EditSaleForm
          sale={editingEntry.sales[0]}
          outwardEntry={editingEntry}
          customer={editingEntry.customers}
          item={editingEntry.items}
          onSuccess={() => {
            setEditingEntry(null);
            fetchEntries();
          }}
          onCancel={() => setEditingEntry(null)}
        />
      );
    } else {
      // If no sales, show EditOutwardEntryForm
      return (
        <EditOutwardEntryForm
          outwardEntry={editingEntry}
          customer={editingEntry.customers}
          item={editingEntry.items}
          onSuccess={() => {
            setEditingEntry(null);
            fetchEntries();
          }}
          onCancel={() => setEditingEntry(null)}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            {language === 'english' ? 'Admin Delete Entries' : 'நிர்வாக என்ட்ரிகள் நீக்கு'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {language === 'english' 
              ? 'Manage and delete outward entries with all related data. This action cannot be undone.'
              : 'அனைத்து தொடர்புடைய தரவுகளுடன் வெளிச்செல்லும் என்ட்ரிகளை நிர்வகிக்கவும் நீக்கவும். இந்த செயலை மாற்ற முடியாது.'
            }
          </p>
        </CardHeader>
      </Card>

      {/* Mobile view */}
      <div className="block md:hidden space-y-4">
        {entries.map((entry) => {
          const status = getEntryStatus(entry);
          return (
            <Card key={entry.id} className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">#{entry.serial_no}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(entry.entry_date), 'dd/MM/yyyy')}
                    </div>
                  </div>
                  <Badge className={`${status.color} text-white text-xs`}>
                    {status.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      {language === 'english' ? 'Customer:' : 'வாடிக்கையாளர்:'}
                    </span>
                    <p>{getDisplayName(entry.customers)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      {language === 'english' ? 'Item:' : 'பொருள்:'}
                    </span>
                    <p>{getDisplayName(entry.items)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      {language === 'english' ? 'Lorry:' : 'லாரி:'}
                    </span>
                    <p>{entry.lorry_no}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      {language === 'english' ? 'Driver:' : 'ஓட்டுநர்:'}
                    </span>
                    <p>{entry.driver_mobile}</p>
                  </div>
                </div>

                {/* Weight Details */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      {language === 'english' ? 'Empty' : 'காலி'}
                    </div>
                    <div className="font-medium">{entry.empty_weight} kg</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      {language === 'english' ? 'Load' : 'லோட்'}
                    </div>
                    <div className="font-medium">{entry.load_weight || '-'} kg</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      {language === 'english' ? 'Net' : 'நிகர'}
                    </div>
                    <div className="font-medium">
                      {entry.load_weight ? (entry.load_weight - entry.empty_weight) : '-'} kg
                    </div>
                  </div>
                </div>

                {/* Bill Details */}
                {entry.sales && entry.sales.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-1">
                      {language === 'english' ? 'Bill Details:' : 'பில் விவரங்கள்:'}
                    </div>
                    {entry.sales.map((sale, index) => (
                      <div key={sale.id} className="text-sm">
                        <span className="font-medium">{sale.bill_serial_no}</span>
                        <span className="text-muted-foreground"> - ₹{sale.total_amount}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Links */}
                {entry.weighment_photo_url && (
                  <div className="pt-2 border-t">
                    <a 
                      href={entry.weighment_photo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {language === 'english' ? 'Empty Weight Image' : 'வெற்று எடை படம்'}
                    </a>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingEntry(entry)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {language === 'english' ? 'Edit' : 'திருத்து'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        disabled={deletingId === entry.id}
                      >
                        {deletingId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          {language === 'english' ? 'Confirm Deletion' : 'நீக்குதலை உறுதிப்படுத்தவும்'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {language === 'english' 
                            ? `Are you sure you want to delete entry #${entry.serial_no}? This will also delete all related sales, ledger entries, credit notes, and debit notes.`
                            : `என்ட்ரி #${entry.serial_no} ஐ நீக்க நீங்கள் உறுதியாக இருக்கிறீர்களா? இது அனைத்து தொடர்புடைய விற்பனை, லெட்ஜர் பதிவுகள், கிரெடிட் நோட்கள் மற்றும் டெபிட் நோட்களையும் நீக்கும்.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {language === 'english' ? 'Cancel' : 'ரத்து'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(entry)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {language === 'english' ? 'Delete' : 'நீக்கு'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Desktop table view */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'english' ? 'S.No' : 'வ.எண்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                  <TableHead>{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Lorry' : 'லாரி'}</TableHead>
                  <TableHead>{language === 'english' ? 'Driver' : 'ஓட்டுநர்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Empty Wt' : 'காலி எடை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Load Wt' : 'லோட் எடை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Net Wt' : 'நிகர எடை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Bill Details' : 'பில் விவரங்கள்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Images' : 'படங்கள்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Status' : 'நிலை'}</TableHead>
                  <TableHead className="text-center">{language === 'english' ? 'Actions' : 'செயல்கள்'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const status = getEntryStatus(entry);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">#{entry.serial_no}</TableCell>
                      <TableCell>{format(new Date(entry.entry_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{getDisplayName(entry.customers)}</TableCell>
                      <TableCell>{getDisplayName(entry.items)}</TableCell>
                      <TableCell className="font-mono">{entry.lorry_no}</TableCell>
                      <TableCell className="font-mono">{entry.driver_mobile}</TableCell>
                      <TableCell>{entry.empty_weight} kg</TableCell>
                      <TableCell>{entry.load_weight ? `${entry.load_weight} kg` : '-'}</TableCell>
                      <TableCell className="font-medium">
                        {entry.load_weight ? `${entry.load_weight - entry.empty_weight} kg` : '-'}
                      </TableCell>
                      <TableCell>
                        {entry.sales && entry.sales.length > 0 ? (
                          <div className="space-y-1">
                            {entry.sales.map((sale) => (
                              <div key={sale.id} className="text-sm">
                                <div className="font-medium">{sale.bill_serial_no}</div>
                                <div className="text-muted-foreground">₹{sale.total_amount}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          {entry.weighment_photo_url && (
                            <a 
                              href={entry.weighment_photo_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {language === 'english' ? 'Empty Wt' : 'காலி எடை'}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} text-white`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingEntry(entry)}
                            title={language === 'english' ? 'Edit entry' : 'பதிவை திருத்து'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={deletingId === entry.id}
                            >
                              {deletingId === entry.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                {language === 'english' ? 'Confirm Deletion' : 'நீக்குதலை உறுதிப்படுத்தவும்'}
                              </AlertDialogTitle>
                              <AlertDialogDescription className="space-y-2">
                                <p>
                                  {language === 'english' 
                                    ? `Are you sure you want to delete entry #${entry.serial_no}?`
                                    : `என்ட்ரி #${entry.serial_no} ஐ நீக்க நீங்கள் உறுதியாக இருக்கிறீர்களா?`}
                                </p>
                                <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                                  <p className="text-sm font-medium text-destructive">
                                    {language === 'english' ? 'This will also delete:' : 'இது பின்வருவனவற்றையும் நீக்கும்:'}
                                  </p>
                                   <ul className="text-sm mt-2 space-y-1">
                                     {entry.sales && entry.sales.length > 0 && (
                                       <>
                                         <li>• {entry.sales.length} {language === 'english' ? 'sales record(s)' : 'விற்பனை பதிவுகள்'}</li>
                                         <li>• {language === 'english' ? 'Customer ledger entries' : 'வாடிக்கையாளர் லெட்ஜர் பதிவுகள்'}</li>
                                         <li>• {language === 'english' ? 'Related credit notes' : 'தொடர்புடைய கிரெடிட் நோட்கள்'}</li>
                                         <li>• {language === 'english' ? 'Related debit notes' : 'தொடர்புடைய டெபிட் நோட்கள்'}</li>
                                       </>
                                     )}
                                     <li>• {language === 'english' ? 'All entry data permanently' : 'அனைத்து என்ட்ரி தரவும் நிரந்தரமாக'}</li>
                                   </ul>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {language === 'english' ? 'Cancel' : 'ரத்து'}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(entry)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {language === 'english' ? 'Delete Permanently' : 'நிரந்தரமாக நீக்கு'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {entries.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'english' ? 'No Entries Found' : 'பதிவுகள் எதுவும் கிடைக்கவில்லை'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'english' 
                ? 'There are no outward entries to display.' 
                : 'காண்பிக்க வெளிச்செல்லும் பதிவுகள் எதுவும் இல்லை.'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          {language === 'english' ? 'Close' : 'மூடு'}
        </Button>
      </div>
    </div>
  );
};