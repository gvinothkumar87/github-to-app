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
  const { billId, id } = useParams();
  const saleId = billId || id; // Support both /bills/:billId/invoice and /sales/:id/view
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const [sale, setSale] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [showIrnDialog, setShowIrnDialog] = useState(false);
  const [irnValue, setIrnValue] = useState('');
  const [irnLoading, setIrnLoading] = useState(false);

  const { data: sales } = useEnhancedOfflineData('offline_sales');
  const { data: customers } = useEnhancedOfflineData('offline_customers');
  const { data: items } = useEnhancedOfflineData('offline_items');
  const { data: outwardEntries } = useEnhancedOfflineData('offline_outward_entries');
  const { data: companySettingsData } = useEnhancedOfflineData('offline_company_settings');

  useEffect(() => {
    if (saleId && sales.length > 0) {
      const foundSale = sales.find((s: any) => s.id === saleId);
      if (foundSale) {
        setSale(foundSale);
        setIrnValue((foundSale as any).irn || '');
      }
    }
  }, [saleId, sales]);

  useEffect(() => {
    if (companySettingsData.length > 0 && sale) {
      const outwardEntry = outwardEntries.find((entry: any) => entry.id === sale.outward_entry_id) as any;
      const location = (outwardEntry as any)?.loading_place || (sale as any).loading_place || (companySettingsData as any[])[0]?.location_code;
      const settings = (companySettingsData as any[]).find((cs: any) => cs.location_code === location) || (companySettingsData as any[])[0];
      setCompanySettings(settings);
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
        .eq('id', saleId);

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
    if (!sale || !customer || !item) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Missing required data for invoice' : 'பில்லுக்கு தேவையான தகவல் இல்லை',
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
        Gstin: (companySettings?.gstin) || "33AALFG0221E1Z3",
        LglNm: (companySettings?.company_name) || "GOVINDAN RICE MILL",
        Addr1: (companySettings?.address_line1) || "6/175 GINGEE MAIN ROAD",
        Addr2: (companySettings?.address_line2) || "GINGEE TALUK, VILLUPURAM DISTRICT",
        Loc: (companySettings?.locality) || "GINGEE",
        Pin: (companySettings?.pin_code) || 605601,
        Stcd: (companySettings?.state_code) || "33",
        Ph: companySettings?.phone || null,
        Em: companySettings?.email || null
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

  const convertNumberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertHundreds = (n: number): string => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };

    if (num === 0) return 'Zero';
    
    let integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let result = '';
    
    if (integerPart >= 10000000) {
      result += convertHundreds(Math.floor(integerPart / 10000000)) + 'Crore ';
      integerPart %= 10000000;
    }
    if (integerPart >= 100000) {
      result += convertHundreds(Math.floor(integerPart / 100000)) + 'Lakh ';
      integerPart %= 100000;
    }
    if (integerPart >= 1000) {
      result += convertHundreds(Math.floor(integerPart / 1000)) + 'Thousand ';
      integerPart %= 1000;
    }
    if (integerPart > 0) {
      result += convertHundreds(integerPart);
    }
    
    result += 'Rupees';
    
    if (decimalPart > 0) {
      result += ' and ' + convertHundreds(decimalPart) + 'Paise';
    }
    
    return result.trim();
  };

  const downloadPDF = async () => {
    if (!sale || !customer || !item) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Missing required data for PDF' : 'PDF க்கு தேவையான தகவல் இல்லை',
        variant: 'destructive',
      });
      return;
    }

    // Use the print function which generates the same PDF layout as web app
    await handlePrint();
  };

  const handlePrint = async () => {
    // Use the exact same print logic from the web app
    if (!sale || !customer || !item) {
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Missing required data for printing' : 'அச்சிடுவதற்கு தேவையான தகவல் இல்லை',
        variant: 'destructive',
      });
      return;
    }

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
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${sale.bill_serial_no}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 9px; }
          .invoice-container { max-width: 210mm; margin: 0 auto; border: 2px solid #000; }
          
          .header { display: flex; border-bottom: 1px solid #000; }
          .logo-section { width: 80px; padding: 10px; border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; }
          .logo { width: 75px; height: 75px; object-fit: contain; }
          .company-section { flex: 1; padding: 10px; text-align: center; }
          .company-name { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
          .company-address { font-size: 8px; margin-bottom: 2px; line-height: 1.2; }
          .invoice-info-section { width: 200px; border-left: 1px solid #000; }
          
          .invoice-details { display: flex; }
          .invoice-left { flex: 1; padding: 8px; font-size: 8px; }
          .invoice-right { width: 120px; padding: 8px; border-left: 1px solid #000; font-size: 8px; }
          
          .consignee-section { display: flex; border-top: 1px solid #000; }
          .consignee-left { flex: 1; padding: 10px; border-right: 1px solid #000; }
          .consignee-right { flex: 1; padding: 10px; }
          .section-title { font-weight: bold; font-size: 8px; margin-bottom: 8px; }
          .customer-name { font-weight: bold; font-size: 10px; margin-bottom: 5px; }
          .customer-details { font-size: 8px; line-height: 1.3; }
          
          .items-table { width: 100%; border-collapse: collapse; border-top: 1px solid #000; }
          .items-table th { background-color: #f5f5f5; font-weight: bold; font-size: 7px; padding: 5px; border: 1px solid #000; text-align: center; }
          .items-table td { font-size: 8px; padding: 4px; border: 1px solid #000; text-align: center; }
          .items-table .desc-col { text-align: left; }
          .items-table .amount-col { text-align: right; }
          
          .footer-section { border-top: 1px solid #000; }
          .amount-words { padding: 8px; border-top: 1px solid #000; border-bottom: 1px solid #000; font-size: 8px; }
          .amount-words-bold { font-weight: bold; }
          
          .tax-details { display: flex; }
          .hsn-table-section { flex: 1; padding: 8px; border-right: 1px solid #000; }
          .hsn-table { width: 100%; border-collapse: collapse; font-size: 7px; }
          .hsn-table th, .hsn-table td { border: 1px solid #000; padding: 3px; text-align: center; }
          .hsn-table th { background-color: #f5f5f5; font-weight: bold; }
          
          .total-section { flex: 1; padding: 8px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 8px; }
          .total-final { border-top: 1px solid #000; margin-top: 5px; padding-top: 3px; font-weight: bold; }
          
          .bank-signature { display: flex; border-top: 1px solid #000; }
          .bank-details { flex: 1; padding: 10px; border-right: 1px solid #000; font-size: 9px; }
          .signature-area { width: 150px; padding: 10px; text-align: center; font-size: 8px; }
          
          @media print {
            body { margin: 0; }
            .invoice-container { max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header Section -->
          <div class="header">
            <div class="logo-section">
              ${sale.irn && qrCodeDataUrl ? `
                <img src="${qrCodeDataUrl}" alt="IRN QR Code" class="logo" />
              ` : `
                <img src="${window.location.origin}/lovable-uploads/8ef45f84-cd7a-4909-9f31-86a578d28f2f.png" alt="GRM Logo" class="logo" onerror="this.style.display='none'" />
              `}
            </div>
            <div class="company-section">
              <div class="company-name">${companySettings.company_name}</div>
              <div class="company-address">
                ${companySettings.address_line1}<br>
                ${companySettings.address_line2}, ${companySettings.locality} - ${companySettings.pin_code}<br>
                Phone: ${companySettings.phone}<br>
                GSTIN/UIN: ${companySettings.gstin} &nbsp;&nbsp;&nbsp; State Name: Tamil Nadu, Code: ${companySettings.state_code}
              </div>
            </div>
            <div class="invoice-info-section">
              <div style="padding: 8px; border-bottom: 1px solid #000;">
                <div style="font-weight: bold; font-size: 8px;">Invoice No.</div>
                <div style="font-size: 9px; margin-top: 2px;">${sale.bill_serial_no}</div>
              </div>
              <div style="padding: 8px; border-bottom: 1px solid #000;">
                <div style="font-weight: bold; font-size: 8px;">Dated</div>
                <div style="font-size: 9px; margin-top: 2px;">${new Date(sale.sale_date).toLocaleDateString('en-IN')}</div>
              </div>
              <div style="padding: 8px;">
                <div style="font-weight: bold; font-size: 8px;">Motor Vehicle No.</div>
                <div style="font-size: 9px; margin-top: 2px;">${sale.lorry_no || outwardEntry?.lorry_no || 'N/A'}</div>
              </div>
            </div>
          </div>

          <!-- Consignee Section -->
          <div class="consignee-section">
            <div class="consignee-left">
              <div class="section-title">Consignee (Ship to)</div>
              <div class="customer-name">${getDisplayName(customer)}</div>
              <div class="customer-details">
                ${customer.address_english || customer.address_tamil || ''}<br>
                ${customer.pin_code ? `PIN: ${customer.pin_code}<br>` : ''}
                ${customer.phone ? `Phone: ${customer.phone}<br>` : ''}
                ${customer.gstin ? `GSTIN/UIN: ${customer.gstin}<br>` : ''}
                State Name: Tamil Nadu, Code: 33
              </div>
            </div>
            <div class="consignee-right">
              <div class="section-title">Buyer (Bill to)</div>
              <div class="customer-name">${getDisplayName(customer)}</div>
              <div class="customer-details">
                ${customer.address_english || customer.address_tamil || ''}<br>
                ${customer.pin_code ? `PIN: ${customer.pin_code}<br>` : ''}
                ${customer.phone ? `Phone: ${customer.phone}<br>` : ''}
                ${customer.gstin ? `GSTIN/UIN: ${customer.gstin}<br>` : ''}
                State Name: Tamil Nadu, Code: 33
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 4%;">Sl<br>No.</th>
                <th style="width: 25%;">Description of Goods</th>
                <th style="width: 8%;">HSN/SAC</th>
                <th style="width: 6%;">GST<br>Rate</th>
                <th style="width: 10%;">Quantity</th>
                <th style="width: 8%;">Rate</th>
                <th style="width: 6%;">per</th>
                <th style="width: 10%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td class="desc-col">${getDisplayName(item)}</td>
                <td>${item.hsn_no}</td>
                <td>${item.gst_percentage}%</td>
                <td>${sale.quantity} ${item.unit}</td>
                <td class="amount-col">₹${sale.rate.toFixed(2)}</td>
                <td>${item.unit}</td>
                <td class="amount-col">₹${baseAmount.toFixed(2)}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td colspan="4" style="text-align: right; font-weight: bold; padding-right: 10px;">Total</td>
                <td style="font-weight: bold;">${sale.quantity} ${item.unit}</td>
                <td></td>
                <td></td>
                <td class="amount-col" style="font-weight: bold;">₹ ${baseAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Footer Section -->
          <div class="footer-section">
            <div class="tax-details">
              <div class="hsn-table-section">
                <table class="hsn-table">
                  <thead>
                    <tr>
                      <th>HSN/SAC</th>
                      <th>Taxable Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${item.hsn_no}</td>
                      <td>₹${baseAmount.toFixed(2)}</td>
                    </tr>
                    <tr style="font-weight: bold;">
                      <td>Total</td>
                      <td>₹${baseAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="total-section">
                ${item.gst_percentage > 0 ? `
                <div class="total-row">
                  <span>CGST ${(item.gst_percentage / 2)}%:</span>
                  <span>₹${(gstAmount / 2).toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>SGST ${(item.gst_percentage / 2)}%:</span>
                  <span>₹${(gstAmount / 2).toFixed(2)}</span>
                </div>
                ` : `
                <div class="total-row">
                  <span>Tax Amount:</span>
                  <span>NIL</span>
                </div>
                `}
                <div class="total-row total-final">
                  <span>Total:</span>
                  <span>₹${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div class="amount-words">
              <strong>Amount Chargeable (in words)</strong><br>
              <span class="amount-words-bold">${convertNumberToWords(totalAmount)} Only</span>
            </div>
            
            <div class="bank-signature">
              <div class="bank-details">
                <strong style="font-size: 10px;">Bank Details</strong><br>
                <span style="font-size: 10px;">Bank Name: ICICI</span><br>
                <span style="font-size: 10px;">A/c No.: 305105000641</span><br>
                <span style="font-size: 10px;">Branch: ANANTHAPURAM</span><br>
                <span style="font-size: 10px;">IFSC: ICIC0003051</span>
              </div>
              <div class="signature-area">
                <div style="margin-bottom: 40px;">for ${companySettings.company_name}</div>
                <div style="border-top: 1px solid #000; padding-top: 5px;">Authorised Signatory</div>
              </div>
            </div>
            
            ${sale.irn ? `
            <div class="irn-section" style="margin-top: 10px; padding: 5px; border-top: 1px solid #ddd; font-size: 9px; text-align: center;">
              <strong>IRN:</strong> ${sale.irn}
            </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
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
      showBackButton={true}
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
              {outwardEntry?.lorry_no && (
                <div>
                  <span className="text-muted-foreground">{language === 'english' ? 'Vehicle:' : 'வாகனம்:'}</span>
                  <p className="font-semibold">{outwardEntry.lorry_no}</p>
                </div>
              )}
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
