import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLocations } from '@/hooks/useLocations';

export const MobileCreditNoteForm = () => {
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const { locations } = useLocations();
  const [loading, setLoading] = useState(false);
  const [previewNoteNo, setPreviewNoteNo] = useState<string>('');
  const [formData, setFormData] = useState({
    customer_id: '',
    item_id: '',
    reference_bill_no: '',
    amount: '',
    gst_percentage: '18.00',
    reason: '',
    note_date: new Date().toISOString().split('T')[0],
    mill: '',
  });

  const { data: customers } = useEnhancedOfflineData('offline_customers');
  const { data: items } = useEnhancedOfflineData('offline_items');

  const selectedCustomer = customers.find((c: any) => c.id === formData.customer_id);
  const selectedItem = items.find((i: any) => i.id === formData.item_id);

  // Set default mill
  React.useEffect(() => {
    if (locations.length > 0 && !formData.mill) {
      setFormData(prev => ({ ...prev, mill: locations[0].location_code }));
    }
  }, [locations, formData.mill]);

  React.useEffect(() => {
    const fetchPreviewNoteNo = async () => {
      const noteNo = await generateCreditNoteNo(formData.mill);
      if (noteNo) setPreviewNoteNo(noteNo);
    };
    fetchPreviewNoteNo();
  }, [formData.mill]);

  const generateCreditNoteNo = async (mill: string) => {
    if (!mill) return '';
    try {
      // Fetch settings
      const { data: settings } = await supabase
        .from('company_settings')
        .select('start_credit_note_no, credit_note_prefix, credit_note_digits')
        .eq('location_code', mill)
        .eq('is_active', true)
        .single();

      const startNo = settings?.start_credit_note_no || 1;
      const prefix = settings?.credit_note_prefix || '';
      const digits = settings?.credit_note_digits || 3;

      // Fetch existing notes to find max
      const { data: existingNotes } = await supabase
        .from('credit_notes')
        .select('note_no')
        .eq('mill', mill);

      let nextNo = 1;

      let relevantNotes = existingNotes || [];
      if (prefix) {
        relevantNotes = relevantNotes.filter(n => n.note_no?.startsWith(prefix));
      } else {
        relevantNotes = relevantNotes.filter(n => /^\d+$/.test(n.note_no));
      }

      if (relevantNotes.length > 0) {
        let maxNo = 0;
        relevantNotes.forEach(note => {
          let num = 0;
          if (prefix) {
            num = parseInt(note.note_no.replace(prefix, ''));
          } else {
            num = parseInt(note.note_no);
          }
          if (!isNaN(num)) {
            maxNo = Math.max(maxNo, num);
          }
        });
        nextNo = maxNo + 1;
      }

      nextNo = Math.max(startNo, nextNo);

      const serialNumber = nextNo.toString().padStart(digits, '0');
      if (prefix) {
        return `${prefix}${serialNumber}`;
      }
      return nextNo.toString();

    } catch (error) {
      console.error('Error generating credit note number:', error);
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id || !formData.amount || !formData.reason) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please fill all required fields' : 'அனைத்து தேவையான புலங்களையும் நிரப்பவும்',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const noteNo = await generateCreditNoteNo(formData.mill);

      const { error: noteError } = await supabase
        .from('credit_notes')
        .insert({
          note_no: noteNo,
          customer_id: formData.customer_id,
          item_id: formData.item_id || null,
          reference_bill_no: formData.reference_bill_no || null,
          amount: parseFloat(formData.amount),
          gst_percentage: parseFloat(formData.gst_percentage),
          reason: formData.reason,
          note_date: formData.note_date,
          mill: formData.mill,
          created_by: user.id,
        });

      if (noteError) throw noteError;

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english'
          ? `Credit Note ${noteNo} created successfully`
          : `கிரெடிட் நோட் ${noteNo} வெற்றிகரமாக உருவாக்கப்பட்டது`,
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || (language === 'english' ? 'Failed to create credit note' : 'கிரெடிட் நோட் உருவாக்குவதில் தோல்வி'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout
      title={language === 'english' ? 'Create Credit Note' : 'கிரெடிட் நோட் உருவாக்கவும்'}
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'english' ? 'Credit Note Details' : 'கிரெடிட் நோட் விவரங்கள்'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="mill">
                  {language === 'english' ? 'Mill/Location *' : 'மில் / இடம் *'}
                </Label>
                <Select
                  value={formData.mill}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, mill: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'english' ? 'Select Mill' : 'மில்லைத் தேர்ந்தெடுக்கவும்'} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.location_code} value={loc.location_code}>
                        {loc.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="preview_note_no">
                  {language === 'english' ? 'Credit Note No. (Preview)' : 'கிரெடிட் நோட் எண் (முன்னோட்டம்)'}
                </Label>
                <Input
                  id="preview_note_no"
                  value={previewNoteNo}
                  readOnly
                  className="bg-muted font-semibold"
                />
              </div>

              <div>
                <Label htmlFor="customer_id">
                  {language === 'english' ? 'Customer *' : 'வாடிக்கையாளர் *'}
                </Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'english' ? 'Select Customer' : 'வாடிக்கையாளரைத் தேர்ந்தெடுக்கவும்'} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {getDisplayName(customer)} ({customer.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reference_bill_no">
                  {language === 'english' ? 'Reference Bill No.' : 'குறிப்பு பில் எண்'}
                </Label>
                <Input
                  id="reference_bill_no"
                  value={formData.reference_bill_no}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_bill_no: e.target.value }))}
                  placeholder={language === 'english' ? 'Enter reference bill number' : 'குறிப்பு பில் எண்ணை உள்ளிடவும்'}
                />
              </div>

              <div>
                <Label htmlFor="item_id">
                  {language === 'english' ? 'Item (Optional)' : 'பொருள் (விருப்பம்)'}
                </Label>
                <Select
                  value={formData.item_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, item_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'english' ? 'Select Item' : 'பொருளைத் தேர்ந்தெடுக்கவும்'} />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {getDisplayName(item)} ({item.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">
                  {language === 'english' ? 'Amount *' : 'தொகை *'}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder={language === 'english' ? 'Enter amount' : 'தொகையை உள்ளிடவும்'}
                  required
                />
              </div>

              <div>
                <Label htmlFor="gst_percentage">
                  {language === 'english' ? 'GST %' : 'GST %'}
                </Label>
                <Input
                  id="gst_percentage"
                  type="number"
                  step="0.01"
                  value={formData.gst_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, gst_percentage: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="reason">
                  {language === 'english' ? 'Reason *' : 'காரணம் *'}
                </Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={language === 'english' ? 'Enter reason for credit note' : 'கிரெடிட் நோட்டிற்கான காரணத்தை உள்ளிடவும்'}
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="note_date">
                  {language === 'english' ? 'Note Date *' : 'நோட் தேதி *'}
                </Label>
                <Input
                  id="note_date"
                  type="date"
                  value={formData.note_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, note_date: e.target.value }))}
                  required
                />
              </div>

              {selectedCustomer && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">
                    {language === 'english' ? 'Customer Details' : 'வாடிக்கையாளர் விவரங்கள்'}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>{language === 'english' ? 'Name:' : 'பெயர்:'}</strong> {getDisplayName(selectedCustomer as any)}</p>
                    <p><strong>{language === 'english' ? 'Code:' : 'குறியீடு:'}</strong> {(selectedCustomer as any).code}</p>
                    {(selectedCustomer as any).contact_person && (
                      <p><strong>{language === 'english' ? 'Contact:' : 'தொடர்பு:'}</strong> {(selectedCustomer as any).contact_person}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading
                    ? (language === 'english' ? 'Creating...' : 'உருவாக்குகிறது...')
                    : (language === 'english' ? 'Create Credit Note' : 'கிரெடிட் நோட் உருவாக்கவும்')
                  }
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  {language === 'english' ? 'Cancel' : 'ரத்து'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default MobileCreditNoteForm;