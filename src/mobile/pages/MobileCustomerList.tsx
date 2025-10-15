import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { MobileLayout } from '../components/MobileLayout';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { Plus, User, Phone, MapPin, Wifi, WifiOff } from 'lucide-react';

const MobileCustomerList: React.FC = () => {
  const { language, getDisplayName } = useLanguage();
  const navigate = useNavigate();
  const { data: customers, loading, isOnline, refresh, isServicesReady } = useEnhancedOfflineData('offline_customers');

  const handleRefresh = async () => {
    await refresh();
  };

  return (
    <MobileLayout title="Customers">
      <div className="space-y-4">
        <OfflineStatusBanner 
          isOnline={isOnline} 
          isServicesReady={isServicesReady} 
        />
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'default' : 'secondary'} className="flex items-center gap-1">
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            
            <Button
              onClick={() => navigate('/customers/new')}
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
              {language === 'english' ? 'Loading customers...' : 'வாடிக்கையாளர்களை ஏற்றுகிறது...'}
            </p>
          </div>
        ) : customers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'english' ? 'No customers found' : 'வாடிக்கையாளர்கள் கிடைக்கவில்லை'}
              </p>
              <Button 
                onClick={() => navigate('/customers/new')}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === 'english' ? 'Add First Customer' : 'முதல் வாடிக்கையாளரை சேர்க்கவும்'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {customers.map((customer: any) => (
              <Card 
                key={customer.id}
                className="transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {getDisplayName(customer)}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="font-mono">{customer.code}</span>
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                      {(language === 'tamil' ? customer.address_tamil : customer.address_english) && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{language === 'tamil' && customer.address_tamil ? customer.address_tamil : customer.address_english}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={customer.sync_status === 'synced' ? 'default' : 'secondary'}>
                        {customer.sync_status === 'synced' ? 'Synced' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isOnline && customers.length > 0 && (
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

export default MobileCustomerList;