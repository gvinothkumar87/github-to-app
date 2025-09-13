import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { MobileLayout } from '../components/MobileLayout';
import { useOfflineData } from '../hooks/useOfflineData';
import { ArrowLeft } from 'lucide-react';

const MobileSalesForm: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { outwardEntryId } = useParams();
  const [loading, setLoading] = useState(false);
  
  const { create: createSale } = useOfflineData('offline_sales');
  const { data: outwardEntries } = useOfflineData('offline_outward_entries');
  const { data: customers } = useOfflineData('offline_customers');
  const { data: items } = useOfflineData('offline_items');

  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [formData, setFormData] = useState({
    outward_entry_id: outwardEntryId || '',
    customer_id: '',
    item_id: '',
    quantity: '',
    rate: '',
    total_amount: '',
    bill_serial_no: '',
    sale_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (outwardEntryId) {
      const entry = outwardEntries.find((e: any) => e.id === outwardEntryId) as any;
      if (entry) {
        setSelectedEntry(entry);
        setFormData(prev => ({
          ...prev,
          outward_entry_id: outwardEntryId,
          customer_id: entry.customer_id,
          item_id: entry.item_id,
          quantity: entry.net_weight?.toString() || '',
        }));
      }
    }
  }, [outwardEntryId, outwardEntries]);

  useEffect(() => {
    if (formData.quantity && formData.rate) {
      const totalAmount = parseFloat(formData.quantity) * parseFloat(formData.rate);
      setFormData(prev => ({ ...prev, total_amount: totalAmount.toFixed(2) }));
    }
  }, [formData.quantity, formData.rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createSale({
        ...formData,
        quantity: parseFloat(formData.quantity),
        rate: parseFloat(formData.rate),
        total_amount: parseFloat(formData.total_amount),
      });
      
      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Sale recorded successfully' : 'விற்பனை வெற்றிகரமாக பதிவு செய்யப்பட்டது',
      });
      
      navigate('/sales');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout title="New Sale">
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/sales')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'english' ? 'Back' : 'பின்'}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'english' ? 'Record New Sale' : 'புதிய விற்பனையை பதிவு செய்யவும்'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="outward_entry_id">
                  {language === 'english' ? 'Outward Entry' : 'வெளியீட்டு பதிவு'} *
                </Label>
                <Select 
                  value={formData.outward_entry_id} 
                  onValueChange={(value) => {
                    const entry = outwardEntries.find((e: any) => e.id === value) as any;
                    setSelectedEntry(entry);
                    setFormData(prev => ({
                      ...prev,
                      outward_entry_id: value,
                      customer_id: entry?.customer_id || '',
                      item_id: entry?.item_id || '',
                      quantity: entry?.net_weight?.toString() || '',
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'english' ? 'Select outward entry' : 'வெளியீட்டு பதிவை தேர்ந்தெடுக்கவும்'} />
                  </SelectTrigger>
                  <SelectContent>
                    {outwardEntries.filter((entry: any) => entry.is_completed).map((entry: any) => {
                      const customer = customers.find((c: any) => c.id === entry.customer_id) as any;
                      const item = items.find((i: any) => i.id === entry.item_id) as any;
                      return (
                        <SelectItem key={entry.id} value={entry.id}>
                          #{entry.serial_no} - {customer?.name_english} - {item?.name_english}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedEntry && (
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm">
                    <strong>Net Weight:</strong> {selectedEntry.net_weight} KG
                  </p>
                  <p className="text-sm">
                    <strong>Lorry:</strong> {selectedEntry.lorry_no}
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="quantity">
                  {language === 'english' ? 'Quantity (KG)' : 'அளவு (கிலோ)'} *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  placeholder={language === 'english' ? 'Enter quantity' : 'அளவை உள்ளிடவும்'}
                />
              </div>
              
              <div>
                <Label htmlFor="rate">
                  {language === 'english' ? 'Rate per KG (₹)' : 'கிலோ வீத விலை (₹)'} *
                </Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                  placeholder={language === 'english' ? 'Enter rate per kg' : 'கிலோ வீத விலையை உள்ளிடவும்'}
                />
              </div>
              
              <div>
                <Label htmlFor="total_amount">
                  {language === 'english' ? 'Total Amount (₹)' : 'மொத்த தொகை (₹)'}
                </Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  readOnly
                  className="bg-muted"
                  placeholder={language === 'english' ? 'Auto-calculated' : 'தானாக கணக்கிடப்பட்டது'}
                />
              </div>
              
              <div>
                <Label htmlFor="bill_serial_no">
                  {language === 'english' ? 'Bill Serial Number' : 'பில் எண்'}
                </Label>
                <Input
                  id="bill_serial_no"
                  value={formData.bill_serial_no}
                  onChange={(e) => setFormData({ ...formData, bill_serial_no: e.target.value })}
                  placeholder={language === 'english' ? 'Enter bill number' : 'பில் எண்ணை உள்ளிடவும்'}
                />
              </div>
              
              <div>
                <Label htmlFor="sale_date">
                  {language === 'english' ? 'Sale Date' : 'விற்பனை தேதி'} *
                </Label>
                <Input
                  id="sale_date"
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (language === 'english' ? 'Recording...' : 'பதிவு செய்கிறது...') : 
                   (language === 'english' ? 'Record Sale' : 'விற்பனையை பதிவு செய்யவும்')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/sales')} 
                  className="flex-1"
                >
                  {language === 'english' ? 'Cancel' : 'ரத்து செய்'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default MobileSalesForm;