import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Receipt, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const MobileReceiptList = () => {
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: receipts, loading: receiptsLoading, remove } = useEnhancedOfflineData('receipts');
  const { data: customers } = useEnhancedOfflineData('customers');

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? getDisplayName(customer as any) : 'Unknown';
  };

  const filteredReceipts = receipts.filter((receipt: any) => 
    (receipt.receipt_no && receipt.receipt_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
    getCustomerName(receipt.customer_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (receipt.payment_method && receipt.payment_method.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteReceipt = async (receiptId: string) => {
    if (confirm(language === 'english' ? 'Are you sure you want to delete this receipt?' : 'இந்த ரசீதை நீக்க விரும்புகிறீர்களா?')) {
      try {
        await remove(receiptId);
        toast({
          title: language === 'english' ? 'Success' : 'வெற்றி',
          description: language === 'english' ? 'Receipt deleted successfully' : 'ரசீது வெற்றிகரமாக நீக்கப்பட்டது',
        });
      } catch (error) {
        toast({
          title: language === 'english' ? 'Error' : 'பிழை',
          description: language === 'english' ? 'Failed to delete receipt' : 'ரசீதை நீக்குவதில் தோல்வி',
          variant: 'destructive',
        });
      }
    }
  };

  if (receiptsLoading) {
    return (
      <MobileLayout 
        title={language === 'english' ? 'Receipts' : 'ரசீதுகள்'}
      >
        <OfflineStatusBanner isOnline={true} isServicesReady={true} />
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              {language === 'english' ? 'Loading receipts...' : 'ரசீதுகளை ஏற்றுகிறது...'}
            </div>
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title={language === 'english' ? 'Receipts' : 'ரசீதுகள்'}
      action={
        <Button
          size="sm"
          onClick={() => navigate('/receipts/new')}
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
                placeholder={language === 'english' ? 'Search receipts...' : 'ரசீதுகளைத் தேடுங்கள்...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipts List */}
        {filteredReceipts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {searchTerm 
                ? (language === 'english' ? 'No receipts found matching your search.' : 'உங்கள் தேடலுக்கு பொருந்தும் ரசீதுகள் எதுவும் இல்லை.')
                : (language === 'english' ? 'No receipts created yet.' : 'இன்னும் ரசீதுகள் எதுவும் உருவாக்கப்படவில்லை.')
              }
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReceipts.map((receipt: any) => (
              <Card key={receipt.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{receipt.receipt_no}</span>
                    </div>
                    <Badge variant="secondary">
                      {new Date(receipt.receipt_date).toLocaleDateString('en-IN')}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        {language === 'english' ? 'Customer: ' : 'வாடிக்கையாளர்: '}
                      </span>
                      <span className="font-medium">{getCustomerName(receipt.customer_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        <span className="text-muted-foreground">
                          {language === 'english' ? 'Method: ' : 'முறை: '}
                        </span>
                        {receipt.payment_method}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        ₹{receipt.amount.toFixed(2)}
                      </span>
                    </div>
                    {receipt.remarks && (
                      <div>
                        <span className="text-muted-foreground">
                          {language === 'english' ? 'Remarks: ' : 'குறிப்புகள்: '}
                        </span>
                        <span>{receipt.remarks}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/receipts/edit/${receipt.id}`)}
                      className="gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      {language === 'english' ? 'Edit' : 'திருத்து'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteReceipt(receipt.id)}
                      className="gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      {language === 'english' ? 'Delete' : 'நீக்கு'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileReceiptList;