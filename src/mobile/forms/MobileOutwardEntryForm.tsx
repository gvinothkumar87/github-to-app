import React, { useState, useEffect, useRef } from 'react';
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
import { Camera, Upload, X } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { supabase } from '@/integrations/supabase/client';

const MobileOutwardEntryForm: React.FC = () => {
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const { data: customers } = useEnhancedOfflineData('offline_customers', [], { autoSync: true });
  const { data: items } = useEnhancedOfflineData('offline_items', [], { autoSync: true });
  const { create: createEntry } = useEnhancedOfflineData('offline_outward_entries', [], { autoSync: true });

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
    weighment_photo_url: '',
  });

  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const takePhoto = async () => {
    try {
      const photo = await CapCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (photo.dataUrl) {
        setPhotoDataUrl(photo.dataUrl);
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to take photo. Please check camera permissions.' : 'புகைப்படம் எடுக்க முடியவில்லை. கேமரா அனுமதிகளை சரிபார்க்கவும்.',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToGoogleDrive = async (dataUrl: string): Promise<string> => {
    const fileName = `weighment_${Date.now()}.jpg`;
    const { data, error } = await supabase.functions.invoke('upload-to-google-drive', {
      body: { dataUrl, fileName },
    });
    if (error) throw error;
    if (!data?.viewUrl) throw new Error('No URL returned from upload');
    return data.viewUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = formData.weighment_photo_url;
      
      // Upload photo if captured/selected
      if (photoDataUrl) {
        setUploading(true);
        photoUrl = await uploadToGoogleDrive(photoDataUrl);
        setUploadedPhotoUrl(photoUrl);
        setUploading(false);
      }

      await createEntry({
        ...formData,
        empty_weight: parseFloat(formData.empty_weight),
        serial_no: Date.now(),
        weighment_photo_url: photoUrl,
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
      setUploading(false);
    }
  };

  return (
    <MobileLayout title="New Outward Entry">
      <div className="space-y-4">

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
                    onClick={takePhoto}
                    className="flex-1"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {language === 'english' ? 'Take Photo' : 'புகைப்படம் எடு'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {language === 'english' ? 'Upload' : 'பதிவேற்று'}
                  </Button>
                </div>
                {photoDataUrl && (
                  <div className="mt-2 relative">
                    <img src={photoDataUrl} alt="Preview" className="max-h-40 rounded border w-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1"
                      onClick={() => setPhotoDataUrl('')}
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
                    className="mt-2 w-full"
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