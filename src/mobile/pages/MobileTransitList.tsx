import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { MobileLayout } from '../components/MobileLayout';
import { useOfflineData } from '../hooks/useOfflineData';
import LoadWeightModal from '../components/LoadWeightModal';
import { ArrowLeft, Plus, Truck, User, Package, Weight, Wifi, WifiOff, Edit } from 'lucide-react';

const MobileTransitList: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showLoadWeightModal, setShowLoadWeightModal] = useState(false);
  const { data: outwardEntries, loading, isOnline, refresh } = useOfflineData('offline_outward_entries');
  const { data: customers } = useOfflineData('offline_customers');
  const { data: items } = useOfflineData('offline_items');

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId) as any;
    return customer?.name_english || 'Unknown Customer';
  };

  const getItemName = (itemId: string) => {
    const item = items.find((i: any) => i.id === itemId) as any;
    return item?.name_english || 'Unknown Item';
  };

  const getStatus = (entry: any) => {
    if (entry.is_completed) {
      return 'Completed';
    } else if (entry.load_weight) {
      return 'Loaded';
    } else {
      return 'Entry Only';
    }
  };

  const getStatusColor = (entry: any) => {
    if (entry.is_completed) {
      return 'bg-green-100 text-green-800';
    } else if (entry.load_weight) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-blue-100 text-blue-800';
    }
  };

  const handleLoadWeight = (entry: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEntry({
      ...entry,
      customer_name: getCustomerName(entry.customer_id),
      item_name: getItemName(entry.item_id)
    });
    setShowLoadWeightModal(true);
  };

  const handleLoadWeightSuccess = () => {
    refresh();
    setShowLoadWeightModal(false);
    setSelectedEntry(null);
  };

  return (
    <MobileLayout title="Transit Logbook">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'english' ? 'Back' : 'பின்'}
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'default' : 'secondary'} className="flex items-center gap-1">
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            
            <Button
              onClick={() => navigate('/transit/new')}
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
              {language === 'english' ? 'Loading entries...' : 'பதிவுகளை ஏற்றுகிறது...'}
            </p>
          </div>
        ) : outwardEntries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'english' ? 'No outward entries found' : 'வெளியீட்டு பதிவுகள் கிடைக்கவில்லை'}
              </p>
              <Button 
                onClick={() => navigate('/transit/new')}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === 'english' ? 'Create First Entry' : 'முதல் பதிவை உருவாக்கவும்'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {outwardEntries
              .sort((a: any, b: any) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
              .map((entry: any) => (
                <Card 
                  key={entry.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => navigate(`/transit/${entry.id}/edit`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">#{entry.serial_no}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry)}`}>
                          {getStatus(entry)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </span>
                        {!entry.is_completed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleLoadWeight(entry, e)}
                            className="h-6 px-2 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {entry.load_weight ? 'Edit' : 'Add'} Weight
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{getCustomerName(entry.customer_id)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{getItemName(entry.item_id)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{entry.lorry_no}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-muted-foreground" />
                          <span>Empty: {entry.empty_weight} KG</span>
                        </div>
                        {entry.load_weight && (
                          <div className="text-right">
                            <span className="text-muted-foreground">Load: </span>
                            <span className="font-medium">{entry.load_weight} KG</span>
                          </div>
                        )}
                      </div>
                      
                      {entry.net_weight && (
                        <div className="flex justify-end text-sm">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                            Net: {entry.net_weight} KG
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {entry.loading_place}
                      </span>
                      <Badge variant={entry.sync_status === 'synced' ? 'default' : 'secondary'} className="text-xs">
                        {entry.sync_status === 'synced' ? 'Synced' : 'Pending'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {!isOnline && outwardEntries.length > 0 && (
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

        {/* Load Weight Modal */}
        {selectedEntry && (
          <LoadWeightModal
            isOpen={showLoadWeightModal}
            onClose={() => setShowLoadWeightModal(false)}
            outwardEntry={selectedEntry}
            onSuccess={handleLoadWeightSuccess}
          />
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileTransitList;