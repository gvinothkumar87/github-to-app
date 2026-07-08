import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, FileText, Printer, Zap, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { IrnInputDialog } from '@/components/IrnInputDialog';
import { einvoiceService } from '@/services/einvoiceService';
import { useToast } from '@/hooks/use-toast';
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
  mill?: string;
  einvoice_status?: string | null;
  ack_no?: string | null;
  ack_date?: string | null;
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

interface Item {
  id: string;
  name_english: string;
  name_tamil?: string;
  code: string;
  hsn_no?: string;
  gst_percentage: number;
  unit: string;
}

interface CreditNoteInvoiceGeneratorProps {
  creditNote: CreditNote;
  customer: Customer;
  item: Item;
  onClose: () => void;
}

export const CreditNoteInvoiceGenerator = ({ creditNote, customer, item, onClose }: CreditNoteInvoiceGeneratorProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [showIrnDialog, setShowIrnDialog] = useState(false);
  const [currentNote, setCurrentNote] = useState(creditNote);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // E-Invoice state
  const [generating, setGenerating] = useState(false);
  const [showCancelIrnDialog, setShowCancelIrnDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('2');
  const [cancelRemark, setCancelRemark] = useState('Data entry mistake');

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  useEffect(() => {
    if (currentNote.irn) {
      generateQRCode();
    }
  }, [currentNote.irn, companySettings]);

  const fetchCompanySettings = async () => {
    try {
      // NEW: Use mill field directly; if missing, fetch first active location
      let locationCode = currentNote.mill;
      if (!locationCode) {
        // fallback: get the first active location from company_settings
        const { data: firstLoc } = await supabase
          .from('company_settings')
          .select('location_code')
          .eq('is_active', true)
          .order('location_name')
          .limit(1)
          .single();
        locationCode = firstLoc?.location_code || '';
      }

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
      setCompanySettings(null);
    }
  };

  const getDefaultCompanyDetails = (_locationCode = '') => null;

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
        TxnDtls: { TaxSch: 'GST', SupTyp: 'B2B' },
        DocDtls: {
          Typ: 'CRN',
          No: currentNote.note_no,
          Dt: new Date(currentNote.note_date).toISOString().split('T')[0].split('-').reverse().join('/')
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
        ValDtls: { TotInvVal: currentNote.amount },
        IRN: currentNote.irn
      };
      const url = await QRCodeLib.toDataURL(JSON.stringify(qrData), {
        width: 200, margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      setQrCodeDataUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // ─── E-Invoice Generation ─────────────────────────────────────────────────
  const handleGenerateEInvoice = async () => {
    if (!companySettings) return;
    if (!companySettings.einvoice_enabled) {
      toast({ title: 'E-Invoice Not Enabled', description: 'Enable E-Invoice in Company Settings first.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const result = await einvoiceService.generateNoteEInvoice({
        note: currentNote,
        noteType: 'CRN',
        table: 'credit_notes',
        companySettings,
        customer,
        item
      });
      setCurrentNote(prev => ({
        ...prev,
        irn: result.irn,
        einvoice_status: 'GENERATED'
      }));
      toast({ title: 'E-Invoice Generated', description: `IRN: ${result.irn.substring(0, 20)}...` });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'E-Invoice Error', description: err.message || 'Failed to generate E-Invoice', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  // ─── E-Invoice Cancellation ───────────────────────────────────────────────
  const handleCancelEInvoice = async () => {
    if (!companySettings) return;
    setGenerating(true);
    try {
      await einvoiceService.cancelNoteEInvoice({
        note: currentNote,
        noteType: 'CRN',
        table: 'credit_notes',
        companySettings,
        reasonCode: cancelReason,
        remark: cancelRemark
      });
      setCurrentNote(prev => ({ ...prev, einvoice_status: 'CANCELLED' }));
      setShowCancelIrnDialog(false);
      setCancelReason('2');
      setCancelRemark('Data entry mistake');
      toast({ title: 'E-Invoice Cancelled', description: 'Credit Note E-Invoice has been cancelled on the portal.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Cancellation Error', description: err.message || 'Failed to cancel E-Invoice', variant: 'destructive' });
    } finally {
      setGenerating(false);
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
    setCurrentNote(prev => ({ ...prev, irn, einvoice_status: 'GENERATED' }));
    setShowIrnDialog(false);
    setTimeout(() => printInvoice(), 100);
  };

  const printInvoice = () => { window.print(); };

  const downloadEInvoiceJSON = () => {
    if (!companySettings) return;
    const customerAddress = customer.address_english || customer.address_tamil || '';
    const addressParts = customerAddress.split(',').map(p => p.trim()).filter(Boolean);
    let buyerAddr1 = customerAddress.substring(0, 100);
    let buyerAddr2 = customerAddress.length > 100 ? customerAddress.substring(100) : '';
    let buyerLoc = '';
    if (addressParts.length >= 3) {
      buyerAddr1 = addressParts.slice(0, 2).join(', ') + ',';
      buyerAddr2 = addressParts.slice(2).join(',');
      buyerLoc = addressParts[addressParts.length - 2];
    } else if (addressParts.length === 2) {
      buyerAddr1 = addressParts[0]; buyerAddr2 = addressParts[1]; buyerLoc = addressParts[1];
    } else {
      buyerAddr1 = customerAddress || 'Address Not Available'; buyerAddr2 = ''; buyerLoc = customerAddress || 'Not Available';
    }
    buyerLoc = buyerLoc.replace(/\d{6}/g, '').replace(/[^\w\s]/g, '').trim();
    if (!buyerLoc && customer.state_code === '33') buyerLoc = 'Tamil Nadu';

    const eInvoiceData = {
      Version: '1.1',
      TranDtls: { TaxSch: 'GST', SupTyp: 'B2B', IgstOnIntra: 'N', RegRev: 'N', EcmGstin: null },
      DocDtls: { Typ: 'CRN', No: currentNote.note_no, Dt: new Date(currentNote.note_date).toISOString().split('T')[0].split('-').reverse().join('/') },
      SellerDtls: { Gstin: companySettings.gstin, LglNm: companySettings.company_name, Addr1: companySettings.address_line1, Addr2: companySettings.address_line2 || null, Loc: companySettings.locality, Pin: companySettings.pin_code ? parseInt(companySettings.pin_code.toString()) : null, Stcd: companySettings.state_code || '33', Ph: companySettings.phone || null, Em: companySettings.email || null },
      BuyerDtls: { Gstin: customer.gstin || null, LglNm: customer.name_english, Addr1: buyerAddr1, Addr2: buyerAddr2 || null, Loc: buyerLoc, Pin: customer.pin_code ? parseInt(customer.pin_code.toString()) : null, Pos: customer.place_of_supply || customer.state_code || '33', Stcd: customer.state_code || '33', Ph: customer.phone || null, Em: customer.email || null },
      ValDtls: { AssVal: calculateGST(currentNote.amount, currentNote.gst_percentage).taxableAmount, IgstVal: 0, CgstVal: calculateGST(currentNote.amount, currentNote.gst_percentage).cgstAmount, SgstVal: calculateGST(currentNote.amount, currentNote.gst_percentage).sgstAmount, CesVal: 0, StCesVal: 0, Discount: 0, OthChrg: 0, RndOffAmt: 0, TotInvVal: currentNote.amount },
      RefDtls: { InvRm: 'NICGEPP' },
      ItemList: [{ SlNo: '1', PrdDesc: item.name_english || 'Product', IsServc: 'N', HsnCd: item.hsn_no || '', Qty: 1, FreeQty: 0, Unit: item.unit || 'NOS', UnitPrice: calculateGST(currentNote.amount, currentNote.gst_percentage).taxableAmount, TotAmt: calculateGST(currentNote.amount, currentNote.gst_percentage).taxableAmount, Discount: 0, PreTaxVal: 0, AssAmt: calculateGST(currentNote.amount, currentNote.gst_percentage).taxableAmount, GstRt: currentNote.gst_percentage || 5, IgstAmt: 0, CgstAmt: calculateGST(currentNote.amount, currentNote.gst_percentage).cgstAmount, SgstAmt: calculateGST(currentNote.amount, currentNote.gst_percentage).sgstAmount, CesRt: 0, CesAmt: 0, CesNonAdvlAmt: 0, StateCesRt: 0, StateCesAmt: 0, StateCesNonAdvlAmt: 0, OthChrg: 0, TotItemVal: currentNote.amount }]
    };
    if (currentNote.irn) (eInvoiceData as any).IRN = currentNote.irn;
    const blob = new Blob([JSON.stringify([eInvoiceData], (k, v) => (v === '' || v === null) ? undefined : v, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `credit-note-${currentNote.note_no}-einvoice.json`; link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(16); pdf.text(companySettings?.company_name || 'Company Name', 20, 20);
    pdf.setFontSize(12); pdf.text('CREDIT NOTE', 20, 40);
    pdf.text(`Note No: ${currentNote.note_no}`, 20, 50);
    pdf.text(`Date: ${new Date(currentNote.note_date).toLocaleDateString()}`, 20, 60);
    pdf.text('Bill To:', 20, 80); pdf.text(customer.name_english, 20, 90);
    if (customer.address_english) pdf.text(customer.address_english, 20, 100);
    pdf.text(`Amount: ₹${currentNote.amount.toFixed(2)}`, 20, 120);
    pdf.text(`Reason: ${currentNote.reason}`, 20, 130);
    pdf.text(`Reference Bill No: ${currentNote.reference_bill_no || 'N/A'}`, 20, 140);
    if (currentNote.irn) pdf.text(`IRN: ${currentNote.irn}`, 20, 160);
    if (qrCodeDataUrl) pdf.addImage(qrCodeDataUrl, 'PNG', 140, 120, 50, 50);
    pdf.save(`credit-note-${currentNote.note_no}.pdf`);
  };

  if (!companySettings) return <div>Loading...</div>;

  const einvoiceStatus = currentNote.einvoice_status || 'PENDING';
  const isGenerated = einvoiceStatus === 'GENERATED';
  const isCancelled = einvoiceStatus === 'CANCELLED';

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="print:hidden">
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span>{language === 'english' ? 'Credit Note' : 'கிரெடிட் நோட்'}</span>
              {/* E-Invoice Status Badge */}
              {isGenerated && <Badge className="bg-green-100 text-green-800 border-green-300">E-Invoice: GENERATED</Badge>}
              {isCancelled && <Badge className="bg-red-100 text-red-800 border-red-300">E-Invoice: CANCELLED</Badge>}
              {!isGenerated && !isCancelled && <Badge variant="outline" className="text-muted-foreground">E-Invoice: PENDING</Badge>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handlePrintButtonClick} size="sm">
                <Printer className="w-4 h-4 mr-2" />
                {language === 'english' ? 'Print' : 'அச்சிடு'}
              </Button>

              {/* Generate E-Invoice Button */}
              {!isGenerated && !isCancelled && companySettings?.einvoice_enabled && (
                <Button onClick={handleGenerateEInvoice} size="sm" variant="default" disabled={generating}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Zap className="w-4 h-4 mr-2" />
                  {generating ? 'Generating...' : 'Generate E-Invoice'}
                </Button>
              )}

              {/* Cancel E-Invoice Button */}
              {isGenerated && (
                <Button onClick={() => setShowCancelIrnDialog(true)} size="sm" variant="destructive" disabled={generating}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel E-Invoice
                </Button>
              )}

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
                <p><strong>Reference Bill No:</strong> {currentNote.reference_bill_no || 'N/A'}</p>
                {currentNote.irn && <p className="text-xs break-all mt-1"><strong>IRN:</strong> {currentNote.irn}</p>}
                {currentNote.ack_no && <p><strong>Ack No:</strong> {currentNote.ack_no}</p>}
                {currentNote.ack_date && <p><strong>Ack Date:</strong> {currentNote.ack_date}</p>}
              </div>
              <div>
                <h3 className="font-bold mb-2">Bill To:</h3>
                <p><strong>{customer.name_english}</strong></p>
                {customer.address_english && <div className="mt-2"><p>{customer.address_english}</p></div>}
                {customer.pin_code && <p>PIN: {customer.pin_code}</p>}
                {customer.state_code && <p>State Code: {customer.state_code}</p>}
                {customer.place_of_supply && <p>Place of Supply: {customer.place_of_supply}</p>}
                {customer.gstin && <p><strong>GSTIN: {customer.gstin}</strong></p>}
                {customer.phone && <p>Phone: {customer.phone}</p>}
                {customer.email && <p>Email: {customer.email}</p>}
              </div>
            </div>

            {/* Item and Amount Details */}
            <div className="border rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <p><strong>Product:</strong> {item.name_english} ({item.code})</p>
                  <p><strong>HSN Code:</strong> {item.hsn_no || 'N/A'}</p>
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

      {/* IRN Manual Entry Dialog */}
      {showIrnDialog && (
        <IrnInputDialog
          open={showIrnDialog}
          onOpenChange={setShowIrnDialog}
          saleId={currentNote.id}
          onIrnSaved={handleIrnSaved}
          tableType="credit_notes"
        />
      )}

      {/* Cancel E-Invoice Dialog */}
      <Dialog open={showCancelIrnDialog} onOpenChange={(open) => {
        if (!open) { setCancelReason('2'); setCancelRemark('Data entry mistake'); }
        setShowCancelIrnDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Credit Note E-Invoice</DialogTitle>
            <DialogDescription>
              Cancel E-Invoice (IRN) for Credit Note {currentNote.note_no}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>IRN</Label>
              <p className="text-xs text-muted-foreground break-all font-mono bg-muted p-2 rounded">{currentNote.irn}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="crn_cancel_reason">Reason</Label>
              <select id="crn_cancel_reason" className="w-full h-10 px-3 border rounded-md bg-background"
                value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                <option value="1">1 - Duplicate</option>
                <option value="2">2 - Data Entry Mistake</option>
                <option value="3">3 - Order Cancelled</option>
                <option value="4">4 - Others</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="crn_cancel_remark">Remarks <span className="text-muted-foreground text-xs">({cancelRemark.length}/100)</span></Label>
              <Input id="crn_cancel_remark" value={cancelRemark}
                onChange={(e) => setCancelRemark(e.target.value.slice(0, 100))}
                placeholder="Enter cancellation remarks..." maxLength={100} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelIrnDialog(false)} disabled={generating}>Back</Button>
            <Button variant="destructive" onClick={handleCancelEInvoice} disabled={generating || !cancelRemark.trim()}>
              {generating ? 'Cancelling...' : 'Confirm Cancel E-Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};