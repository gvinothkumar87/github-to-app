import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IrnInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string;
  onIrnSaved: (irn: string) => void;
  tableType?: 'sales' | 'credit_notes' | 'debit_notes';
}

export const IrnInputDialog = ({ open, onOpenChange, saleId, onIrnSaved, tableType = 'sales' }: IrnInputDialogProps) => {
  const [irn, setIrn] = useState('');
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!irn.trim()) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please enter IRN' : 'IRN உள்ளிடவும்',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from(tableType)
        .update({ irn: irn.trim() })
        .eq('id', saleId);

      if (error) throw error;

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'IRN saved successfully' : 'IRN வெற்றிகரமாக சேமிக்கப்பட்டது',
      });

      onIrnSaved(irn.trim());
      onOpenChange(false);
      setIrn('');
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || (language === 'english' ? 'Failed to save IRN' : 'IRN சேமிப்பதில் தோல்வி'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onIrnSaved('');
    onOpenChange(false);
    setIrn('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'english' ? 'Enter IRN' : 'IRN உள்ளிடவும்'}
          </DialogTitle>
          <DialogDescription>
            {language === 'english' 
              ? 'Please enter the Invoice Reference Number (IRN) for this bill to proceed with printing.'
              : 'இந்த பில்லை அச்சிடுவதற்கு Invoice Reference Number (IRN) உள்ளிடவும்.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="irn">
              {language === 'english' ? 'IRN (Invoice Reference Number)' : 'IRN (Invoice Reference Number)'}
            </Label>
            <Input
              id="irn"
              value={irn}
              onChange={(e) => setIrn(e.target.value)}
              placeholder={language === 'english' ? 'Enter IRN...' : 'IRN உள்ளிடவும்...'}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip} disabled={loading}>
            {language === 'english' ? 'Skip' : 'தவிர்'}
          </Button>
          <Button onClick={handleSave} disabled={loading || !irn.trim()}>
            {loading 
              ? (language === 'english' ? 'Saving...' : 'சேமிக்கிறது...') 
              : (language === 'english' ? 'Save & Print' : 'சேமித்து அச்சிடு')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};