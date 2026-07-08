import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Calendar as CalendarIcon, Activity as ActivityIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { useLocations } from '@/hooks/useLocations';

type ActivityType = 'all' | 'sale_direct' | 'sale_transit' | 'outward' | 'purchase' | 'receipt' | 'credit_note' | 'debit_note';

interface UnifiedActivity {
  id: string;
  type: ActivityType;
  date: string;
  reference_no: string;
  party_name: string;
  details: string;
  amount_or_qty: string | number;
  location: string;
  raw_data: any;
}

export default function ActivitiesLog() {
  const { language, getDisplayName } = useLanguage();
  const [activities, setActivities] = useState<UnifiedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { locations } = useLocations();

  // Filters
  const [fromDate, setFromDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [millFilter, setMillFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<ActivityType>('all');

  useEffect(() => {
    fetchActivities();
  }, [fromDate, toDate, millFilter, typeFilter]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const allActivities: UnifiedActivity[] = [];

      // 1. Fetch Sales (Direct & Transit)
      if (typeFilter === 'all' || typeFilter === 'sale_direct' || typeFilter === 'sale_transit') {
        let query = supabase
          .from('sales')
          .select(`*, customers(*), items(*)`)
          .gte('sale_date', fromDate)
          .lte('sale_date', toDate);

        if (millFilter !== 'all') {
          query = query.eq('loading_place', millFilter);
        }

        const { data: salesData, error: salesError } = await query;
        if (!salesError && salesData) {
          salesData.forEach(sale => {
            const isTransit = !!sale.outward_entry_id;
            if (typeFilter !== 'all' && typeFilter === 'sale_direct' && isTransit) return;
            if (typeFilter !== 'all' && typeFilter === 'sale_transit' && !isTransit) return;

            allActivities.push({
              id: sale.id,
              type: isTransit ? 'sale_transit' : 'sale_direct',
              date: sale.sale_date,
              reference_no: sale.bill_serial_no || 'N/A',
              party_name: getDisplayName(sale.customers),
              details: getDisplayName(sale.items),
              amount_or_qty: `₹${(sale.total_amount || 0).toFixed(2)}`,
              location: sale.loading_place || 'N/A',
              raw_data: sale,
            });
          });
        }
      }

      // 2. Fetch Outward Entries
      if (typeFilter === 'all' || typeFilter === 'outward') {
        let query = supabase
          .from('outward_entries')
          .select(`*, customers(*), items(*)`)
          .gte('entry_date', fromDate)
          .lte('entry_date', toDate);

        if (millFilter !== 'all') {
          query = query.eq('loading_place', millFilter);
        }

        const { data: outwardData, error: outwardError } = await query;
        if (!outwardError && outwardData) {
          outwardData.forEach(entry => {
            allActivities.push({
              id: entry.id,
              type: 'outward',
              date: entry.entry_date,
              reference_no: `Entry #${entry.serial_no}`,
              party_name: getDisplayName(entry.customers),
              details: getDisplayName(entry.items),
              amount_or_qty: `${entry.net_weight || 0} KG`,
              location: entry.loading_place || 'N/A',
              raw_data: entry,
            });
          });
        }
      }

      // 3. Fetch Purchases (Note: Purchases may not have loading_place)
      if (typeFilter === 'all' || typeFilter === 'purchase') {
        let query = supabase
          .from('purchases')
          .select(`*, suppliers(*), items(*)`)
          .gte('purchase_date', fromDate)
          .lte('purchase_date', toDate);

        const { data: purchaseData, error: purchaseError } = await query;
        if (!purchaseError && purchaseData) {
          purchaseData.forEach(purchase => {
            // Purchases don't have location explicitly yet. We show them on 'all' or default location 'N/A'
            if (millFilter !== 'all' && purchase.location_code !== millFilter) {
               // If purchases had a location code, we would filter it here.
               // For now, if a specific mill is selected, we might still want to show purchases if they are global, 
               // but to be strict with the mill filter, we might exclude them unless we add a location to purchases.
               // Let's assume purchases are global for now, or skip them if filtering by mill specifically.
               return; 
            }
            allActivities.push({
              id: purchase.id,
              type: 'purchase',
              date: purchase.purchase_date,
              reference_no: purchase.bill_serial_no || 'N/A',
              party_name: getDisplayName(purchase.suppliers),
              details: getDisplayName(purchase.items),
              amount_or_qty: `₹${(purchase.total_amount || 0).toFixed(2)}`,
              location: purchase.location_code || 'N/A',
              raw_data: purchase,
            });
          });
        }
      }

      // 4. Fetch Receipts
      if (typeFilter === 'all' || typeFilter === 'receipt') {
        let query = supabase
          .from('receipts')
          .select(`*, customers(*)`)
          .gte('receipt_date', fromDate)
          .lte('receipt_date', toDate);

        const { data: receiptData, error: receiptError } = await query;
        if (!receiptError && receiptData) {
          receiptData.forEach(receipt => {
             if (millFilter !== 'all' && receipt.location_code !== millFilter) return;
             
            allActivities.push({
              id: receipt.id,
              type: 'receipt',
              date: receipt.receipt_date,
              reference_no: receipt.receipt_no || 'N/A',
              party_name: getDisplayName(receipt.customers),
              details: receipt.payment_mode || 'Payment',
              amount_or_qty: `₹${(receipt.amount || 0).toFixed(2)}`,
              location: receipt.location_code || 'N/A',
              raw_data: receipt,
            });
          });
        }
      }

      // 5. Fetch Credit Notes
      if (typeFilter === 'all' || typeFilter === 'credit_note') {
        let query = supabase
          .from('credit_notes')
          .select(`*, customers(*)`)
          .gte('note_date', fromDate)
          .lte('note_date', toDate);

        const { data: creditNoteData, error: creditNoteError } = await query;
        if (!creditNoteError && creditNoteData) {
          creditNoteData.forEach(note => {
            if (millFilter !== 'all' && note.mill !== millFilter) return;

            allActivities.push({
              id: note.id,
              type: 'credit_note',
              date: note.note_date,
              reference_no: note.note_no || 'N/A',
              party_name: getDisplayName(note.customers),
              details: note.reason || 'Credit Note',
              amount_or_qty: `₹${(note.amount || 0).toFixed(2)}`,
              location: note.mill || 'N/A',
              raw_data: note,
            });
          });
        }
      }

      // 6. Fetch Debit Notes
      if (typeFilter === 'all' || typeFilter === 'debit_note') {
        let query = supabase
          .from('debit_notes')
          .select(`*, customers(*)`)
          .gte('note_date', fromDate)
          .lte('note_date', toDate);

        const { data: debitNoteData, error: debitNoteError } = await query;
        if (!debitNoteError && debitNoteData) {
          debitNoteData.forEach(note => {
             if (millFilter !== 'all' && note.mill !== millFilter) return;

            allActivities.push({
              id: note.id,
              type: 'debit_note',
              date: note.note_date,
              reference_no: note.note_no || 'N/A',
              party_name: getDisplayName(note.customers),
              details: note.reason || 'Debit Note',
              amount_or_qty: `₹${(note.amount || 0).toFixed(2)}`,
              location: note.mill || 'N/A',
              raw_data: note,
            });
          });
        }
      }

      // Sort by Date Descending
      allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeLabel = (type: ActivityType) => {
    switch (type) {
      case 'sale_direct': return language === 'english' ? 'Direct Sale' : 'நேரடி விற்பனை';
      case 'sale_transit': return language === 'english' ? 'Transit Sale' : 'போக்குவரத்து விற்பனை';
      case 'outward': return language === 'english' ? 'Outward / Load' : 'அவுட்வர்ட் / லோட்';
      case 'purchase': return language === 'english' ? 'Purchase' : 'கொள்முதல்';
      case 'receipt': return language === 'english' ? 'Receipt' : 'ரசீது';
      case 'credit_note': return language === 'english' ? 'Credit Note' : 'கிரெடிட் நோட்';
      case 'debit_note': return language === 'english' ? 'Debit Note' : 'டெபிட் நோட்';
      default: return type;
    }
  };

  const getActivityTypeBadgeVariant = (type: ActivityType) => {
    switch (type) {
      case 'sale_direct': return 'default';
      case 'sale_transit': return 'default';
      case 'outward': return 'outline';
      case 'purchase': return 'secondary';
      case 'receipt': return 'success';
      case 'debit_note': return 'destructive';
      case 'credit_note': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <PageLayout title={language === 'english' ? 'Activities Log' : 'செயல்பாட்டு பதிவு'}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5" />
              {language === 'english' ? 'All Activities' : 'அனைத்து செயல்பாடுகளும்'}
            </CardTitle>
            <CardDescription>
              {language === 'english' 
                ? 'A unified timeline of all transactions and entries.' 
                : 'அனைத்து பரிவர்த்தனைகள் மற்றும் பதிவுகளின் ஒருங்கிணைந்த காலக்கெடு.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">{language === 'english' ? 'From Date' : 'தேதியிலிருந்து'}</label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">{language === 'english' ? 'To Date' : 'தேதி வரை'}</label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">{language === 'english' ? 'Mill' : 'மில்'}</label>
                <Select value={millFilter} onValueChange={setMillFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Mill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'english' ? 'All Mills' : 'அனைத்து மில்களும்'}</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.location_code}>
                        {language === 'english' ? loc.location_code : loc.location_name_tamil || loc.location_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">{language === 'english' ? 'Activity Type' : 'செயல்பாடு வகை'}</label>
                <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as ActivityType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'english' ? 'All Activities' : 'அனைத்து செயல்பாடுகளும்'}</SelectItem>
                    <SelectItem value="sale_direct">{language === 'english' ? 'Direct Sales' : 'நேரடி விற்பனை'}</SelectItem>
                    <SelectItem value="sale_transit">{language === 'english' ? 'Transit Sales' : 'போக்குவரத்து விற்பனை'}</SelectItem>
                    <SelectItem value="outward">{language === 'english' ? 'Outward/Load' : 'அவுட்வர்ட்/லோட்'}</SelectItem>
                    <SelectItem value="purchase">{language === 'english' ? 'Purchases' : 'கொள்முதல்'}</SelectItem>
                    <SelectItem value="receipt">{language === 'english' ? 'Receipts' : 'ரசீதுகள்'}</SelectItem>
                    <SelectItem value="credit_note">{language === 'english' ? 'Credit Notes' : 'கிரெடிட் நோட்கள்'}</SelectItem>
                    <SelectItem value="debit_note">{language === 'english' ? 'Debit Notes' : 'டெபிட் நோட்கள்'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                {language === 'english' ? 'No activities found for the selected filters.' : 'தேர்ந்தெடுக்கப்பட்ட வடிப்பான்களுக்கு எந்த செயல்பாடுகளும் கிடைக்கவில்லை.'}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'english' ? 'Date' : 'தேதி'}</TableHead>
                      <TableHead>{language === 'english' ? 'Type' : 'வகை'}</TableHead>
                      <TableHead>{language === 'english' ? 'Ref No' : 'குறிப்பு எண்'}</TableHead>
                      <TableHead>{language === 'english' ? 'Party' : 'வாடிக்கையாளர்/சப்ளையர்'}</TableHead>
                      <TableHead>{language === 'english' ? 'Details' : 'விவரங்கள்'}</TableHead>
                      <TableHead>{language === 'english' ? 'Amount / Qty' : 'தொகை / அளவு'}</TableHead>
                      <TableHead>{language === 'english' ? 'Location' : 'இடம்'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={`${activity.type}-${activity.id}`}>
                        <TableCell className="whitespace-nowrap">
                          {format(parseISO(activity.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActivityTypeBadgeVariant(activity.type) as any}>
                            {getActivityTypeLabel(activity.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{activity.reference_no}</TableCell>
                        <TableCell>{activity.party_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={activity.details}>
                          {activity.details}
                        </TableCell>
                        <TableCell className="font-semibold">{activity.amount_or_qty}</TableCell>
                        <TableCell>
                          {activity.location || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
