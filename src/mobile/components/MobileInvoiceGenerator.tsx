import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { Printer, Download, Share } from 'lucide-react';

export const MobileInvoiceGenerator = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const [sale, setSale] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);

  const { data: sales } = useEnhancedOfflineData('sales');
  const { data: customers } = useEnhancedOfflineData('customers');
  const { data: items } = useEnhancedOfflineData('items');
  const { data: outwardEntries } = useEnhancedOfflineData('outward_entries');
  const { data: settings } = useEnhancedOfflineData('company_settings');

  useEffect(() => {
    if (saleId && sales.length > 0) {
      const foundSale = sales.find((s: any) => s.id === saleId);
      setSale(foundSale);
    }
    if (settings.length > 0) {
      setCompanySettings(settings[0]);
    }
  }, [saleId, sales, settings]);

  const customer = sale ? customers.find((c: any) => c.id === sale.customer_id) : null;
  const item = sale ? items.find((i: any) => i.id === sale.item_id) : null;
  const outwardEntry = sale ? outwardEntries.find((e: any) => e.id === sale.outward_entry_id) : null;

  const calculateAmounts = () => {
    if (!sale || !item) return { baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    
    const baseAmount = sale.quantity * sale.rate;
    const gstPercent = (item as any).gst_percentage || 0;
    const gstAmount = baseAmount * (gstPercent / 100);
    const totalAmount = baseAmount + gstAmount;
    
    return { baseAmount, gstAmount, totalAmount };
  };

  const { baseAmount, gstAmount, totalAmount } = calculateAmounts();

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${sale?.bill_serial_no}`,
          text: `Invoice for ${customer ? getDisplayName(customer as any) : 'Customer'} - Amount: ₹${totalAmount.toFixed(2)}`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  if (!sale || !customer || !item || !outwardEntry) {
    return (
      <MobileLayout 
        title={language === 'english' ? 'Invoice' : 'விலைப்பட்டியல்'}
        showBackButton
        onBack={() => navigate('/bills')}
      >
        <Card>
          <CardContent className="p-6 text-center">
            {language === 'english' ? 'Loading invoice...' : 'விலைப்பட்டியல் ஏற்றுகிறது...'}
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title={language === 'english' ? 'Invoice' : 'விலைப்பட்டியல்'}
      showBackButton
      onBack={() => navigate('/bills')}
      action={
        <div className="flex gap-2">
          {navigator.share && (
            <Button size="sm" variant="outline" onClick={handleShare} className="gap-1">
              <Share className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" onClick={handlePrint} className="gap-1">
            <Printer className="h-4 w-4" />
            {language === 'english' ? 'Print' : 'அச்சிடு'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 print:space-y-6">
        {/* Company Header */}
        <Card className="print:shadow-none">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold text-primary mb-2">
              {companySettings?.company_name || 'Company Name'}
            </h1>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{companySettings?.address_line1}</p>
              {companySettings?.address_line2 && <p>{companySettings.address_line2}</p>}
              <p>{companySettings?.locality}, {companySettings?.location_name} - {companySettings?.pin_code}</p>
              {companySettings?.phone && <p>Phone: {companySettings.phone}</p>}
              {companySettings?.email && <p>Email: {companySettings.email}</p>}
              {companySettings?.gstin && <p>GSTIN: {companySettings.gstin}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Header */}
        <Card className="print:shadow-none">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  {language === 'english' ? 'TAX INVOICE' : 'வரி விலைப்பட்டியல்'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'english' ? 'Bill No:' : 'பில் எண்:'} <span className="font-medium">{sale.bill_serial_no}</span>
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">
                  {language === 'english' ? 'Date:' : 'தேதி:'}
                </p>
                <p className="font-medium">{new Date(sale.sale_date).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold mb-2">
                  {language === 'english' ? 'Bill To:' : 'பில் பெறுபவர்:'}
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{getDisplayName(customer as any)}</p>
                  <p>{(customer as any).code}</p>
                  {(customer as any).address_english && <p>{(customer as any).address_english}</p>}
                  {(customer as any).contact_person && (
                    <p>{language === 'english' ? 'Contact:' : 'தொடர்பு:'} {(customer as any).contact_person}</p>
                  )}
                  {(customer as any).phone && <p>{language === 'english' ? 'Phone:' : 'தொலைபேசி:'} {(customer as any).phone}</p>}
                  {(customer as any).gstin && <p>GSTIN: {(customer as any).gstin}</p>}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {language === 'english' ? 'Transport Details:' : 'போக்குவரத்து விவரங்கள்:'}
                </h3>
                <div className="text-sm space-y-1">
                  <p>{language === 'english' ? 'Lorry No:' : 'லாரி எண்:'} <span className="font-medium">{(outwardEntry as any).lorry_no}</span></p>
                  <p>{language === 'english' ? 'Driver Mobile:' : 'ஓட்டுநர் மொபைல்:'} {(outwardEntry as any).driver_mobile}</p>
                  <p>{language === 'english' ? 'Loading Place:' : 'ஏற்றும் இடம்:'} {(outwardEntry as any).loading_place}</p>
                  {(outwardEntry as any).net_weight && (
                    <p>{language === 'english' ? 'Net Weight:' : 'நிகர எடை:'} {(outwardEntry as any).net_weight} KG</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="print:shadow-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">
                      {language === 'english' ? 'Item' : 'பொருள்'}
                    </th>
                    <th className="p-3 text-center text-sm font-medium">
                      {language === 'english' ? 'HSN' : 'HSN'}
                    </th>
                    <th className="p-3 text-center text-sm font-medium">
                      {language === 'english' ? 'Qty' : 'அளவு'}
                    </th>
                    <th className="p-3 text-right text-sm font-medium">
                      {language === 'english' ? 'Rate' : 'விலை'}
                    </th>
                    <th className="p-3 text-right text-sm font-medium">
                      {language === 'english' ? 'Amount' : 'தொகை'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{getDisplayName(item as any)}</p>
                        {(item as any).description_english && (
                          <p className="text-xs text-muted-foreground">{(item as any).description_english}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center text-sm">{(item as any).hsn_no || '-'}</td>
                    <td className="p-3 text-center text-sm">{sale.quantity} {(item as any).unit}</td>
                    <td className="p-3 text-right text-sm">₹{sale.rate.toFixed(2)}</td>
                    <td className="p-3 text-right text-sm font-medium">₹{baseAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="print:shadow-none">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{language === 'english' ? 'Subtotal:' : 'उप-कुल:'}</span>
                <span>₹{baseAmount.toFixed(2)}</span>
              </div>
              {(item as any).gst_percentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span>GST ({(item as any).gst_percentage}%):</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{language === 'english' ? 'Total Amount:' : 'मुख्य रकम:'}</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="print:shadow-none">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <p>{language === 'english' ? 'Thank you for your business!' : 'உங்கள் வியாபாரத்திற்கு நன்றி!'}</p>
            {companySettings?.bank_name && (
              <div className="mt-4 text-xs">
                <p><strong>{language === 'english' ? 'Bank Details:' : 'બેંક વિગતો:'}</strong></p>
                <p>{companySettings.bank_name} - {companySettings.bank_branch}</p>
                <p>{language === 'english' ? 'A/c No:' : 'खाता संख्या:'} {companySettings.bank_account_no}</p>
                <p>IFSC: {companySettings.bank_ifsc}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default MobileInvoiceGenerator;