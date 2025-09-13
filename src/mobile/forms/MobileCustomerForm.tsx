import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { MobileLayout } from '../components/MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { ArrowLeft } from 'lucide-react';

interface MobileCustomerFormProps {
  customerId?: string;
}

const MobileCustomerForm: React.FC<MobileCustomerFormProps> = ({ customerId }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { create, update, findById, isServicesReady } = useEnhancedOfflineData('customers', [], { autoSync: true });

  const [formData, setFormData] = useState({
    name_english: '',
    name_tamil: '',
    code: '',
    contact_person: '',
    phone: '',
    email: '',
    address_english: '',
    address_tamil: '',
    gstin: '',
    pin_code: '',
    state_code: '33',
    place_of_supply: '33',
  });

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    } else {
      generateCustomerCode();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    if (!customerId) return;
    try {
      const customer = await findById(customerId);
      if (customer) {
        setFormData(customer as any);
      }
    } catch (error) {
      console.error('Error loading customer:', error);
    }
  };

  const generateCustomerCode = () => {
    const timestamp = Date.now();
    const code = `CUST${timestamp.toString().slice(-6)}`;
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (customerId) {
        await update(customerId, formData);
        toast({
          title: language === 'english' ? 'Success' : 'வெற்றி',
          description: language === 'english' ? 'Customer updated successfully' : 'வாடிக்கையாளர் வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
        });
      } else {
        await create(formData);
        toast({
          title: language === 'english' ? 'Success' : 'வெற்றி',
          description: language === 'english' ? 'Customer created successfully' : 'வாடிக்கையாளர் வெற்றிகரமாக உருவாக்கப்பட்டது',
        });
      }
      
      navigate('/customers');
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
    <MobileLayout title={customerId ? 'Edit Customer' : 'New Customer'}>
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/customers')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'english' ? 'Back' : 'பின்'}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>
              {customerId
                ? (language === 'english' ? 'Edit Customer' : 'வாடிக்கையாளரை திருத்து')
                : (language === 'english' ? 'Add New Customer' : 'புதிய வாடிக்கையாளரை சேர்க்கவும்')
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name_english">
                  {language === 'english' ? 'Name (English)' : 'பெயர் (ஆங்கிலம்)'} *
                </Label>
                <Input
                  id="name_english"
                  value={formData.name_english}
                  onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
                  required
                  placeholder={language === 'english' ? 'Enter customer name' : 'வாடிக்கையாளர் பெயரை உள்ளிடவும்'}
                />
              </div>
              
              <div>
                <Label htmlFor="name_tamil">
                  {language === 'english' ? 'Name (Tamil)' : 'பெயர் (தமிழ்)'}
                </Label>
                <Input
                  id="name_tamil"
                  value={formData.name_tamil}
                  onChange={(e) => setFormData({ ...formData, name_tamil: e.target.value })}
                  placeholder={language === 'english' ? 'Enter name in Tamil' : 'தமிழில் பெயரை உள்ளிடவும்'}
                />
              </div>
              
              <div>
                <Label htmlFor="code">
                  {language === 'english' ? 'Customer Code' : 'வாடிக்கையாளர் குறியீடு'} *
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  readOnly
                  className="bg-muted"
                  placeholder={language === 'english' ? 'Auto-generated' : 'தானாக உருவாக்கப்பட்டது'}
                />
              </div>
              
              <div>
                <Label htmlFor="contact_person">
                  {language === 'english' ? 'Contact Person' : 'தொடர்புக்கான நபர்'}
                </Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder={language === 'english' ? 'Contact person name' : 'தொடர்புக்கான நபரின் பெயர்'}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">
                  {language === 'english' ? 'Phone Number' : 'தொலைபேசி எண்'}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={language === 'english' ? 'Phone number' : 'தொலைபேசி எண்'}
                />
              </div>
              
              <div>
                <Label htmlFor="email">
                  {language === 'english' ? 'Email' : 'மின்னஞ்சல்'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={language === 'english' ? 'Email address' : 'மின்னஞ்சல் முகவரி'}
                />
              </div>
              
              <div>
                <Label htmlFor="address_english">
                  {language === 'english' ? 'Address (English)' : 'முகவரி (ஆங்கிலம்)'}
                </Label>
                <Textarea
                  id="address_english"
                  value={formData.address_english}
                  onChange={(e) => setFormData({ ...formData, address_english: e.target.value })}
                  placeholder={language === 'english' ? 'Enter address' : 'முகவரியை உள்ளிடவும்'}
                  rows={2}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (language === 'english' ? 'Saving...' : 'சேமிக்கிறது...') : 
                   (customerId ? (language === 'english' ? 'Update' : 'புதுப்பிக்கவும்') :
                    (language === 'english' ? 'Create' : 'உருவாக்கவும்'))}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/customers')} 
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

export default MobileCustomerForm;