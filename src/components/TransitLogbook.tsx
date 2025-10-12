import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import { CustomerForm } from './forms/CustomerForm';
import { ItemForm } from './forms/ItemForm';
import { OutwardEntryForm } from './forms/OutwardEntryForm';
import { SalesForm } from './forms/SalesForm';
import { DirectSalesForm } from './forms/DirectSalesForm';
import { SalesLedgerView } from './SalesLedgerView';
import { AmountReceivedForm } from './forms/AmountReceivedForm';
import { CustomerLedgerView } from './CustomerLedgerView';
import { AdminDeleteForm } from './forms/AdminDeleteForm';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Customer, Item, OutwardEntry } from '@/types';
import { Plus, Edit, Truck, Scale, CalendarIcon, Download, FileText, FileSpreadsheet, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const TransitLogbook = () => {
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('entries');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Data states
  const [entries, setEntries] = useState<OutwardEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Load weight input tracking
  const [loadWeights, setLoadWeights] = useState<{[key: string]: string}>({});
  const [photoData, setPhotoData] = useState<{[key: string]: string}>({});
  const [uploadingMap, setUploadingMap] = useState<{[key: string]: boolean}>({});
  
  // Reports filters
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<string>('all');
  const [reportEntries, setReportEntries] = useState<OutwardEntry[]>([]);

  useEffect(() => {
    if (activeTab === 'entries') {
      fetchEntries();
    } else if (activeTab === 'load-weight') {
      fetchPendingEntries();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'items') {
      fetchItems();
    } else if (activeTab === 'reports') {
      fetchCustomers();
      fetchItems();
      fetchReportData();
    } else if (activeTab === 'direct-sales' || activeTab === 'outward-sales' || activeTab === 'sales-ledger' || activeTab === 'amount-received') {
      // These tabs handle their own data fetching
    }
  }, [activeTab]);

  // Trigger report data refresh when filters change
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReportData();
    }
  }, [startDate, endDate, selectedCustomer, selectedItem, activeTab]);

  const fetchEntries = async () => {
    setLoading(true);
    
    // Calculate date 10 days ago
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const tenDaysAgoFormatted = tenDaysAgo.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('outward_entries')
      .select(`
        *,
        customers!inner(name_english, name_tamil, code),
        items!inner(name_english, name_tamil, code, unit)
      `)
      .gte('entry_date', tenDaysAgoFormatted)
      .order('serial_no', { ascending: false });
    
    if (error) {
      console.error('Error fetching entries:', error);
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    } else {
      setEntries(data as any || []);
    }
    setLoading(false);
  };

  // Separate function to fetch only pending load weight entries
  const fetchPendingEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('outward_entries')
      .select(`
        *,
        customers!inner(name_english, name_tamil, code),
        items!inner(name_english, name_tamil, code, unit)
      `)
      .eq('is_completed', false)
      .order('serial_no', { ascending: false });
    
    if (error) {
      console.error('Error fetching pending entries:', error);
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பيะই',
        description: error.message,
      });
    } else {
      setEntries(data as any || []);
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name_english');
    
    if (error) {
      console.error('Error fetching customers:', error);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const fetchReportData = async () => {
    setLoading(true);
    let query = supabase
      .from('outward_entries')
      .select(`
        *,
        customers!inner(name_english, name_tamil, code),
        items!inner(name_english, name_tamil, code, unit)
      `)
      .eq('is_completed', true);

    // Apply date filters
    if (startDate) {
      query = query.gte('entry_date', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      query = query.lte('entry_date', format(endDate, 'yyyy-MM-dd'));
    }

    // Apply customer filter
    if (selectedCustomer && selectedCustomer !== 'all') {
      query = query.eq('customer_id', selectedCustomer);
    }

    // Apply item filter
    if (selectedItem && selectedItem !== 'all') {
      query = query.eq('item_id', selectedItem);
    }

    const { data, error } = await query.order('entry_date', { ascending: false });

    if (error) {
      console.error('Error fetching report data:', error);
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    } else {
      setReportEntries(data as any || []);
    }
    setLoading(false);
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name_english');
    
    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingItem(null);
    if (activeTab === 'entries') {
      fetchEntries();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'items') {
      fetchItems();
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handlePhotoFileChange = (entryId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoData(prev => ({ ...prev, [entryId]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const updateLoadWeight = async (entry: any, loadWeight: number) => {
    try {
      if (!photoData[entry.id]) {
        toast({
          variant: 'destructive',
          title: language === 'english' ? 'Photo required' : 'புகைப்படம் தேவை',
          description: language === 'english' ? 'Please upload the weighment photo before updating.' : 'புதுப்பிப்பதற்கு முன் எடைப் புகைப்படத்தை பதிவேற்றவும்.'
        });
        return;
      }

      if (loadWeight <= entry.empty_weight) {
        toast({
          variant: 'destructive',
          title: language === 'english' ? 'Invalid weight' : 'தவறான எடை',
          description: language === 'english' ? 'Load weight must be greater than empty weight.' : 'மொத்த எடை காலி எடையை விட அதிகமாக இருக்க வேண்டும்.'
        });
        return;
      }

      setUploadingMap(prev => ({ ...prev, [entry.id]: true }));

      // Compress then upload via edge function
      const { compressDataUrl } = await import('@/lib/image');
      const compressed = await compressDataUrl(photoData[entry.id], { maxSize: 1600, quality: 0.7 });

      const fileName = `load-weight-${entry.serial_no}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-to-google-drive', {
        body: { dataUrl: compressed, fileName },
      });
      if (uploadError) throw uploadError;
      const viewUrl = uploadData.viewUrl;

      const netWeight = loadWeight - entry.empty_weight;

      const { error } = await supabase
        .from('outward_entries')
        .update({
          load_weight: loadWeight,
          net_weight: netWeight,
          weighment_photo_url: viewUrl,
          load_weight_updated_at: new Date().toISOString(),
          is_completed: true,
        })
        .eq('id', entry.id);

      if (error) throw error;

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Load weight updated successfully' : 'மொத்த எடை வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
      });

      // Refresh the appropriate list based on current tab
      if (activeTab === 'load-weight') {
        fetchPendingEntries();
      } else {
        fetchEntries();
      }
      
      // Clear the input and photo after successful update
      setLoadWeights(prev => ({ ...prev, [entry.id]: '' }));
      setPhotoData(prev => { const p = { ...prev }; delete p[entry.id]; return p; });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    } finally {
      setUploadingMap(prev => ({ ...prev, [entry.id]: false }));
    }
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      reportEntries.map(entry => ({
        'Serial No': entry.serial_no,
        'Date': format(new Date(entry.entry_date), 'dd/MM/yyyy'),
        'Customer': entry.customers ? getDisplayName(entry.customers) : '-',
        'Item': entry.items ? getDisplayName(entry.items) : '-',
        'Loading Place': entry.loading_place === 'PULIVANTHI' ? 'PULIVANTHI' : 'MATTAPARAI',
        'Lorry No': entry.lorry_no,
        'Driver Mobile': entry.driver_mobile,
        'Empty Weight': entry.empty_weight,
        'Load Weight': entry.load_weight || 0,
        'Net Weight': entry.load_weight ? (entry.load_weight - entry.empty_weight) : 0,
        'Unit': entry.items?.unit || '',
        'Remarks': entry.remarks || ''
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transit Report');
    
    const filename = `transit-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, filename);

    toast({
      title: language === 'english' ? 'Success' : 'வெற்றி',
      description: language === 'english' ? 'Excel file downloaded successfully' : 'Excel கோப்பு வெற்றிகரமாக பதிவிறக்கப்பட்டது',
    });
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(16);
      doc.text('Transit Logbook Report', 14, 20);
      
      // Date range
      if (startDate || endDate) {
        doc.setFontSize(10);
        const dateRange = `Date Range: ${startDate ? format(startDate, 'dd/MM/yyyy') : 'All'} - ${endDate ? format(endDate, 'dd/MM/yyyy') : 'All'}`;
        doc.text(dateRange, 14, 30);
      }

      // Prepare table data
      const tableData = reportEntries.map(entry => [
        entry.serial_no.toString(),
        format(new Date(entry.entry_date), 'dd/MM/yyyy'),
        entry.customers ? getDisplayName(entry.customers) : '-',
        entry.items ? getDisplayName(entry.items) : '-',
        entry.lorry_no,
        entry.empty_weight.toString(),
        (entry.load_weight || 0).toString(),
        entry.load_weight ? Math.abs(entry.load_weight - entry.empty_weight).toString() : '0',
        entry.items?.unit || ''
      ]);

      // Add table using autoTable
      autoTable(doc, {
        head: [['S.No', 'Date', 'Customer', 'Item', 'Lorry', 'Empty Wt', 'Load Wt', 'Net Wt', 'Unit']],
        body: tableData,
        startY: startDate || endDate ? 40 : 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        margin: { top: 40 },
        theme: 'grid'
      });

      const filename = `transit-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'PDF file downloaded successfully' : 'PDF கோப்பு வெற்றிகரமாக பதிவிறக்கப்பட்டது',
      });
    } catch (error) {
      console.error('PDF Download Error:', error);
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to download PDF file' : 'PDF கோப்பு பதிவிறக்கம் தோல்வியுற்றது',
      });
    }
  };

  const renderContent = () => {
    if (showForm) {
      if (activeTab === 'customers') {
        return (
          <CustomerForm
            customer={editingItem}
            onSuccess={handleFormSuccess}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        );
      } else if (activeTab === 'items') {
        return (
          <ItemForm
            item={editingItem}
            onSuccess={handleFormSuccess}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        );
      } else if (activeTab === 'entries') {
        return (
          <OutwardEntryForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        );
      } else if (activeTab === 'direct-sales') {
        return (
          <DirectSalesForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        );
      } else if (activeTab === 'outward-sales') {
        return (
          <SalesForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        );
      } else if (activeTab === 'amount-received') {
        return (
          <AmountReceivedForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        );
      } else if (activeTab === 'admin-delete') {
        return (
          <AdminDeleteForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        );
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">
            {activeTab === 'entries' && (language === 'english' ? 'Outward Entries' : 'வெளியீட்டு பதிவுகள்')}
            {activeTab === 'customers' && (language === 'english' ? 'Customers' : 'வாடிக்கையாளர்கள்')}
            {activeTab === 'items' && (language === 'english' ? 'Items' : 'பொருட்கள்')}
            {activeTab === 'load-weight' && (language === 'english' ? 'Load Weight Update' : 'மொத்த எடை புதுப்பிப்பு')}
            {activeTab === 'reports' && (language === 'english' ? 'Reports' : 'அறிக்கைகள்')}
            {activeTab === 'direct-sales' && (language === 'english' ? 'Direct Sales' : 'நேரடி விற்பனை')}
            {activeTab === 'outward-sales' && (language === 'english' ? 'Sales from Transit' : 'போக்குவரத்து விற்பனை')}
            {activeTab === 'sales-ledger' && (language === 'english' ? 'Sales Ledger' : 'விற்பனை லெட்ஜர்')}
            {activeTab === 'amount-received' && (language === 'english' ? 'Amount Received' : 'பெற்ற தொகை')}
            {activeTab === 'admin-delete' && (language === 'english' ? 'Delete Entry' : 'என்ட்ரி நீக்கு')}
            {activeTab === 'customer-ledger' && (language === 'english' ? 'Customer Ledger' : 'வாடிக்கையாளர் லெட்ஜர்')}
          </h2>
          
          {(activeTab === 'entries' || activeTab === 'customers' || activeTab === 'items' || activeTab === 'direct-sales' || activeTab === 'outward-sales' || activeTab === 'amount-received') && (
            <Button onClick={() => setShowForm(true)} className="bg-gradient-primary text-primary-foreground shadow-card">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'english' ? 'Add New' : 'புதியது சேர்க்கவும்'}
            </Button>
          )}
          
          {activeTab === 'admin-delete' && (
            <Button onClick={() => setShowForm(true)} variant="destructive" className="shadow-card">
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'english' ? 'Delete Entry' : 'என்ட்ரி நீக்கு'}
            </Button>
          )}
        </div>

        {activeTab === 'entries' && (
          <Card className="shadow-card bg-gradient-card">
            <CardContent className="p-0">
              {/* Mobile optimized view */}
              <div className="block md:hidden space-y-4 p-4">
                {entries.map((entry) => (
                  <Card key={entry.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">#{entry.serial_no}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={entry.is_completed ? 'default' : 'secondary'} className="text-xs">
                        {entry.is_completed 
                          ? (language === 'english' ? 'Completed' : 'முடிந்தது')
                          : (language === 'english' ? 'Pending' : 'நிலுவையில்')}
                      </Badge>
                    </div>
                    
                     <div className="space-y-2 text-sm">
                       <div>
                         <span className="font-medium">
                           {language === 'english' ? 'Customer: ' : 'வாடிக்கையாளர்: '}
                         </span>
                         {entry.customers ? getDisplayName(entry.customers) : '-'}
                       </div>
                       <div>
                         <span className="font-medium">
                           {language === 'english' ? 'Item: ' : 'பொருள்: '}
                         </span>
                         {entry.items ? getDisplayName(entry.items) : '-'}
                       </div>
                       <div>
                         <span className="font-medium">
                           {language === 'english' ? 'Loading Place: ' : 'ஏற்றும் இடம்: '}
                         </span>
                         {entry.loading_place === 'PULIVANTHI' 
                           ? (language === 'english' ? 'PULIVANTHI' : 'புலியந்தி')
                           : (language === 'english' ? 'MATTAPARAI' : 'மட்டப்பாறை')}
                       </div>
                       <div>
                         <span className="font-medium">
                           {language === 'english' ? 'Lorry: ' : 'லாரி: '}
                         </span>
                         {entry.lorry_no}
                       </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">
                            {language === 'english' ? 'Empty Weight' : 'காலி எடை'}
                          </div>
                          <div className="font-medium">
                            {entry.empty_weight} KG
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">
                            {language === 'english' ? 'Load Weight' : 'மொத்த எடை'}
                          </div>
                          <div className="font-medium">
                            {entry.load_weight ? `${entry.load_weight} KG` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {entries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'english' 
                      ? 'No entries found' 
                      : 'பதிவுகள் எதுவும் கிடைக்கவில்லை'}
                  </div>
                )}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>{language === 'english' ? 'Serial No' : 'வரிசை எண்'}</TableHead>
                       <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                       <TableHead>{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}</TableHead>
                       <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
                       <TableHead>{language === 'english' ? 'Loading Place' : 'ஏற்றும் இடம்'}</TableHead>
                       <TableHead>{language === 'english' ? 'Lorry No' : 'லாரி எண்'}</TableHead>
                       <TableHead>{language === 'english' ? 'Empty Weight' : 'காலி எடை'}</TableHead>
                       <TableHead>{language === 'english' ? 'Load Weight' : 'மொத்த எடை'}</TableHead>
                       <TableHead>{language === 'english' ? 'Status' : 'நிலை'}</TableHead>
                     </TableRow>
                   </TableHeader>
                  <TableBody>
                     {entries.map((entry) => (
                       <TableRow key={entry.id}>
                         <TableCell className="font-medium">{entry.serial_no}</TableCell>
                         <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                         <TableCell>{entry.customers ? getDisplayName(entry.customers) : '-'}</TableCell>
                         <TableCell>{entry.items ? getDisplayName(entry.items) : '-'}</TableCell>
                         <TableCell>
                           {entry.loading_place === 'PULIVANTHI' 
                             ? (language === 'english' ? 'PULIVANTHI' : 'புலியந்தி')
                             : (language === 'english' ? 'MATTAPARAI' : 'மட்டப்பாறை')}
                         </TableCell>
                         <TableCell className="font-mono">{entry.lorry_no}</TableCell>
                          <TableCell>{entry.empty_weight} KG</TableCell>
                          <TableCell>
                            {entry.load_weight ? `${entry.load_weight} KG` : '-'}
                          </TableCell>
                         <TableCell>
                           <Badge variant={entry.is_completed ? 'default' : 'secondary'}>
                             {entry.is_completed 
                               ? (language === 'english' ? 'Completed' : 'முடிந்தது')
                               : (language === 'english' ? 'Pending' : 'நிலுவையில்')}
                           </Badge>
                         </TableCell>
                       </TableRow>
                     ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'customers' && (
          <Card className="shadow-card bg-gradient-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'english' ? 'Code' : 'குறியீடு'}</TableHead>
                      <TableHead>{language === 'english' ? 'Name' : 'பெயர்'}</TableHead>
                      <TableHead>{language === 'english' ? 'Contact' : 'தொடர்பு'}</TableHead>
                      <TableHead>{language === 'english' ? 'Phone' : 'தொலைபேசி'}</TableHead>
                      <TableHead>{language === 'english' ? 'Status' : 'நிலை'}</TableHead>
                      <TableHead>{language === 'english' ? 'Actions' : 'செயல்கள்'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-mono">{customer.code}</TableCell>
                        <TableCell className="font-medium">{getDisplayName(customer)}</TableCell>
                        <TableCell>{customer.contact_person || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                            {customer.is_active 
                              ? (language === 'english' ? 'Active' : 'செயல்பாட்டில்')
                              : (language === 'english' ? 'Inactive' : 'செயல்படாது')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {language === 'english' ? 'Edit' : 'திருத்து'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'items' && (
          <Card className="shadow-card bg-gradient-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>{language === 'english' ? 'Code' : 'குறியீடு'}</TableHead>
                       <TableHead>{language === 'english' ? 'Name' : 'பெயர்'}</TableHead>
                       <TableHead>{language === 'english' ? 'Unit' : 'அலகு'}</TableHead>
                       <TableHead>{language === 'english' ? 'HSN No' : 'எச்எஸ்என் எண்'}</TableHead>
                       <TableHead>{language === 'english' ? 'GST %' : 'ஜிஎஸ்டி %'}</TableHead>
                       <TableHead>{language === 'english' ? 'Status' : 'நிலை'}</TableHead>
                       <TableHead>{language === 'english' ? 'Actions' : 'செயல்கள்'}</TableHead>
                     </TableRow>
                   </TableHeader>
                  <TableBody>
                     {items.map((item) => (
                       <TableRow key={item.id}>
                         <TableCell className="font-mono">{item.code}</TableCell>
                         <TableCell className="font-medium">{getDisplayName(item)}</TableCell>
                         <TableCell>{item.unit}</TableCell>
                         <TableCell className="font-mono">{item.hsn_no || '-'}</TableCell>
                         <TableCell>{item.gst_percentage}%</TableCell>
                         <TableCell>
                           <Badge variant={item.is_active ? 'default' : 'secondary'}>
                             {item.is_active 
                               ? (language === 'english' ? 'Active' : 'செயல்பாட்டில்')
                               : (language === 'english' ? 'Inactive' : 'செயல்படாது')}
                           </Badge>
                         </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {language === 'english' ? 'Edit' : 'திருத்து'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'load-weight' && (
          <div className="grid gap-4">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  {language === 'english' ? 'Pending Load Weight Entries' : 'நிலுவையில் உள்ள மொத்த எடை பதிவுகள்'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile optimized layout */}
                <div className="block md:hidden space-y-4">
                  {entries.map((entry) => (
                    <Card key={entry.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">#{entry.serial_no}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(entry.entry_date).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {language === 'english' ? 'Pending' : 'நிலுவையில்'}
                        </Badge>
                      </div>
                      
                       <div className="space-y-2 text-sm">
                         <div>
                           <span className="font-medium">
                             {language === 'english' ? 'Customer: ' : 'வாடிக்கையாளர்: '}
                           </span>
                           {entry.customers ? getDisplayName(entry.customers) : '-'}
                         </div>
                         <div>
                           <span className="font-medium">
                             {language === 'english' ? 'Item: ' : 'பொருள்: '}
                           </span>
                           {entry.items ? getDisplayName(entry.items) : '-'}
                         </div>
                         <div>
                           <span className="font-medium">
                             {language === 'english' ? 'Loading Place: ' : 'ஏற்றும் இடம்: '}
                           </span>
                           {entry.loading_place === 'PULIVANTHI' 
                             ? (language === 'english' ? 'PULIVANTHI' : 'புலியந்தி')
                             : (language === 'english' ? 'MATTAPARAI' : 'மட்டப்பாறை')}
                         </div>
                         <div>
                           <span className="font-medium">
                             {language === 'english' ? 'Lorry: ' : 'லாரி: '}
                           </span>
                           {entry.lorry_no}
                         </div>
                         <div>
                           <span className="font-medium">
                             {language === 'english' ? 'Empty Weight: ' : 'காலி எடை: '}
                           </span>
                            {entry.empty_weight} KG
                         </div>
                       </div>
                      
                      <div className="space-y-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={language === 'english' ? 'Load weight' : 'மொத்த எடை'}
                          value={loadWeights[entry.id] || ''}
                          onChange={(e) => setLoadWeights(prev => ({
                            ...prev,
                            [entry.id]: e.target.value
                          }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = parseFloat(loadWeights[entry.id] || '0');
                              if (value > 0) {
                                updateLoadWeight(entry, value);
                              }
                            }
                          }}
                        />
                        
                        <div className="space-y-2">
                          <input
                            id={`photo-upload-${entry.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoFileChange(entry.id, file);
                            }}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`photo-upload-${entry.id}`)?.click()}
                            className="w-full"
                          >
                            {photoData[entry.id] 
                              ? (language === 'english' ? '✓ Photo Selected' : '✓ புகைப்படம் தேர்ந்தெடுக்கப்பட்டது')
                              : (language === 'english' ? 'Upload Photo *' : 'புகைப்படம் பதிவேற்றவும் *')}
                          </Button>
                          {photoData[entry.id] && (
                            <img 
                              src={photoData[entry.id]} 
                              alt="Preview" 
                              className="w-full h-32 object-cover rounded border"
                            />
                          )}
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            const value = parseFloat(loadWeights[entry.id] || '0');
                            if (value > 0) {
                              updateLoadWeight(entry, value);
                            }
                          }}
                          disabled={uploadingMap[entry.id]}
                          className="w-full"
                        >
                          {uploadingMap[entry.id]
                            ? (language === 'english' ? 'Uploading...' : 'பதிவேற்றுகிறது...')
                            : (language === 'english' ? 'Update' : 'புதுப்பி')}
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  {entries.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'english' 
                        ? 'No pending load weight entries' 
                        : 'நிலுவையில் உள்ள மொத்த எடை பதிவுகள் இல்லை'}
                    </div>
                  )}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>{language === 'english' ? 'Serial No' : 'வரிசை எண்'}</TableHead>
                         <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                         <TableHead>{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}</TableHead>
                         <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
                         <TableHead>{language === 'english' ? 'Loading Place' : 'ஏற்றும் இடம்'}</TableHead>
                         <TableHead>{language === 'english' ? 'Lorry No' : 'லாரி எண்'}</TableHead>
                          <TableHead>{language === 'english' ? 'Empty Weight' : 'காலி எடை'}</TableHead>
                          <TableHead>{language === 'english' ? 'Photo' : 'புகைப்படம்'}</TableHead>
                          <TableHead>{language === 'english' ? 'Load Weight' : 'மொத்த எடை'}</TableHead>
                          <TableHead>{language === 'english' ? 'Action' : 'செயல்'}</TableHead>
                       </TableRow>
                     </TableHeader>
                    <TableBody>
                       {entries.map((entry) => (
                         <TableRow key={entry.id}>
                           <TableCell className="font-medium">{entry.serial_no}</TableCell>
                           <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                           <TableCell>{entry.customers ? getDisplayName(entry.customers) : '-'}</TableCell>
                           <TableCell>{entry.items ? getDisplayName(entry.items) : '-'}</TableCell>
                           <TableCell>
                             {entry.loading_place === 'PULIVANTHI' 
                               ? (language === 'english' ? 'PULIVANTHI' : 'புலியந்தி')
                               : (language === 'english' ? 'MATTAPARAI' : 'மட்டப்பாறை')}
                           </TableCell>
                            <TableCell className="font-mono">{entry.lorry_no}</TableCell>
                             <TableCell>{entry.empty_weight} KG</TableCell>
                           <TableCell>
                             <input
                               id={`photo_${entry.id}`}
                               type="file"
                               accept="image/*"
                               className="hidden"
                               onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) handlePhotoFileChange(entry.id, file);
                               }}
                             />
                             <div className="flex items-center gap-2">
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={() => document.getElementById(`photo_${entry.id}`)?.click()}
                               >
                                 {language === 'english' ? 'Upload Photo' : 'புகைப்படம் பதிவேற்று'}
                               </Button>
                               {photoData[entry.id] && (
                                 <img src={photoData[entry.id]} alt="Preview" className="h-10 w-14 object-cover rounded border" />
                               )}
                             </div>
                           </TableCell>
                           <TableCell>
                             <Input
                               type="number"
                               step="0.01"
                               placeholder={language === 'english' ? 'Enter load weight' : 'மொத்த எடையை உள்ளிடவும்'}
                               value={loadWeights[entry.id] || ''}
                               onChange={(e) => setLoadWeights(prev => ({
                                 ...prev,
                                 [entry.id]: e.target.value
                               }))}
                               className="w-32"
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   const value = parseFloat(loadWeights[entry.id] || '0');
                                   if (value > 0) {
                                     updateLoadWeight(entry, value);
                                   }
                                 }
                               }}
                             />
                           </TableCell>
                           <TableCell>
                             <Button
                               size="sm"
                               disabled={!photoData[entry.id] || uploadingMap[entry.id]}
                               onClick={() => {
                                 const value = parseFloat(loadWeights[entry.id] || '0');
                                 if (value > 0) {
                                   updateLoadWeight(entry, value);
                                 }
                               }}
                             >
                               {uploadingMap[entry.id] ? (language === 'english' ? 'Uploading...' : 'பதிவேற்றுகிறது...') : (language === 'english' ? 'Update' : 'புதுப்பிக்கவும்')}
                             </Button>
                           </TableCell>
                        </TableRow>
                      ))}
                      
                      {entries.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {language === 'english' 
                              ? 'No pending load weight entries' 
                              : 'நிலுவையில் உள்ள மொத்த எடை பதிவுகள் இல்லை'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid gap-6">
            {/* Filters Section */}
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {language === 'english' ? 'Report Filters' : 'அறிக்கை வடிகட்டிகள்'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'english' ? 'Start Date' : 'தொடக்க தேதி'}
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "dd/MM/yyyy") : 
                            (language === 'english' ? 'Pick start date' : 'தொடக்க தேதி தேர்ந்தெடுக்கவும்')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'english' ? 'End Date' : 'முடிவு தேதி'}
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "dd/MM/yyyy") : 
                            (language === 'english' ? 'Pick end date' : 'முடிவு தேதி தேர்ந்தெடுக்கவும்')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Customer Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}
                    </label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          language === 'english' ? 'Select customer' : 'வாடிக்கையாளரைத் தேர்ந்தெடுக்கவும்'
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {language === 'english' ? 'All Customers' : 'அனைத்து வாடிக்கையாளர்கள்'}
                        </SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {getDisplayName(customer)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Item Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'english' ? 'Item' : 'பொருள்'}
                    </label>
                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          language === 'english' ? 'Select item' : 'பொருளைத் தேர்ந்தெடுக்கவும்'
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {language === 'english' ? 'All Items' : 'அனைத்து பொருட்கள்'}
                        </SelectItem>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {getDisplayName(item)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={fetchReportData} className="bg-gradient-primary">
                    <FileText className="h-4 w-4 mr-2" />
                    {language === 'english' ? 'Generate Report' : 'அறிக்கை உருவாக்கவும்'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setSelectedCustomer('all');
                      setSelectedItem('all');
                      setReportEntries([]);
                    }}
                    variant="outline"
                  >
                    {language === 'english' ? 'Clear Filters' : 'வடிகட்டிகளை அழிக்கவும்'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results and Download Section */}
            {reportEntries.length > 0 && (
              <Card className="shadow-card bg-gradient-card">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {language === 'english' ? 'Transit Ledger Report' : 'போக்குவரத்து லெட்ஜர் அறிக்கை'}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button onClick={downloadExcel} variant="outline" size="sm">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        {language === 'english' ? 'Excel' : 'Excel'}
                      </Button>
                      <Button onClick={downloadPDF} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        {language === 'english' ? 'PDF' : 'PDF'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Mobile optimized view */}
                  <div className="block md:hidden space-y-4">
                    {reportEntries.map((entry) => (
                      <Card key={entry.id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">#{entry.serial_no}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(entry.entry_date), 'dd/MM/yyyy')}
                            </div>
                          </div>
                          <Badge variant="default" className="text-xs">
                            {language === 'english' ? 'Completed' : 'முடிந்தது'}
                          </Badge>
                        </div>
                        
                         <div className="space-y-2 text-sm">
                           <div>
                             <span className="font-medium">
                               {language === 'english' ? 'Customer: ' : 'வாடிக்கையாளர்: '}
                             </span>
                             {entry.customers ? getDisplayName(entry.customers) : '-'}
                           </div>
                           <div>
                             <span className="font-medium">
                               {language === 'english' ? 'Item: ' : 'பொருள்: '}
                             </span>
                             {entry.items ? getDisplayName(entry.items) : '-'}
                           </div>
                           <div>
                             <span className="font-medium">
                               {language === 'english' ? 'Loading Place: ' : 'ஏற்றும் இடம்: '}
                             </span>
                             {entry.loading_place === 'PULIVANTHI' 
                               ? (language === 'english' ? 'PULIVANTHI' : 'புலியந்தி')
                               : (language === 'english' ? 'MATTAPARAI' : 'மட்டப்பாறை')}
                           </div>
                           <div>
                             <span className="font-medium">
                               {language === 'english' ? 'Lorry: ' : 'லாரி: '}
                             </span>
                             {entry.lorry_no}
                           </div>
                          
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">
                                {language === 'english' ? 'Empty' : 'காலி'}
                              </div>
                              <div className="font-medium">
                                {entry.empty_weight} KG
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">
                                {language === 'english' ? 'Load' : 'மொத்த'}
                              </div>
                              <div className="font-medium">
                                {entry.load_weight || 0} KG
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">
                                {language === 'english' ? 'Net' : 'நிகர'}
                              </div>
                              <div className="font-medium text-primary">
                                {entry.load_weight ? (entry.load_weight - entry.empty_weight) : 0} KG
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop table view */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>{language === 'english' ? 'Serial No' : 'வரிசை எண்'}</TableHead>
                           <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                           <TableHead>{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}</TableHead>
                           <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
                           <TableHead>{language === 'english' ? 'Loading Place' : 'ஏற்றும் இடம்'}</TableHead>
                           <TableHead>{language === 'english' ? 'Lorry No' : 'லாரி எண்'}</TableHead>
                           <TableHead>{language === 'english' ? 'Driver Mobile' : 'ஓட்டுனர் மொபைல்'}</TableHead>
                           <TableHead>{language === 'english' ? 'Empty Weight' : 'காலி எடை'}</TableHead>
                           <TableHead>{language === 'english' ? 'Load Weight' : 'மொத்த எடை'}</TableHead>
                           <TableHead>{language === 'english' ? 'Net Weight' : 'நிகர எடை'}</TableHead>
                           <TableHead>{language === 'english' ? 'Unit' : 'அலகு'}</TableHead>
                           <TableHead>{language === 'english' ? 'Remarks' : 'குறிப்புகள்'}</TableHead>
                         </TableRow>
                       </TableHeader>
                      <TableBody>
                         {reportEntries.map((entry) => (
                           <TableRow key={entry.id}>
                             <TableCell className="font-medium">{entry.serial_no}</TableCell>
                             <TableCell>{format(new Date(entry.entry_date), 'dd/MM/yyyy')}</TableCell>
                             <TableCell>{entry.customers ? getDisplayName(entry.customers) : '-'}</TableCell>
                             <TableCell>{entry.items ? getDisplayName(entry.items) : '-'}</TableCell>
                             <TableCell>
                               {entry.loading_place === 'PULIVANTHI' 
                                 ? (language === 'english' ? 'PULIVANTHI' : 'புலியந்தி')
                                 : (language === 'english' ? 'MATTAPARAI' : 'மட்டப்பாறை')}
                             </TableCell>
                             <TableCell className="font-mono">{entry.lorry_no}</TableCell>
                             <TableCell className="font-mono">{entry.driver_mobile}</TableCell>
                             <TableCell>{entry.empty_weight} KG</TableCell>
                             <TableCell>{entry.load_weight || 0} KG</TableCell>
                             <TableCell className="font-medium text-primary">
                               {entry.load_weight ? (entry.load_weight - entry.empty_weight) : 0} KG
                             </TableCell>
                            <TableCell>{entry.items?.unit}</TableCell>
                            <TableCell>{entry.remarks || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'english' ? 'Total Entries' : 'மொத்த பதிவுகள்'}
                        </div>
                        <div className="text-2xl font-bold">{reportEntries.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'english' ? 'Total Empty Weight' : 'மொத்த காலி எடை'}
                        </div>
                        <div className="text-2xl font-bold">
                          {reportEntries.reduce((sum, entry) => sum + entry.empty_weight, 0).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'english' ? 'Total Load Weight' : 'மொத்த சுமை எடை'}
                        </div>
                        <div className="text-2xl font-bold">
                          {reportEntries.reduce((sum, entry) => sum + (entry.load_weight || 0), 0).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'english' ? 'Total Net Weight' : 'மொத்த நிகர எடை'}
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {reportEntries.reduce((sum, entry) => 
                            sum + (entry.load_weight ? (entry.load_weight - entry.empty_weight) : 0), 0
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {reportEntries.length === 0 && startDate && (
              <Card className="shadow-card bg-gradient-card">
                <CardContent className="text-center py-8">
                  <div className="text-muted-foreground">
                    {language === 'english' 
                      ? 'No completed entries found for the selected filters.' 
                      : 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டிகளுக்கு முடிக்கப்பட்ட பதிவுகள் எதுவும் கிடைக்கவில்லை.'}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Direct Sales tab content */}
        {activeTab === 'direct-sales' && !showForm && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {language === 'english' 
                ? 'Click "Add New" to create a direct sale without outward entry'
                : 'வெளிச்செல்லும் என்ட்ரி இல்லாமல் நேரடி விற்பனை உருவாக்க "புதியது சேர்க்கவும்" என்பதை கிளிக் செய்யவும்'
              }
            </div>
          </div>
        )}

        {/* Outward Sales tab content */}
        {activeTab === 'outward-sales' && !showForm && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {language === 'english' 
                ? 'Click "Add New" to create a sale from completed outward entries'
                : 'முடிக்கப்பட்ட வெளிச்செல்லும் என்ட்ரிகளிலிருந்து விற்பனை உருவாக்க "புதியது சேர்க்கவும்" என்பதை கிளிக் செய்யவும்'
              }
            </div>
          </div>
        )}

        {/* Amount Received tab content */}
        {activeTab === 'amount-received' && !showForm && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {language === 'english' 
                ? 'Click "Add New" to record payment received from customers'
                : 'வாடிக்கையாளர்களிடமிருந்து பெறப்பட்ட பணத்தை பதிவு செய்ய "புதியது சேர்க்கவும்" என்பதை கிளிக் செய்யவும்'
              }
            </div>
          </div>
        )}

        {/* Admin Delete tab content */}
        {activeTab === 'admin-delete' && !showForm && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {language === 'english' 
                ? 'Click "Delete Entry" to remove outward entries in any status with all related data'
                : 'அனைத்து தொடர்புடைய தரவுகளுடன் எந்த நிலையிலுள்ள வெளிச்செல்லும் என்ட்ரிகளையும் அகற்ற "என்ட்ரி நீக்கு" என்பதை கிளிக் செய்யவும்'
              }
            </div>
            <div className="text-sm text-destructive">
              {language === 'english' 
                ? '⚠️ Admin access only - This will permanently delete entries and cannot be undone'
                : '⚠️ நிர்வாக அணுகல் மட்டும் - இது என்ட்ரிகளை நிரந்தரமாக நீக்கும் மற்றும் மாற்ற முடியாது'
              }
            </div>
          </div>
        )}

        {/* Sales Ledger tab content */}
        {activeTab === 'sales-ledger' && (
          <SalesLedgerView />
        )}

        {/* Customer Ledger tab content */}
        {activeTab === 'customer-ledger' && (
          <CustomerLedgerView />
        )}
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};