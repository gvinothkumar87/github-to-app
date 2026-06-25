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
import { getFinancialYear } from "@/utils/financialYear";

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
    start_bill_no: setting?.start_bill_no?.toString() || '1',
    start_debit_note_no: setting?.start_debit_note_no?.toString() || '1',
    start_credit_note_no: setting?.start_credit_note_no?.toString() || '1',
    bill_prefix: setting?.bill_prefix || '',
    bill_digits: setting?.bill_digits?.toString() || '3',
    financial_year_in_serial: setting?.financial_year_in_serial ?? false,
    debit_note_prefix: setting?.debit_note_prefix || '',
    debit_note_digits: setting?.debit_note_digits?.toString() || '3',
    debit_note_financial_year_in_serial: setting?.debit_note_financial_year_in_serial ?? false,
    credit_note_prefix: setting?.credit_note_prefix || '',
    credit_note_digits: setting?.credit_note_digits?.toString() || '3',
    credit_note_financial_year_in_serial: setting?.credit_note_financial_year_in_serial ?? false,
    einvoice_enabled: setting?.einvoice_enabled ?? false,
    einvoice_aspid: setting?.einvoice_aspid || '',
    einvoice_asppassword: setting?.einvoice_asppassword || '',
    einvoice_username: setting?.einvoice_username || '',
    einvoice_password: setting?.einvoice_password || '',
    einvoice_sandbox: setting?.einvoice_sandbox ?? true,
    ewaybill_enabled: setting?.ewaybill_enabled ?? false,
    ewaybill_password: setting?.ewaybill_password || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        pin_code: parseInt(formData.pin_code) || 0,
        start_bill_no: parseInt(formData.start_bill_no) || 1,
        start_debit_note_no: parseInt(formData.start_debit_note_no) || 1,
        start_credit_note_no: parseInt(formData.start_credit_note_no) || 1,
        bill_prefix: formData.bill_prefix || null,
        bill_digits: parseInt(formData.bill_digits) || 3,
        financial_year_in_serial: formData.financial_year_in_serial,
        debit_note_prefix: formData.debit_note_prefix || null,
        debit_note_digits: parseInt(formData.debit_note_digits) || 3,
        debit_note_financial_year_in_serial: formData.debit_note_financial_year_in_serial,
        credit_note_prefix: formData.credit_note_prefix || null,
        credit_note_digits: parseInt(formData.credit_note_digits) || 3,
        credit_note_financial_year_in_serial: formData.credit_note_financial_year_in_serial,
        einvoice_enabled: formData.einvoice_enabled,
        einvoice_aspid: formData.einvoice_aspid || null,
        einvoice_asppassword: formData.einvoice_asppassword || null,
        einvoice_username: formData.einvoice_username || null,
        einvoice_password: formData.einvoice_password || null,
        einvoice_sandbox: formData.einvoice_sandbox,
        ewaybill_enabled: formData.ewaybill_enabled,
        ewaybill_password: formData.ewaybill_password || null,
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
                onChange={(e) => setFormData({ ...formData, location_code: e.target.value.toUpperCase() })}
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
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
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
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, bank_account_no: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase() })}
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
                onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                placeholder={language === 'english' ? 'Enter branch name' : 'கிளை பெயரை உள்ளிடுக'}
              />
            </div>
          </div>

          <div className="col-span-full space-y-4">
            <h3 className="font-semibold mb-2">{language === 'english' ? 'Sequence Configuration' : 'தொடர் வரியமைப்பு'}</h3>

            <div className="border p-4 rounded-md space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Bill Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bill_prefix">
                    {language === 'english' ? 'Prefix (e.g. GRM, PUL)' : 'முன்னொட்டு (எ.கா. GRM, PUL)'}
                  </Label>
                  <Input
                    id="bill_prefix"
                    value={formData.bill_prefix}
                    onChange={(e) => setFormData({ ...formData, bill_prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g. GRM"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'english'
                      ? 'Base prefix only — do NOT include year (e.g. GRM, not GRM-25-26)'
                      : 'மூல முன்னொட்டு மட்டும் — ஆண்டு சேர்க்க வேண்டாம் (எ.கா. GRM)'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bill_digits">
                    {language === 'english' ? 'Digits' : 'இலக்கங்கள்'}
                  </Label>
                  <Input
                    id="bill_digits"
                    type="number"
                    value={formData.bill_digits}
                    onChange={(e) => setFormData({ ...formData, bill_digits: e.target.value })}
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_bill_no">
                    {language === 'english' ? 'Start No' : 'தொடக்க எண்'}
                  </Label>
                  <Input
                    id="start_bill_no"
                    type="number"
                    value={formData.start_bill_no}
                    onChange={(e) => setFormData({ ...formData, start_bill_no: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>
              {/* Financial Year in Serial toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  id="financial_year_in_serial"
                  type="checkbox"
                  checked={formData.financial_year_in_serial}
                  onChange={(e) => setFormData({ ...formData, financial_year_in_serial: e.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <div>
                  <Label htmlFor="financial_year_in_serial" className="cursor-pointer font-medium">
                    {language === 'english'
                      ? 'Include Financial Year in Bill No'
                      : 'பில் எண்ணில் நிதியாண்டு சேர்க்கவும்'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === 'english'
                      ? `Preview: ${formData.bill_prefix ? `${formData.bill_prefix}-${getFinancialYear()}-001` : '001'} → resets to 001 each April 1`
                      : `மாதிரி: ${formData.bill_prefix ? `${formData.bill_prefix}-${getFinancialYear()}-001` : '001'} → ஒவ்வொரு ஏப்ரல் 1-ம் 001 இலிருந்து தொடங்கும்`}
                  </p>
                </div>
              </div>
            </div>

            <div className="border p-4 rounded-md space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Debit Note Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="debit_note_prefix">Prefix</Label>
                  <Input
                    id="debit_note_prefix"
                    value={formData.debit_note_prefix}
                    onChange={(e) => setFormData({ ...formData, debit_note_prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g. DN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="debit_note_digits">Digits</Label>
                  <Input
                    id="debit_note_digits"
                    type="number"
                    value={formData.debit_note_digits}
                    onChange={(e) => setFormData({ ...formData, debit_note_digits: e.target.value })}
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_debit_note_no">Start No</Label>
                  <Input
                    id="start_debit_note_no"
                    type="number"
                    value={formData.start_debit_note_no}
                    onChange={(e) => setFormData({ ...formData, start_debit_note_no: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>
              {/* Financial Year in Serial toggle for Debit Note */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  id="debit_note_financial_year_in_serial"
                  type="checkbox"
                  checked={formData.debit_note_financial_year_in_serial}
                  onChange={(e) => setFormData({ ...formData, debit_note_financial_year_in_serial: e.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <div>
                  <Label htmlFor="debit_note_financial_year_in_serial" className="cursor-pointer font-medium">
                    {language === 'english'
                      ? 'Include Financial Year in Debit Note No'
                      : 'டெபிட் நோட் எண்ணில் நிதியாண்டு சேர்க்கவும்'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === 'english'
                      ? `Preview: ${formData.debit_note_prefix ? `${formData.debit_note_prefix}-${getFinancialYear()}-001` : '001'} → resets to 001 each April 1`
                      : `மாதிரி: ${formData.debit_note_prefix ? `${formData.debit_note_prefix}-${getFinancialYear()}-001` : '001'} → ஒவ்வொரு ஏப்ரல் 1-ம் 001 இலிருந்து தொடங்கும்`}
                  </p>
                </div>
              </div>
            </div>

            <div className="border p-4 rounded-md space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Credit Note Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credit_note_prefix">Prefix</Label>
                  <Input
                    id="credit_note_prefix"
                    value={formData.credit_note_prefix}
                    onChange={(e) => setFormData({ ...formData, credit_note_prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g. CN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_note_digits">Digits</Label>
                  <Input
                    id="credit_note_digits"
                    type="number"
                    value={formData.credit_note_digits}
                    onChange={(e) => setFormData({ ...formData, credit_note_digits: e.target.value })}
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_credit_note_no">Start No</Label>
                  <Input
                    id="start_credit_note_no"
                    type="number"
                    value={formData.start_credit_note_no}
                    onChange={(e) => setFormData({ ...formData, start_credit_note_no: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>
              {/* Financial Year in Serial toggle for Credit Note */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  id="credit_note_financial_year_in_serial"
                  type="checkbox"
                  checked={formData.credit_note_financial_year_in_serial}
                  onChange={(e) => setFormData({ ...formData, credit_note_financial_year_in_serial: e.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <div>
                  <Label htmlFor="credit_note_financial_year_in_serial" className="cursor-pointer font-medium">
                    {language === 'english'
                      ? 'Include Financial Year in Credit Note No'
                      : 'கிரெடிட் நோட் எண்ணில் நிதியாண்டு சேர்க்கவும்'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === 'english'
                      ? `Preview: ${formData.credit_note_prefix ? `${formData.credit_note_prefix}-${getFinancialYear()}-001` : '001'} → resets to 001 each April 1`
                      : `மாதிரி: ${formData.credit_note_prefix ? `${formData.credit_note_prefix}-${getFinancialYear()}-001` : '001'} → ஒவ்வொரு ஏப்ரல் 1-ம் 001 இலிருந்து தொடங்கும்`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* E-Invoice & E-Way Bill Configuration */}
          <div className="border p-4 rounded-md space-y-4">
            <h3 className="font-semibold text-base mb-2">
              {language === 'english' ? 'E-Invoice & E-Way Bill Configuration' : 'ஈ-இன்வாய்ஸ் & ஈ-வே பில் வரியமைப்பு'}
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 pt-2">
                <input
                  id="einvoice_enabled"
                  type="checkbox"
                  checked={formData.einvoice_enabled}
                  onChange={(e) => setFormData({ ...formData, einvoice_enabled: e.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <div>
                  <Label htmlFor="einvoice_enabled" className="cursor-pointer font-medium">
                    {language === 'english' ? 'Enable Automated E-Invoice & Combined E-Way Bill' : 'தானியங்கி ஈ-இன்வாய்ஸ் & ஒருங்கிணைந்த ஈ-வே பில் செயல்படுத்தவும்'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === 'english' 
                      ? 'Enable direct API integration with GSP for automated e-invoice and combined e-way bill generation.'
                      : 'விற்பனையில் தானியங்கி ஈ-இன்வாய்ஸ் மற்றும் ஒருங்கிணைந்த ஈ-வே பில் உருவாக்க ஜிஎஸ்டிஎன் நேரடி ஒருங்கிணைப்பை செயல்படுத்தவும்.'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  id="ewaybill_enabled"
                  type="checkbox"
                  checked={formData.ewaybill_enabled}
                  onChange={(e) => setFormData({ ...formData, ewaybill_enabled: e.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <div>
                  <Label htmlFor="ewaybill_enabled" className="cursor-pointer font-medium">
                    {language === 'english' ? 'Enable Standalone E-Way Bill API' : 'தனியான ஈ-வே பில் ஏபிஐ செயல்படுத்தவும்'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === 'english' 
                      ? 'Enable standalone E-Way Bill generation directly via TaxPro E-Way Bill API.'
                      : 'தானியங்கி தனியான ஈ-வே பில் உருவாக்க நேரடி ஈ-வே பில் ஏபிஐ ஒருங்கிணைப்பை செயல்படுத்தவும்.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {(formData.einvoice_enabled || formData.ewaybill_enabled) && (
              <div className="space-y-4 pt-4 border-t mt-2">
                <div className="flex items-center gap-3">
                  <input
                    id="einvoice_sandbox"
                    type="checkbox"
                    checked={formData.einvoice_sandbox}
                    onChange={(e) => setFormData({ ...formData, einvoice_sandbox: e.target.checked })}
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  <div>
                    <Label htmlFor="einvoice_sandbox" className="cursor-pointer font-medium">
                      {language === 'english' ? 'Use Sandbox (Testing) Mode' : 'சாண்ட்பாக்ஸ் (சோதனை) பயன்முறையைப் பயன்படுத்தவும்'}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {language === 'english' ? 'Uses GSP sandbox endpoints for testing instead of production.' : 'தயாரிப்புக்கு பதிலாக சோதனைக்கான ஜிஎஸ்டிஎன் சாண்ட்பாக்ஸ் முனைகளைப் பயன்படுத்துகிறது.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="einvoice_aspid">GSP ASP ID</Label>
                    <Input
                      id="einvoice_aspid"
                      value={formData.einvoice_aspid}
                      onChange={(e) => setFormData({ ...formData, einvoice_aspid: e.target.value })}
                      placeholder="e.g. 16******18"
                      required={formData.einvoice_enabled || formData.ewaybill_enabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="einvoice_asppassword">GSP ASP Password</Label>
                    <Input
                      id="einvoice_asppassword"
                      type="password"
                      value={formData.einvoice_asppassword}
                      onChange={(e) => setFormData({ ...formData, einvoice_asppassword: e.target.value })}
                      placeholder="Enter ASP password"
                      required={formData.einvoice_enabled || formData.ewaybill_enabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="einvoice_username">NIC Portal API User Name</Label>
                    <Input
                      id="einvoice_username"
                      value={formData.einvoice_username}
                      onChange={(e) => setFormData({ ...formData, einvoice_username: e.target.value })}
                      placeholder="e.g. TaxProEnvPON"
                      required={formData.einvoice_enabled || formData.ewaybill_enabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="einvoice_password">E-Invoice API Password (eInvPwd)</Label>
                    <Input
                      id="einvoice_password"
                      type="password"
                      value={formData.einvoice_password}
                      onChange={(e) => setFormData({ ...formData, einvoice_password: e.target.value })}
                      placeholder="Enter e-invoice API password"
                      required={formData.einvoice_enabled}
                      disabled={!formData.einvoice_enabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ewaybill_password">E-Way Bill API Password (ewbpwd)</Label>
                    <Input
                      id="ewaybill_password"
                      type="password"
                      value={formData.ewaybill_password}
                      onChange={(e) => setFormData({ ...formData, ewaybill_password: e.target.value })}
                      placeholder="Enter e-way bill API password"
                      required={formData.ewaybill_enabled}
                      disabled={!formData.ewaybill_enabled}
                    />
                  </div>
                </div>
              </div>
            )}
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