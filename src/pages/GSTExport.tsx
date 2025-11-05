import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { ArrowLeft, FileSpreadsheet, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { exportGSTExcel, calculateGSTSummary } from '@/lib/exports/gstExcel';
import { format } from 'date-fns';

const GSTExport = () => {
  const navigate = useNavigate();
  
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

  // Fetch GST summary when dates change
  useEffect(() => {
    fetchGSTSummary();
  }, [gstStartDate, gstEndDate]);

  const fetchGSTSummary = async () => {
    setLoadingGST(true);
    try {
      // Fetch all required data
      const [salesRes, customersRes, itemsRes] = await Promise.all([
        supabase.from('sales').select('*'),
        supabase.from('customers').select('id, name_english, gstin'),
        supabase.from('items').select('id, name_english, hsn_no, unit_weight, gst_percentage')
      ]);

      if (salesRes.error) throw salesRes.error;
      if (customersRes.error) throw customersRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const summary = calculateGSTSummary({
        sales: salesRes.data || [],
        customers: customersRes.data || [],
        items: itemsRes.data || [],
        startDate: gstStartDate,
        endDate: gstEndDate,
        excludeDSeries: true
      });

      setGstSummary(summary);
    } catch (error) {
      console.error('Error fetching GST summary:', error);
      toast.error('Failed to calculate GST summary');
    } finally {
      setLoadingGST(false);
    }
  };

  const handleExportGSTExcel = async () => {
    setLoadingGST(true);
    try {
      // Fetch all required data
      const [salesRes, customersRes, itemsRes] = await Promise.all([
        supabase.from('sales').select('*'),
        supabase.from('customers').select('id, name_english, gstin'),
        supabase.from('items').select('id, name_english, hsn_no, unit_weight, gst_percentage')
      ]);

      if (salesRes.error) throw salesRes.error;
      if (customersRes.error) throw customersRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const result = exportGSTExcel({
        sales: salesRes.data || [],
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        {gstSummary && (
          <Card>
            <CardHeader>
              <CardTitle>GST Summary</CardTitle>
              <CardDescription>
                Summary for {gstStartDate} to {gstEndDate} (excluding D series)
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
      </div>
    </PageLayout>
  );
};

export default GSTExport;
