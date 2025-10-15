import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { MobileLayout } from '../components/MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';


interface MobileItemFormProps {
  itemId?: string;
}

const MobileItemForm: React.FC<MobileItemFormProps> = ({ itemId }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { create, update, findById, isServicesReady } = useEnhancedOfflineData('offline_items', [], { autoSync: true });

  const [formData, setFormData] = useState({
    name_english: '',
    name_tamil: '',
    code: '',
    unit: 'KG',
    unit_weight: '1',
    hsn_no: '',
    gst_percentage: '0',
    description_english: '',
    description_tamil: '',
    is_active: true,
  });

  useEffect(() => {
    if (itemId) {
      loadItem();
    } else {
      generateItemCode();
    }
  }, [itemId]);

  const loadItem = async () => {
    if (!itemId) return;
    try {
      const item = await findById(itemId) as any;
      if (item) {
        setFormData({
          ...item,
          gst_percentage: item.gst_percentage?.toString() || '0',
          unit_weight: item.unit_weight?.toString() || '1'
        });
      }
    } catch (error) {
      console.error('Error loading item:', error);
    }
  };

  const generateItemCode = () => {
    const timestamp = Date.now();
    const code = `ITEM${timestamp.toString().slice(-6)}`;
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData = {
        ...formData,
        gst_percentage: parseFloat(formData.gst_percentage),
        unit_weight: parseFloat(formData.unit_weight),
      };

      if (itemId) {
        await update(itemId, itemData);
        toast({
          title: language === 'english' ? 'Success' : 'வெற்றி',
          description: language === 'english' ? 'Item updated successfully' : 'பொருள் வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
        });
      } else {
        await create(itemData);
        toast({
          title: language === 'english' ? 'Success' : 'வெற்றி',
          description: language === 'english' ? 'Item created successfully' : 'பொருள் வெற்றிகரமாக உருவாக்கப்பட்டது',
        });
      }
      
      navigate('/items');
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
    <MobileLayout title={itemId ? 'Edit Item' : 'New Item'}>
      <div className="space-y-4">

        <Card>
          <CardHeader>
            <CardTitle>
              {itemId
                ? (language === 'english' ? 'Edit Item' : 'பொருளை திருத்து')
                : (language === 'english' ? 'Add New Item' : 'புதிய பொருளை சேர்க்கவும்')
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name_english">
                  {language === 'english' ? 'Item Name (English)' : 'பொருள் பெயர் (ஆங்கிலம்)'} *
                </Label>
                <Input
                  id="name_english"
                  value={formData.name_english}
                  onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
                  required
                  placeholder={language === 'english' ? 'Enter item name' : 'பொருள் பெயரை உள்ளிடவும்'}
                />
              </div>
              
              <div>
                <Label htmlFor="name_tamil">
                  {language === 'english' ? 'Item Name (Tamil)' : 'பொருள் பெயர் (தமிழ்)'}
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
                  {language === 'english' ? 'Item Code' : 'பொருள் குறியீடு'} *
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
                <Label htmlFor="unit">
                  {language === 'english' ? 'Unit' : 'அலகு'} *
                </Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">KG - Kilogram</SelectItem>
                    <SelectItem value="TON">TON - Metric Ton</SelectItem>
                    <SelectItem value="BAG">BAG - Bag</SelectItem>
                    <SelectItem value="PCS">PCS - Pieces</SelectItem>
                    <SelectItem value="LTR">LTR - Liter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="hsn_no">
                  {language === 'english' ? 'HSN Number' : 'HSN எண்'}
                </Label>
                <Input
                  id="hsn_no"
                  value={formData.hsn_no}
                  onChange={(e) => setFormData({ ...formData, hsn_no: e.target.value })}
                  placeholder={language === 'english' ? 'HSN classification number' : 'HSN வகைப்பாடு எண்'}
                />
              </div>
              
              <div>
                <Label htmlFor="unit_weight">
                  {language === 'english' ? 'Unit Weight (KG)' : 'யூனிட் எடை (கிலோ)'}
                </Label>
                <Input
                  id="unit_weight"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.unit_weight}
                  onChange={(e) => setFormData({ ...formData, unit_weight: e.target.value })}
                  placeholder={language === 'english' ? 'Enter unit weight' : 'யூனிட் எடையை உள்ளிடவும்'}
                />
              </div>
              
              <div>
                <Label htmlFor="gst_percentage">
                  {language === 'english' ? 'GST Percentage (%)' : 'GST சதவீதம் (%)'}
                </Label>
                <Input
                  id="gst_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.gst_percentage}
                  onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                  placeholder={language === 'english' ? 'Enter GST percentage' : 'GST சதவீதத்தை உள்ளிடவும்'}
                />
              </div>
              
              <div>
                <Label htmlFor="description_english">
                  {language === 'english' ? 'Description (English)' : 'விளக்கம் (ஆங்கிலம்)'}
                </Label>
                <Textarea
                  id="description_english"
                  value={formData.description_english}
                  onChange={(e) => setFormData({ ...formData, description_english: e.target.value })}
                  placeholder={language === 'english' ? 'Enter item description' : 'பொருள் விளக்கத்தை உள்ளிடவும்'}
                  rows={2}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (language === 'english' ? 'Saving...' : 'சேமிக்கிறது...') : 
                   (itemId ? (language === 'english' ? 'Update' : 'புதுப்பிக்கவும்') :
                    (language === 'english' ? 'Create' : 'உருவாக்கவும்'))}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/items')} 
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

export default MobileItemForm;