import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import QRCode from 'qrcode';

export const MobileInvoiceGenerator: React.FC = () => {
  const { saleId } = useParams();
  const { language, getDisplayName } = useLanguage();
  const [sale, setSale] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);

  const { data: sales } = useEnhancedOfflineData('sales');
  const { data: customers } = useEnhancedOfflineData('customers');
  const { data: items } = useEnhancedOfflineData('items');
  const { data: outwardEntries } = useEnhancedOfflineData('outward_entries');
  const { data: companySettingsData } = useEnhancedOfflineData('company_settings');

  useEffect(() => {
    if (saleId && sales.length > 0) {
      const foundSale = sales.find((s: any) => s.id === saleId);
      if (foundSale) {
        setSale(foundSale);
      }
    }
  }, [saleId, sales]);

  useEffect(() => {
    if (companySettingsData.length > 0 && sale) {
      const outwardEntry = outwardEntries.find((entry: any) => entry.id === sale.outward_entry_id);
      if (outwardEntry) {
        const settings = companySettingsData.find((cs: any) => cs.location_name === (outwardEntry as any).loading_place);
        setCompanySettings(settings || companySettingsData[0]);
      }
    }
  }, [companySettingsData, sale, outwardEntries]);

  const customer: any = sale ? customers.find((c: any) => c.id === sale.customer_id) : null;
  const item: any = sale ? items.find((i: any) => i.id === sale.item_id) : null;
  const outwardEntry: any = sale ? outwardEntries.find((e: any) => e.id === sale.outward_entry_id) : null;

  const calculateAmounts = () => {
    if (!sale || !item) return { baseAmount: 0, gstAmount: 0, totalAmount: 0 };
    
    const quantity = sale.quantity;
    const rate = sale.rate;
    const baseAmount = quantity * rate;
    const gstPercent = item.gst_percentage || 0;
    const gstAmount = baseAmount * (gstPercent / 100);
    const totalAmount = baseAmount + gstAmount;
    
    return { baseAmount, gstAmount, totalAmount };
  };

  const handlePrint = async () => {
    // For mobile, we'll open a new window with the print-optimized invoice
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate QR code if IRN exists
    let qrCodeDataUrl = '';
    if (sale.irn) {
      try {
        qrCodeDataUrl = await QRCode.toDataURL(sale.irn, {
          width: 120,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }

    const { baseAmount, gstAmount, totalAmount } = calculateAmounts();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${sale.bill_serial_no || 'N/A'}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 10px; }
            .invoice-container { max-width: 100%; }
            .header { display: flex; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .qr-section { width: 80px; height: 80px; margin-right: 15px; display: flex; align-items: center; justify-content: center; }
            .qr-code { max-width: 100%; max-height: 100%; }
            .company-info { flex: 1; text-align: center; }
            .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .company-details { font-size: 9px; line-height: 1.3; }
            .invoice-title { font-size: 14px; font-weight: bold; background: #f0f0f0; padding: 5px; text-align: center; margin-bottom: 15px; }
            .details-section { margin-bottom: 15px; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            .details-table td { padding: 3px 5px; border: 1px solid #ddd; font-size: 9px; }
            .details-label { font-weight: bold; background: #f9f9f9; width: 40%; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .items-table th, .items-table td { border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px; }
            .items-table th { background: #f0f0f0; font-weight: bold; }
            .totals-section { margin-top: 15px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 10px; }
            .grand-total { font-weight: bold; font-size: 12px; border-top: 2px solid #000; padding-top: 5px; }
            .amount-words { margin: 15px 0; padding: 8px; border: 1px solid #000; background: #f9f9f9; font-size: 9px; }
            .footer { margin-top: 20px; text-align: right; font-size: 9px; }
            @media print {
              body { -webkit-print-color-adjust: exact; padding: 5px; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              ${sale.irn && qrCodeDataUrl ? `
                <div class="qr-section">
                  <img src="${qrCodeDataUrl}" alt="IRN QR Code" class="qr-code" />
                </div>
              ` : '<div class="qr-section"></div>'}
              <div class="company-info">
                <div class="company-name">${companySettings?.company_name || 'Company Name'}</div>
                <div class="company-details">
                  ${companySettings?.address_line1 || ''} ${companySettings?.address_line2 || ''}<br>
                  ${companySettings?.locality || ''} - ${companySettings?.pin_code || ''}<br>
                  Phone: ${companySettings?.phone || 'N/A'}<br>
                  GSTIN: ${companySettings?.gstin || 'N/A'}
                </div>
              </div>
            </div>
            
            <div class="invoice-title">TAX INVOICE</div>
            
            <div class="details-section">
              <table class="details-table">
                <tr>
                  <td class="details-label">Invoice No:</td>
                  <td>${sale.bill_serial_no || 'N/A'}</td>
                  <td class="details-label">Date:</td>
                  <td>${format(new Date(sale.sale_date), 'dd/MM/yyyy')}</td>
                </tr>
                <tr>
                  <td class="details-label">Customer:</td>
                  <td colspan="3">${customer?.name_english || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="details-label">GSTIN:</td>
                  <td>${customer?.gstin || 'N/A'}</td>
                  <td class="details-label">Lorry No:</td>
                  <td>${outwardEntry?.lorry_no || 'N/A'}</td>
                </tr>
                ${sale.irn ? `
                <tr>
                  <td class="details-label">IRN:</td>
                  <td colspan="3">${sale.irn}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Description</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>${item?.name_english || 'N/A'}</td>
                  <td>${item?.hsn_no || 'N/A'}</td>
                  <td>${sale.quantity} ${item?.unit || 'KG'}</td>
                  <td>₹${sale.rate.toFixed(2)}</td>
                  <td>₹${baseAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="totals-section">
              <div class="total-row">
                <span>Taxable Amount:</span>
                <span>₹${baseAmount.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>GST (${item?.gst_percentage || 0}%):</span>
                <span>₹${gstAmount.toFixed(2)}</span>
              </div>
              <div class="total-row grand-total">
                <span>Total Amount:</span>
                <span>₹${totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>For ${companySettings?.company_name || 'Company Name'}</p>
              <br><br>
              <p>Authorized Signatory</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${sale.bill_serial_no}`,
          text: `Invoice for ${customer?.name_english} - Amount: ₹${calculateAmounts().totalAmount.toFixed(2)}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (!sale || !customer || !item || !outwardEntry) {
    return (
      <MobileLayout title={language === 'english' ? 'Invoice' : 'விலைப்பட்டியல்'}>
        <div className="py-10 text-center text-muted-foreground">
          {language === 'english' ? 'Loading invoice...' : 'விலைப்பட்டியல் ஏற்றுகிறது...'}
        </div>
      </MobileLayout>
    );
  }

  const { baseAmount, gstAmount, totalAmount } = calculateAmounts();

  return (
    <MobileLayout title={language === 'english' ? 'Invoice' : 'விலைப்பட்டியல்'}>
      <div className="space-y-4">
        {/* Company Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">
              {companySettings?.company_name || 'Company Name'}
            </CardTitle>
            <div className="text-xs text-muted-foreground">
              {companySettings?.address_line1 && (
                <div>{companySettings.address_line1} {companySettings.address_line2}</div>
              )}
              {companySettings?.locality && (
                <div>{companySettings.locality} - {companySettings.pin_code}</div>
              )}
              {companySettings?.phone && <div>Phone: {companySettings.phone}</div>}
              {companySettings?.gstin && <div>GSTIN: {companySettings.gstin}</div>}
            </div>
          </CardHeader>
        </Card>

        {/* Invoice Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {language === 'english' ? 'TAX INVOICE' : 'வரி விலைப்பட்டியல்'}
            </CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bill Serial No</p>
                <p className="font-medium">{sale.bill_serial_no || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sale Date</p>
                <p className="font-medium">{format(new Date(sale.sale_date), 'dd/MM/yyyy')}</p>
              </div>
              {sale.irn && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">IRN</p>
                  <p className="font-medium text-xs break-all">{sale.irn}</p>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {language === 'english' ? 'Customer Details' : 'வாடிக்கையாளர் விவரங்கள்'}
            </CardTitle>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{getDisplayName(customer)}</p>
              </div>
              {customer.gstin && (
                <div>
                  <p className="text-sm text-muted-foreground">GSTIN</p>
                  <p className="font-medium">{customer.gstin}</p>
                </div>
              )}
              {customer.address_english && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-sm">{customer.address_english}</p>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Transport Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {language === 'english' ? 'Transport Details' : 'போக்குவரத்து விவரங்கள்'}
            </CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Lorry No</p>
                <p className="font-medium">{outwardEntry.lorry_no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Driver Mobile</p>
                <p className="font-medium">{outwardEntry.driver_mobile}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Item Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {language === 'english' ? 'Item Details' : 'பொருள் விவரங்கள்'}
            </CardTitle>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs font-medium bg-muted p-2 rounded">
                <div>Description</div>
                <div className="text-center">Qty</div>
                <div className="text-right">Rate</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">{getDisplayName(item)}</p>
                  <p className="text-xs text-muted-foreground">HSN: {item.hsn_no || 'N/A'}</p>
                </div>
                <div className="text-center">{sale.quantity} {item.unit}</div>
                <div className="text-right">₹{sale.rate.toFixed(2)}</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taxable Amount:</span>
                <span>₹{baseAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST ({item.gst_percentage || 0}%):</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer size={16} />
            {language === 'english' ? 'Print' : 'அச்சிடு'}
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
            <Share2 size={16} />
            {language === 'english' ? 'Share' : 'பகிர்'}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileInvoiceGenerator;