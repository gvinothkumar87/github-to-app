import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types';

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSuccess, onCancel }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name_english: customer?.name_english || '',
    name_tamil: customer?.name_tamil || '',
    code: customer?.code || '',
    contact_person: customer?.contact_person || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address_english: customer?.address_english || '',
    address_tamil: customer?.address_tamil || '',
    gstin: customer?.gstin || '',
    pin_code: customer?.pin_code || '',
    state_code: customer?.state_code || '33',
    place_of_supply: customer?.place_of_supply || '33',
  });

  useEffect(() => {
    if (!customer) {
      generateCustomerCode();
    }
  }, [customer]);

  const generateCustomerCode = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('code')
        .like('code', 'CUST%')
        .order('code', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastCode = data[0].code;
        const numberPart = lastCode.replace('CUST', '');
        nextNumber = parseInt(numberPart) + 1;
      }
      
      const newCode = `CUST${nextNumber.toString().padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, code: newCode }));
    } catch (error) {
      console.error('Error generating customer code:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (customer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', customer.id);
        
        if (error) throw error;
        
        toast({
          title: language === 'english' ? 'Success' : 'வெற்றி',
          description: language === 'english' ? 'Customer updated successfully' : 'வாடிக்கையாளர் வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
        });
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([formData]);
        
        if (error) throw error;
        
        toast({
          title: language === 'english' ? 'Success' : 'வெற்றி',
          description: language === 'english' ? 'Customer created successfully' : 'வாடிக்கையாளர் வெற்றிகரமாக உருவாக்கப்பட்டது',
        });
      }
      
      onSuccess();
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
    <Card className="w-full max-w-2xl mx-auto shadow-card">
      <CardHeader>
        <CardTitle>
          {customer
            ? (language === 'english' ? 'Edit Customer' : 'வாடிக்கையாளரை திருத்து')
            : (language === 'english' ? 'Add New Customer' : 'புதிய வாடிக்கையாளரை சேர்க்கவும்')
          }
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="gstin">
                {language === 'english' ? 'GSTIN' : 'ஜிஎஸ்டிஎன்'}
              </Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder={language === 'english' ? 'GST Number' : 'ஜிஎஸ்டி எண்'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pin_code">
                {language === 'english' ? 'Pin Code' : 'அஞ்சல் குறியீடு'}
              </Label>
              <Input
                id="pin_code"
                value={formData.pin_code}
                onChange={(e) => setFormData({...formData, pin_code: e.target.value})}
                placeholder={language === 'english' ? 'Enter 6-digit PIN code' : '6 இலக்க PIN குறியீட்டை உள்ளிடுக'}
                maxLength={6}
                pattern="[0-9]{6}"
              />
            </div>

            <div>
              <Label htmlFor="state_code">
                {language === 'english' ? 'State Code' : 'மாநில குறியீடு'}
              </Label>
              <Input
                id="state_code"
                value={formData.state_code}
                onChange={(e) => setFormData({...formData, state_code: e.target.value})}
                placeholder={language === 'english' ? 'State code (e.g., 33)' : 'மாநில குறியீடு (எ.கா., 33)'}
                maxLength={2}
              />
            </div>

            <div>
              <Label htmlFor="place_of_supply">
                {language === 'english' ? 'Place of Supply' : 'விநியோக இடம்'}
              </Label>
              <Input
                id="place_of_supply"
                value={formData.place_of_supply}
                onChange={(e) => setFormData({...formData, place_of_supply: e.target.value})}
                placeholder={language === 'english' ? 'Place of supply code' : 'விநியோக இட குறியீடு'}
                maxLength={2}
              />
            </div>
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
          
          <div>
            <Label htmlFor="address_tamil">
              {language === 'english' ? 'Address (Tamil)' : 'முகவரி (தமிழ்)'}
            </Label>
            <Textarea
              id="address_tamil"
              value={formData.address_tamil}
              onChange={(e) => setFormData({ ...formData, address_tamil: e.target.value })}
              placeholder={language === 'english' ? 'Enter address in Tamil' : 'தமிழில் முகவரியை உள்ளிடவும்'}
              rows={2}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (language === 'english' ? 'Saving...' : 'சேமிக்கிறது...') : 
               (customer ? (language === 'english' ? 'Update' : 'புதுப்பிக்கவும்') :
                (language === 'english' ? 'Create' : 'உருவாக்கவும்'))}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              {language === 'english' ? 'Cancel' : 'ரத்து செய்'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};