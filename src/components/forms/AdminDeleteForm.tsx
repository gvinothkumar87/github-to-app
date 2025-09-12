import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OutwardEntry, Customer, Item } from '@/types';
import { Trash2, AlertTriangle, Package, Truck, Receipt } from 'lucide-react';
import { format } from 'date-fns';

interface AdminDeleteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminDeleteForm: React.FC<AdminDeleteFormProps> = ({ onSuccess, onCancel }) => {
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  
  const [entries, setEntries] = useState<OutwardEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<OutwardEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('outward_entries')
        .select(`
          *,
          customers!inner(name_english, name_tamil, code),
          items!inner(name_english, name_tamil, code, unit)
        `)
        .order('entry_date', { ascending: false })
        .order('serial_no', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEntries((data || []) as OutwardEntry[]);
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

  const getEntryStatus = (entry: OutwardEntry) => {
    if (!entry.is_completed && !entry.load_weight) {
      return { 
        status: 'pending_load', 
        label: language === 'english' ? 'Pending Load Weight' : 'லோட் எடை நிலுவையில்',
        color: 'bg-yellow-500'
      };
    } else if (entry.is_completed && entry.load_weight) {
      // Check if sale exists
      return { 
        status: 'with_load', 
        label: language === 'english' ? 'Load Weight Added' : 'லோட் எடை சேர்க்கப்பட்டது',
        color: 'bg-blue-500'
      };
    } else {
      return { 
        status: 'billed', 
        label: language === 'english' ? 'Billed' : 'பில் போடப்பட்டது',
        color: 'bg-green-500'
      };
    }
  };

  const getDeletionImpact = async (entry: OutwardEntry) => {
    const impacts = [];
    
    // Check for related sales
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, bill_serial_no, total_amount')
      .eq('outward_entry_id', entry.id);

    if (sales && sales.length > 0) {
      impacts.push({
        type: 'sales',
        count: sales.length,
        details: sales.map(s => `Bill: ${s.bill_serial_no}, Amount: ₹${s.total_amount}`)
      });
    }

    // Check for customer ledger entries
    if (sales && sales.length > 0) {
      const saleIds = sales.map(s => s.id);
      const { data: ledgerEntries } = await supabase
        .from('customer_ledger')
        .select('id')
        .in('reference_id', saleIds);

      if (ledgerEntries && ledgerEntries.length > 0) {
        impacts.push({
          type: 'ledger',
          count: ledgerEntries.length,
          details: [`${ledgerEntries.length} customer ledger entries`]
        });
      }
    }

    return impacts;
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;

    setDeleting(true);
    try {
      // Get deletion impacts
      const impacts = await getDeletionImpact(selectedEntry);
      
      // Start transaction-like deletion
      // 1. Delete customer ledger entries first
      const { data: sales } = await supabase
        .from('sales')
        .select('id')
        .eq('outward_entry_id', selectedEntry.id);

      if (sales && sales.length > 0) {
        const saleIds = sales.map(s => s.id);
        
        // Delete customer ledger entries
        const { error: ledgerError } = await supabase
          .from('customer_ledger')
          .delete()
          .in('reference_id', saleIds);

        if (ledgerError) throw new Error(`Error deleting ledger entries: ${ledgerError.message}`);

        // Delete sales
        const { error: salesError } = await supabase
          .from('sales')
          .delete()
          .eq('outward_entry_id', selectedEntry.id);

        if (salesError) throw new Error(`Error deleting sales: ${salesError.message}`);
      }

      // 2. Finally delete the outward entry
      const { error: entryError } = await supabase
        .from('outward_entries')
        .delete()
        .eq('id', selectedEntry.id);

      if (entryError) throw new Error(`Error deleting outward entry: ${entryError.message}`);

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' 
          ? `Entry ${selectedEntry.serial_no} and all related records deleted successfully`
          : `என்ட்ரி ${selectedEntry.serial_no} மற்றும் அனைத்து தொடர்புடைய பதிவுகளும் வெற்றிகரமாக நீக்கப்பட்டன`,
      });

      setSelectedEntry(null);
      fetchEntries();
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          {language === 'english' ? 'Admin Delete Entry' : 'நிர்வாக என்ட்ரி நீக்கு'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Entry Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {language === 'english' ? 'Select Entry to Delete' : 'நீக்க வேண்டிய என்ட்ரியை தேர்வு செய்யவும்'}
          </label>
          <Select onValueChange={(value) => {
            const entry = entries.find(e => e.id === value);
            setSelectedEntry(entry || null);
          }}>
            <SelectTrigger>
              <SelectValue placeholder={language === 'english' ? 'Choose an entry...' : 'ஒரு என்ட்ரியை தேர்வு செய்யவும்...'} />
            </SelectTrigger>
            <SelectContent>
              {entries.map((entry) => {
                const status = getEntryStatus(entry);
                return (
                  <SelectItem key={entry.id} value={entry.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{entry.serial_no}</span>
                      <span>-</span>
                      <span>{getDisplayName(entry.customers)}</span>
                      <span>-</span>
                      <span>{getDisplayName(entry.items)}</span>
                      <Badge className={`${status.color} text-white text-xs`}>
                        {status.label}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Entry Details */}
        {selectedEntry && (
          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {language === 'english' ? 'Entry Details' : 'என்ட்ரி விவரங்கள்'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">
                    {language === 'english' ? 'Serial No:' : 'வரிசை எண்:'}
                  </span>
                  <p className="font-medium">#{selectedEntry.serial_no}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    {language === 'english' ? 'Date:' : 'தேதி:'}
                  </span>
                  <p className="font-medium">{format(new Date(selectedEntry.entry_date), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    {language === 'english' ? 'Customer:' : 'வாடிக்கையாளர்:'}
                  </span>
                  <p className="font-medium">{getDisplayName(selectedEntry.customers)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    {language === 'english' ? 'Item:' : 'பொருள்:'}
                  </span>
                  <p className="font-medium">{getDisplayName(selectedEntry.items)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    {language === 'english' ? 'Lorry No:' : 'லாரி எண்:'}
                  </span>
                  <p className="font-medium">{selectedEntry.lorry_no}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    {language === 'english' ? 'Status:' : 'நிலை:'}
                  </span>
                  <Badge className={`${getEntryStatus(selectedEntry).color} text-white`}>
                    {getEntryStatus(selectedEntry).label}
                  </Badge>
                </div>
              </div>

              {selectedEntry.load_weight && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {language === 'english' ? 'Empty Weight:' : 'காலி எடை:'}
                    </span>
                    <p className="font-medium">{selectedEntry.empty_weight} kg</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {language === 'english' ? 'Load Weight:' : 'லோட் எடை:'}
                    </span>
                    <p className="font-medium">{selectedEntry.load_weight} kg</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {language === 'english' ? 'Net Weight:' : 'நிகர எடை:'}
                    </span>
                    <p className="font-medium">{selectedEntry.net_weight} kg</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            {language === 'english' ? 'Cancel' : 'ரத்து'}
          </Button>
          
          {selectedEntry && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === 'english' ? 'Delete Entry' : 'என்ட்ரியை நீக்கு'}
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
                        ? `Are you sure you want to delete entry #${selectedEntry.serial_no}? This action cannot be undone.`
                        : `என்ட்ரி #${selectedEntry.serial_no} ஐ நீக்க நீங்கள் உறுதியாக இருக்கிறீர்களா? இந்த செயலை மாற்ற முடியாது.`}
                    </p>
                    <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                      <p className="text-sm font-medium text-destructive">
                        {language === 'english' ? 'This will also delete:' : 'இது பின்வருவனவற்றையும் நீக்கும்:'}
                      </p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>• {language === 'english' ? 'All related sales records' : 'அனைத்து தொடர்புடைய விற்பனை பதிவுகள்'}</li>
                        <li>• {language === 'english' ? 'Customer ledger entries' : 'வாடிக்கையாளர் லெட்ஜர் பதிவுகள்'}</li>
                        <li>• {language === 'english' ? 'Any generated invoices' : 'உருவாக்கப்பட்ட எந்த இன்வாய்ஸ்களும்'}</li>
                      </ul>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === 'english' ? 'Cancel' : 'ரத்து'}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    {deleting 
                      ? (language === 'english' ? 'Deleting...' : 'நீக்கப்படுகிறது...')
                      : (language === 'english' ? 'Delete Permanently' : 'நிரந்தரமாக நீக்கு')
                    }
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};