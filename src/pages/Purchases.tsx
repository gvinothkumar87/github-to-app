import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InwardEntryForm } from '@/components/forms/InwardEntryForm';
import { PurchaseForm } from '@/components/forms/PurchaseForm';
import { PurchaseFromTransitForm } from '@/components/forms/PurchaseFromTransitForm';
import { SupplierLedgerView } from '@/components/SupplierLedgerView';
import { UnifiedPurchaseBillsList } from '@/components/UnifiedPurchaseBillsList';
import { EditPurchaseForm } from '@/components/forms/EditPurchaseForm';
import { EditInwardEntryForm } from '@/components/forms/EditInwardEntryForm';
import { PurchaseInvoiceGenerator } from '@/components/PurchaseInvoiceGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InwardEntry, Purchase, Supplier, Item } from '@/types';
import { Plus, Scale, Truck, ShoppingCart, ClipboardList, Book, Upload, ArrowLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { usePageAccess } from '@/hooks/usePageAccess';

// Purchase sidebar component
const PurchaseSidebar = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
  const { language } = useLanguage();
  const { setOpenMobile } = useSidebar();
  const { checkAccess, loading } = usePageAccess();
  const navigate = useNavigate();

  const canAccessTab = (tabId: string) => {
    if (loading) return false;
    const route = `index:${tabId}`;
    return checkAccess(route);
  };

  const tabs = [
    { id: 'purchase-inward-entries', label: language === 'english' ? 'Inward Entries' : 'உள்வரும் பதிவுகள்', icon: Truck },
    { id: 'purchase-empty-weight', label: language === 'english' ? 'Empty Weight' : 'காலி எடை', icon: Scale },
    { id: 'purchase-direct', label: language === 'english' ? 'Direct Purchase' : 'நேரடி கொள்முதல்', icon: ShoppingCart },
    { id: 'purchase-from-transit', label: language === 'english' ? 'Purchase from Transit' : 'போக்குவரத்து கொள்முதல்', icon: Truck },
    { id: 'purchase-list', label: language === 'english' ? 'Purchase List' : 'கொள்முதல் பட்டியல்', icon: ClipboardList },
    { id: 'purchase-bills', label: language === 'english' ? 'Purchase Bills Management' : 'கொள்முதல் பில் மேலாண்மை', icon: FileText },
    { id: 'purchase-supplier-ledger', label: language === 'english' ? 'Supplier Ledger' : 'சப்ளையர் லெட்ஜர்', icon: Book },
  ].filter(tab => canAccessTab(tab.id));

  return (
    <Sidebar collapsible="icon" className="bg-white border-r border-gray-200">
      <SidebarContent className="bg-white">
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate">
            {language === 'english' ? 'Purchases' : 'கொள்முதல்'}
          </h1>
          <SidebarTrigger className="md:hidden" />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarMenu>
            {tabs.map((tab) => (
              <SidebarMenuItem key={tab.id}>
                <SidebarMenuButton
                  onClick={() => {
                    if (activeTab !== tab.id) {
                      onTabChange(tab.id);
                      if (window.innerWidth < 768) {
                        setOpenMobile(false);
                      }
                    }
                  }}
                  isActive={activeTab === tab.id}
                  className={`w-full justify-start px-4 py-3 h-auto transition-all duration-200 group relative overflow-hidden ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className={`mr-3 h-5 w-5 transition-transform duration-200 ${
                    activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  <span className="text-lg font-medium">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-r-full" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
          <SidebarMenuButton
            onClick={() => navigate('/')}
            className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 transition-colors"
          >
            <ArrowLeft className="mr-3 h-5 w-5" />
            <span className="text-lg font-medium">{language === 'english' ? 'Back to Sales' : 'விற்பனைக்குத் திரும்பு'}</span>
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default function Purchases() {
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('purchase-inward-entries');
  const [showForm, setShowForm] = useState(false);

  // Data states
  const [entries, setEntries] = useState<InwardEntry[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);

  // Empty weight input tracking
  const [emptyWeights, setEmptyWeights] = useState<{ [key: string]: string }>({});
  const [photoData, setPhotoData] = useState<{ [key: string]: string }>({});
  const [uploadingMap, setUploadingMap] = useState<{ [key: string]: boolean }>({});

  // Edit / Print states
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingInwardEntry, setEditingInwardEntry] = useState<InwardEntry | null>(null);
  const [printingPurchase, setPrintingPurchase] = useState<Purchase | null>(null);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [linkedInwardEntry, setLinkedInwardEntry] = useState<InwardEntry | null>(null);

  useEffect(() => {
    if (activeTab === 'purchase-inward-entries') {
      fetchInwardEntries();
    } else if (activeTab === 'purchase-empty-weight') {
      fetchPendingEntries();
    } else if (activeTab === 'purchase-list') {
      fetchPurchases();
    }
  }, [activeTab]);

  const fetchInwardEntries = async () => {
    setLoading(true);
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const tenDaysAgoFormatted = tenDaysAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('inward_entries')
      .select(`
        *,
        suppliers!inner(name_english, name_tamil, code),
        items!inner(name_english, name_tamil, code, unit)
      `)
      .gte('entry_date', tenDaysAgoFormatted)
      .order('serial_no', { ascending: false });

    if (error) {
      console.error('Error fetching inward entries:', error);
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

  const fetchPendingEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inward_entries')
      .select(`
        *,
        suppliers!inner(name_english, name_tamil, code),
        items!inner(name_english, name_tamil, code, unit)
      `)
      .eq('is_completed', false)
      .order('serial_no', { ascending: false });

    if (error) {
      console.error('Error fetching pending entries:', error);
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

  const fetchPurchases = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('purchases')
      .select(`
        *,
        suppliers (name_english, name_tamil),
        items (name_english, name_tamil, unit)
      `)
      .order('purchase_date', { ascending: false });

    if (data) setPurchases(data as any);
    setLoading(false);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    if (activeTab === 'purchase-inward-entries') {
      fetchInwardEntries();
    } else if (activeTab === 'purchase-empty-weight') {
      fetchPendingEntries();
    } else if (activeTab === 'purchase-list' || activeTab === 'purchase-direct' || activeTab === 'purchase-from-transit') {
      fetchPurchases();
    }
  };

  const handlePhotoFileChange = (entryId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoData(prev => ({ ...prev, [entryId]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const updateEmptyWeight = async (entry: any, emptyWeight: number) => {
    try {
      if (!photoData[entry.id]) {
        toast({
          variant: 'destructive',
          title: language === 'english' ? 'Photo required' : 'புகைப்படம் தேவை',
          description: language === 'english'
            ? 'Please upload the weighment photo before updating.'
            : 'புதுப்பிப்பதற்கு முன் எடைப் புகைப்படத்தை பதிவேற்றவும்.'
        });
        return;
      }

      if (emptyWeight >= entry.full_weight) {
        toast({
          variant: 'destructive',
          title: language === 'english' ? 'Invalid weight' : 'தவறான எடை',
          description: language === 'english'
            ? 'Empty weight must be less than full weight.'
            : 'காலி எடை முழு எடையை விட குறைவாக இருக்க வேண்டும்.'
        });
        return;
      }

      setUploadingMap(prev => ({ ...prev, [entry.id]: true }));

      // Compress then upload via edge function
      const { compressDataUrl } = await import('@/lib/image');
      const compressed = await compressDataUrl(photoData[entry.id], { maxSize: 1600, quality: 0.7 });

      const fileName = `empty-weight-${entry.serial_no}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-to-google-drive', {
        body: { fileData: compressed, fileName },
      });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError instanceof Error && uploadError.name === 'FunctionsHttpError') {
          const context = (uploadError as any).context;
          if (context && context.json) {
            context.json().then((errBody: any) => {
              console.error('Detailed Upload Error:', errBody);
            }).catch(() => { });
          }
        }
        throw uploadError;
      }

      // Handle nested data if present
      let responseData = uploadData;
      if (uploadData && typeof uploadData === 'object') {
        if ('data' in uploadData && !uploadData.viewUrl && !uploadData.fileUrl && !uploadData.url) {
          responseData = uploadData.data;
        }
      }

      const viewUrl = responseData.viewUrl || responseData.fileUrl || responseData.url || responseData.fileLink || responseData.directLink;
      if (!viewUrl) {
        throw new Error('No URL returned from upload');
      }

      const netWeight = entry.full_weight - emptyWeight;

      const { error } = await supabase
        .from('inward_entries')
        .update({
          empty_weight: emptyWeight,
          net_weight: netWeight,
          empty_weight_photo_url: viewUrl,
          empty_weight_updated_at: new Date().toISOString(),
          is_completed: true,
        })
        .eq('id', entry.id);

      if (error) throw error;

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Empty weight updated successfully' : 'காலி எடை வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
      });

      if (activeTab === 'purchase-empty-weight') {
        fetchPendingEntries();
      } else {
        fetchInwardEntries();
      }

      // Clear inputs
      setEmptyWeights(prev => ({ ...prev, [entry.id]: '' }));
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

  const renderContent = () => {
    if (editingPurchase && currentSupplier && currentItem) {
      return (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setEditingPurchase(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'english' ? 'Back' : 'பின்னே'}
          </Button>
          <EditPurchaseForm 
            purchase={editingPurchase} 
            supplier={currentSupplier}
            item={currentItem}
            onSuccess={() => {
              setEditingPurchase(null);
              fetchPurchases();
            }} 
            onCancel={() => setEditingPurchase(null)} 
          />
        </div>
      );
    }

    if (editingInwardEntry && currentSupplier && currentItem) {
      return (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setEditingInwardEntry(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'english' ? 'Back' : 'பின்னே'}
          </Button>
          <EditInwardEntryForm 
            inwardEntry={editingInwardEntry} 
            supplier={currentSupplier}
            item={currentItem}
            onSuccess={() => {
              setEditingInwardEntry(null);
              fetchInwardEntries();
            }} 
            onCancel={() => setEditingInwardEntry(null)} 
          />
        </div>
      );
    }

    if (printingPurchase && currentSupplier && currentItem) {
      return (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setPrintingPurchase(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'english' ? 'Back' : 'பின்னே'}
          </Button>
          <PurchaseInvoiceGenerator 
            purchase={printingPurchase} 
            inwardEntry={linkedInwardEntry}
            supplier={currentSupplier}
            item={currentItem}
            onClose={() => setPrintingPurchase(null)} 
          />
        </div>
      );
    }

    if (showForm) {
      switch (activeTab) {
        case 'purchase-inward-entries':
          return (
            <InwardEntryForm
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          );
        case 'purchase-direct':
          return (
            <PurchaseForm
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          );
        case 'purchase-from-transit':
          return (
            <PurchaseFromTransitForm
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          );
        default:
          return null;
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">
            {activeTab === 'purchase-inward-entries' && (language === 'english' ? 'Inward Entries' : 'உள்வரும் பதிவுகள்')}
            {activeTab === 'purchase-empty-weight' && (language === 'english' ? 'Empty Weight Update' : 'காலி எடை புதுப்பிப்பு')}
            {activeTab === 'purchase-direct' && (language === 'english' ? 'Direct Purchase' : 'நேரடி கொள்முதல்')}
            {activeTab === 'purchase-from-transit' && (language === 'english' ? 'Purchase from Transit' : 'போக்குவரத்து கொள்முதல்')}
            {activeTab === 'purchase-list' && (language === 'english' ? 'All Purchases' : 'அனைத்து கொள்முதல்கள்')}
            {activeTab === 'purchase-bills' && (language === 'english' ? 'Purchase Bills Management' : 'கொள்முதல் பில் மேலாண்மை')}
            {activeTab === 'purchase-supplier-ledger' && (language === 'english' ? 'Supplier Ledger' : 'சப்ளையர் லெட்ஜர்')}
          </h2>

          {(activeTab === 'purchase-inward-entries' || activeTab === 'purchase-direct' || activeTab === 'purchase-from-transit') && (
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-card">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'english' ? 'Add New' : 'புதியது சேர்க்கவும்'}
            </Button>
          )}
        </div>

        {/* Inward Entries Tab */}
        {activeTab === 'purchase-inward-entries' && (
          <Card className="shadow-card bg-gradient-card">
            <CardContent className="p-0">
              {/* Mobile view */}
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
                          {language === 'english' ? 'Supplier: ' : 'சப்ளையர்: '}
                        </span>
                        {entry.suppliers ? getDisplayName(entry.suppliers) : '-'}
                      </div>
                      <div>
                        <span className="font-medium">
                          {language === 'english' ? 'Item: ' : 'பொருள்: '}
                        </span>
                        {entry.items ? getDisplayName(entry.items) : '-'}
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
                            {language === 'english' ? 'Full Weight' : 'முழு எடை'}
                          </div>
                          <div className="font-medium">{entry.full_weight} KG</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">
                            {language === 'english' ? 'Empty Weight' : 'காலி எடை'}
                          </div>
                          <div className="font-medium">
                            {entry.empty_weight ? `${entry.empty_weight} KG` : '-'}
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
                      <TableHead>{language === 'english' ? 'Supplier' : 'சப்ளையர்'}</TableHead>
                      <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
                      <TableHead>{language === 'english' ? 'Mill' : 'மில்'}</TableHead>
                      <TableHead>{language === 'english' ? 'Lorry No' : 'லாரி எண்'}</TableHead>
                      <TableHead>{language === 'english' ? 'Full Weight' : 'முழு எடை'}</TableHead>
                      <TableHead>{language === 'english' ? 'Empty Weight' : 'காலி எடை'}</TableHead>
                      <TableHead>{language === 'english' ? 'Net Weight' : 'நிகர எடை'}</TableHead>
                      <TableHead>{language === 'english' ? 'Status' : 'நிலை'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.serial_no}</TableCell>
                        <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                        <TableCell>{entry.suppliers ? getDisplayName(entry.suppliers) : '-'}</TableCell>
                        <TableCell>{entry.items ? getDisplayName(entry.items) : '-'}</TableCell>
                        <TableCell>{entry.loading_place}</TableCell>
                        <TableCell className="font-mono">{entry.lorry_no}</TableCell>
                        <TableCell>{entry.full_weight} KG</TableCell>
                        <TableCell>{entry.empty_weight ? `${entry.empty_weight} KG` : '-'}</TableCell>
                        <TableCell>{entry.net_weight ? `${entry.net_weight} KG` : '-'}</TableCell>
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

        {/* Empty Weight Update Tab */}
        {activeTab === 'purchase-empty-weight' && (
          <div className="grid gap-4">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  {language === 'english' ? 'Pending Empty Weight Entries' : 'நிலுவையில் உள்ள காலி எடை பதிவுகள்'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile view */}
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
                            {language === 'english' ? 'Supplier: ' : 'சப்ளையர்: '}
                          </span>
                          {entry.suppliers ? getDisplayName(entry.suppliers) : '-'}
                        </div>
                        <div>
                          <span className="font-medium">
                            {language === 'english' ? 'Item: ' : 'பொருள்: '}
                          </span>
                          {entry.items ? getDisplayName(entry.items) : '-'}
                        </div>
                        <div>
                          <span className="font-medium">
                            {language === 'english' ? 'Lorry: ' : 'லாரி: '}
                          </span>
                          {entry.lorry_no}
                        </div>
                        <div>
                          <span className="font-medium">
                            {language === 'english' ? 'Full Weight: ' : 'முழு எடை: '}
                          </span>
                          {entry.full_weight} KG
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={language === 'english' ? 'Empty weight' : 'காலி எடை'}
                          value={emptyWeights[entry.id] || ''}
                          onChange={(e) => setEmptyWeights(prev => ({
                            ...prev,
                            [entry.id]: e.target.value
                          }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = parseFloat(emptyWeights[entry.id] || '0');
                              if (value > 0) {
                                updateEmptyWeight(entry, value);
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
                            const value = parseFloat(emptyWeights[entry.id] || '0');
                            if (value > 0) {
                              updateEmptyWeight(entry, value);
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
                        ? 'No pending empty weight entries'
                        : 'நிலுவையில் காலி எடை பதிவுகள் இல்லை'}
                    </div>
                  )}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'english' ? 'S.No' : 'வ.எண்'}</TableHead>
                        <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                        <TableHead>{language === 'english' ? 'Supplier' : 'சப்ளையர்'}</TableHead>
                        <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
                        <TableHead>{language === 'english' ? 'Lorry' : 'லாரி'}</TableHead>
                        <TableHead>{language === 'english' ? 'Full Weight' : 'முழு எடை'}</TableHead>
                        <TableHead>{language === 'english' ? 'Empty Weight' : 'காலி எடை'}</TableHead>
                        <TableHead>{language === 'english' ? 'Photo' : 'புகைப்படம்'}</TableHead>
                        <TableHead>{language === 'english' ? 'Action' : 'செயல்'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.serial_no}</TableCell>
                          <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.suppliers ? getDisplayName(entry.suppliers) : '-'}</TableCell>
                          <TableCell>{entry.items ? getDisplayName(entry.items) : '-'}</TableCell>
                          <TableCell className="font-mono">{entry.lorry_no}</TableCell>
                          <TableCell>{entry.full_weight} KG</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              className="w-32"
                              placeholder={language === 'english' ? 'Empty wt' : 'காலி எடை'}
                              value={emptyWeights[entry.id] || ''}
                              onChange={(e) => setEmptyWeights(prev => ({
                                ...prev,
                                [entry.id]: e.target.value
                              }))}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <input
                                id={`photo-upload-desk-${entry.id}`}
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
                                onClick={() => document.getElementById(`photo-upload-desk-${entry.id}`)?.click()}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                {photoData[entry.id]
                                  ? (language === 'english' ? '✓ Photo' : '✓ படம்')
                                  : (language === 'english' ? 'Photo *' : 'படம் *')}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                const value = parseFloat(emptyWeights[entry.id] || '0');
                                if (value > 0) {
                                  updateEmptyWeight(entry, value);
                                }
                              }}
                              disabled={uploadingMap[entry.id]}
                            >
                              {uploadingMap[entry.id]
                                ? (language === 'english' ? 'Uploading...' : 'பதிவேற்றுகிறது...')
                                : (language === 'english' ? 'Update' : 'புதுப்பி')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {entries.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'english'
                        ? 'No pending empty weight entries'
                        : 'நிலுவையில் காலி எடை பதிவுகள் இல்லை'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Direct Purchase tab content */}
        {activeTab === 'purchase-direct' && !showForm && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {language === 'english'
                ? 'Click "Add New" to create a direct purchase without inward entry'
                : 'உள்வரும் பதிவு இல்லாமல் நேரடி கொள்முதல் உருவாக்க "புதியது சேர்க்கவும்" என்பதை கிளிக் செய்யவும்'
              }
            </div>
          </div>
        )}

        {/* Purchase from Transit tab content */}
        {activeTab === 'purchase-from-transit' && !showForm && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {language === 'english'
                ? 'Click "Add New" to create a purchase from completed inward entries'
                : 'முடிக்கப்பட்ட உள்வரும் பதிவுகளிலிருந்து கொள்முதல் உருவாக்க "புதியது சேர்க்கவும்" என்பதை கிளிக் செய்யவும்'
              }
            </div>
          </div>
        )}

        {/* Purchase List Tab */}
        {activeTab === 'purchase-list' && (
          <Card className="shadow-card bg-gradient-card">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Mobile view */}
                  <div className="block md:hidden space-y-4 p-4">
                    {purchases.map((purchase) => (
                      <Card key={purchase.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-sm">
                            {purchase.bill_serial_no || '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(purchase.purchase_date), 'dd/MM/yyyy')}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">
                            {language === 'english' ? 'Supplier: ' : 'சப்ளையர்: '}
                          </span>
                          {purchase.suppliers ? getDisplayName(purchase.suppliers) : '-'}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">
                            {language === 'english' ? 'Item: ' : 'பொருள்: '}
                          </span>
                          {purchase.items ? getDisplayName(purchase.items) : '-'}
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span>{purchase.quantity} {purchase.items?.unit || ''}</span>
                          <span>₹{purchase.rate?.toFixed(2)}</span>
                          <span className="font-bold">₹{purchase.total_amount?.toFixed(2)}</span>
                        </div>
                      </Card>
                    ))}
                    {purchases.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'english' ? 'No purchases found' : 'கொள்முதல்கள் எதுவும் கிடைக்கவில்லை'}
                      </div>
                    )}
                  </div>

                  {/* Desktop table view */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                          <TableHead>{language === 'english' ? 'Bill No' : 'பில் எண்'}</TableHead>
                          <TableHead>{language === 'english' ? 'Supplier' : 'சப்ளையர்'}</TableHead>
                          <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
                          <TableHead>{language === 'english' ? 'Mill' : 'மில்'}</TableHead>
                          <TableHead className="text-right">{language === 'english' ? 'Quantity' : 'அளவு'}</TableHead>
                          <TableHead className="text-right">{language === 'english' ? 'Rate' : 'விலை'}</TableHead>
                          <TableHead className="text-right">{language === 'english' ? 'Total' : 'மொத்தம்'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell>{format(new Date(purchase.purchase_date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{purchase.bill_serial_no || '-'}</TableCell>
                            <TableCell>{purchase.suppliers ? getDisplayName(purchase.suppliers) : '-'}</TableCell>
                            <TableCell>{purchase.items ? getDisplayName(purchase.items) : '-'}</TableCell>
                            <TableCell>{purchase.mill}</TableCell>
                            <TableCell className="text-right">
                              {purchase.quantity} {purchase.items?.unit || ''}
                            </TableCell>
                            <TableCell className="text-right">₹{purchase.rate?.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold">₹{purchase.total_amount?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {purchases.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'english' ? 'No purchases found' : 'கொள்முதல்கள் எதுவும் கிடைக்கவில்லை'}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Purchase Bills Management Tab */}
        {activeTab === 'purchase-bills' && (
          <UnifiedPurchaseBillsList 
            onEditPurchase={(purchase, inwardEntry, supplier, item) => {
              setEditingPurchase(purchase);
              setLinkedInwardEntry(inwardEntry);
              setCurrentSupplier(supplier);
              setCurrentItem(item);
            }}
            onEditInwardEntry={(inwardEntry, supplier, item) => {
              setEditingInwardEntry(inwardEntry);
              setCurrentSupplier(supplier);
              setCurrentItem(item);
            }}
            onPrintPurchase={(purchase, inwardEntry, supplier, item) => {
              setPrintingPurchase(purchase);
              setLinkedInwardEntry(inwardEntry);
              setCurrentSupplier(supplier);
              setCurrentItem(item);
            }}
          />
        )}

        {/* Supplier Ledger tab content */}
        {activeTab === 'purchase-supplier-ledger' && (
          <SupplierLedgerView />
        )}
      </div>
    );
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-svh w-full bg-gray-50">
        <PurchaseSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-y-auto w-full relative">
          <SidebarTrigger className="absolute top-4 left-4 z-50 md:hidden bg-white shadow-md rounded-lg p-2" />
          <div className="p-4 md:p-8 w-full animate-fade-in pb-20 md:pb-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
