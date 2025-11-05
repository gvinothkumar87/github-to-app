import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { UnifiedBillsList } from '@/components/UnifiedBillsList';
import { EditSaleForm } from '@/components/forms/EditSaleForm';
import { EditDebitNoteForm } from '@/components/forms/EditDebitNoteForm';
import { EditCreditNoteForm } from '@/components/forms/EditCreditNoteForm';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { DebitNoteInvoiceGenerator } from '@/components/DebitNoteInvoiceGenerator';
import { CreditNoteInvoiceGenerator } from '@/components/CreditNoteInvoiceGenerator';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Sale, OutwardEntry, Customer, Item, DebitNote, CreditNote } from '@/types';
import { ArrowLeft, FileText, FileSpreadsheet, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { exportGSTExcel, calculateGSTSummary } from '@/lib/exports/gstExcel';
import { format } from 'date-fns';

const Bills = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  // Sales editing state
  const [editingSale, setEditingSale] = useState<{
    sale: Sale;
    outwardEntry: OutwardEntry;
    customer: Customer;
    item: Item;
  } | null>(null);
  
  // Debit note editing state
  const [editingDebitNote, setEditingDebitNote] = useState<{
    debitNote: DebitNote;
    customer: Customer;
  } | null>(null);
  
  // Credit note editing state
  const [editingCreditNote, setEditingCreditNote] = useState<{
    creditNote: CreditNote;
    customer: Customer;
  } | null>(null);
  
  // Printing states
  const [printingSale, setPrintingSale] = useState<{
    sale: Sale;
    outwardEntry: OutwardEntry;
    customer: Customer;
    item: Item;
  } | null>(null);
  
  const [printingDebitNote, setPrintingDebitNote] = useState<{
    debitNote: DebitNote;
    customer: Customer;
    item: Item;
  } | null>(null);
  
  const [printingCreditNote, setPrintingCreditNote] = useState<{
    creditNote: CreditNote;
    customer: Customer;
    item: Item;
  } | null>(null);
  
  const [refreshKey, setRefreshKey] = useState(0);

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
        supabase.from('items').select('id, name_english, hsn_no')
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
        supabase.from('items').select('id, name_english, hsn_no')
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
        toast.success('GST Report Exported', { description: result.message });
      } else {
        toast.error('No Data', { description: result.message });
      }
    } catch (error) {
      console.error('Error exporting GST Excel:', error);
      toast.error('Export failed', { description: 'Failed to export GST report' });
    } finally {
      setLoadingGST(false);
    }
  };

  // Sales handlers
  const handleEditSale = (sale: Sale, outwardEntry: OutwardEntry, customer: Customer, item: Item) => {
    setEditingSale({ sale, outwardEntry, customer, item });
  };

  const handlePrintSale = (sale: Sale, outwardEntry: OutwardEntry, customer: Customer, item: Item) => {
    setPrintingSale({ sale, outwardEntry, customer, item });
  };

  // Debit note handlers
  const handleEditDebitNote = (debitNote: DebitNote, customer: Customer) => {
    setEditingDebitNote({ debitNote, customer });
  };

  const handlePrintDebitNote = async (debitNote: DebitNote, customer: Customer) => {
    // Fetch item details
    if (debitNote.item_id) {
      const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', debitNote.item_id)
        .single();
      
      if (!error && item) {
        setPrintingDebitNote({ debitNote, customer, item });
      } else {
        toast.error('Error fetching item details');
      }
    } else {
      // Fallback for old debit notes without item_id
      const defaultItem: Item = {
        id: '',
        name_english: 'No Product',
        name_tamil: undefined,
        code: 'N/A',
        unit: 'NOS',
        unit_weight: 1,
        hsn_no: '',
        gst_percentage: 18,
        description_english: undefined,
        description_tamil: undefined,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setPrintingDebitNote({ debitNote, customer, item: defaultItem });
    }
  };

  // Credit note handlers
  const handleEditCreditNote = (creditNote: CreditNote, customer: Customer) => {
    setEditingCreditNote({ creditNote, customer });
  };

  const handlePrintCreditNote = async (creditNote: CreditNote, customer: Customer) => {
    // Fetch item details
    if (creditNote.item_id) {
      const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', creditNote.item_id)
        .single();
      
      if (!error && item) {
        setPrintingCreditNote({ creditNote, customer, item });
      } else {
        toast.error('Error fetching item details');
      }
    } else {
      // Fallback for old credit notes without item_id
      const defaultItem: Item = {
        id: '',
        name_english: 'No Product',
        name_tamil: undefined,
        code: 'N/A',
        unit: 'NOS',
        unit_weight: 1,
        hsn_no: '',
        gst_percentage: 18,
        description_english: undefined,
        description_tamil: undefined,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setPrintingCreditNote({ creditNote, customer, item: defaultItem });
    }
  };

  // Success handlers
  const handleEditSuccess = () => {
    setEditingSale(null);
    setEditingDebitNote(null);
    setEditingCreditNote(null);
    setRefreshKey(prev => prev + 1);
  };

  // Close handlers
  const handleCloseEdit = () => {
    setEditingSale(null);
    setEditingDebitNote(null);
    setEditingCreditNote(null);
  };

  const handleClosePrint = () => {
    setPrintingSale(null);
    setPrintingDebitNote(null);
    setPrintingCreditNote(null);
  };

  // Edit Sale View
  if (editingSale) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-primary text-primary-foreground shadow-elevated">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseEdit}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <FileText className="h-8 w-8" />
                <h1 className="text-xl md:text-2xl font-bold">
                  {language === 'english' ? 'Edit Sales Bill' : 'விற்பனை பில் திருத்து'}
                </h1>
              </div>
              <LanguageToggle />
            </div>
          </div>
        </header>
        
        <div className="container mx-auto p-6">
          <EditSaleForm
            sale={editingSale.sale}
            outwardEntry={editingSale.outwardEntry}
            customer={editingSale.customer}
            item={editingSale.item}
            onSuccess={handleEditSuccess}
            onCancel={handleCloseEdit}
          />
        </div>
      </div>
    );
  }

  // Edit Debit Note View
  if (editingDebitNote) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-primary text-primary-foreground shadow-elevated">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseEdit}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <FileText className="h-8 w-8" />
                <h1 className="text-xl md:text-2xl font-bold">
                  {language === 'english' ? 'Edit Debit Note' : 'டெபிட் நோட் திருத்து'}
                </h1>
              </div>
              <LanguageToggle />
            </div>
          </div>
        </header>
        
        <div className="container mx-auto p-6">
          <EditDebitNoteForm
            debitNote={editingDebitNote.debitNote}
            customer={editingDebitNote.customer}
            onSuccess={handleEditSuccess}
            onCancel={handleCloseEdit}
          />
        </div>
      </div>
    );
  }

  // Edit Credit Note View
  if (editingCreditNote) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-primary text-primary-foreground shadow-elevated">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseEdit}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <FileText className="h-8 w-8" />
                <h1 className="text-xl md:text-2xl font-bold">
                  {language === 'english' ? 'Edit Credit Note' : 'கிரெடிட் நோட் திருத்து'}
                </h1>
              </div>
              <LanguageToggle />
            </div>
          </div>
        </header>
        
        <div className="container mx-auto p-6">
          <EditCreditNoteForm
            creditNote={editingCreditNote.creditNote}
            customer={editingCreditNote.customer}
            onSuccess={handleEditSuccess}
            onCancel={handleCloseEdit}
          />
        </div>
      </div>
    );
  }

  // Print Sales Bill View
  if (printingSale) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-primary text-primary-foreground shadow-elevated">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClosePrint}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <FileText className="h-8 w-8" />
                <h1 className="text-xl md:text-2xl font-bold">
                  {language === 'english' ? 'Print Sales Bill' : 'விற்பனை பில் அச்சிடு'}
                </h1>
              </div>
              <LanguageToggle />
            </div>
          </div>
        </header>
        
        <div className="container mx-auto p-6">
          <InvoiceGenerator
            sale={printingSale.sale}
            outwardEntry={printingSale.outwardEntry}
            customer={printingSale.customer}
            item={printingSale.item}
            onClose={handleClosePrint}
          />
        </div>
      </div>
    );
  }

  // Print Debit Note View
  if (printingDebitNote) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-primary text-primary-foreground shadow-elevated">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClosePrint}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <FileText className="h-8 w-8" />
                <h1 className="text-xl md:text-2xl font-bold">
                  {language === 'english' ? 'Print Debit Note' : 'டெபிட் நோட் அச்சிடு'}
                </h1>
              </div>
              <LanguageToggle />
            </div>
          </div>
        </header>
        
        <div className="container mx-auto p-6">
          <DebitNoteInvoiceGenerator
            debitNote={printingDebitNote.debitNote}
            customer={printingDebitNote.customer}
            item={printingDebitNote.item}
            onClose={handleClosePrint}
          />
        </div>
      </div>
    );
  }

  // Print Credit Note View
  if (printingCreditNote) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-primary text-primary-foreground shadow-elevated">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClosePrint}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <FileText className="h-8 w-8" />
                <h1 className="text-xl md:text-2xl font-bold">
                  {language === 'english' ? 'Print Credit Note' : 'கிரெடிட் நோட் அச்சிடு'}
                </h1>
              </div>
              <LanguageToggle />
            </div>
          </div>
        </header>
        
        <div className="container mx-auto p-6">
          <CreditNoteInvoiceGenerator
            creditNote={printingCreditNote.creditNote}
            customer={printingCreditNote.customer}
            item={printingCreditNote.item}
            onClose={handleClosePrint}
          />
        </div>
      </div>
    );
  }

  // Main Bills List View
  return (
    <PageLayout title={language === 'english' ? 'Bills Management' : 'பில் மேலாண்மை'}>
      <div className="container mx-auto p-6 space-y-6">
        {/* GST Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {language === 'english' ? 'GST Excel Export' : 'ஜிஎஸ்டி எக்செல் ஏற்றுமதி'}
            </CardTitle>
            <CardDescription>
              {language === 'english' 
                ? 'Export GST report excluding D-series bills' 
                : 'டி-சீரிஸ் பில்களை தவிர்த்து ஜிஎஸ்டி அறிக்கையை ஏற்றுமதி செய்க'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {language === 'english' ? 'Start Date' : 'தொடக்க தேதி'}
                </label>
                <Input
                  type="date"
                  value={gstStartDate}
                  onChange={(e) => setGstStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {language === 'english' ? 'End Date' : 'முடிவு தேதி'}
                </label>
                <Input
                  type="date"
                  value={gstEndDate}
                  onChange={(e) => setGstEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleExportGSTExcel} 
                  disabled={loadingGST}
                  className="w-full"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {loadingGST 
                    ? (language === 'english' ? 'Exporting...' : 'ஏற்றுமதி செய்யப்படுகிறது...')
                    : (language === 'english' ? 'Export GST Excel' : 'ஜிஎஸ்டி எக்செல் ஏற்றுமதி')}
                </Button>
              </div>
            </div>

            {/* Summary Totals */}
            {gstSummary && gstSummary.recordCount > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">
                    {language === 'english' ? 'Records' : 'பதிவுகள்'}
                  </div>
                  <div className="text-lg font-semibold">{gstSummary.recordCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">
                    {language === 'english' ? 'Taxable Amount' : 'வரி தொகை'}
                  </div>
                  <div className="text-lg font-semibold">₹{gstSummary.totalTaxableAmount.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">CGST</div>
                  <div className="text-lg font-semibold">₹{gstSummary.totalCGST.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">SGST</div>
                  <div className="text-lg font-semibold">₹{gstSummary.totalSGST.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">
                    {language === 'english' ? 'Grand Total' : 'மொத்த தொகை'}
                  </div>
                  <div className="text-lg font-semibold text-primary">₹{gstSummary.grandTotal.toFixed(2)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bills List */}
        <UnifiedBillsList
          key={refreshKey}
          onEditSale={handleEditSale}
          onPrintSale={handlePrintSale}
          onEditDebitNote={handleEditDebitNote}
          onPrintDebitNote={handlePrintDebitNote}
          onEditCreditNote={handleEditCreditNote}
          onPrintCreditNote={handlePrintCreditNote}
        />
      </div>
    </PageLayout>
  );
};

export default Bills;