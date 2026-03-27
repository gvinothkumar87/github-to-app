import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import CompanySettingsForm from '@/components/forms/CompanySettingsForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { CompanySetting } from '@/types/company';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const CompanySettings = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<CompanySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSetting, setEditingSetting] = useState<CompanySetting | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .order('location_name');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleEdit = (setting: CompanySetting) => {
    setEditingSetting(setting);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingSetting(undefined);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    fetchSettings();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSetting(undefined);
  };

  if (showForm) {
    return (
      <PageLayout title={language === 'english' ? 'Company Settings' : 'நிறுவன அமைப்புகள்'}>
        <div className="max-w-4xl mx-auto p-4">
          <CompanySettingsForm
            setting={editingSetting}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={language === 'english' ? 'Company Settings' : 'நிறுவன அமைப்புகள்'}>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {language === 'english' ? 'Locations' : 'இடங்கள்'}
          </h2>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'english' ? 'Add Location' : 'இடத்தைச் சேர்'}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">
              {language === 'english' ? 'No locations found' : 'இடங்கள் எதுவும் இல்லை'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {settings.map((setting) => (
              <Card key={setting.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEdit(setting)}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">{setting.location_name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">{setting.location_code}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(setting); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm pl-6 border-t pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Bill No:</span>
                      <span className="font-medium">
                        {setting.bill_prefix || ''}{(setting.start_bill_no || 1).toString().padStart(setting.bill_digits || 3, '0')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Debit Note:</span>
                      <span className="font-medium">
                        {setting.debit_note_prefix || ''}{(setting.start_debit_note_no || 1).toString().padStart(setting.debit_note_digits || 3, '0')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Credit Note:</span>
                      <span className="font-medium">
                        {setting.credit_note_prefix || ''}{(setting.start_credit_note_no || 1).toString().padStart(setting.credit_note_digits || 3, '0')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default CompanySettings;
