import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Printer, Download, FileJson, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const MobileInvoiceGenerator: React.FC = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const [sale, setSale] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [showIrnDialog, setShowIrnDialog] = useState(false);
  const [irnValue, setIrnValue] = useState('');
  const [irnLoading, setIrnLoading] = useState(false);

  const { data: sales } = useEnhancedOfflineData('sales');
  const { data: customers } = useEnhancedOfflineData('customers');
  const { data: items } = useEnhancedOfflineData('items');
  const { data: outwardEntries } = useEnhancedOfflineData('outward_entries');
  const { data: companySettingsData } = useEnhancedOfflineData('company_settings');

  useEffect(() => {
    if (billId && sales.length > 0) {
      const foundSale = sales.find((s: any) => s.id === billId);
      if (foundSale) {
        setSale(foundSale);
        setIrnValue((foundSale as any).irn || '');
      }
    }
  }, [billId, sales]);

  useEffect(() => {
    if (companySettingsData.length > 0 && sale) {
      const outwardEntry = outwardEntries.find((entry: any) => entry.id === sale.outward_entry_id);
      if (outwardEntry) {
        const settings = companySettingsData.find((cs: any) => cs.location_code === (outwardEntry as any).loading_place);
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

  const handleUpdateIrn = async () => {
    if (!irnValue.trim()) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Please enter IRN' : 'IRN உள்ளிடவும்',
        variant: 'destructive',
      });
      return;
    }

    setIrnLoading(true);
    try {
      const { error } = await supabase
        .from('sales')
        .update({ irn: irnValue.trim() })
        .eq('id', billId);

      if (error) throw error;

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'IRN updated successfully' : 'IRN வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
      });

      setSale({ ...sale, irn: irnValue.trim() });
      setShowIrnDialog(false);
    } catch (error: any) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message || (language === 'english' ? 'Failed to update IRN' : 'IRN புதுப்பிப்பதில் தோல்வி'),
        variant: 'destructive',
      });
    } finally {
      setIrnLoading(false);
    }
  };

  const generateEInvoiceJSON = () => {
    if (!sale || !customer || !item || !outwardEntry || !companySettings) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Missing required data' : 'தேவையான தகவல் இல்லை',
        variant: 'destructive',
      });
      return;
    }

    const { baseAmount, gstAmount } = calculateAmounts();
    const roundedBaseAmount = Math.round(baseAmount * 100) / 100;
    const roundedGstAmount = Math.round(gstAmount * 100) / 100;
    const roundedCgstAmount = Math.round((roundedGstAmount / 2) * 100) / 100;
    const roundedSgstAmount = Math.round((roundedGstAmount / 2) * 100) / 100;
    const roundedTotalAmount = Math.round((roundedBaseAmount + roundedCgstAmount + roundedSgstAmount) * 100) / 100;

    const eInvoiceData = {
      Version: "1.1",
      TranDtls: {
        TaxSch: "GST",
        SupTyp: "B2B",
        IgstOnIntra: "N",
        RegRev: "N",
        EcmGstin: null
      },
      DocDtls: {
        Typ: "INV",
        No: sale.bill_serial_no,
        Dt: new Date(sale.sale_date).toISOString().split('T')[0].split('-').reverse().join('/')
      },
      SellerDtls: {
        Gstin: companySettings.gstin,
        LglNm: companySettings.company_name,
        Addr1: companySettings.address_line1,
        Addr2: companySettings.address_line2 || "",
        Loc: companySettings.locality,
        Pin: companySettings.pin_code,
        Stcd: companySettings.state_code,
        Ph: companySettings.phone || null,
        Em: companySettings.email || null
      },
      BuyerDtls: {
        Gstin: customer.gstin || "URP",
        LglNm: getDisplayName(customer),
        Pos: customer.state_code || "33",
        Addr1: customer.address_english || customer.address_tamil || "",
        Addr2: "",
        Loc: customer.pin_code || "",
        Pin: parseInt(customer.pin_code) || 0,
        Stcd: customer.state_code || "33",
        Ph: customer.phone || null,
        Em: customer.email || null
      },
      ItemList: [
        {
          SlNo: "1",
          PrdDesc: getDisplayName(item),
          IsServc: "N",
          HsnCd: item.hsn_no,
          Qty: sale.quantity,
          Unit: item.unit,
          UnitPrice: sale.rate,
          TotAmt: roundedBaseAmount,
          Discount: 0,
          AssAmt: roundedBaseAmount,
          GstRt: item.gst_percentage,
          CgstAmt: roundedCgstAmount,
          SgstAmt: roundedSgstAmount,
          IgstAmt: 0,
          CesRt: 0,
          CesAmt: 0,
          CesNonAdvlAmt: 0,
          StateCesRt: 0,
          StateCesAmt: 0,
          StateCesNonAdvlAmt: 0,
          OthChrg: 0,
          TotItemVal: roundedTotalAmount
        }
      ]
    };

    const eInvoiceArray = [eInvoiceData];
    const blob = new Blob([JSON.stringify(eInvoiceArray, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `einvoice_${sale.bill_serial_no}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: language === 'english' ? 'Success' : 'வெற்றி',
      description: language === 'english' ? 'JSON file downloaded' : 'JSON கோப்பு பதிவிறக்கப்பட்டது',
    });
  };

  const downloadPDF = async () => {
    if (!sale || !customer || !item || !outwardEntry || !companySettings) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Missing required data' : 'தேவையான தகவல் இல்லை',
        variant: 'destructive',
      });
      return;
    }

    try {
      const pdf = new jsPDF();
      const { baseAmount, gstAmount, totalAmount } = calculateAmounts();

      // Title
      pdf.setFontSize(20);
      pdf.text(companySettings.company_name, 105, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text(companySettings.address_line1, 105, 28, { align: 'center' });
      pdf.text(`${companySettings.locality} - ${companySettings.pin_code}`, 105, 34, { align: 'center' });
      pdf.text(`GSTIN: ${companySettings.gstin}`, 105, 40, { align: 'center' });

      // Invoice details
      pdf.setFontSize(14);
      pdf.text('TAX INVOICE', 105, 52, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text(`Invoice No: ${sale.bill_serial_no}`, 20, 62);
      pdf.text(`Date: ${new Date(sale.sale_date).toLocaleDateString('en-IN')}`, 20, 68);
      pdf.text(`Vehicle: ${outwardEntry.lorry_no}`, 20, 74);

      // Customer details
      pdf.text('Bill To:', 20, 86);
      pdf.text(getDisplayName(customer), 20, 92);
      if (customer.address_english || customer.address_tamil) {
        pdf.text(customer.address_english || customer.address_tamil, 20, 98, { maxWidth: 180 });
      }
      if (customer.gstin) {
        pdf.text(`GSTIN: ${customer.gstin}`, 20, 108);
      }

      // Items table
      const tableY = 120;
      pdf.line(20, tableY, 190, tableY);
      pdf.text('Description', 22, tableY + 6);
      pdf.text('HSN', 100, tableY + 6);
      pdf.text('Qty', 125, tableY + 6);
      pdf.text('Rate', 145, tableY + 6);
      pdf.text('Amount', 170, tableY + 6);
      pdf.line(20, tableY + 10, 190, tableY + 10);

      pdf.text(getDisplayName(item), 22, tableY + 18);
      pdf.text(item.hsn_no || '', 100, tableY + 18);
      pdf.text(`${sale.quantity} ${item.unit}`, 125, tableY + 18);
      pdf.text(`₹${sale.rate.toFixed(2)}`, 145, tableY + 18);
      pdf.text(`₹${baseAmount.toFixed(2)}`, 170, tableY + 18);

      pdf.line(20, tableY + 22, 190, tableY + 22);

      // Totals
      const totalsY = tableY + 32;
      pdf.text('Taxable Amount:', 130, totalsY);
      pdf.text(`₹${baseAmount.toFixed(2)}`, 170, totalsY);

      if (gstAmount > 0) {
        pdf.text(`CGST (${item.gst_percentage / 2}%):`, 130, totalsY + 6);
        pdf.text(`₹${(gstAmount / 2).toFixed(2)}`, 170, totalsY + 6);
        
        pdf.text(`SGST (${item.gst_percentage / 2}%):`, 130, totalsY + 12);
        pdf.text(`₹${(gstAmount / 2).toFixed(2)}`, 170, totalsY + 12);
      }

      pdf.setFontSize(12);
      pdf.text('Total Amount:', 130, totalsY + 22);
      pdf.text(`₹${totalAmount.toFixed(2)}`, 170, totalsY + 22);

      // IRN if available
      if (sale.irn) {
        pdf.setFontSize(8);
        pdf.text(`IRN: ${sale.irn}`, 20, 280);
      }

      pdf.save(`invoice_${sale.bill_serial_no}.pdf`);

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'PDF downloaded successfully' : 'PDF வெற்றிகரமாக பதிவிறக்கப்பட்டது',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to generate PDF' : 'PDF உருவாக்குவதில் தோல்வி',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = async () => {
    // Use the same print logic from the web app
    if (!sale || !customer || !item || !outwardEntry || !companySettings) return;

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
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${sale.bill_serial_no || 'N/A'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 10px; }
            .invoice-container { max-width: 100%; border: 2px solid #000; }
            .header { display: flex; align-items: center; padding: 10px; border-bottom: 2px solid #000; }
            .qr-section { width: 80px; margin-right: 15px; }
            .company-info { flex: 1; text-align: center; }
            .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .details { padding: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            .totals { text-align: right; padding: 10px; }
            .total-row { margin: 5px 0; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              ${sale.irn && qrCodeDataUrl ? `
                <div class="qr-section">
                  <img src="${qrCodeDataUrl}" style="width: 100%;" />
                </div>
              ` : ''}
              <div class="company-info">
                <div class="company-name">${companySettings.company_name}</div>
                <div>${companySettings.address_line1}</div>
                <div>${companySettings.locality} - ${companySettings.pin_code}</div>
                <div>GSTIN: ${companySettings.gstin}</div>
              </div>
            </div>
            
            <div class="details">
              <h3>Tax Invoice</h3>
              <p><strong>Invoice No:</strong> ${sale.bill_serial_no}</p>
              <p><strong>Date:</strong> ${new Date(sale.sale_date).toLocaleDateString('en-IN')}</p>
              <p><strong>Vehicle:</strong> ${outwardEntry.lorry_no}</p>
              
              <h4>Bill To:</h4>
              <p><strong>${getDisplayName(customer)}</strong></p>
              ${customer.address_english || customer.address_tamil ? `<p>${customer.address_english || customer.address_tamil}</p>` : ''}
              ${customer.gstin ? `<p>GSTIN: ${customer.gstin}</p>` : ''}
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${getDisplayName(item)}</td>
                  <td>${item.hsn_no || ''}</td>
                  <td>${sale.quantity} ${item.unit}</td>
                  <td>₹${sale.rate.toFixed(2)}</td>
                  <td>₹${baseAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row"><strong>Taxable Amount:</strong> ₹${baseAmount.toFixed(2)}</div>
              ${gstAmount > 0 ? `
                <div class="total-row">CGST (${item.gst_percentage / 2}%): ₹${(gstAmount / 2).toFixed(2)}</div>
                <div class="total-row">SGST (${item.gst_percentage / 2}%): ₹${(gstAmount / 2).toFixed(2)}</div>
              ` : ''}
              <div class="total-row" style="font-size: 16px; margin-top: 10px;">
                <strong>Total Amount: ₹${totalAmount.toFixed(2)}</strong>
              </div>
            </div>

            ${sale.irn ? `<div style="padding: 10px; font-size: 8px;">IRN: ${sale.irn}</div>` : ''}
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

  if (!sale || !customer || !item) {
    return (
      <MobileLayout title={language === 'english' ? 'Invoice' : 'பில்'}>
        <Card>
          <CardContent className="p-6 text-center">
            {language === 'english' ? 'Loading invoice...' : 'பில் ஏற்றுகிறது...'}
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  const { baseAmount, gstAmount, totalAmount } = calculateAmounts();

  return (
    <MobileLayout 
      title={`${language === 'english' ? 'Invoice' : 'பில்'} - ${sale.bill_serial_no}`}
    >
      <div className="space-y-4">
        {/* Action Buttons */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                {language === 'english' ? 'Print' : 'அச்சிடு'}
              </Button>
              <Button onClick={downloadPDF} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {language === 'english' ? 'PDF' : 'PDF'}
              </Button>
              <Button onClick={generateEInvoiceJSON} variant="outline" className="gap-2">
                <FileJson className="h-4 w-4" />
                {language === 'english' ? 'JSON' : 'JSON'}
              </Button>
              <Button onClick={() => setShowIrnDialog(true)} variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                {language === 'english' ? 'IRN' : 'IRN'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'english' ? 'Invoice Details' : 'பில் விவரங்கள்'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">{language === 'english' ? 'Bill No:' : 'பில் எண்:'}</span>
                <p className="font-semibold">{sale.bill_serial_no}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{language === 'english' ? 'Date:' : 'தேதி:'}</span>
                <p className="font-semibold">{format(new Date(sale.sale_date), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{language === 'english' ? 'Customer:' : 'வாடிக்கையாளர்:'}</span>
                <p className="font-semibold">{getDisplayName(customer)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{language === 'english' ? 'Vehicle:' : 'வாகனம்:'}</span>
                <p className="font-semibold">{outwardEntry?.lorry_no}</p>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{getDisplayName(item)}</span>
                  <span>{sale.quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{language === 'english' ? 'Rate:' : 'விலை:'}</span>
                  <span>₹{sale.rate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{language === 'english' ? 'Taxable Amount:' : 'வரி விதிக்கக்கூடிய தொகை:'}</span>
                  <span>₹{baseAmount.toFixed(2)}</span>
                </div>
                {gstAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CGST ({item.gst_percentage / 2}%):</span>
                      <span>₹{(gstAmount / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SGST ({item.gst_percentage / 2}%):</span>
                      <span>₹{(gstAmount / 2).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{language === 'english' ? 'Total:' : 'மொத்தம்:'}</span>
                  <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {sale.irn && (
              <div className="border-t pt-3">
                <span className="text-xs text-muted-foreground">IRN:</span>
                <p className="text-xs font-mono break-all">{sale.irn}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* IRN Dialog */}
      <Dialog open={showIrnDialog} onOpenChange={setShowIrnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'english' ? 'Update IRN' : 'IRN புதுப்பிக்கவும்'}
            </DialogTitle>
            <DialogDescription>
              {language === 'english' 
                ? 'Enter or update the Invoice Reference Number (IRN) for this bill.'
                : 'இந்த பில்லுக்கான Invoice Reference Number (IRN) உள்ளிடவும் அல்லது புதுப்பிக்கவும்.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="irn">IRN</Label>
              <Input
                id="irn"
                value={irnValue}
                onChange={(e) => setIrnValue(e.target.value)}
                placeholder={language === 'english' ? 'Enter IRN...' : 'IRN உள்ளிடவும்...'}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowIrnDialog(false)}>
              {language === 'english' ? 'Cancel' : 'ரத்து'}
            </Button>
            <Button onClick={handleUpdateIrn} disabled={irnLoading}>
              {irnLoading 
                ? (language === 'english' ? 'Saving...' : 'சேமிக்கிறது...') 
                : (language === 'english' ? 'Save' : 'சேமி')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default MobileInvoiceGenerator;
