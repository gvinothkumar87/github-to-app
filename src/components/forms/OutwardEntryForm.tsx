import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Customer, Item } from '@/types';
import { Camera, Upload, X } from 'lucide-react';

interface OutwardEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const OutwardEntryForm: React.FC<OutwardEntryFormProps> = ({ onSuccess, onCancel }) => {
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    loading_place: 'PULIVANTHI',
    customer_id: '',
    item_id: '',
    lorry_no: '',
    driver_mobile: '',
    empty_weight: '',
    remarks: '',
    weighment_photo_url: '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('name_english');
    
    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }
    
    setCustomers(data || []);
  };

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('name_english');
    
    if (error) {
      console.error('Error fetching items:', error);
      return;
    }
    
    setItems(data || []);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData({ ...formData, weighment_photo_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadToGoogleDrive = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const raw = reader.result as string;
          const { compressDataUrl } = await import('@/lib/image');
          const compressed = await compressDataUrl(raw, { maxSize: 1600, quality: 0.7 });

          const fileName = `weighment_${Date.now()}_${file.name}`;
          const { data, error } = await supabase.functions.invoke('upload-to-google-drive', {
            body: { dataUrl: compressed, fileName },
          });
          if (error) throw error;
          if (!data?.viewUrl) throw new Error('No URL returned from upload');
          resolve(data.viewUrl);
        } catch (error) {
          reject(error as any);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = formData.weighment_photo_url;
      
      // Upload photo if selected
      if (selectedFile) {
        setUploading(true);
        photoUrl = await uploadToGoogleDrive(selectedFile);
        setUploadedPhotoUrl(photoUrl);
        setUploading(false);
      }

      const { error } = await supabase
        .from('outward_entries')
        .insert([{
          ...formData,
          empty_weight: parseFloat(formData.empty_weight),
          weighment_photo_url: photoUrl,
        }]);
      
      if (error) throw error;
      
      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Outward entry created successfully' : 'வெளியீட்டு பதிவு வெற்றிகரமாக உருவாக்கப்பட்டது',
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
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-card">
      <CardHeader>
        <CardTitle>
          {language === 'english' ? 'New Outward Entry' : 'புதிய வெளியீட்டு பதிவு'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {getDisplayName(customer)} ({customer.code})
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
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {getDisplayName(item)} ({item.code})
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
          
          <div>
            <Label htmlFor="weighment_photo">
              {language === 'english' ? 'Weighment Photo' : 'எடை புகைப்படம்'}
            </Label>
            <input
              ref={fileInputRef}
              id="weighment_photo"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                {language === 'english' ? 'Upload Photo' : 'புகைப்படம் பதிவேற்று'}
              </Button>
            </div>
            {previewUrl && (
              <div className="mt-2 relative">
                <img src={previewUrl} alt="Preview" className="max-h-40 rounded border" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {uploadedPhotoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open(uploadedPhotoUrl, '_blank')}
              >
                {language === 'english' ? 'View in Google Drive' : 'Google Drive இல் பார்க்கவும்'}
              </Button>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || uploading} className="flex-1">
              {uploading ? (language === 'english' ? 'Uploading...' : 'பதிவேற்றுகிறது...') :
               loading ? (language === 'english' ? 'Creating...' : 'உருவாக்குகிறது...') : 
               (language === 'english' ? 'Create Entry' : 'பதிவு உருவாக்கவும்')}
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