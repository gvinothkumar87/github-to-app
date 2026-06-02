import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { InwardEntry } from '@/types';

const MobileEmptyWeight: React.FC = () => {
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  
  const [entries, setEntries] = useState<InwardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [emptyWeights, setEmptyWeights] = useState<{ [key: string]: string }>({});
  const [photoData, setPhotoData] = useState<{ [key: string]: string }>({});
  const [uploadingMap, setUploadingMap] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchPendingEntries();
  }, []);

  const fetchPendingEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inward_entries')
      .select(`
        *,
        suppliers!inner(name_english, name_tamil, code),
        items!inner(name_english, name_tamil, code, unit)
      `)
      .eq('is_completed', false)
      .order('serial_no', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    } else {
      setEntries(data as any || []);
    }
    setLoading(false);
  };

  const handlePhotoFileChange = (entryId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoData(prev => ({ ...prev, [entryId]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const updateEmptyWeight = async (entry: any, emptyWeight: number) => {
    try {
      if (!photoData[entry.id]) {
        toast({
          variant: 'destructive',
          title: language === 'english' ? 'Photo required' : 'புகைப்படம் தேவை',
          description: language === 'english'
            ? 'Please upload the weighment photo before updating.'
            : 'புதுப்பிப்பதற்கு முன் எடைப் புகைப்படத்தை பதிவேற்றவும்.'
        });
        return;
      }

      if (emptyWeight >= entry.full_weight) {
        toast({
          variant: 'destructive',
          title: language === 'english' ? 'Invalid weight' : 'தவறான எடை',
          description: language === 'english'
            ? 'Empty weight must be less than full weight.'
            : 'காலி எடை முழு எடையை விட குறைவாக இருக்க வேண்டும்.'
        });
        return;
      }

      setUploadingMap(prev => ({ ...prev, [entry.id]: true }));

      const { compressDataUrl } = await import('@/lib/image');
      const compressed = await compressDataUrl(photoData[entry.id], { maxSize: 1600, quality: 0.7 });

      const fileName = `empty-weight-${entry.serial_no}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-to-google-drive', {
        body: { fileData: compressed, fileName },
      });

      if (uploadError) throw uploadError;

      let responseData = uploadData;
      if (uploadData && typeof uploadData === 'object' && 'data' in uploadData && !uploadData.viewUrl) {
        responseData = uploadData.data;
      }

      const viewUrl = responseData.viewUrl || responseData.fileUrl || responseData.url || responseData.fileLink || responseData.directLink;
      if (!viewUrl) throw new Error('No URL returned from upload');

      const netWeight = entry.full_weight - emptyWeight;

      const { error } = await supabase
        .from('inward_entries')
        .update({
          empty_weight: emptyWeight,
          net_weight: netWeight,
          empty_weight_photo_url: viewUrl,
          empty_weight_updated_at: new Date().toISOString(),
          is_completed: true,
        })
        .eq('id', entry.id);

      if (error) throw error;

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'Empty weight updated successfully' : 'காலி எடை வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
      });

      fetchPendingEntries();
      setEmptyWeights(prev => ({ ...prev, [entry.id]: '' }));
      setPhotoData(prev => { const p = { ...prev }; delete p[entry.id]; return p; });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    } finally {
      setUploadingMap(prev => ({ ...prev, [entry.id]: false }));
    }
  };

  return (
    <MobileLayout title={language === 'english' ? 'Empty Weight Update' : 'காலி எடை புதுப்பிப்பு'} showBackButton onBack={() => navigate('/purchases')}>
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="p-4 space-y-3 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">#{entry.serial_no}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.entry_date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {language === 'english' ? 'Pending' : 'நிலுவையில்'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">{language === 'english' ? 'Supplier: ' : 'சப்ளையர்: '}</span>
                    {entry.suppliers ? getDisplayName(entry.suppliers) : '-'}
                  </div>
                  <div>
                    <span className="font-medium">{language === 'english' ? 'Item: ' : 'பொருள்: '}</span>
                    {entry.items ? getDisplayName(entry.items) : '-'}
                  </div>
                  <div>
                    <span className="font-medium">{language === 'english' ? 'Lorry: ' : 'லாரி: '}</span>
                    {entry.lorry_no}
                  </div>
                  <div>
                    <span className="font-medium">{language === 'english' ? 'Full Weight: ' : 'முழு எடை: '}</span>
                    {entry.full_weight} KG
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={language === 'english' ? 'Empty weight' : 'காலி எடை'}
                    value={emptyWeights[entry.id] || ''}
                    onChange={(e) => setEmptyWeights(prev => ({ ...prev, [entry.id]: e.target.value }))}
                  />

                  <div className="space-y-2">
                    <input
                      id={`photo-upload-${entry.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoFileChange(entry.id, file);
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`photo-upload-${entry.id}`)?.click()}
                      className="w-full"
                    >
                      {photoData[entry.id]
                        ? (language === 'english' ? '✓ Photo Selected' : '✓ புகைப்படம் தேர்ந்தெடுக்கப்பட்டது')
                        : (language === 'english' ? 'Upload Photo *' : 'புகைப்படம் பதிவேற்றவும் *')}
                    </Button>
                    {photoData[entry.id] && (
                      <img src={photoData[entry.id]} alt="Preview" className="w-full h-32 object-cover rounded border" />
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                    onClick={() => {
                      const value = parseFloat(emptyWeights[entry.id] || '0');
                      if (value > 0) updateEmptyWeight(entry, value);
                    }}
                    disabled={uploadingMap[entry.id]}
                  >
                    {uploadingMap[entry.id]
                      ? (language === 'english' ? 'Uploading...' : 'பதிவேற்றுகிறது...')
                      : (language === 'english' ? 'Update Empty Weight' : 'காலி எடை புதுப்பி')}
                  </Button>
                </div>
              </Card>
            ))}

            {entries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'english'
                  ? 'No pending empty weight entries'
                  : 'நிலுவையில் காலி எடை பதிவுகள் இல்லை'}
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileEmptyWeight;
