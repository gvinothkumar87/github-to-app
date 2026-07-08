import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Download, FileJson, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateInvoiceHtml } from '@/utils/invoiceTemplate';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const normalizeLocationCode = (code?: string | null) => (code || '').toString().trim().toUpperCase();

const getDefaultCompanyDetails = (locationCode: string = '') => null;

export const MobileInvoiceGenerator: React.FC = () => {
  const { billId, id } = useParams();
  const saleId = billId || id; // Support both /bills/:billId/invoice and /sales/:id/view
  const navigate = useNavigate();
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const { state } = useLocation();
  const [sale, setSale] = useState<any>(state?.sale || null);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [allSalesItems, setAllSalesItems] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [showIrnDialog, setShowIrnDialog] = useState(false);
  const [irnValue, setIrnValue] = useState('');
  const [irnLoading, setIrnLoading] = useState(false);

  const { data: sales } = useEnhancedOfflineData('offline_sales');
  const { data: customers } = useEnhancedOfflineData('offline_customers');
  const { data: items } = useEnhancedOfflineData('offline_items');
  const { data: outwardEntries } = useEnhancedOfflineData('offline_outward_entries');
  const { data: companySettingsData } = useEnhancedOfflineData('offline_company_settings');

  // Initialize from navigation state if available
  useEffect(() => {
    if (state?.sale) {
      setSale(state.sale);
      setIrnValue(state.sale.irn || '');

      // If we have the full data from state, use it
      if (state.sale.bill_serial_no) {
        // Check if there are other sales with same bill number
        const sameBillSales = sales.filter((s: any) => s.bill_serial_no === state.sale.bill_serial_no);
        if (sameBillSales.length > 0) {
          setAllSales(sameBillSales);
          const saleItems = sameBillSales.map((s: any) =>
            items.find((i: any) => i.id === s.item_id)
          ).filter(Boolean);
          setAllSalesItems(saleItems);
        } else {
          // Single sale from state
          setAllSales([state.sale]);
          if (state.item) {
            setAllSalesItems([state.item]);
          }
        }
      }
    }
  }, [state, sales, items]);

  useEffect(() => {
    // Fetch from offline data if not provided via state
    if (!state?.sale && saleId && sales.length > 0) {
      const foundSale = sales.find((s: any) => s.id === saleId);
      if (foundSale) {
        setSale(foundSale);
        setIrnValue((foundSale as any).irn || '');

        // Fetch all sales with same bill_serial_no for multi-product bills
        if ((foundSale as any).bill_serial_no) {
          const sameBillSales = sales.filter((s: any) => (s as any).bill_serial_no === (foundSale as any).bill_serial_no);
          setAllSales(sameBillSales);

          // Get items for all sales
          const saleItems = sameBillSales.map((s: any) =>
            items.find((i: any) => (i as any).id === (s as any).item_id)
          ).filter(Boolean);
          setAllSalesItems(saleItems);
        }
      }
    }
  }, [saleId, sales, items, state]);

  useEffect(() => {
    if (!sale) return;

    const outwardEntryRecord = outwardEntries.find((entry: any) => entry.id === sale.outward_entry_id) as any;
    const preferredLocation =
      normalizeLocationCode(
        outwardEntryRecord?.loading_place ||
        sale.loading_place ||
        (companySettingsData as any[])[0]?.location_code
      ) || 'PULIVANTHI';

    if (companySettingsData.length > 0) {
      const matchingSettings = (companySettingsData as any[]).find(
        (cs: any) => normalizeLocationCode(cs.location_code) === preferredLocation
      );
      const fallbackSettings =
        matchingSettings ||
        (companySettingsData as any[]).find((cs: any) => cs.is_active) ||
        (companySettingsData as any[])[0];

      if (fallbackSettings) {
        setCompanySettings(fallbackSettings);
        return;
      }
    }

    setCompanySettings(null);
  }, [companySettingsData, sale, outwardEntries]);

  // Use data from state first, fall back to fetching from offline data
  const customer: any = state?.customer || (sale ? customers.find((c: any) => c.id === sale.customer_id) : null);
  const item: any = state?.item || (sale ? items.find((i: any) => i.id === sale.item_id) : null);
  const outwardEntry: any = state?.outwardEntry || (sale ? outwardEntries.find((e: any) => e.id === sale.outward_entry_id) : null);

  const effectiveCompanySettings = companySettings;

  const calculateAmounts = () => {
    if (!allSales.length || !allSalesItems.length) {
      // Fallback to single sale
      if (!sale || !item) return { baseAmount: 0, gstAmount: 0, totalAmount: 0, totalQuantity: 0 };
      const quantity = sale.quantity;
      const rate = sale.rate;
      const baseAmount = quantity * rate;
      const gstPercent = item.gst_percentage || 0;
      const gstAmount = baseAmount * (gstPercent / 100);
      const totalAmount = baseAmount + gstAmount;
      return { baseAmount, gstAmount, totalAmount, totalQuantity: quantity };
    }

    // Calculate for multiple products
    return allSales.reduce((acc, s, index) => {
      const currentItem = allSalesItems[index] || item;
      const base = s.quantity * s.rate;
      const gst = base * ((currentItem?.gst_percentage || 0) / 100);
      return {
        baseAmount: acc.baseAmount + base,
        gstAmount: acc.gstAmount + gst,
        totalAmount: acc.totalAmount + base + gst,
        totalQuantity: acc.totalQuantity + s.quantity
      };
    }, { baseAmount: 0, gstAmount: 0, totalAmount: 0, totalQuantity: 0 });
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

  const generateEInvoiceJSON = async () => {
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

    const sellerDetails = effectiveCompanySettings;

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
        Gstin: sellerDetails.gstin,
        LglNm: sellerDetails.company_name,
        Addr1: sellerDetails.address_line1,
        Addr2: sellerDetails.address_line2 || '',
        Loc: sellerDetails.locality,
        Pin: sellerDetails.pin_code,
        Stcd: sellerDetails.state_code,
        Ph: sellerDetails.phone || null,
        Em: sellerDetails.email || null
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
        ...(customer.phone ? { Ph: customer.phone } : {}),
        ...(customer.email ? { Em: customer.email } : {}),
      },
      ItemList: allSales.length > 0 ? allSales.map((s, index) => {
        const currentItem = allSalesItems[index] || item;
        const baseAmt = s.quantity * s.rate;
        const gstAmt = baseAmt * ((currentItem?.gst_percentage || 0) / 100);
        const cgstAmt = Math.round((gstAmt / 2) * 100) / 100;
        const sgstAmt = Math.round((gstAmt / 2) * 100) / 100;
        const itemTotal = Math.round((baseAmt + cgstAmt + sgstAmt) * 100) / 100;

        return {
          SlNo: (index + 1).toString(),
          PrdDesc: getDisplayName(currentItem),
          IsServc: "N",
          HsnCd: currentItem?.hsn_no,
          Qty: s.quantity,
          Unit: currentItem?.unit,
          UnitPrice: s.rate,
          TotAmt: Math.round(baseAmt * 100) / 100,
          Discount: 0,
          AssAmt: Math.round(baseAmt * 100) / 100,
          GstRt: currentItem?.gst_percentage || 0,
          CgstAmt: cgstAmt,
          SgstAmt: sgstAmt,
          IgstAmt: 0,
          CesRt: 0,
          CesAmt: 0,
          CesNonAdvlAmt: 0,
          StateCesRt: 0,
          StateCesAmt: 0,
          StateCesNonAdvlAmt: 0,
          OthChrg: 0,
          TotItemVal: itemTotal
        };
      }) : [
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
    const replacer = (key: string, value: any) => {
      if (value === "" || value === null) return undefined;
      return value;
    };
    const jsonString = JSON.stringify(eInvoiceArray, replacer, 2);

    // Check if running on native mobile platform
    if (Capacitor.isNativePlatform()) {
      // Native mobile - use share functionality
      const fileName = `einvoice_${sale.bill_serial_no}.json`;
      const base64Data = btoa(jsonString);

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });

      await Share.share({
        title: language === 'english' ? 'E-Invoice JSON' : 'மின் பில் JSON',
        text: `${language === 'english' ? 'E-Invoice' : 'மின் பில்'} ${sale.bill_serial_no}`,
        url: result.uri,
        dialogTitle: language === 'english' ? 'Share E-Invoice' : 'மின் பில் பகிர்'
      });

      toast({
        title: language === 'english' ? 'Success' : 'வெற்றி',
        description: language === 'english' ? 'JSON ready to share' : 'JSON பகிர தயார்',
      });
    } else {
      // Web browser - use standard download
      const blob = new Blob([jsonString], { type: 'application/json' });
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
    }
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

    // Generate QR code if IRN exists
    let qrCodeDataUrl = '';
    if (sale.irn) {
      try {
        qrCodeDataUrl = await QRCode.toDataURL(sale.irn, {
          width: 120,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }

    const { baseAmount, gstAmount } = calculateAmounts();
    const amounts = calculateAmounts();
    const totalAmount = amounts.totalAmount;
    const totalQuantity = amounts.totalQuantity;
    const allGstZero = allSales.every((s, index) => (allSalesItems[index] || item).gst_percentage === 0);

    const cs = effectiveCompanySettings;

    const htmlString = generateInvoiceHtml({
      sale,
      allSales,
      allItems: allSalesItems,
      item,
      customer,
      companySettings: cs,
      outwardEntry,
      getDisplayName,
      convertNumberToWords,
      baseAmount,
      gstAmount,
      totalAmount,
      totalQuantity,
      allGstZero,
      qrCodeDataUrl,
      ewbQrCodeDataUrl: '',
      ewbDetails: null
    });

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    iframe.style.background = '#ffffff';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);
    
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(htmlString);
        iframe.contentWindow.document.close();
        
        // Give the iframe a moment to render the layout and images
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = await html2canvas(iframe.contentWindow.document.body, { 
          scale: 2, 
          useCORS: true,
          windowWidth: 794
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Check if running on native mobile platform
        if (Capacitor.isNativePlatform()) {
          // Native mobile - use share functionality
          const pdfBase64 = pdf.output('datauristring').split(',')[1];
          const fileName = `invoice_${sale.bill_serial_no}.pdf`;

          const result = await Filesystem.writeFile({
            path: fileName,
            data: pdfBase64,
            directory: Directory.Cache
          });

          await Share.share({
            title: language === 'english' ? 'Invoice PDF' : 'பில் PDF',
            text: `${language === 'english' ? 'Invoice' : 'பில்'} ${sale.bill_serial_no}`,
            url: result.uri,
            dialogTitle: language === 'english' ? 'Share Invoice' : 'பில் பகிர்'
          });

          toast({
            title: language === 'english' ? 'Success' : 'வெற்றி',
            description: language === 'english' ? 'PDF ready to share' : 'PDF பகிர தயார்',
          });
        } else {
          // Web browser - use standard download
          pdf.save(`invoice_${sale.bill_serial_no}.pdf`);

          toast({
            title: language === 'english' ? 'Success' : 'வெற்றி',
            description: language === 'english' ? 'PDF downloaded' : 'PDF பதிவிறக்கப்பட்டது',
          });
        }
      }
    } catch (e) {
      console.error('PDF generation failed', e);
      toast({
        title: language === 'english' ? 'Error' : 'பிழை',
        description: language === 'english' ? 'Failed to generate PDF' : 'PDF உருவாக்கம் தோல்வியடைந்தது',
        variant: 'destructive',
      });
    } finally {
      document.body.removeChild(iframe);
    }
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
              <Button onClick={downloadPDF} className="gap-2">
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
              <div className="col-span-2">
                <span className="text-muted-foreground">{language === 'english' ? 'Customer Details' : 'வாடிக்கையாளர் விவரங்கள்'}:</span>
                <div className="mt-1 space-y-1">
                  <p className="font-semibold">{getDisplayName(customer)}</p>
                  {(customer.address_english || customer.address_tamil) && (
                    <p className="text-sm">{language === 'english' ? customer.address_english : customer.address_tamil || customer.address_english}</p>
                  )}
                  {customer.pin_code && <p className="text-sm"><strong>{language === 'english' ? 'PIN:' : 'பின்:'}</strong> {customer.pin_code}</p>}
                  {customer.phone && <p className="text-sm"><strong>{language === 'english' ? 'Phone:' : 'தொலைபேசி:'}</strong> {customer.phone}</p>}
                  {customer.gstin && <p className="text-sm"><strong>GSTIN:</strong> {customer.gstin}</p>}
                </div>
              </div>
              {outwardEntry?.lorry_no && (
                <div>
                  <span className="text-muted-foreground">{language === 'english' ? 'Vehicle:' : 'வாகனம்:'}</span>
                  <p className="font-semibold">{outwardEntry.lorry_no}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              {allSales.length > 0 ? (
                <>
                  {allSales.map((s: any, index) => {
                    const currentItem = allSalesItems[index] || item;
                    const itemBase = s.quantity * s.rate;
                    return (
                      <div key={s.id} className="space-y-2 pb-2 border-b last:border-b-0">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{getDisplayName(currentItem)}</span>
                          <span>{s.quantity} {currentItem.unit}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{language === 'english' ? 'Rate:' : 'விலை:'}</span>
                          <span>₹{s.rate.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{language === 'english' ? 'Amount:' : 'தொகை:'}</span>
                          <span>₹{itemBase.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{getDisplayName(item)}</span>
                      <span>{sale.quantity} {item.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{language === 'english' ? 'Rate:' : 'விலை:'}</span>
                      <span>₹{sale.rate.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="border-t pt-2 mt-2">
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
