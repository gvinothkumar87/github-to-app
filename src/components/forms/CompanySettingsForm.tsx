import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { CompanySetting } from "@/types/company";

interface CompanySettingsFormProps {
  setting?: CompanySetting;
  onSuccess: () => void;
  onCancel: () => void;
}

const CompanySettingsForm: React.FC<CompanySettingsFormProps> = ({
  setting,
  onSuccess,
  onCancel,
}) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    location_code: setting?.location_code || '',
    location_name: setting?.location_name || '',
    company_name: setting?.company_name || '',
    gstin: setting?.gstin || '',
    address_line1: setting?.address_line1 || '',
    address_line2: setting?.address_line2 || '',
    locality: setting?.locality || '',
    pin_code: setting?.pin_code?.toString() || '',
    state_code: setting?.state_code || '33',
    phone: setting?.phone || '',
    email: setting?.email || '',
    bank_name: setting?.bank_name || '',
    bank_account_no: setting?.bank_account_no || '',
    bank_ifsc: setting?.bank_ifsc || '',
    bank_branch: setting?.bank_branch || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        pin_code: parseInt(formData.pin_code) || 0,
        is_active: true,
      };

      if (setting) {
        const { error } = await supabase
          .from('company_settings')
          .update(submitData)
          .eq('id', setting.id);

        if (error) throw error;

        toast({
          title: language === 'english' ? "Success" : "வெற்றி",
          description: language === 'english' 
            ? "Company settings updated successfully!" 
            : "நிறுவன அமைப்புகள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன!",
        });
      } else {
        const { error } = await supabase
          .from('company_settings')
          .insert([submitData]);

        if (error) throw error;

        toast({
          title: language === 'english' ? "Success" : "வெற்றி",
          description: language === 'english' 
            ? "Company settings added successfully!" 
            : "நிறுவன அமைப்புகள் வெற்றிகரமாக சேர்க்கப்பட்டன!",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        title: language === 'english' ? "Error" : "பிழை",
        description: language === 'english' 
          ? "Failed to save company settings. Please try again." 
          : "நிறுவன அமைப்புகளை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {setting 
            ? (language === 'english' ? 'Edit Company Settings' : 'நிறுவன அமைப்புகளை திருத்து')
            : (language === 'english' ? 'Add Company Settings' : 'நிறுவன அமைப்புகளை சேர்')
          }
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location_code">
                {language === 'english' ? 'Location Code' : 'இட குறியீடு'}
              </Label>
              <Input
                id="location_code"
                value={formData.location_code}
                onChange={(e) => setFormData({...formData, location_code: e.target.value.toUpperCase()})}
                placeholder={language === 'english' ? 'Enter location code (e.g., PULIVANTHI)' : 'இட குறியீட்டை உள்ளிடுக'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_name">
                {language === 'english' ? 'Location Name' : 'இட பெயர்'}
              </Label>
              <Input
                id="location_name"
                value={formData.location_name}
                onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                placeholder={language === 'english' ? 'Enter location name' : 'இட பெயரை உள்ளிடுக'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">
                {language === 'english' ? 'Company Name' : 'நிறுவன பெயர்'}
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                placeholder={language === 'english' ? 'Enter company name' : 'நிறுவன பெயரை உள்ளிடுக'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">
                {language === 'english' ? 'GSTIN' : 'ஜிஎஸ்டிஎன்'}
              </Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) => setFormData({...formData, gstin: e.target.value.toUpperCase()})}
                placeholder={language === 'english' ? 'Enter GSTIN' : 'ஜிஎஸ்டிஎன் உள்ளிடுக'}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1">
                {language === 'english' ? 'Address Line 1' : 'முகவரி வரி 1'}
              </Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => setFormData({...formData, address_line1: e.target.value})}
                placeholder={language === 'english' ? 'Enter address line 1' : 'முகவரி வரி 1 ஐ உள்ளிடுக'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">
                {language === 'english' ? 'Address Line 2' : 'முகவரி வரி 2'}
              </Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => setFormData({...formData, address_line2: e.target.value})}
                placeholder={language === 'english' ? 'Enter address line 2' : 'முகவரி வரி 2 ஐ உள்ளிடுக'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locality">
                  {language === 'english' ? 'Locality' : 'வட்டாரம்'}
                </Label>
                <Input
                  id="locality"
                  value={formData.locality}
                  onChange={(e) => setFormData({...formData, locality: e.target.value})}
                  placeholder={language === 'english' ? 'Enter locality' : 'வட்டாரத்தை உள்ளிடுக'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin_code">
                  {language === 'english' ? 'Pin Code' : 'அஞ்சல் குறியீடு'}
                </Label>
                <Input
                  id="pin_code"
                  value={formData.pin_code}
                  onChange={(e) => setFormData({...formData, pin_code: e.target.value})}
                  placeholder={language === 'english' ? 'Enter PIN code' : 'PIN குறியீட்டை உள்ளிடுக'}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state_code">
                  {language === 'english' ? 'State Code' : 'மாநில குறியீடு'}
                </Label>
                <Input
                  id="state_code"
                  value={formData.state_code}
                  onChange={(e) => setFormData({...formData, state_code: e.target.value})}
                  placeholder={language === 'english' ? 'State code' : 'மாநில குறியீடு'}
                  maxLength={2}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                {language === 'english' ? 'Phone' : 'தொலைபேசி'}
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder={language === 'english' ? 'Enter phone number' : 'தொலைபேசி எண்ணை உள்ளிடுக'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {language === 'english' ? 'Email' : 'மின்னஞ்சல்'}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder={language === 'english' ? 'Enter email address' : 'மின்னஞ்சல் முகவரியை உள்ளிடுக'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">
                {language === 'english' ? 'Bank Name' : 'வங்கி பெயர்'}
              </Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                placeholder={language === 'english' ? 'Enter bank name' : 'வங்கி பெயரை உள்ளிடுக'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account_no">
                {language === 'english' ? 'Account Number' : 'கணக்கு எண்'}
              </Label>
              <Input
                id="bank_account_no"
                value={formData.bank_account_no}
                onChange={(e) => setFormData({...formData, bank_account_no: e.target.value})}
                placeholder={language === 'english' ? 'Enter account number' : 'கணக்கு எண்ணை உள்ளிடுக'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_ifsc">
                {language === 'english' ? 'IFSC Code' : 'ஐஎஃப்எஸ்சி குறியீடு'}
              </Label>
              <Input
                id="bank_ifsc"
                value={formData.bank_ifsc}
                onChange={(e) => setFormData({...formData, bank_ifsc: e.target.value.toUpperCase()})}
                placeholder={language === 'english' ? 'Enter IFSC code' : 'ஐஎஃப்எஸ்சி குறியீட்டை உள்ளிடுக'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_branch">
                {language === 'english' ? 'Branch' : 'கிளை'}
              </Label>
              <Input
                id="bank_branch"
                value={formData.bank_branch}
                onChange={(e) => setFormData({...formData, bank_branch: e.target.value})}
                placeholder={language === 'english' ? 'Enter branch name' : 'கிளை பெயரை உள்ளிடுக'}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading 
                ? (language === 'english' ? 'Saving...' : 'சேமிக்கப்படுகிறது...')
                : setting 
                  ? (language === 'english' ? 'Update Settings' : 'அமைப்புகளை புதுப்பிக்கவும்')
                  : (language === 'english' ? 'Save Settings' : 'அமைப்புகளை சேமிக்கவும்')
              }
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              {language === 'english' ? 'Cancel' : 'ரத்து'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompanySettingsForm;