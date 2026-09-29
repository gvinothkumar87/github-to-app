import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { Customer, Item, OutwardEntry } from '@/types';

interface OutwardEntrySummaryProps {
  entry: Partial<OutwardEntry>;
  customer?: Customer | null;
  item?: Item | null;
  loadWeight?: number | null;
  showGst?: boolean;
  entryPhotoUrl?: string | null;
  loadPhotoUrl?: string | null;
}

const getGoogleDriveFileId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const patterns = [/\/file\/d\/([^/]+)/, /id=([^&]+)/, /\/d\/([^/]+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

const getViewUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const fileId = getGoogleDriveFileId(url);
  if (fileId) return `https://drive.google.com/file/d/${fileId}/view`;
  return url;
};

const getImageSrc = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  const fileId = getGoogleDriveFileId(url);
  if (fileId) return null;
  return url;
};

const EntryImage = ({ label, url }: { label: string; url: string | null }) => {
  const viewUrl = getViewUrl(url);
  const imageSrc = getImageSrc(url);
  const fileId = getGoogleDriveFileId(url);
  if (!viewUrl || (!imageSrc && !fileId)) return null;

  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}:</Label>
      {imageSrc ? (
        <img src={imageSrc} alt={label} className="h-40 w-full max-w-72 object-cover rounded border bg-background" />
      ) : (
        <iframe
          title={label}
          src={`https://drive.google.com/file/d/${fileId}/preview`}
          className="h-40 w-full max-w-72 rounded border bg-background"
          allow="autoplay"
        />
      )}
      <button type="button" className="text-xs text-primary underline" onClick={() => window.open(viewUrl, '_blank')}>
        {label}
      </button>
    </div>
  );
};

export const OutwardEntrySummary = ({
  entry,
  customer,
  item,
  loadWeight,
  showGst = true,
  entryPhotoUrl,
  loadPhotoUrl,
}: OutwardEntrySummaryProps) => {
  const { language, getDisplayName } = useLanguage();
  const emptyWeight = Number(entry.empty_weight) || 0;
  const effectiveLoadWeight = loadWeight ?? entry.load_weight ?? null;
  const netWeight = effectiveLoadWeight != null ? Number(effectiveLoadWeight) - emptyWeight : entry.net_weight;
  const unitWeight = item?.unit_weight || 1;
  const calculatedQuantity = netWeight != null ? Number(netWeight) / unitWeight : null;
  const outwardPhoto = entryPhotoUrl ?? entry.weighment_photo_url ?? null;
  const loadPhoto = loadPhotoUrl ?? entry.load_weight_photo_url ?? null;

  return (
    <div className="bg-muted p-4 rounded-lg space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <Label className="text-xs font-medium">{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}:</Label>
          <p>{customer ? getDisplayName(customer) : '-'}</p>
        </div>
        <div>
          <Label className="text-xs font-medium">{language === 'english' ? 'Item' : 'பொருள்'}:</Label>
          <p>{item ? getDisplayName(item) : '-'}</p>
        </div>
        <div>
          <Label className="text-xs font-medium">{language === 'english' ? 'Empty Weight' : 'காலி எடை'}:</Label>
          <p>{emptyWeight ? `${emptyWeight} KG` : '-'}</p>
        </div>
        <div>
          <Label className="text-xs font-medium">{language === 'english' ? 'Load Weight' : 'மொத்த எடை'}:</Label>
          <p>{effectiveLoadWeight != null ? `${effectiveLoadWeight} KG` : '-'}</p>
        </div>
        <div>
          <Label className="text-xs font-medium">{language === 'english' ? 'Net Weight' : 'நிகர எடை'}:</Label>
          <p>{netWeight != null ? `${Number(netWeight).toFixed(2)} KG` : '-'}</p>
        </div>
        <div>
          <Label className="text-xs font-medium">{language === 'english' ? 'Unit Weight' : 'யூனிட் எடை'}:</Label>
          <p>{item ? `${item.unit_weight || 1} KG per ${item.unit}` : '-'}</p>
        </div>
        <div>
          <Label className="text-xs font-medium">{language === 'english' ? 'Calculated Quantity' : 'கணக்கிடப்பட்ட அளவு'}:</Label>
          <p>{calculatedQuantity != null ? `${calculatedQuantity.toFixed(2)} ${item?.unit || ''}` : '-'}</p>
        </div>
        <div>
          <Label className="text-xs font-medium">{language === 'english' ? 'Lorry No' : 'லாரி எண்'}:</Label>
          <p>{entry.lorry_no || '-'}</p>
        </div>
        {showGst && (
          <div>
            <Label className="text-xs font-medium">{language === 'english' ? 'GST %' : 'ஜிஎஸ்டி %'}:</Label>
            <p>{item?.gst_percentage || 0}%</p>
          </div>
        )}
        <div>
          <Label className="text-xs font-medium">{language === 'english' ? 'Loading Place' : 'ஏற்றும் இடம்'}:</Label>
          <p>{entry.loading_place || '-'}</p>
        </div>
      </div>
      {(outwardPhoto || loadPhoto) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <EntryImage label={language === 'english' ? 'Outward Entry Photo' : 'வெளிச்செல்லும் பதிவு புகைப்படம்'} url={outwardPhoto} />
          <EntryImage label={language === 'english' ? 'Load Weight Photo' : 'மொத்த எடை புகைப்படம்'} url={loadPhoto} />
        </div>
      )}
    </div>
  );
};
