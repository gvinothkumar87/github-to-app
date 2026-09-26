import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export function PartyStatusButton({ table, id, active, onChanged }: {
  table: 'customers' | 'suppliers'; id: string; active: boolean | number; onChanged: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const enabled = active === true || active === 1;
  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.from(table).update({ is_active: !enabled }).eq('id', id).select('id').single();
      if (error) throw error;
      await onChanged();
      toast({ title: enabled ? 'Account disabled' : 'Account enabled', description: enabled ? 'New entries are blocked. Past history remains available.' : 'This account can be used in entry forms again.' });
    } catch (error) {
      toast({ title: 'Unable to change status', description: error instanceof Error ? error.message : 'Check your connection and permissions.', variant: 'destructive' });
    } finally { setBusy(false); }
  };
  return <Button type="button" size="sm" variant="outline" disabled={busy} onClick={toggle}>
    {busy ? 'Saving…' : enabled ? (language === 'english' ? 'Disable' : 'முடக்கு') : (language === 'english' ? 'Enable' : 'செயல்படுத்து')}
  </Button>;
}
