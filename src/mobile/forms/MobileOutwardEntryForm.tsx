import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { MobileLayout } from '../components/MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { ArrowLeft } from 'lucide-react';

const MobileOutwardEntryForm: React.FC = () => {
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const { data: customers } = useEnhancedOfflineData('offline_customers');
  const { data: items } = useEnhancedOfflineData('offline_items');
  const { create: createEntry } = useEnhancedOfflineData('offline_outward_entries');

  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    loading_place: 'PULIVANTHI',
    customer_id: '',
    item_id: '',
    lorry_no: '',
    driver_mobile: '',
    empty_weight: '',
    remarks: '',
    is_completed: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createEntry({
        ...formData,
        empty_weight: parseFloat(formData.empty_weight),
        serial_no: Date.now(), // Generate unique serial number offline
      });
      
      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Outward entry created successfully' : 'வெளியீட்டு பதிவு வெற்றிகரமாக உருவாக்கப்பட்டது',
      });
      
      navigate('/transit');
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
    <MobileLayout title="New Outward Entry">
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/transit')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'english' ? 'Back' : 'பின்'}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'english' ? 'New Outward Entry' : 'புதிய வெளியீட்டு பதிவு'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="entry_date">
                  {language === 'english' ? 'Entry Date' : 'பதிவு தேதி'} *
                </Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="loading_place">
                  {language === 'english' ? 'Loading Place' : 'ஏற்றும் இடம்'} *
                </Label>
                <Select value={formData.loading_place} onValueChange={(value) => setFormData({ ...formData, loading_place: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PULIVANTHI">
                      {language === 'english' ? 'PULIVANTHI' : 'புலியந்தி'}
                    </SelectItem>
                    <SelectItem value="MATTAPARAI">
                      {language === 'english' ? 'MATTAPARAI' : 'மட்டப்பாறை'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="customer_id">
                  {language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'} *
                </Label>
                <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'english' ? 'Select customer' : 'வாடிக்கையாளரை தேர்ந்தெடுக்கவும்'} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name_english} ({customer.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="item_id">
                  {language === 'english' ? 'Item' : 'பொருள்'} *
                </Label>
                <Select value={formData.item_id} onValueChange={(value) => setFormData({ ...formData, item_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'english' ? 'Select item' : 'பொருளை தேர்ந்தெடுக்கவும்'} />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name_english} ({item.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="lorry_no">
                  {language === 'english' ? 'Lorry Number' : 'லாரி எண்'} *
                </Label>
                <Input
                  id="lorry_no"
                  value={formData.lorry_no}
                  onChange={(e) => setFormData({ ...formData, lorry_no: e.target.value.toUpperCase() })}
                  required
                  placeholder={language === 'english' ? 'e.g., TN01AB1234' : 'உதா: TN01AB1234'}
                />
              </div>
              
              <div>
                <Label htmlFor="driver_mobile">
                  {language === 'english' ? 'Driver Mobile' : 'ஓட்டுநர் மொபைல்'} *
                </Label>
                <Input
                  id="driver_mobile"
                  type="tel"
                  value={formData.driver_mobile}
                  onChange={(e) => setFormData({ ...formData, driver_mobile: e.target.value })}
                  required
                  placeholder={language === 'english' ? 'Driver mobile number' : 'ஓட்டுநர் மொபைல் எண்'}
                />
              </div>
              
              <div>
                <Label htmlFor="empty_weight">
                  {language === 'english' ? 'Empty Weight (KG)' : 'காலி எடை (கிலோ)'} *
                </Label>
                <Input
                  id="empty_weight"
                  type="number"
                  step="0.01"
                  value={formData.empty_weight}
                  onChange={(e) => setFormData({ ...formData, empty_weight: e.target.value })}
                  required
                  placeholder={language === 'english' ? 'Enter empty weight' : 'காலி எடையை உள்ளிடவும்'}
                />
              </div>
              
              <div>
                <Label htmlFor="remarks">
                  {language === 'english' ? 'Remarks' : 'குறிப்புகள்'}
                </Label>
                <Input
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder={language === 'english' ? 'Any additional notes' : 'கூடுதல் குறிப்புகள்'}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (language === 'english' ? 'Creating...' : 'உருவாக்குகிறது...') : 
                   (language === 'english' ? 'Create Entry' : 'பதிவு உருவாக்கவும்')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/transit')} 
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

export default MobileOutwardEntryForm;