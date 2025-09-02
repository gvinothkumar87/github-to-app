import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import { CustomerForm } from './forms/CustomerForm';
import { ItemForm } from './forms/ItemForm';
import { OutwardEntryForm } from './forms/OutwardEntryForm';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Customer, Item, OutwardEntry } from '@/types';
import { Plus, Edit, Truck, Scale } from 'lucide-react';
import { Input } from './ui/input';

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

  useEffect(() => {
    if (activeTab === 'entries') {
      fetchEntries();
    } else if (activeTab === 'load-weight') {
      fetchPendingEntries();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'items') {
      fetchItems();
    }
  }, [activeTab]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('outward_entries')
      .select(`
        *,
        customers!inner(name_english, name_tamil, code),
        items!inner(name_english, name_tamil, code, unit)
      `)
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

  const updateLoadWeight = async (entryId: string, loadWeight: number) => {
    try {
      const { error } = await supabase
        .from('outward_entries')
        .update({
          load_weight: loadWeight,
          load_weight_updated_at: new Date().toISOString(),
          is_completed: true,
        })
        .eq('id', entryId);

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
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
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
          </h2>
          
          {(activeTab === 'entries' || activeTab === 'customers' || activeTab === 'items') && (
            <Button onClick={() => setShowForm(true)} className="bg-gradient-primary text-primary-foreground shadow-card">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'english' ? 'Add New' : 'புதியது சேர்க்கவும்'}
            </Button>
          )}
        </div>

        {activeTab === 'entries' && (
          <Card className="shadow-card bg-gradient-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'english' ? 'Serial No' : 'வரிசை எண்'}</TableHead>
                      <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                      <TableHead>{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}</TableHead>
                      <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
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
                        <TableCell className="font-mono">{entry.lorry_no}</TableCell>
                        <TableCell>{entry.empty_weight} {entry.items?.unit}</TableCell>
                        <TableCell>
                          {entry.load_weight ? `${entry.load_weight} ${entry.items?.unit}` : '-'}
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'english' ? 'Serial No' : 'வரிசை எண்'}</TableHead>
                        <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                        <TableHead>{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}</TableHead>
                        <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
                        <TableHead>{language === 'english' ? 'Lorry No' : 'லாரி எண்'}</TableHead>
                        <TableHead>{language === 'english' ? 'Empty Weight' : 'காலி எடை'}</TableHead>
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
                          <TableCell className="font-mono">{entry.lorry_no}</TableCell>
                          <TableCell>{entry.empty_weight} {entry.items?.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder={language === 'english' ? 'Enter load weight' : 'மொத்த எடையை உள்ளிடவும்'}
                              className="w-32"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const value = parseFloat((e.target as HTMLInputElement).value);
                                  if (value > 0) {
                                    updateLoadWeight(entry.id, value);
                                  }
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                const input = document.querySelector(`input[placeholder*="${entry.id}"]`) as HTMLInputElement;
                                const value = parseFloat(input?.value || '0');
                                if (value > 0) {
                                  updateLoadWeight(entry.id, value);
                                }
                              }}
                            >
                              {language === 'english' ? 'Update' : 'புதுப்பிக்கவும்'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid gap-6">
            <Card className="shadow-card bg-gradient-card">
              <CardHeader>
                <CardTitle>
                  {language === 'english' ? 'Reports & Analytics' : 'அறிக்கைகள் மற்றும் பகுப்பாய்வு'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {language === 'english' 
                    ? 'Reporting features will be implemented in the next version.' 
                    : 'அறிக்கை அம்சங்கள் அடுத்த பதிப்பில் செயல்படுத்தப்படும்.'}
                </p>
              </CardContent>
            </Card>
          </div>
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