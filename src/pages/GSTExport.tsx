import { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { FileSpreadsheet, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { exportGSTExcel, calculateGSTSummary } from '@/lib/exports/gstExcel';
import { format } from 'date-fns';
import { useLocations } from '@/hooks/useLocations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SaleRecord {
  id: string;
  sale_date: string;
  bill_serial_no?: string;
  customer_name: string;
  gstin?: string;
  item_name: string;
  hsn_no?: string;
  unit_weight: number;
  bags: number;
  total_weight: number;
  rate: number;
  amount: number;
  gst_percentage: number;
  cgst: number;
  sgst: number;
  final_total: number;
  type: 'Sale' | 'Debit Note' | 'Credit Note';
}

const GSTExport = () => {
  const { locations } = useLocations();
  const [selectedGstin, setSelectedGstin] = useState<string>('all');
  
  // GST Export state
  const [gstStartDate, setGstStartDate] = useState(() => {
    const firstDay = new Date();
    firstDay.setDate(1);
    return format(firstDay, 'yyyy-MM-dd');
  });
  const [gstEndDate, setGstEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [gstSummary, setGstSummary] = useState<{
    totalTaxableAmount: number;
    totalCGST: number;
    totalSGST: number;
    grandTotal: number;
    recordCount: number;
  } | null>(null);
  const [loadingGST, setLoadingGST] = useState(false);
  const [salesData, setSalesData] = useState<SaleRecord[]>([]);

  // Group locations by unique GSTIN
  const gstinGroups = useMemo(() => {
    const groups: { [key: string]: { companyName: string; locations: string[]; codes: string[] } } = {};
    (locations || []).forEach((loc) => {
      const gstin = loc.gstin?.trim();
      if (!gstin) return;
      if (!groups[gstin]) {
        groups[gstin] = {
          companyName: loc.company_name,
          locations: [],
          codes: []
        };
      }
      const locName = loc.location_name || loc.location_code;
      if (!groups[gstin].locations.includes(locName)) {
        groups[gstin].locations.push(locName);
      }
      if (!groups[gstin].codes.includes(loc.location_code)) {
        groups[gstin].codes.push(loc.location_code);
      }
    });
    return groups;
  }, [locations]);

  // Fetch GST data when dates, selected gstin, or locations change
  useEffect(() => {
    fetchGSTData();
  }, [gstStartDate, gstEndDate, selectedGstin, locations]);

  const fetchGSTData = async () => {
    setLoadingGST(true);
    try {
      // Fetch all required data
      const [salesRes, debitNotesRes, creditNotesRes, customersRes, itemsRes] = await Promise.all([
        supabase.from('sales').select('*'),
        supabase.from('debit_notes').select('*'),
        supabase.from('credit_notes').select('*'),
        supabase.from('customers').select('id, name_english, gstin'),
        supabase.from('items').select('id, name_english, hsn_no, unit_weight, gst_percentage')
      ]);

      if (salesRes.error) throw salesRes.error;
      if (debitNotesRes.error) throw debitNotesRes.error;
      if (creditNotesRes.error) throw creditNotesRes.error;
      if (customersRes.error) throw customersRes.error;
      if (itemsRes.error) throw itemsRes.error;

      // Filter sales by date range, exclude D-series, and filter by selected GSTIN
      const filteredSales = (salesRes.data || []).filter((sale) => {
        const saleDate = new Date(sale.sale_date);
        const start = new Date(gstStartDate);
        const end = new Date(gstEndDate);
        
        const matchesDate = saleDate >= start && saleDate <= end;
        const notDSeries = !sale.bill_serial_no || !sale.bill_serial_no.startsWith('D');
        
        let matchesGstin = true;
        if (selectedGstin !== 'all') {
          const matchingCodes = gstinGroups[selectedGstin]?.codes || [];
          matchesGstin = matchingCodes.includes(sale.loading_place);
        }
        
        return matchesDate && notDSeries && matchesGstin;
      });

      // Filter debit notes
      const filteredDebitNotes = (debitNotesRes.data || []).filter((note) => {
        const noteDate = new Date(note.note_date);
        const start = new Date(gstStartDate);
        const end = new Date(gstEndDate);
        
        let matchesGstin = true;
        if (selectedGstin !== 'all') {
          const matchingCodes = gstinGroups[selectedGstin]?.codes || [];
          matchesGstin = matchingCodes.includes(note.mill);
        }
        
        return noteDate >= start && noteDate <= end && matchesGstin;
      });

      // Filter credit notes
      const filteredCreditNotes = (creditNotesRes.data || []).filter((note) => {
        const noteDate = new Date(note.note_date);
        const start = new Date(gstStartDate);
        const end = new Date(gstEndDate);
        
        let matchesGstin = true;
        if (selectedGstin !== 'all') {
          const matchingCodes = gstinGroups[selectedGstin]?.codes || [];
          matchesGstin = matchingCodes.includes(note.mill);
        }
        
        return noteDate >= start && noteDate <= end && matchesGstin;
      });

      const records: SaleRecord[] = [];

      // Map sales
      filteredSales.forEach((sale) => {
        const customer = customersRes.data?.find((c) => c.id === sale.customer_id);
        const item = itemsRes.data?.find((i) => i.id === sale.item_id);
        
        const unitWeight = Number(item?.unit_weight) || 0;
        const bags = Number(sale.quantity) || 0;
        const totalWeight = unitWeight * bags;
        const rate = Number(sale.rate) || 0;
        const gstPercentage = Number(item?.gst_percentage) || 0;
        const finalTotal = Number(sale.total_amount) || 0;
        
        // Reverse calculate amount before GST from final total
        const amount = finalTotal / (1 + gstPercentage / 100);
        const gstAmount = finalTotal - amount;
        const cgst = gstAmount / 2;
        const sgst = gstAmount / 2;

        records.push({
          id: sale.id,
          sale_date: sale.sale_date,
          bill_serial_no: sale.bill_serial_no,
          customer_name: customer?.name_english || '',
          gstin: customer?.gstin,
          item_name: item?.name_english || '',
          hsn_no: item?.hsn_no,
          unit_weight: unitWeight,
          bags,
          total_weight: totalWeight,
          rate,
          amount,
          gst_percentage: gstPercentage,
          cgst,
          sgst,
          final_total: finalTotal,
          type: 'Sale'
        });
      });

      // Map debit notes
      filteredDebitNotes.forEach((note) => {
        const customer = customersRes.data?.find((c) => c.id === note.customer_id);
        const item = itemsRes.data?.find((i) => i.id === note.item_id);
        
        const gstPercentage = Number(note.gst_percentage) || Number(item?.gst_percentage) || 0;
        const finalTotal = Number(note.amount) || 0;
        
        const amount = finalTotal / (1 + gstPercentage / 100);
        const gstAmount = finalTotal - amount;
        const cgst = gstAmount / 2;
        const sgst = gstAmount / 2;

        records.push({
          id: note.id,
          sale_date: note.note_date,
          bill_serial_no: note.note_no,
          customer_name: customer?.name_english || '',
          gstin: customer?.gstin,
          item_name: item?.name_english || '',
          hsn_no: item?.hsn_no,
          unit_weight: 0,
          bags: 0,
          total_weight: 0,
          rate: 0,
          amount,
          gst_percentage: gstPercentage,
          cgst,
          sgst,
          final_total: finalTotal,
          type: 'Debit Note'
        });
      });

      // Map credit notes (negative amounts/GST)
      filteredCreditNotes.forEach((note) => {
        const customer = customersRes.data?.find((c) => c.id === note.customer_id);
        const item = itemsRes.data?.find((i) => i.id === note.item_id);
        
        const gstPercentage = Number(note.gst_percentage) || Number(item?.gst_percentage) || 0;
        const finalTotal = Number(note.amount) || 0;
        
        const amount = finalTotal / (1 + gstPercentage / 100);
        const gstAmount = finalTotal - amount;
        const cgst = gstAmount / 2;
        const sgst = gstAmount / 2;

        records.push({
          id: note.id,
          sale_date: note.note_date,
          bill_serial_no: note.note_no,
          customer_name: customer?.name_english || '',
          gstin: customer?.gstin,
          item_name: item?.name_english || '',
          hsn_no: item?.hsn_no,
          unit_weight: 0,
          bags: 0,
          total_weight: 0,
          rate: 0,
          amount: -amount,
          gst_percentage: gstPercentage,
          cgst: -cgst,
          sgst: -sgst,
          final_total: -finalTotal,
          type: 'Credit Note'
        });
      });

      // Sort records by date ascending
      records.sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime());

      setSalesData(records);

      // Calculate summary
      const summary = calculateGSTSummary({
        sales: filteredSales,
        debitNotes: filteredDebitNotes,
        creditNotes: filteredCreditNotes,
        customers: customersRes.data || [],
        items: itemsRes.data || [],
        startDate: gstStartDate,
        endDate: gstEndDate,
        excludeDSeries: true
      });

      setGstSummary(summary);
    } catch (error) {
      console.error('Error fetching GST data:', error);
      toast.error('Failed to fetch GST data');
    } finally {
      setLoadingGST(false);
    }
  };

  const handleExportGSTExcel = async () => {
    setLoadingGST(true);
    try {
      // Fetch all required data
      const [salesRes, debitNotesRes, creditNotesRes, customersRes, itemsRes] = await Promise.all([
        supabase.from('sales').select('*'),
        supabase.from('debit_notes').select('*'),
        supabase.from('credit_notes').select('*'),
        supabase.from('customers').select('id, name_english, gstin'),
        supabase.from('items').select('id, name_english, hsn_no, unit_weight, gst_percentage')
      ]);

      if (salesRes.error) throw salesRes.error;
      if (debitNotesRes.error) throw debitNotesRes.error;
      if (creditNotesRes.error) throw creditNotesRes.error;
      if (customersRes.error) throw customersRes.error;
      if (itemsRes.error) throw itemsRes.error;

      // Filter by selected GSTIN
      const filteredSales = (salesRes.data || []).filter((sale) => {
        if (selectedGstin !== 'all') {
          const matchingCodes = gstinGroups[selectedGstin]?.codes || [];
          return matchingCodes.includes(sale.loading_place);
        }
        return true;
      });

      const filteredDebitNotes = (debitNotesRes.data || []).filter((note) => {
        if (selectedGstin !== 'all') {
          const matchingCodes = gstinGroups[selectedGstin]?.codes || [];
          return matchingCodes.includes(note.mill);
        }
        return true;
      });

      const filteredCreditNotes = (creditNotesRes.data || []).filter((note) => {
        if (selectedGstin !== 'all') {
          const matchingCodes = gstinGroups[selectedGstin]?.codes || [];
          return matchingCodes.includes(note.mill);
        }
        return true;
      });

      const result = exportGSTExcel({
        sales: filteredSales,
        debitNotes: filteredDebitNotes,
        creditNotes: filteredCreditNotes,
        customers: customersRes.data || [],
        items: itemsRes.data || [],
        startDate: gstStartDate,
        endDate: gstEndDate,
        excludeDSeries: true
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error exporting GST Excel:', error);
      toast.error('Failed to export GST Excel');
    } finally {
      setLoadingGST(false);
    }
  };

  return (
    <PageLayout title="GST Excel Export">
      <div className="container mx-auto p-6 space-y-6">
        {/* Date Range Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date Range
            </CardTitle>
            <CardDescription>
              Choose the date range for GST report export (D series bills will be excluded)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="gst-start-date" className="text-sm font-medium">
                  Start Date
                </label>
                <Input
                  id="gst-start-date"
                  type="date"
                  value={gstStartDate}
                  onChange={(e) => setGstStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="gst-end-date" className="text-sm font-medium">
                  End Date
                </label>
                <Input
                  id="gst-end-date"
                  type="date"
                  value={gstEndDate}
                  onChange={(e) => setGstEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="company-gstin" className="text-sm font-medium">
                  Company GSTIN Filter
                </label>
                <Select value={selectedGstin} onValueChange={setSelectedGstin}>
                  <SelectTrigger id="company-gstin">
                    <SelectValue placeholder="All GSTINs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All GSTINs</SelectItem>
                    {Object.entries(gstinGroups).map(([gstin, group]) => (
                      <SelectItem key={gstin} value={gstin}>
                        {gstin} - {group.companyName} ({group.locations.join(', ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        {gstSummary && (
          <Card>
            <CardHeader>
              <CardTitle>GST Summary</CardTitle>
              <CardDescription>
                Summary for {gstStartDate} to {gstEndDate} (excluding D series, including Credit/Debit Notes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Records</p>
                  <p className="text-2xl font-bold">{gstSummary.recordCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Taxable Amount</p>
                  <p className="text-2xl font-bold">₹{gstSummary.totalTaxableAmount.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">CGST</p>
                  <p className="text-2xl font-bold">₹{gstSummary.totalCGST.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SGST</p>
                  <p className="text-2xl font-bold">₹{gstSummary.totalSGST.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Grand Total</p>
                  <p className="text-2xl font-bold text-primary">₹{gstSummary.grandTotal.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleExportGSTExcel}
            disabled={loadingGST}
            size="lg"
            className="gap-2"
          >
            <FileSpreadsheet className="h-5 w-5" />
            {loadingGST ? 'Exporting...' : 'Export GST Excel'}
          </Button>
        </div>

        {/* Data Table */}
        {salesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>GST Records</CardTitle>
              <CardDescription>
                {salesData.length} records found (excluding D series, including Credit/Debit Notes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">S.No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Bill/Note No</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>Feed</TableHead>
                      <TableHead>HSN</TableHead>
                      <TableHead className="text-right">KG</TableHead>
                      <TableHead className="text-right">Bags</TableHead>
                      <TableHead className="text-right">Total Weight</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">GST%</TableHead>
                      <TableHead className="text-right">CGST</TableHead>
                      <TableHead className="text-right">SGST</TableHead>
                      <TableHead className="text-right">Final Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((record, index) => (
                      <TableRow key={`${record.type}-${record.id}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{format(new Date(record.sale_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            record.type === 'Sale' ? 'bg-blue-100 text-blue-800' :
                            record.type === 'Debit Note' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {record.type}
                          </span>
                        </TableCell>
                        <TableCell>{record.bill_serial_no || '-'}</TableCell>
                        <TableCell>{record.customer_name}</TableCell>
                        <TableCell>{record.gstin || '-'}</TableCell>
                        <TableCell>{record.item_name}</TableCell>
                        <TableCell>{record.hsn_no || '-'}</TableCell>
                        <TableCell className="text-right">{record.unit_weight || '-'}</TableCell>
                        <TableCell className="text-right">{record.bags || '-'}</TableCell>
                        <TableCell className="text-right">{record.total_weight || '-'}</TableCell>
                        <TableCell className="text-right">{record.rate ? `₹${record.rate.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className="text-right">₹{record.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{record.gst_percentage}%</TableCell>
                        <TableCell className="text-right">₹{record.cgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{record.sgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">₹{record.final_total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Data Message */}
        {!loadingGST && salesData.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No GST records found for the selected period (excluding D series)
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default GSTExport;
