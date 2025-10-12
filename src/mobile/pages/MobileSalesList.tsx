import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { MobileLayout } from '../components/MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';
import { Plus, FileText, User, Package, Truck, IndianRupee, Wifi, WifiOff } from 'lucide-react';

const MobileSalesList: React.FC = () => {
  const { language, getDisplayName } = useLanguage();
  const navigate = useNavigate();
  const { data: sales, loading, isOnline, isServicesReady, error } = useEnhancedOfflineData('sales');
  const { data: customers } = useEnhancedOfflineData('customers');
  const { data: items } = useEnhancedOfflineData('items');
  const { data: outwardEntries } = useEnhancedOfflineData('outward_entries');

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId) as any;
    return customer ? getDisplayName(customer) : 'Unknown Customer';
  };

  const getItemName = (itemId: string) => {
    const item = items.find((i: any) => i.id === itemId) as any;
    return item ? getDisplayName(item) : 'Unknown Item';
  };

  const getOutwardEntry = (outwardEntryId: string) => {
    const entry = outwardEntries.find((e: any) => e.id === outwardEntryId) as any;
    return entry;
  };

  return (
    <MobileLayout title="Sales">
      <div className="space-y-4">
        <OfflineStatusBanner 
          isOnline={isOnline} 
          isServicesReady={isServicesReady}
          error={error}
        />
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'default' : 'secondary'} className="flex items-center gap-1">
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            
            <Button
              onClick={() => navigate('/sales/new')}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {language === 'english' ? 'Add' : 'சேர்க்கவும்'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              {language === 'english' ? 'Loading sales...' : 'விற்பனைகளை ஏற்றுகிறது...'}
            </p>
          </div>
        ) : sales.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'english' ? 'No sales found' : 'விற்பனைகள் கிடைக்கவில்லை'}
              </p>
              <Button 
                onClick={() => navigate('/sales/new')}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === 'english' ? 'Record First Sale' : 'முதல் விற்பனையை பதிவு செய்யவும்'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sales
              .sort((a: any, b: any) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
              .map((sale: any) => {
                const outwardEntry = getOutwardEntry(sale.outward_entry_id);
                return (
                  <Card 
                    key={sale.id}
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => navigate(`/sales/${sale.id}/view`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">
                            {sale.bill_serial_no || `Sale #${sale.id.slice(-6)}`}
                          </h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{getCustomerName(sale.customer_id)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{getItemName(sale.item_id)}</span>
                        </div>
                        
                        {outwardEntry && (
                          <div className="flex items-center gap-2 text-sm">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono">#{outwardEntry.serial_no} - {outwardEntry.lorry_no}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                          <div>
                            <span className="text-muted-foreground">Qty: </span>
                            <span className="font-medium">{sale.quantity} KG</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rate: </span>
                            <span className="font-medium">₹{sale.rate}/KG</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                            <IndianRupee className="h-4 w-4" />
                            <span>{sale.total_amount.toLocaleString()}</span>
                          </div>
                          <Badge variant={sale.sync_status === 'synced' ? 'default' : 'secondary'} className="text-xs">
                            {sale.sync_status === 'synced' ? 'Synced' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}

        {!isOnline && sales.length > 0 && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <WifiOff className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-orange-700">
                {language === 'english' 
                  ? 'Working offline. Changes will sync when online.' 
                  : 'ஆஃப்லைனில் செயல்படுகிறது. ஆன்லைனில் வரும்போது மாற்றங்கள் ஒத்திசைக்கப்படும்.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileSalesList;