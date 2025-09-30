import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BillsList } from '@/components/BillsList';
import { EditSaleForm } from '@/components/forms/EditSaleForm';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Sale, OutwardEntry, Customer, Item } from '@/types';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Bills = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [editingSale, setEditingSale] = useState<{
    sale: Sale;
    outwardEntry: OutwardEntry;
    customer: Customer;
    item: Item;
  } | null>(null);
  const [printingSale, setPrintingSale] = useState<{
    sale: Sale;
    outwardEntry: OutwardEntry;
    customer: Customer;
    item: Item;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEditSale = (sale: Sale, outwardEntry: OutwardEntry, customer: Customer, item: Item) => {
    setEditingSale({ sale, outwardEntry, customer, item });
  };

  const handlePrintSale = (sale: Sale, outwardEntry: OutwardEntry, customer: Customer, item: Item) => {
    setPrintingSale({ sale, outwardEntry, customer, item });
  };

  const handleEditSuccess = () => {
    setEditingSale(null);
    setRefreshKey(prev => prev + 1);
  };

  const handlePrintClose = () => {
    setPrintingSale(null);
  };

  if (editingSale) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-gradient-primary text-primary-foreground shadow-elevated">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSale(null)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <FileText className="h-8 w-8" />
                <h1 className="text-xl md:text-2xl font-bold">
                  {language === 'english' ? 'Edit Bill' : 'பில் திருத்து'}
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
            onCancel={() => setEditingSale(null)}
          />
        </div>
      </div>
    );
  }

  if (printingSale) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-gradient-primary text-primary-foreground shadow-elevated">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPrintingSale(null)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <FileText className="h-8 w-8" />
                <h1 className="text-xl md:text-2xl font-bold">
                  {language === 'english' ? 'Print Bill' : 'பில் அச்சிடு'}
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
            onClose={handlePrintClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-elevated">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <FileText className="h-8 w-8" />
              <h1 className="text-xl md:text-2xl font-bold">
                {language === 'english' ? 'Bills Management' : 'பில் மேலாண்மை'}
              </h1>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-6">
        <BillsList
          key={refreshKey}
          onEditSale={handleEditSale}
          onPrintSale={handlePrintSale}
        />
      </div>
    </div>
  );
};

export default Bills;