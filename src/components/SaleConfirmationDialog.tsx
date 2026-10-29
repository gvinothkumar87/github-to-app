import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Customer, CustomerShipAddress } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
  customer?: Partial<Customer>;
  shipTo?: CustomerShipAddress | null;
  lorryNo?: string;
  lines: { name: string; quantity: number; rate: number; unit?: string }[];
}

export function SaleConfirmationDialog({ open, onOpenChange, onConfirm, loading, customer, shipTo, lorryNo, lines }: Props) {
  const { language } = useLanguage();
  const confirming = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const en = language === 'english';
  const name = en ? customer?.name_english : customer?.name_tamil || customer?.name_english;
  const address = en ? customer?.address_english : customer?.address_tamil || customer?.address_english;
  const shipAddress = shipTo ? (en ? shipTo.address_english : shipTo.address_tamil || shipTo.address_english) : address;
  const missing = en ? 'Not provided' : 'கொடுக்கப்படவில்லை';
  const announcement = en
    ? `Please confirm the sale. Bill to: ${name || missing}. ${address || ''}. Ship to: ${shipTo?.name || name || missing}. ${shipAddress || ''}. Lorry number: ${lorryNo?.split('').join(' ') || missing}. ${lines.map(line => `${line.name}. Calculated quantity: ${line.quantity} ${line.unit || 'units'}. Rate per unit: ${line.rate} rupees.`).join(' ')} Check the details and press Confirm and Create Bill to generate the bill.`
    : `விற்பனையை உறுதிப்படுத்தவும். பில் பெறுபவர்: ${name || missing}. ${address || ''}. அனுப்பும் முகவரி: ${shipTo?.name || name || missing}. ${shipAddress || ''}. லாரி எண்: ${lorryNo?.split('').join(' ') || missing}. ${lines.map(line => `${line.name}. கணக்கிடப்பட்ட அளவு: ${line.quantity} ${line.unit || 'யூனிட்'}. யூனிட் விலை: ${line.rate} ரூபாய்.`).join(' ')} விவரங்களை சரிபார்த்து பில்லை உருவாக்க உறுதிப்படுத்தவும்.`;

  const stopAnnouncement = useCallback(() => {
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const speakAnnouncement = useCallback(() => {
    if (!speechSupported) return;
    stopAnnouncement();
    setVoiceError(false);
    const utterance = new SpeechSynthesisUtterance(announcement);
    utterance.lang = en ? 'en-IN' : 'ta-IN';
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.toLowerCase() === utterance.lang.toLowerCase())
      || voices.find(v => v.lang.toLowerCase().startsWith(en ? 'en' : 'ta'));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.onend = () => { utteranceRef.current = null; setSpeaking(false); };
    utterance.onerror = () => { utteranceRef.current = null; setSpeaking(false); setVoiceError(true); };
    utteranceRef.current = utterance;
    setSpeaking(true);
    try { window.speechSynthesis.speak(utterance); }
    catch { utteranceRef.current = null; setSpeaking(false); setVoiceError(true); }
  }, [announcement, en, speechSupported, stopAnnouncement]);

  useEffect(() => {
    if (open && !loading) speakAnnouncement();
    return stopAnnouncement;
  }, [open, loading, speakAnnouncement, stopAnnouncement]);

  return (
    <AlertDialog open={open} onOpenChange={value => { if (!loading && !confirming.current) onOpenChange(value); }}>
      <AlertDialogContent className="max-h-[90dvh] overflow-y-auto w-[calc(100%-2rem)] rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{en ? 'Confirm Sale' : 'விற்பனையை உறுதிப்படுத்தவும்'}</AlertDialogTitle>
          <AlertDialogDescription>{en ? 'Check these details before generating the bill.' : 'பில்லை உருவாக்கும் முன் இந்த விவரங்களை சரிபார்க்கவும்.'}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          {speechSupported ? <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={loading} onClick={speakAnnouncement}>{en ? 'Replay Announcement' : 'மீண்டும் கேட்கவும்'}</Button>
            {speaking && <Button type="button" variant="outline" onClick={stopAnnouncement}>{en ? 'Stop Voice' : 'குரலை நிறுத்து'}</Button>}
          </div> : <p className="text-sm text-muted-foreground">{en ? 'Voice announcements are unavailable on this device. Please review the details below.' : 'இந்த சாதனத்தில் குரல் அறிவிப்பு கிடைக்கவில்லை. கீழே உள்ள விவரங்களை சரிபார்க்கவும்.'}</p>}
          {voiceError && <p role="status" className="text-sm text-muted-foreground">{en ? 'Could not play the announcement. Tap Replay Announcement to try again, or review the details below.' : 'குரல் அறிவிப்பை இயக்க முடியவில்லை. மீண்டும் கேட்கவும் அல்லது கீழே உள்ள விவரங்களை சரிபார்க்கவும்.'}</p>}
        </div>
        <div className="space-y-4 text-sm break-words">
          <div><p className="font-semibold">{en ? 'Bill To' : 'பில் பெறுபவர்'}</p><p>{name || '—'}</p><p className="whitespace-pre-line">{address}</p></div>
          <div><p className="font-semibold">{en ? 'Ship To' : 'அனுப்பும் முகவரி'}</p><p>{shipTo?.name || name || '—'}{shipTo?.label ? ` (${shipTo.label})` : ''}</p><p className="whitespace-pre-line">{shipAddress}</p>{!shipTo && <p className="text-muted-foreground">{en ? 'Same as Bill To' : 'பில் முகவரியே'}</p>}</div>
          <div><p className="font-semibold">{en ? 'Lorry Number' : 'லாரி எண்'}</p><p>{lorryNo || '—'}</p></div>
          {lines.map((line, index) => <div key={index} className="rounded border p-3 space-y-1">
            <p className="font-semibold">{line.name}</p>
            <p>{en ? 'Calculated Quantity' : 'கணக்கிடப்பட்ட அளவு'}: {line.quantity.toLocaleString('en-IN', { maximumFractionDigits: 6 })} {line.unit}</p>
            <p>{en ? 'Rate per Unit' : 'யூனிட் விலை'}: ₹{line.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
          </div>)}
        </div>
        <AlertDialogFooter className="gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>{en ? 'Back to Edit' : 'திருத்து'}</Button>
          <Button type="button" disabled={loading} onClick={async () => {
            if (confirming.current) return;
            stopAnnouncement();
            confirming.current = true;
            try { await onConfirm(); } finally { confirming.current = false; onOpenChange(false); }
          }}>{loading ? (en ? 'Creating...' : 'உருவாக்குகிறது...') : (en ? 'Confirm & Create Bill' : 'உறுதிசெய்து பில் உருவாக்கு')}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
