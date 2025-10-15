import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { MobileLayout } from '../components/MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';
import { Plus, Package, Percent, Tag, Wifi, WifiOff } from 'lucide-react';

const MobileItemList: React.FC = () => {
  const { language, getDisplayName } = useLanguage();
  const navigate = useNavigate();
  const { data: items, loading, isOnline, isServicesReady, error } = useEnhancedOfflineData('offline_items');

  return (
    <MobileLayout title="Items">
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
              onClick={() => navigate('/items/new')}
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
              {language === 'english' ? 'Loading items...' : 'பொருட்களை ஏற்றுகிறது...'}
            </p>
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'english' ? 'No items found' : 'பொருட்கள் கிடைக்கவில்லை'}
              </p>
              <Button 
                onClick={() => navigate('/items/new')}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === 'english' ? 'Add First Item' : 'முதல் பொருளை சேர்க்கவும்'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item: any) => (
              <Card 
                key={item.id}
                className="transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {getDisplayName(item)}
                      </h3>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span className="font-mono">{item.code}</span>
                        </div>
                        <span className="bg-muted px-2 py-1 rounded">
                          {item.unit}
                        </span>
                      </div>

                      {(language === 'tamil' ? item.description_tamil : item.description_english) && (
                        <p className="text-xs text-muted-foreground mt-2 truncate">
                          {language === 'tamil' && item.description_tamil ? item.description_tamil : item.description_english}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {item.hsn_no && (
                          <span className="text-xs text-muted-foreground">
                            HSN: {item.hsn_no}
                          </span>
                        )}
                        
                        {item.gst_percentage > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Percent className="h-3 w-3 text-green-600" />
                            <span className="text-green-600 font-medium">
                              {item.gst_percentage}% GST
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant={item.sync_status === 'synced' ? 'default' : 'secondary'} className="text-xs">
                        {item.sync_status === 'synced' ? 'Synced' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isOnline && items.length > 0 && (
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

export default MobileItemList;