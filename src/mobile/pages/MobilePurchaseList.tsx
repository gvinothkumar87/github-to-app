import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Purchase } from '@/types';

const MobilePurchaseList: React.FC = () => {
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        suppliers (name_english, name_tamil),
        items (name_english, name_tamil, unit)
      `)
      .order('purchase_date', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    } else {
      setPurchases(data as any || []);
    }
    setLoading(false);
  };

  return (
    <MobileLayout title={language === 'english' ? 'Purchase List' : 'கொள்முதல் பட்டியல்'} showBackButton onBack={() => navigate('/purchases')}>
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">#{purchase.bill_no}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {purchase.status === 'completed' 
                      ? (language === 'english' ? 'Completed' : 'முடிந்தது')
                      : (language === 'english' ? 'Pending' : 'நிலுவையில்')}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">{language === 'english' ? 'Supplier: ' : 'சப்ளையர்: '}</span>
                    {purchase.suppliers ? getDisplayName(purchase.suppliers) : '-'}
                  </div>
                  <div>
                    <span className="font-medium">{language === 'english' ? 'Item: ' : 'பொருள்: '}</span>
                    {purchase.items ? getDisplayName(purchase.items) : '-'}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">{language === 'english' ? 'Quantity' : 'அளவு'}</div>
                      <div className="font-medium">{purchase.quantity} {purchase.items?.unit}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">{language === 'english' ? 'Total Amount' : 'மொத்த தொகை'}</div>
                      <div className="font-medium text-emerald-600">₹{purchase.total_amount}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {purchases.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'english' ? 'No purchases found' : 'கொள்முதல் எதுவும் கிடைக்கவில்லை'}
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default MobilePurchaseList;
