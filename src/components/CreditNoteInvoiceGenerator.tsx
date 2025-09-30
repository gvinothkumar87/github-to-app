import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, FileText, Printer, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { IrnInputDialog } from '@/components/IrnInputDialog';
import QRCodeLib from 'qrcode';
import jsPDF from 'jspdf';

interface CreditNote {
  id: string;
  note_no: string;
  note_date: string;
  amount: number;
  gst_percentage?: number;
  reason: string;
  reference_bill_no?: string | null;
  irn?: string | null;
  customer_id: string;
}

interface Customer {
  id: string;
  name_english: string;
  name_tamil?: string;
  code: string;
  address_english?: string;
  address_tamil?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  pin_code?: string;
  state_code?: string;
  place_of_supply?: string;
}

interface CreditNoteInvoiceGeneratorProps {
  creditNote: CreditNote;
  customer: Customer;
  onClose: () => void;
}

export const CreditNoteInvoiceGenerator = ({ creditNote, customer, onClose }: CreditNoteInvoiceGeneratorProps) => {
  const { language } = useLanguage();
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [showIrnDialog, setShowIrnDialog] = useState(false);
  const [currentNote, setCurrentNote] = useState(creditNote);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  useEffect(() => {
    if (currentNote.irn) {
      generateQRCode();
    }
  }, [currentNote.irn]);

  const fetchCompanySettings = async () => {
    try {
      // Determine location based on reference bill number
      const locationCode = currentNote.reference_bill_no?.toUpperCase().includes('PULIVANTHI') ? 'PULIVANTHI' : 'MATTAPARAI';
      
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('is_active', true)
        .eq('location_code', locationCode)
        .single();

      if (error) {
        console.error('Error fetching company settings:', error);
        setCompanySettings(getDefaultCompanyDetails(locationCode));
      } else {
        setCompanySettings(data);
      }
    } catch (error) {
      console.error('Error:', error);
      setCompanySettings(getDefaultCompanyDetails('MATTAPARAI'));
    }
  };

  const getDefaultCompanyDetails = (locationCode = 'MATTAPARAI') => ({
    company_name: 'Sri Raghavendra Traders',
    address_line1: locationCode === 'PULIVANTHI' ? 'No. 456, Pulivanthi Road' : 'No. 123, Mattaparai Street',
    locality: locationCode === 'PULIVANTHI' ? 'Pulivanthi' : 'Mattaparai',
    pin_code: locationCode === 'PULIVANTHI' ? 600002 : 600001,
    gstin: locationCode === 'PULIVANTHI' ? '33XXXXX0000X2ZZ' : '33XXXXX0000X1ZZ',
    phone: '+91 9876543210',
    email: 'info@company.com',
    location_code: locationCode
  });

  const calculateGST = (amount: number, gstPercentage: number = 18) => {
    const taxableAmount = amount / (1 + gstPercentage / 100);
    const gstAmount = amount - taxableAmount;
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;
    
    return {
      taxableAmount: Number(taxableAmount.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      cgstAmount: Number(cgstAmount.toFixed(2)),
      sgstAmount: Number(sgstAmount.toFixed(2)),
      totalAmount: amount
    };
  };

  const generateQRCode = async () => {
    try {
      if (!currentNote.irn || !companySettings) return;

      const qrData = {
        Version: '1.1',
        TxnDtls: {
          TaxSch: 'GST',
          SupTyp: 'B2B'
        },
        DocDtls: {
          Typ: 'CRN',
          No: currentNote.note_no,
          Dt: currentNote.note_date
        },
        SellerDtls: {
          Gstin: companySettings.gstin,
          LglNm: companySettings.company_name,
          Addr1: companySettings.address_line1,
          Loc: companySettings.locality,
          Pin: companySettings.pin_code.toString(),
          Stcd: companySettings.state_code || '33'
        },
        BuyerDtls: {
          Gstin: customer.gstin || null,
          LglNm: customer.name_english,
          Pos: customer.place_of_supply || customer.state_code || '33',
          Addr1: customer.address_english || 'Address Not Available',
          Pin: customer.pin_code || 'PIN Not Available',
          Stcd: customer.state_code || '33'
        },
        ValDtls: {
          TotInvVal: currentNote.amount
        },
        IRN: currentNote.irn
      };

      const qrString = JSON.stringify(qrData);
      const qrCodeDataUrl = await QRCodeLib.toDataURL(qrString, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        }
      });
      setQrCodeDataUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handlePrintButtonClick = () => {
    if (!currentNote.irn) {
      setShowIrnDialog(true);
    } else {
      printInvoice();
    }
  };

  const handleIrnSaved = (irn: string) => {
    setCurrentNote(prev => ({ ...prev, irn }));
    setShowIrnDialog(false);
    setTimeout(() => printInvoice(), 100);
  };

  const printInvoice = () => {
    window.print();
  };

  const downloadEInvoiceJSON = () => {
    if (!companySettings) return;

    const eInvoiceData = {
      Version: '1.1',
      TxnDtls: {
        TaxSch: 'GST',
        SupTyp: 'B2B'
      },
      DocDtls: {
        Typ: 'CRN',
        No: currentNote.note_no,
        Dt: currentNote.note_date
      },
      SellerDtls: {
        Gstin: companySettings.gstin,
        LglNm: companySettings.company_name,
        Addr1: companySettings.address_line1,
        Addr2: companySettings.address_line2 || '',
        Loc: companySettings.locality,
        Pin: companySettings.pin_code.toString(),
        Stcd: companySettings.state_code || '33'
      },
      BuyerDtls: {
        Gstin: customer.gstin || null,
        LglNm: customer.name_english,
        Pos: customer.place_of_supply || customer.state_code || '33',
        Addr1: customer.address_english || 'Address Not Available',
        Pin: customer.pin_code || 'PIN Not Available',
        Stcd: customer.state_code || '33'
      },
      ValDtls: {
        TotInvVal: currentNote.amount
      },
      ItemList: [
        {
          SlNo: '1',
          IsServc: 'N',
          HsnCd: '1006',
          Qty: 1,
          Unit: 'NOS',
          UnitPrice: currentNote.amount,
          TotAmt: currentNote.amount,
          Discount: 0,
          PreTaxVal: currentNote.amount,
          AssAmt: currentNote.amount,
          GstRt: 0,
          IgstAmt: 0,
          CgstAmt: 0,
          SgstAmt: 0,
          TotItemVal: currentNote.amount
        }
      ]
    };

    if (currentNote.irn) {
      (eInvoiceData as any).IRN = currentNote.irn;
    }

    const blob = new Blob([JSON.stringify(eInvoiceData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credit-note-${currentNote.note_no}-einvoice.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const pdf = new jsPDF();
    
    // Company details
    pdf.setFontSize(16);
    pdf.text(companySettings?.company_name || 'Company Name', 20, 20);
    
    pdf.setFontSize(12);
    pdf.text('CREDIT NOTE', 20, 40);
    pdf.text(`Note No: ${currentNote.note_no}`, 20, 50);
    pdf.text(`Date: ${new Date(currentNote.note_date).toLocaleDateString()}`, 20, 60);
    
    // Customer details
    pdf.text('Bill To:', 20, 80);
    pdf.text(customer.name_english, 20, 90);
    if (customer.address_english) {
      pdf.text(customer.address_english, 20, 100);
    }
    
    // Amount
    pdf.text(`Amount: ₹${currentNote.amount.toFixed(2)}`, 20, 120);
    pdf.text(`Reason: ${currentNote.reason}`, 20, 130);
    
    if (currentNote.reference_bill_no) {
      pdf.text(`Reference Bill: ${currentNote.reference_bill_no}`, 20, 140);
    }
    
    if (currentNote.irn) {
      pdf.text(`IRN: ${currentNote.irn}`, 20, 160);
    }
    
    // Add QR code if available
    if (qrCodeDataUrl) {
      pdf.addImage(qrCodeDataUrl, 'PNG', 140, 120, 50, 50);
    }
    
    pdf.save(`credit-note-${currentNote.note_no}.pdf`);
  };

  if (!companySettings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="print:hidden">
          <CardTitle className="flex items-center justify-between">
            <span>{language === 'english' ? 'Credit Note' : 'கிரெடிட் நோட்'}</span>
            <div className="flex gap-2">
              <Button onClick={handlePrintButtonClick} size="sm">
                <Printer className="w-4 h-4 mr-2" />
                {language === 'english' ? 'Print' : 'அச்சிடு'}
              </Button>
              <Button onClick={downloadEInvoiceJSON} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {language === 'english' ? 'Download JSON' : 'JSON பதிவிறக்கு'}
              </Button>
              <Button onClick={downloadPDF} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                {language === 'english' ? 'Download PDF' : 'PDF பதிவிறக்கு'}
              </Button>
              <Button onClick={onClose} variant="secondary" size="sm">
                {language === 'english' ? 'Close' : 'மூடு'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Invoice Content */}
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold">{companySettings.company_name}</h1>
              <p>{companySettings.address_line1}</p>
              {companySettings.address_line2 && <p>{companySettings.address_line2}</p>}
              <p>{companySettings.locality}, {companySettings.pin_code}</p>
              <p><strong>GSTIN: {companySettings.gstin}</strong></p>
              <p>Phone: {companySettings.phone} | Email: {companySettings.email}</p>
              <p className="text-sm font-semibold">({companySettings.location_code || 'MATTAPARAI'})</p>
            </div>

            {/* Credit Note Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-bold mb-2">CREDIT NOTE</h2>
                <p><strong>Note No:</strong> {currentNote.note_no}</p>
                <p><strong>Date:</strong> {new Date(currentNote.note_date).toLocaleDateString()}</p>
                {currentNote.reference_bill_no && (
                  <p><strong>Reference Bill:</strong> {currentNote.reference_bill_no}</p>
                )}
                {currentNote.irn && (
                  <p><strong>IRN:</strong> {currentNote.irn}</p>
                )}
              </div>
              <div>
                <h3 className="font-bold mb-2">Bill To:</h3>
                <p><strong>{customer.name_english}</strong></p>
                {customer.name_tamil && <p className="text-sm text-muted-foreground">{customer.name_tamil}</p>}
                <p>Code: {customer.code}</p>
                {customer.address_english && (
                  <div className="mt-2">
                    <p>{customer.address_english}</p>
                    {customer.address_tamil && <p className="text-sm text-muted-foreground">{customer.address_tamil}</p>}
                  </div>
                )}
                {customer.pin_code && <p>PIN: {customer.pin_code}</p>}
                {customer.state_code && <p>State Code: {customer.state_code}</p>}
                {customer.place_of_supply && <p>Place of Supply: {customer.place_of_supply}</p>}
                {customer.gstin && <p><strong>GSTIN: {customer.gstin}</strong></p>}
                {customer.phone && <p>Phone: {customer.phone}</p>}
                {customer.email && <p>Email: {customer.email}</p>}
              </div>
            </div>

            {/* Amount Details */}
            <div className="border rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <p><strong>Reason:</strong> {currentNote.reason}</p>
                </div>
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>Taxable Amount:</p>
                      <p>CGST @ {((currentNote.gst_percentage || 18) / 2).toFixed(1)}%:</p>
                      <p>SGST @ {((currentNote.gst_percentage || 18) / 2).toFixed(1)}%:</p>
                      <p>GST Amount:</p>
                    </div>
                    <div className="text-right">
                      <p>₹{calculateGST(currentNote.amount, currentNote.gst_percentage).taxableAmount.toFixed(2)}</p>
                      <p>₹{calculateGST(currentNote.amount, currentNote.gst_percentage).cgstAmount.toFixed(2)}</p>
                      <p>₹{calculateGST(currentNote.amount, currentNote.gst_percentage).sgstAmount.toFixed(2)}</p>
                      <p>₹{calculateGST(currentNote.amount, currentNote.gst_percentage).gstAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="border-t mt-2 pt-2">
                    <div className="grid grid-cols-2 gap-4 font-bold text-lg">
                      <p>Total Amount:</p>
                      <p className="text-right">₹{currentNote.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {qrCodeDataUrl && (
              <div className="flex justify-center">
                <div className="text-center">
                  <img src={qrCodeDataUrl} alt="QR Code" className="mx-auto" />
                  <p className="text-xs mt-2">E-Invoice QR Code</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showIrnDialog && (
        <IrnInputDialog
          open={showIrnDialog}
          onOpenChange={setShowIrnDialog}
          saleId={currentNote.id}
          onIrnSaved={handleIrnSaved}
          tableType="credit_notes"
        />
      )}
    </div>
  );
};