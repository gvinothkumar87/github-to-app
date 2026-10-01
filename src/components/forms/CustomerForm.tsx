import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Customer, CustomerShipAddress } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

type ShipAddressFormRow = {
  id?: string;
  label: string;
  name: string;
  address_english: string;
  address_tamil: string;
  pin_code: string;
  state_code: string;
  place_of_supply: string;
  gstin: string;
  phone: string;
  is_default: boolean;
  is_active: boolean;
};

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSuccess, onCancel }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [shipAddresses, setShipAddresses] = useState<ShipAddressFormRow[]>([]);
  const [deletedShipAddressIds, setDeletedShipAddressIds] = useState<string[]>([]);

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
    opening_balance: customer?.opening_balance || 0,
  });

  useEffect(() => {
    if (!customer) {
      generateCustomerCode();
    } else {
      fetchShipAddresses(customer.id);
    }
  }, [customer]);

  const emptyShipAddress = (): ShipAddressFormRow => ({
    label: '',
    name: '',
    address_english: '',
    address_tamil: '',
    pin_code: '',
    state_code: formData.state_code || '33',
    place_of_supply: formData.place_of_supply || formData.state_code || '33',
    gstin: '',
    phone: '',
    is_default: shipAddresses.length === 0,
    is_active: true,
  });

  const fetchShipAddresses = async (customerId: string) => {
    const { data, error } = await supabase
      .from('customer_ship_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('label');

    if (error) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
      return;
    }

    setShipAddresses((data || []).map((addr: CustomerShipAddress) => ({
      id: addr.id,
      label: addr.label || '',
      name: addr.name || '',
      address_english: addr.address_english || '',
      address_tamil: addr.address_tamil || '',
      pin_code: addr.pin_code || '',
      state_code: addr.state_code || '',
      place_of_supply: addr.place_of_supply || '',
      gstin: addr.gstin || '',
      phone: addr.phone || '',
      is_default: !!addr.is_default,
      is_active: addr.is_active !== false,
    })));
  };

  const updateShipAddress = (index: number, field: keyof ShipAddressFormRow, value: string | boolean) => {
    setShipAddresses(prev => prev.map((addr, i) => {
      if (i !== index) return field === 'is_default' && value === true ? { ...addr, is_default: false } : addr;
      return { ...addr, [field]: value };
    }));
  };

  const removeShipAddress = (index: number) => {
    setShipAddresses(prev => {
      const removed = prev[index];
      if (removed?.id) setDeletedShipAddressIds(ids => [...ids, removed.id!]);
      const remaining = prev.filter((_, i) => i !== index);
      if (removed?.is_default && remaining.length > 0 && !remaining.some(addr => addr.is_default)) {
        remaining[0] = { ...remaining[0], is_default: true };
      }
      return remaining;
    });
  };

  const saveShipAddresses = async (customerId: string) => {
    if (deletedShipAddressIds.length > 0) {
      const { error } = await supabase
        .from('customer_ship_addresses')
        .delete()
        .in('id', deletedShipAddressIds);
      if (error) throw error;
    }

    const validRows = shipAddresses
      .map((addr, index) => ({ ...addr, is_default: addr.is_default || (index === 0 && !shipAddresses.some(a => a.is_default)) }))
      .filter(addr => addr.label.trim() || addr.address_english.trim());

    if (validRows.some(addr => addr.is_default)) {
      const { error } = await supabase
        .from('customer_ship_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId);
      if (error) throw error;
    }

    for (const addr of validRows) {
      const values = {
        customer_id: customerId,
        label: addr.label.trim() || 'Ship To',
        name: addr.name.trim() || null,
        address_english: addr.address_english.trim(),
        address_tamil: addr.address_tamil.trim() || null,
        pin_code: addr.pin_code.trim() || null,
        state_code: addr.state_code.trim() || null,
        place_of_supply: addr.place_of_supply.trim() || addr.state_code.trim() || null,
        gstin: addr.gstin.trim() || null,
        phone: addr.phone.trim() || null,
        is_default: addr.is_default,
        is_active: addr.is_active,
      };

      if (!values.address_english) {
        throw new Error('Ship-to address is required when a ship-to label is entered.');
      }

      const result = addr.id
        ? await supabase.from('customer_ship_addresses').update(values).eq('id', addr.id)
        : await supabase.from('customer_ship_addresses').insert(values);
      if (result.error) throw result.error;
    }
  };

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
      let customerId = customer?.id;
      if (customer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', customer.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert([formData])
          .select('id')
          .single();
        
        if (error) throw error;
        customerId = data.id;
      }

      if (customerId) {
        await saveShipAddresses(customerId);
      }

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: customer
          ? (language === 'english' ? 'Customer updated successfully' : 'வாடிக்கையாளர் வெற்றிகரமாக புதுப்பிக்கப்பட்டது')
          : (language === 'english' ? 'Customer created successfully' : 'வாடிக்கையாளர் வெற்றிகரமாக உருவாக்கப்பட்டது'),
      });
      
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
            <Label htmlFor="opening_balance">
              {language === 'english' ? 'Opening Balance' : 'தொடக்க இருப்பு'}
            </Label>
            <Input
              id="opening_balance"
              type="number"
              step="0.01"
              value={formData.opening_balance}
              onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
              placeholder={language === 'english' ? 'Enter opening balance' : 'தொடக்க இருப்பை உள்ளிடவும்'}
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

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-base font-semibold">
                  {language === 'english' ? 'Ship To Addresses' : 'அனுப்பும் முகவரிகள்'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'english'
                    ? 'Add separate delivery addresses for bills, e-invoice and e-way bill.'
                    : 'பில், இ-இன்வாய்ஸ், இ-வே பில் பயன்பாட்டுக்கு தனி முகவரிகள் சேர்க்கவும்.'}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setShipAddresses(prev => [...prev, emptyShipAddress()])}>
                {language === 'english' ? 'Add Ship To' : 'முகவரி சேர்க்கவும்'}
              </Button>
            </div>

            {shipAddresses.map((addr, index) => (
              <div key={addr.id || index} className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{language === 'english' ? 'Label' : 'பெயர்'}</Label>
                    <Input value={addr.label} onChange={(e) => updateShipAddress(index, 'label', e.target.value)} placeholder="Factory / Branch / Site" />
                  </div>
                  <div>
                    <Label>{language === 'english' ? 'Ship To Name' : 'பெறுநர் பெயர்'}</Label>
                    <Input value={addr.name} onChange={(e) => updateShipAddress(index, 'name', e.target.value)} placeholder={formData.name_english} />
                  </div>
                  <div>
                    <Label>{language === 'english' ? 'GSTIN' : 'ஜிஎஸ்டிஎன்'}</Label>
                    <Input value={addr.gstin} onChange={(e) => updateShipAddress(index, 'gstin', e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <Label>{language === 'english' ? 'Phone' : 'தொலைபேசி'}</Label>
                    <Input value={addr.phone} onChange={(e) => updateShipAddress(index, 'phone', e.target.value)} />
                  </div>
                  <div>
                    <Label>{language === 'english' ? 'Pin Code' : 'அஞ்சல் குறியீடு'}</Label>
                    <Input value={addr.pin_code} maxLength={6} onChange={(e) => updateShipAddress(index, 'pin_code', e.target.value)} />
                  </div>
                  <div>
                    <Label>{language === 'english' ? 'State Code' : 'மாநில குறியீடு'}</Label>
                    <Input value={addr.state_code} maxLength={2} onChange={(e) => updateShipAddress(index, 'state_code', e.target.value)} />
                  </div>
                  <div>
                    <Label>{language === 'english' ? 'Place of Supply' : 'விநியோக இடம்'}</Label>
                    <Input value={addr.place_of_supply} maxLength={2} onChange={(e) => updateShipAddress(index, 'place_of_supply', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>{language === 'english' ? 'Address (English)' : 'முகவரி (ஆங்கிலம்)'}</Label>
                  <Textarea value={addr.address_english} onChange={(e) => updateShipAddress(index, 'address_english', e.target.value)} rows={2} />
                </div>
                <div>
                  <Label>{language === 'english' ? 'Address (Tamil)' : 'முகவரி (தமிழ்)'}</Label>
                  <Textarea value={addr.address_tamil} onChange={(e) => updateShipAddress(index, 'address_tamil', e.target.value)} rows={2} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={addr.is_default} onCheckedChange={(checked) => updateShipAddress(index, 'is_default', checked === true)} />
                      {language === 'english' ? 'Default' : 'இயல்புநிலை'}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={addr.is_active} onCheckedChange={(checked) => updateShipAddress(index, 'is_active', checked === true)} />
                      {language === 'english' ? 'Active' : 'செயலில்'}
                    </label>
                  </div>
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeShipAddress(index)}>
                    {language === 'english' ? 'Remove' : 'நீக்கு'}
                  </Button>
                </div>
              </div>
            ))}
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
