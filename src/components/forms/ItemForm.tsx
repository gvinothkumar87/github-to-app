import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Item } from '@/types';

interface ItemFormProps {
  item?: Item;
  onSuccess: () => void;
  onCancel: () => void;
}

const units = ['KG', 'TON', 'PCS', 'LTR', 'MT', 'BAG'];

export const ItemForm: React.FC<ItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name_english: item?.name_english || '',
    name_tamil: item?.name_tamil || '',
    code: item?.code || '',
    unit: item?.unit || 'KG',
    unit_weight: item?.unit_weight || 1,
    hsn_no: item?.hsn_no || '',
    gst_percentage: item?.gst_percentage || 0,
    opening_stock: item?.opening_stock || 0,
    description_english: item?.description_english || '',
    description_tamil: item?.description_tamil || '',
  });

  useEffect(() => {
    if (!item) {
      generateItemCode();
    }
  }, [item]);

  const generateItemCode = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('code')
        .like('code', 'ITEM%')
        .order('code', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastCode = data[0].code;
        const numberPart = lastCode.replace('ITEM', '');
        nextNumber = parseInt(numberPart) + 1;
      }
      
      const newCode = `ITEM${nextNumber.toString().padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, code: newCode }));
    } catch (error) {
      console.error('Error generating item code:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (item) {
        const { error } = await supabase
          .from('items')
          .update(formData)
          .eq('id', item.id);
        
        if (error) throw error;
        
        toast({
          title: language === 'english' ? 'Success' : 'வெற்றி',
          description: language === 'english' ? 'Item updated successfully' : 'பொருள் வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
        });
      } else {
        const { error } = await supabase
          .from('items')
          .insert([formData]);
        
        if (error) throw error;
        
        toast({
          title: language === 'english' ? 'Success' : 'வெற்றி',
          description: language === 'english' ? 'Item created successfully' : 'பொருள் வெற்றிகரமாக உருவாக்கப்பட்டது',
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
          {item
            ? (language === 'english' ? 'Edit Item' : 'பொருளை திருத்து')
            : (language === 'english' ? 'Add New Item' : 'புதிய பொருளை சேர்க்கவும்')
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
                placeholder={language === 'english' ? 'Enter item name' : 'பொருளின் பெயரை உள்ளிடவும்'}
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
                  <SelectValue placeholder={language === 'english' ? 'Select unit' : 'அலகை தேர்ந்தெடுக்கவும்'} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
             </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <Label htmlFor="hsn_no">
                 {language === 'english' ? 'HSN No' : 'எச்எஸ்என் எண்'}
               </Label>
               <Input
                 id="hsn_no"
                 value={formData.hsn_no}
                 onChange={(e) => setFormData({ ...formData, hsn_no: e.target.value })}
                 placeholder={language === 'english' ? 'e.g., 1234567890' : 'உதா: 1234567890'}
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
                  onChange={(e) => setFormData({ ...formData, unit_weight: parseFloat(e.target.value) || 1 })}
                  placeholder={language === 'english' ? 'e.g., 50' : 'உதா: 50'}
                />
              </div>
              
              <div>
                <Label htmlFor="gst_percentage">
                  {language === 'english' ? 'GST %' : 'ஜிஎஸ்டி %'}
                </Label>
                <Input
                  id="gst_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.gst_percentage}
                  onChange={(e) => setFormData({ ...formData, gst_percentage: parseFloat(e.target.value) || 0 })}
                  placeholder={language === 'english' ? 'e.g., 18.00' : 'உதா: 18.00'}
                />
              </div>
              
              <div>
                <Label htmlFor="opening_stock">
                  {language === 'english' ? 'Opening Stock' : 'தொடக்க இருப்பு'}
                </Label>
                <Input
                  id="opening_stock"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.opening_stock}
                  onChange={(e) => setFormData({ ...formData, opening_stock: parseFloat(e.target.value) || 0 })}
                  placeholder={language === 'english' ? 'e.g., 100' : 'உதா: 100'}
                />
              </div>
           </div>
          
          <div>
            <Label htmlFor="description_english">
              {language === 'english' ? 'Description (English)' : 'விளக்கம் (ஆங்கிலம்)'}
            </Label>
            <Textarea
              id="description_english"
              value={formData.description_english}
              onChange={(e) => setFormData({ ...formData, description_english: e.target.value })}
              placeholder={language === 'english' ? 'Enter description' : 'விளக்கத்தை உள்ளிடவும்'}
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="description_tamil">
              {language === 'english' ? 'Description (Tamil)' : 'விளக்கம் (தமிழ்)'}
            </Label>
            <Textarea
              id="description_tamil"
              value={formData.description_tamil}
              onChange={(e) => setFormData({ ...formData, description_tamil: e.target.value })}
              placeholder={language === 'english' ? 'Enter description in Tamil' : 'தமிழில் விளக்கத்தை உள்ளிடவும்'}
              rows={2}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (language === 'english' ? 'Saving...' : 'சேமிக்கிறது...') : 
               (item ? (language === 'english' ? 'Update' : 'புதுப்பிக்கவும்') :
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