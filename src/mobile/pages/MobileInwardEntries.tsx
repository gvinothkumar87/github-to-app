import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { InwardEntry } from '@/types';

const MobileInwardEntries: React.FC = () => {
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const [entries, setEntries] = useState<InwardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInwardEntries();
  }, []);

  const fetchInwardEntries = async () => {
    setLoading(true);
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const tenDaysAgoFormatted = tenDaysAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('inward_entries')
      .select(`
        *,
        suppliers!inner(name_english, name_tamil, code),
        items!inner(name_english, name_tamil, code, unit)
      `)
      .gte('entry_date', tenDaysAgoFormatted)
      .order('serial_no', { ascending: false });

    if (error) {
      console.error('Error fetching inward entries:', error);
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

  return (
    <MobileLayout title={language === 'english' ? 'Inward Entries' : 'உள்வரும் பதிவுகள்'} showBackButton onBack={() => navigate('/purchases')}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{language === 'english' ? 'Recent Entries' : 'சமீபத்திய பதிவுகள்'}</h2>
          <Button onClick={() => navigate('/purchases/inward/new')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {language === 'english' ? 'Add New' : 'புதியது'}
          </Button>
        </div>

        {loading ? (
           <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">#{entry.serial_no}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.entry_date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={entry.is_completed ? 'default' : 'secondary'} className="text-xs">
                    {entry.is_completed
                      ? (language === 'english' ? 'Completed' : 'முடிந்தது')
                      : (language === 'english' ? 'Pending' : 'நிலுவையில்')}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">
                      {language === 'english' ? 'Supplier: ' : 'சப்ளையர்: '}
                    </span>
                    {entry.suppliers ? getDisplayName(entry.suppliers) : '-'}
                  </div>
                  <div>
                    <span className="font-medium">
                      {language === 'english' ? 'Item: ' : 'பொருள்: '}
                    </span>
                    {entry.items ? getDisplayName(entry.items) : '-'}
                  </div>
                  <div>
                    <span className="font-medium">
                      {language === 'english' ? 'Lorry: ' : 'லாரி: '}
                    </span>
                    {entry.lorry_no}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">
                        {language === 'english' ? 'Full Weight' : 'முழு எடை'}
                      </div>
                      <div className="font-medium">{entry.full_weight} KG</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">
                        {language === 'english' ? 'Empty Weight' : 'காலி எடை'}
                      </div>
                      <div className="font-medium">
                        {entry.empty_weight ? `${entry.empty_weight} KG` : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {entries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'english'
                  ? 'No entries found'
                  : 'பதிவுகள் எதுவும் கிடைக்கவில்லை'}
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileInwardEntries;
