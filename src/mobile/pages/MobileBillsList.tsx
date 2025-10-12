import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Edit, Search, Plus, Trash2, Printer } from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

export const MobileBillsList = () => {
  const isAdmin = useAdminCheck();
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSaleForDelete, setSelectedSaleForDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: sales, loading: salesLoading, refresh } = useEnhancedOfflineData('sales');
  const { data: customers } = useEnhancedOfflineData('customers');
  const { data: items } = useEnhancedOfflineData('items');
  const { data: outwardEntries } = useEnhancedOfflineData('outward_entries');

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? getDisplayName(customer as any) : 'Unknown';
  };

  const getItemName = (itemId: string) => {
    const item = items.find((i: any) => i.id === itemId);
    return item ? getDisplayName(item as any) : 'Unknown';
  };

  const getOutwardEntry = (entryId: string) => {
    return outwardEntries.find((e: any) => e.id === entryId);
  };

  const filteredSales = sales.filter((sale: any) => 
    (sale.bill_serial_no && sale.bill_serial_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
    getCustomerName(sale.customer_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getItemName(sale.item_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditSale = (sale: any) => {
    navigate(`/sales/${sale.id}/edit`);
  };

  const handlePrintSale = (sale: any) => {
    navigate(`/bills/${sale.id}/invoice`);
  };

  const confirmDelete = (sale: any) => {
    setSelectedSaleForDelete(sale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSale = async () => {
    if (!selectedSaleForDelete) return;

    setIsDeleting(true);
    try {
      // Delete customer ledger entry
      await supabase
        .from('customer_ledger')
        .delete()
        .eq('reference_id', selectedSaleForDelete.id)
        .eq('transaction_type', 'sale');

      // Delete sale
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', selectedSaleForDelete.id);

      if (error) throw error;

      toast.success(language === 'english' ? 'Bill deleted successfully' : 'பில் வெற்றிகரமாக நீக்கப்பட்டது');
      refresh();
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      toast.error(error.message || 'Failed to delete bill');
    } finally {
      setIsDeleting(false);
    }
  };

  if (salesLoading) {
    return (
      <MobileLayout 
        title={language === 'english' ? 'Bills Management' : 'பில் மேலாண்மை'}
      >
      <OfflineStatusBanner isOnline={true} isServicesReady={true} />
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              {language === 'english' ? 'Loading bills...' : 'பில்களை ஏற்றுகிறது...'}
            </div>
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title={language === 'english' ? 'Bills Management' : 'பில் மேலாண்மை'}
      action={
        <Button
          size="sm"
          onClick={() => navigate('/sales/new')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {language === 'english' ? 'New' : 'புதிய'}
        </Button>
      }
    >
      <OfflineStatusBanner isOnline={true} isServicesReady={true} />
      
      <div className="space-y-4">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'english' ? 'Search bills...' : 'பில்களைத் தேடுங்கள்...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bills List */}
        {filteredSales.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {searchTerm 
                ? (language === 'english' ? 'No bills found matching your search.' : 'உங்கள் தேடலுக்கு பொருந்தும் பில்கள் எதுவும் இல்லை.')
                : (language === 'english' ? 'No bills created yet.' : 'இன்னும் பில்கள் எதுவும் உருவாக்கப்படவில்லை.')
              }
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSales.map((sale: any) => {
              const outwardEntry = getOutwardEntry(sale.outward_entry_id);
              return (
                <Card key={sale.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{sale.bill_serial_no}</span>
                      </div>
                      <Badge variant="secondary">
                        {new Date(sale.sale_date).toLocaleDateString('en-IN')}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          {language === 'english' ? 'Customer: ' : 'வாடிக்கையாளர்: '}
                        </span>
                        <span className="font-medium">{getCustomerName(sale.customer_id)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {language === 'english' ? 'Item: ' : 'பொருள்: '}
                        </span>
                        <span>{getItemName(sale.item_id)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          <span className="text-muted-foreground">
                            {language === 'english' ? 'Qty: ' : 'அளவு: '}
                          </span>
                          {sale.quantity}
                        </span>
                        <span>
                          <span className="text-muted-foreground">
                            {language === 'english' ? 'Rate: ' : 'விலை: '}
                          </span>
                          ₹{sale.rate}
                        </span>
                      </div>
                      {outwardEntry && (
                        <div>
                          <span className="text-muted-foreground">
                            {language === 'english' ? 'Lorry: ' : 'லாரி: '}
                          </span>
                          <span>{(outwardEntry as any)?.lorry_no}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-primary">
                        ₹{sale.total_amount.toFixed(2)}
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => handlePrintSale(sale)}
                          className="gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          {language === 'english' ? 'Print' : 'அச்சிடு'}
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSale(sale)}
                              className="gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              {language === 'english' ? 'Edit' : 'திருத்து'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => confirmDelete(sale)}
                              className="gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              {language === 'english' ? 'Delete' : 'நீக்கு'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'english' ? 'Delete Bill' : 'பில் நீக்கு'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'english' 
                ? `Are you sure you want to delete bill ${selectedSaleForDelete?.bill_serial_no}? This action cannot be undone.`
                : `பில் ${selectedSaleForDelete?.bill_serial_no} ஐ நீக்க விரும்புகிறீர்களா? இந்த செயலை மீட்க முடியாது.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'english' ? 'Cancel' : 'ரத்து'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSale}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (language === 'english' ? 'Deleting...' : 'நீக்குகிறது...') : (language === 'english' ? 'Delete' : 'நீக்கு')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
};

export default MobileBillsList;