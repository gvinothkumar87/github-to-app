import { useState } from 'react';
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
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      <div className="container mx-auto p-6">
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