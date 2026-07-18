import { Sale, OutwardEntry, Customer, Item } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, FileText, Edit, ShieldAlert, Truck, CheckCircle, Ban, RefreshCw, Calendar, ChevronDown, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { IrnInputDialog } from '@/components/IrnInputDialog';
import { einvoiceService } from '@/services/einvoiceService';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import QRCode from 'qrcode';
import { generateInvoiceHtml } from '@/utils/invoiceTemplate';
import { generateEwayBillHtml } from '@/utils/ewayBillTemplate';

interface InvoiceGeneratorProps {
  sale: Sale;
  outwardEntry?: OutwardEntry | null;
  customer: Customer;
  item: Item;
  onClose: () => void;
}

interface CompanyDetails {
  name: string;
  address: string;
  gstin: string;
}

export const InvoiceGenerator = ({ sale, outwardEntry, customer, item, onClose }: InvoiceGeneratorProps) => {
  const { language, getDisplayName } = useLanguage();
  const { toast } = useToast();
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [showIrnDialog, setShowIrnDialog] = useState(false);
  const [currentSale, setCurrentSale] = useState(sale);
  const [allSales, setAllSales] = useState<Sale[]>([sale]);
  const [allItems, setAllItems] = useState<Item[]>([item]);

  // E-Invoice & E-Way Bill States
  const [generating, setGenerating] = useState(false);
  // E-Invoice cancel state
  const [cancelReason, setCancelReason] = useState('2'); // default to Data Entry Mistake (E-Invoice code)
  const [cancelRemark, setCancelRemark] = useState('Data entry mistake');
  // E-Way Bill cancel state (separate — reason codes differ from E-Invoice)
  const [ewbCancelReason, setEwbCancelReason] = useState('2'); // default: 2 = Order Cancelled (EWB code)
  const [ewbCancelRemark, setEwbCancelRemark] = useState('Order cancelled');
  const [showCancelIrnDialog, setShowCancelIrnDialog] = useState(false);
  const [showCancelEwbDialog, setShowCancelEwbDialog] = useState(false);

  // E-way bill inputs
  const [distance, setDistance] = useState<number>(0);
  const [transporterId, setTransporterId] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [transDocNo, setTransDocNo] = useState('');
  const [transDocDt, setTransDocDt] = useState('');
  const [transMode, setTransMode] = useState<'1' | '2' | '3' | '4'>('1');
  const [vehType, setVehType] = useState<'R' | 'O'>('R');
  const [includeEwayBill, setIncludeEwayBill] = useState(false);
  const [generateStandaloneEwb, setGenerateStandaloneEwb] = useState(false);
  
  // E-Way Bill Vehicle Update Dialog state
  const [showVehicleUpdateDialog, setShowVehicleUpdateDialog] = useState(false);
  const [newVehicleNo, setNewVehicleNo] = useState('');
  const [vehUpdatePlace, setVehUpdatePlace] = useState('');
  const [vehUpdateState, setVehUpdateState] = useState<number>(33);
  const [vehUpdateReason, setVehUpdateReason] = useState('1');
  const [vehUpdateRemark, setVehUpdateRemark] = useState('Due to Break down');
  
  // E-Way Bill Validity Extension Dialog state
  const [showValidityExtensionDialog, setShowValidityExtensionDialog] = useState(false);
  const [extVehicleNo, setExtVehicleNo] = useState('');
  const [extPlace, setExtPlace] = useState('');
  const [extState, setExtState] = useState<number>(33);
  const [extPincode, setExtPincode] = useState('');
  const [extRemainingDistance, setExtRemainingDistance] = useState<number>(0);
  const [extReasonCode, setExtReasonCode] = useState<number>(5);
  const [extRemarks, setExtRemarks] = useState('Due to Break down');
  const [extAddr1, setExtAddr1] = useState('');
  const [extAddr2, setExtAddr2] = useState('');
  const [extTransitType, setExtTransitType] = useState<'R' | 'W' | 'O'>('R');
  const [extConsignmentStatus, setExtConsignmentStatus] = useState<'M' | 'T'>('M');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingOfficialPdf, setDownloadingOfficialPdf] = useState(false);
  const [printingEwb, setPrintingEwb] = useState(false);

  useEffect(() => {
    const fetchAllSalesForBill = async () => {
      if (sale.bill_serial_no) {
        try {
          const { data, error } = await supabase
            .from('sales')
            .select(`
              *,
              items(*)
            `)
            .eq('bill_serial_no', sale.bill_serial_no)
            .order('created_at');

          if (error) throw error;

          if (data && data.length > 0) {
            setAllSales(data);
            setAllItems(data.map((s: any) => s.items).filter(Boolean));
            
            // Find our specific sale in the fetched list to get updated db values
            const matched = data.find((d: any) => d.id === sale.id);
            if (matched) {
              setCurrentSale(matched);
            }
          }
        } catch (error) {
          console.error('Error fetching all sales:', error);
        }
      }
    };

    fetchAllSalesForBill();
  }, [sale.bill_serial_no, sale.id]);

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        // Determine loading place: prioritize sale.loading_place (for direct sales), then outward entry, then default
        const loadingPlace = sale.loading_place || outwardEntry?.loading_place || 'PULIVANTHI';

        console.log('Loading company settings for mill:', loadingPlace);

        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .eq('location_code', loadingPlace)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching company settings:', error);
          // Fallback to hardcoded values
          setCompanySettings(getDefaultCompanyDetails(loadingPlace));
        } else {
          setCompanySettings(data);
        }
      } catch (error) {
        console.error('Error:', error);
        // Use the correct loading place for fallback
        const loadingPlace = sale.loading_place || outwardEntry?.loading_place || 'PULIVANTHI';
        setCompanySettings(getDefaultCompanyDetails(loadingPlace));
      }
    };

    fetchCompanySettings();
  }, [sale.loading_place, outwardEntry?.loading_place]);



  const getDefaultCompanyDetails = (loadingPlace: string) => {
    // Return empty/null to force usage of database settings
    // This ensures we don't accidentally use hardcoded outdated details
    return null;
  };

  const handlePrintButtonClick = () => {
    printInvoice();
  };

  const handleIrnSaved = (irn: string) => {
    // Update the current sale with IRN (print is separate)
    if (irn) {
      setCurrentSale({ ...currentSale, irn });
    }
  };

  const handleGenerateEInvoice = async () => {
    if (!companySettings) return;
    setGenerating(true);
    try {
      const res = await einvoiceService.generateEInvoice({
        sale: currentSale,
        allSales,
        allItems,
        customer,
        item,
        companySettings,
        outwardEntry,
        generateEwayBill: includeEwayBill,
        distance,
        transporterId,
        transporterName,
        transDocNo,
        transDocDt,
        vehType,
        transMode
      });
      
      if (res.correctedDistance !== undefined) {
        setDistance(res.correctedDistance);
      }

      setCurrentSale(prev => ({
        ...prev,
        irn: res.irn,
        signed_qrcode: res.signedQrcode,
        ack_no: res.ackNo,
        ack_date: res.ackDate,
        einvoice_status: 'GENERATED',
        ...(res.ewayBillNo ? {
          eway_bill_no: res.ewayBillNo,
          eway_bill_date: res.ewayBillDate,
          eway_bill_valid_upto: res.ewayBillValidUpto || prev.eway_bill_valid_upto,
          eway_bill_status: 'GENERATED'
        } : {})
      }));

      toast({
        title: 'Success',
        description: res.ewayBillNo 
          ? 'E-Invoice and E-Way Bill generated successfully!' 
          : 'E-Invoice generated successfully!',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'E-Invoice Generation Error',
        description: err.message || 'Failed to generate E-Invoice',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateEWayBill = async () => {
    if (!companySettings) return;
    if (distance < 0) {
      toast({
        title: 'Validation Error',
        description: 'Distance cannot be negative',
        variant: 'destructive'
      });
      return;
    }
    setGenerating(true);
    try {
      const res = await einvoiceService.generateEWayBill({
        sale: currentSale,
        companySettings,
        distance,
        transporterId,
        transporterName,
        transDocNo,
        transDocDt,
        vehType,
        transMode,
        outwardEntry
      });

      if (res.correctedDistance !== undefined) {
        setDistance(res.correctedDistance);
      }

      setCurrentSale(prev => ({
        ...prev,
        eway_bill_no: res.ewayBillNo,
        eway_bill_date: res.ewayBillDate,
        eway_bill_valid_upto: res.ewayBillValidUpto || prev.eway_bill_valid_upto,
        eway_bill_status: 'GENERATED'
      }));

      toast({
        title: 'Success',
        description: 'E-Way Bill generated successfully!',
      });
    } catch (err: any) {
      console.error(err);
      // If the IRN is not active (cancelled on portal), sync local UI state immediately
      const errMsg: string = err.message || '';
      if (
        errMsg.includes('2302') ||
        errMsg.includes('IRN is not active') ||
        errMsg.includes('not active') ||
        errMsg.includes('CANCELLED')
      ) {
        setCurrentSale(prev => ({
          ...prev,
          einvoice_status: 'CANCELLED'
        }));
      }
      toast({
        title: 'E-Way Bill Error',
        description: err.message || 'Failed to generate E-Way Bill',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateStandaloneEWayBill = async () => {
    if (!companySettings) return;
    if (distance < 0) {
      toast({
        title: 'Validation Error',
        description: 'Distance cannot be negative',
        variant: 'destructive'
      });
      return;
    }
    setGenerating(true);
    try {
      const res = await einvoiceService.generateStandaloneEWayBill({
        sale: currentSale,
        allSales,
        allItems,
        customer,
        item,
        companySettings,
        outwardEntry,
        distance,
        transporterId,
        transporterName,
        transDocNo,
        transDocDt,
        vehType,
        transMode
      });

      if (res.correctedDistance !== undefined) {
        setDistance(res.correctedDistance);
      }

      setCurrentSale(prev => ({
        ...prev,
        eway_bill_no: res.ewayBillNo,
        eway_bill_date: res.ewayBillDate,
        eway_bill_status: 'GENERATED'
      }));

      toast({
        title: 'Success',
        description: 'Standalone E-Way Bill generated successfully!',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Standalone E-Way Bill Error',
        description: err.message || 'Failed to generate standalone E-Way Bill',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateVehicle = async () => {
    if (!companySettings) return;
    if (!newVehicleNo || !vehUpdatePlace) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required vehicle update fields',
        variant: 'destructive'
      });
      return;
    }
    setGenerating(true);
    try {
      await einvoiceService.updateEWayBillVehicle({
        sale: currentSale,
        vehicleNo: newVehicleNo,
        fromPlace: vehUpdatePlace,
        fromState: vehUpdateState,
        reasonCode: vehUpdateReason,
        reasonRem: vehUpdateRemark,
        transDocNo,
        transDocDate: transDocDt,
        transMode,
        vehicleType: vehType,
        companySettings
      });

      setCurrentSale(prev => ({
        ...prev,
        lorry_no: newVehicleNo.replace(/\s+/g, '').toUpperCase()
      }));

      setShowVehicleUpdateDialog(false);
      toast({
        title: 'Success',
        description: 'E-Way Bill vehicle updated successfully!',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Vehicle Update Error',
        description: err.message || 'Failed to update E-Way Bill vehicle',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExtendValidity = async () => {
    if (!companySettings) return;
    if (!extVehicleNo || !extPlace || !extPincode || !extRemainingDistance || !extAddr1) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required extension fields',
        variant: 'destructive'
      });
      return;
    }
    setGenerating(true);
    try {
      const res = await einvoiceService.extendEWayBillValidity({
        sale: currentSale,
        vehicleNo: extVehicleNo,
        fromPlace: extPlace,
        fromState: extState,
        remainingDistance: extRemainingDistance,
        transDocNo,
        transDocDate: transDocDt,
        transMode,
        extnRsnCode: extReasonCode,
        extnRemarks: extRemarks,
        fromPincode: parseInt(extPincode, 10),
        consignmentStatus: extConsignmentStatus,
        vehicleType: vehType,
        transitType: extTransitType,
        addressLine1: extAddr1,
        addressLine2: extAddr2,
        companySettings
      });

      setCurrentSale(prev => ({
        ...prev,
        lorry_no: extVehicleNo.replace(/\s+/g, '').toUpperCase()
      }));

      setShowValidityExtensionDialog(false);
      toast({
        title: 'Success',
        description: `E-Way Bill validity extended successfully! New Validity: ${res.validUpto}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Extension Error',
        description: err.message || 'Failed to extend E-Way Bill validity',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintEWayBill = async () => {
    if (!companySettings || !currentSale.eway_bill_no) return;
    setPrintingEwb(true);
    try {
      // 1. Fetch EWB details from API
      let ewbDetails: any = null;
      try {
        const res = await einvoiceService.getEWayBillDetails(
          currentSale.eway_bill_no,
          companySettings,
          currentSale.irn || undefined,
          true
        );
        let dataObj = res.Data || res.data || res;
        if (typeof dataObj === 'string' && dataObj) {
          try { dataObj = JSON.parse(dataObj); } catch (e) { /* ignore */ }
        }
        ewbDetails = dataObj;
      } catch (err: any) {
        console.warn('Could not fetch EWB details for print, using local data:', err);
      }

      // 2. Generate QR code from full EWB details string
      let qrCodeDataUrl = '';
      try {
        const ewbNo = currentSale.eway_bill_no || '';
        const ewbDate = ewbDetails?.ewayBillDate || ewbDetails?.EwayBillDate || currentSale.eway_bill_date || '';
        const genGstin = ewbDetails?.userGstin || ewbDetails?.UserGstin || companySettings?.gstin || '';
        const docNo = ewbDetails?.docNo || ewbDetails?.DocNo || currentSale.bill_serial_no || '';
        const docDate = ewbDetails?.docDate || ewbDetails?.DocDate || currentSale.sale_date || '';
        const fromGstin = ewbDetails?.fromGstin || ewbDetails?.FromGstin || companySettings?.gstin || '';
        const toGstin = ewbDetails?.toGstin || ewbDetails?.ToGstin || '';
        const totInvVal = ewbDetails?.totInvValue || ewbDetails?.TotInvValue || currentSale.total_amount || '';
        const hsnCode = ewbDetails?.hsnCode || ewbDetails?.HsnCode || '';

        // Official EWB QR Code format: EWBNo, EWBDate, GenGstin, DocNo, DocDate, FromGstin, ToGstin, TotInvVal, HsnCode
        const qrString = `${ewbNo},${ewbDate},${genGstin},${docNo},${docDate},${fromGstin},${toGstin},${totInvVal},${hsnCode}`;

        qrCodeDataUrl = await QRCode.toDataURL(qrString, {
          width: 140,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
      } catch (error) {
        console.error('Error generating EWB QR code for print:', error);
      }

      // 3. Generate HTML using the official format template
      const htmlContent = generateEwayBillHtml({
        ewbNo: currentSale.eway_bill_no,
        ewbDetails,
        qrCodeDataUrl,
        sale: currentSale,
        companySettings,
        customer,
        item
      });

      // 4. Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Print Error',
        description: err.message || 'Failed to print E-Way Bill',
        variant: 'destructive'
      });
    } finally {
      setPrintingEwb(false);
    }
  };

  const handleDownloadEWayBillPDF = async (printAction: 'printewb' | 'printdetailewb' | 'printcewb' = 'printewb') => {
    if (!companySettings || !currentSale.eway_bill_no) return;
    setDownloadingPdf(true);
    try {
      const filename = `ewaybill_${currentSale.eway_bill_no}.pdf`;
      await einvoiceService.downloadEWayBillPDF(currentSale.eway_bill_no, companySettings, filename, printAction);
      toast({
        title: 'Success',
        description: 'E-Way Bill PDF downloaded successfully!',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'PDF Download Error',
        description: err.message || 'Failed to download E-Way Bill PDF',
        variant: 'destructive'
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadOfficialEWayBillPDF = async (printAction: 'printewb' | 'printdetailewb' | 'printcewb' = 'printewb') => {
    if (!companySettings || !currentSale.eway_bill_no) return;
    setDownloadingOfficialPdf(true);
    try {
      const filename = `official_ewaybill_${currentSale.eway_bill_no}.pdf`;
      await einvoiceService.downloadOfficialEWayBillPDF(
        currentSale.eway_bill_no,
        companySettings,
        filename,
        printAction,
        currentSale.irn || undefined
      );
      toast({
        title: 'Success',
        description: 'Official E-Way Bill PDF downloaded successfully!',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Official PDF Download Error',
        description: err.message || 'Failed to download official E-Way Bill PDF',
        variant: 'destructive'
      });
    } finally {
      setDownloadingOfficialPdf(false);
    }
  };

  const handleCancelEInvoice = async () => {
    if (!companySettings) return;
    setGenerating(true);
    try {
      await einvoiceService.cancelEInvoice(currentSale, companySettings, cancelReason, cancelRemark);
      setCurrentSale(prev => ({
        ...prev,
        einvoice_status: 'CANCELLED'
      }));
      setShowCancelIrnDialog(false);
      toast({
        title: 'Cancelled',
        description: 'E-Invoice cancelled successfully!',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Cancellation Error',
        description: err.message || 'Failed to cancel E-Invoice',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCancelEWayBill = async () => {
    if (!companySettings) return;
    setGenerating(true);
    try {
      await einvoiceService.cancelEWayBill(currentSale, companySettings, parseInt(ewbCancelReason, 10), ewbCancelRemark);
      setCurrentSale(prev => ({
        ...prev,
        eway_bill_status: 'CANCELLED'
      }));
      setShowCancelEwbDialog(false);
      // Reset EWB cancel fields for next use
      setEwbCancelReason('2');
      setEwbCancelRemark('Order cancelled');
      toast({
        title: 'Cancelled',
        description: 'E-Way Bill cancelled successfully!',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Cancellation Error',
        description: err.message || 'Failed to cancel E-Way Bill',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  // Calculate totals for all products
  const calculateTotals = () => {
    return allSales.reduce((acc, s, index) => {
      const currentItem = allItems[index] || item;
      const base = s.quantity * s.rate;
      const gst = base * (currentItem.gst_percentage / 100);
      return {
        baseAmount: acc.baseAmount + base,
        gstAmount: acc.gstAmount + gst,
        totalAmount: acc.totalAmount + base + gst,
        totalQuantity: acc.totalQuantity + s.quantity
      };
    }, { baseAmount: 0, gstAmount: 0, totalAmount: 0, totalQuantity: 0 });
  };

  const { baseAmount, gstAmount, totalAmount, totalQuantity } = calculateTotals();
  // True when every sale line has 0% GST — used to simplify the invoice layout
  const allGstZero = allSales.every((s, index) => (allItems[index] || item).gst_percentage === 0);

  const generateEInvoiceJSON = () => {
    if (!companySettings) {
      console.error('Company settings not loaded');
      return;
    }

    console.log('Generating JSON with customer:', customer);
    console.log('Company settings:', companySettings);

    // Use customer details directly from database
    const customerAddress = customer.address_english || customer.address_tamil || "";

    // E-Invoice Addr1 limit is 100 chars. Use full address, split if necessary.
    const buyerAddr1 = customerAddress.substring(0, 100);
    const buyerAddr2 = customerAddress.length > 100 ? customerAddress.substring(100) : "";

    // Try to extract city from address (last part after comma), or default to State/Place of Supply
    const addressParts = customerAddress.split(',');
    let buyerLoc = addressParts.length > 0 ? addressParts[addressParts.length - 1].trim() : "";

    // Clean up pincode from location if present
    buyerLoc = buyerLoc.replace(/\d{6}/g, '').replace(/[^\w\s]/g, '').trim();

    if (!buyerLoc && customer.state_code === '33') {
      buyerLoc = "Tamil Nadu";
    }

    // Round amounts to 2 decimal places to avoid floating-point precision errors
    const roundedBaseAmount = Math.round(baseAmount * 100) / 100;
    const roundedGstAmount = Math.round(gstAmount * 100) / 100;
    const roundedCgstAmount = Math.round((roundedGstAmount / 2) * 100) / 100;
    const roundedSgstAmount = Math.round((roundedGstAmount / 2) * 100) / 100;

    // Calculate total to ensure exact match with components
    const calculatedTotal = roundedBaseAmount + roundedCgstAmount + roundedSgstAmount;
    const roundedTotalAmount = Math.round(calculatedTotal * 100) / 100;

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
        No: currentSale.bill_serial_no,
        Dt: new Date(currentSale.sale_date).toISOString().split('T')[0].split('-').reverse().join('/')
      },
      SellerDtls: {
        Gstin: companySettings.gstin,
        LglNm: companySettings.company_name,
        Addr1: companySettings.address_line1,
        Addr2: companySettings.address_line2 || null,
        Loc: companySettings.locality,
        Pin: companySettings.pin_code,
        Stcd: companySettings.state_code,
        Ph: companySettings.phone || null,
        Em: companySettings.email || null
      },
      BuyerDtls: {
        Gstin: customer.gstin || "URP",
        LglNm: customer.name_english || getDisplayName(customer),
        TrdNm: customer.name_english || getDisplayName(customer),
        Addr1: buyerAddr1,
        Addr2: buyerAddr2,
        Loc: buyerLoc,
        Pin: parseInt(customer.pin_code || "605201"),
        Pos: customer.place_of_supply || customer.state_code || "33",
        Stcd: customer.state_code || "33",
        ...(customer.phone ? { Ph: customer.phone } : {}),
        ...(customer.email ? { Em: customer.email } : {}),
        ContactPerson: customer.contact_person || "",
        Code: customer.code || ""
      },
      ValDtls: {
        AssVal: roundedBaseAmount,
        IgstVal: 0,
        CgstVal: roundedCgstAmount,
        SgstVal: roundedSgstAmount,
        CesVal: 0,
        StCesVal: 0,
        Discount: 0,
        OthChrg: 0,
        RndOffAmt: 0,
        TotInvVal: roundedTotalAmount
      },
      RefDtls: {
        InvRm: "NICGEPP"
      },
      ItemList: allSales.map((s, index) => {
        const currentItem = allItems[index] || item;
        const baseAmt = s.quantity * s.rate;
        const gstAmt = baseAmt * (currentItem.gst_percentage / 100);
        const cgstAmt = Math.round((gstAmt / 2) * 100) / 100;
        const sgstAmt = Math.round((gstAmt / 2) * 100) / 100;
        const itemTotal = Math.round((baseAmt + cgstAmt + sgstAmt) * 100) / 100;

        return {
          SlNo: (index + 1).toString(),
          PrdDesc: getDisplayName(currentItem),
          IsServc: "N",
          HsnCd: currentItem.hsn_no,
          Qty: s.quantity,
          FreeQty: 0,
          Unit: currentItem.unit,
          UnitPrice: Math.round(s.rate * 100) / 100,
          TotAmt: Math.round(baseAmt * 100) / 100,
          Discount: 0,
          PreTaxVal: 0,
          AssAmt: Math.round(baseAmt * 100) / 100,
          GstRt: currentItem.gst_percentage,
          IgstAmt: 0,
          CgstAmt: cgstAmt,
          SgstAmt: sgstAmt,
          CesRt: 0,
          CesAmt: 0,
          CesNonAdvlAmt: 0,
          StateCesRt: 0,
          StateCesAmt: 0,
          StateCesNonAdvlAmt: 0,
          OthChrg: 0,
          TotItemVal: itemTotal
        };
      })
    };

    // Wrap the invoice in an array as required by NIC API
    const eInvoiceArray = [eInvoiceData];

    const replacer = (key: string, value: any) => {
      if (value === "" || value === null) return undefined;
      return value;
    };

    const blob = new Blob([JSON.stringify(eInvoiceArray, replacer, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `einvoice_${currentSale.bill_serial_no}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printInvoice = async () => {
    // EWB details from API (ewaybillapi) are not used during print —
    // eway_bill_no, eway_bill_date, ack_no, ack_date are all stored in the DB (currentSale).
    // The template falls back to currentSale values when ewbDetails is null.
    const ewbDetails: any = null;

    // Generate QR code if IRN exists
    let qrCodeDataUrl = '';
    const qrcodeContent = currentSale.signed_qrcode || currentSale.irn;
    if (qrcodeContent) {
      try {
        qrCodeDataUrl = await QRCode.toDataURL(qrcodeContent, {
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

    // Generate E-Way Bill QR Code if EWB number exists
    let ewbQrCodeDataUrl = '';
    if (currentSale.eway_bill_no) {
      try {
        const ewbNo = currentSale.eway_bill_no || '';
        const ewbDate = ewbDetails?.ewayBillDate || ewbDetails?.EwayBillDate || currentSale.eway_bill_date || '';
        const genGstin = ewbDetails?.userGstin || ewbDetails?.UserGstin || companySettings?.gstin || '';
        const docNo = ewbDetails?.docNo || ewbDetails?.DocNo || currentSale.bill_serial_no || '';
        const docDate = ewbDetails?.docDate || ewbDetails?.DocDate || currentSale.sale_date || '';
        const fromGstin = ewbDetails?.fromGstin || ewbDetails?.FromGstin || companySettings?.gstin || '';
        const toGstin = ewbDetails?.toGstin || ewbDetails?.ToGstin || '';
        const totInvVal = ewbDetails?.totInvValue || ewbDetails?.TotInvValue || currentSale.total_amount || '';
        const hsnCode = ewbDetails?.hsnCode || ewbDetails?.HsnCode || '';

        // Official EWB QR Code format: EWBNo, EWBDate, GenGstin, DocNo, DocDate, FromGstin, ToGstin, TotInvVal, HsnCode
        const qrString = `${ewbNo},${ewbDate},${genGstin},${docNo},${docDate},${fromGstin},${toGstin},${totInvVal},${hsnCode}`;

        ewbQrCodeDataUrl = await QRCode.toDataURL(qrString, {
          width: 140,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (error) {
        console.error('Error generating EWB QR code:', error);
      }
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = generateInvoiceHtml({
        sale: currentSale,
        allSales,
        allItems,
        item,
        customer,
        companySettings,
        outwardEntry,
        getDisplayName,
        convertNumberToWords,
        baseAmount,
        gstAmount,
        totalAmount,
        totalQuantity,
        allGstZero,
        qrCodeDataUrl,
        ewbQrCodeDataUrl,
        ewbDetails
      });
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {language === 'english' ? 'Invoice Generated' : 'இன்வாய்ஸ் உருவாக்கப்பட்டது'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Company Details */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{companySettings?.company_name || "GOVINDAN RICE MILL"}</h3>
            <p className="text-sm">
              {companySettings?.address_line1}, {companySettings?.address_line2}
            </p>
            <p className="text-sm">{companySettings?.locality} - {companySettings?.pin_code}</p>
            <p className="text-sm font-medium">GSTIN: {companySettings?.gstin}</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">
                {language === 'english' ? 'Invoice Details' : 'இன்வாய்ஸ் விவரங்கள்'}
              </h4>
              <p><strong>{language === 'english' ? 'Invoice No:' : 'இன்வாய்ஸ் எண்:'}</strong> {sale.bill_serial_no}</p>
              <p><strong>{language === 'english' ? 'Date:' : 'தேதி:'}</strong> {new Date(sale.sale_date).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">
                {language === 'english' ? 'Customer Details' : 'வாடிக்கையாளர் விவரங்கள்'}
              </h4>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{getDisplayName(customer)}</p>
                {customer.contact_person && (
                  <p><strong>{language === 'english' ? 'Contact:' : 'தொடர்பு:'}</strong> {customer.contact_person}</p>
                )}
                {(customer.address_english || customer.address_tamil) && (
                  <p><strong>{language === 'english' ? 'Address:' : 'முகவரி:'}</strong> {language === 'english' ? customer.address_english : customer.address_tamil || customer.address_english}</p>
                )}
                {customer.pin_code && <p><strong>{language === 'english' ? 'PIN:' : 'பின்:'}</strong> {customer.pin_code}</p>}
                {customer.phone && <p><strong>{language === 'english' ? 'Phone:' : 'தொலைபேசி:'}</strong> {customer.phone}</p>}
                {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
                {customer.gstin && <p><strong>GSTIN:</strong> {customer.gstin}</p>}
                {customer.state_code && <p><strong>{language === 'english' ? 'State Code:' : 'மாநில குறியீடு:'}</strong> {customer.state_code}</p>}
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-left">HSN</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">GST %</th>
                  <th className="p-3 text-right">GST Amt</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {allSales.map((s, index) => {
                  const currentItem = allItems[index] || item;
                  const itemBase = s.quantity * s.rate;
                  const itemGst = itemBase * (currentItem.gst_percentage / 100);
                  const itemTotal = itemBase + itemGst;
                  return (
                    <tr key={s.id} className="border-t">
                      <td className="p-3">{getDisplayName(currentItem)}</td>
                      <td className="p-3">{currentItem.hsn_no}</td>
                      <td className="p-3 text-right">{s.quantity} {currentItem.unit}</td>
                      <td className="p-3 text-right">₹{s.rate.toFixed(2)}</td>
                      <td className="p-3 text-right">₹{itemBase.toFixed(2)}</td>
                      <td className="p-3 text-right">{currentItem.gst_percentage}%</td>
                      <td className="p-3 text-right">₹{itemGst.toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold">₹{itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* GST Breakdown */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">
              {language === 'english' ? 'Tax Breakdown' : 'வரி விவரங்கள்'}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>{language === 'english' ? 'Taxable Amount:' : 'வரிக்குரிய தொகை:'}</span>
                <span>₹{baseAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST ({(item.gst_percentage / 2)}%):</span>
                <span>₹{(gstAmount / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST ({(item.gst_percentage / 2)}%):</span>
                <span>₹{(gstAmount / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>{language === 'english' ? 'Total Amount:' : 'மொத்த தொகை:'}</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* E-Invoice & E-Way Bill Automated Section */}
          {(companySettings?.einvoice_enabled || companySettings?.ewaybill_enabled) && (
            <Card className="border border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  {language === 'english' ? 'E-Invoice & E-Way Bill Actions' : 'ஈ-இன்வாய்ஸ் & ஈ-வே பில் செயல்பாடுகள்'}
                  {companySettings?.einvoice_sandbox && (
                    <span className="text-xs bg-amber-500/20 text-amber-700 px-2 py-0.5 rounded font-normal">
                      Sandbox Mode
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status displays */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border p-3 rounded bg-background flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground">E-Invoice Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      {currentSale.einvoice_status === 'GENERATED' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-700 text-xs">GENERATED</span>
                        </>
                      ) : currentSale.einvoice_status === 'CANCELLED' ? (
                        <>
                          <Ban className="h-4 w-4 text-red-600" />
                          <span className="font-semibold text-red-700 text-xs">CANCELLED</span>
                        </>
                      ) : (
                        <span className="font-medium text-muted-foreground text-xs">NOT GENERATED</span>
                      )}
                    </div>
                  </div>

                  <div className="border p-3 rounded bg-background flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground">E-Way Bill Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      {currentSale.eway_bill_no && currentSale.eway_bill_status === 'GENERATED' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-700 text-xs truncate">
                            GENERATED ({currentSale.eway_bill_no})
                          </span>
                        </>
                      ) : currentSale.eway_bill_status === 'CANCELLED' ? (
                        <>
                          <Ban className="h-4 w-4 text-red-600" />
                          <span className="font-semibold text-red-700 text-xs">CANCELLED</span>
                        </>
                      ) : (
                        <span className="font-medium text-muted-foreground text-xs">NOT GENERATED</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Case 1: E-Invoice or E-Way Bill not generated yet */}
                {(!currentSale.irn && !currentSale.eway_bill_no) && (
                  <div className="space-y-4 border-t pt-3">
                    {companySettings.einvoice_enabled && companySettings.ewaybill_enabled && (
                      <div className="flex gap-4 p-2 border rounded bg-background">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-xs">
                          <input
                            type="radio"
                            name="ewb_generation_mode"
                            checked={!generateStandaloneEwb}
                            onChange={() => setGenerateStandaloneEwb(false)}
                            className="accent-primary"
                          />
                          E-Invoice + E-Way Bill (Combined)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-xs">
                          <input
                            type="radio"
                            name="ewb_generation_mode"
                            checked={generateStandaloneEwb}
                            onChange={() => setGenerateStandaloneEwb(true)}
                            className="accent-primary"
                          />
                          Standalone E-Way Bill Only
                        </label>
                      </div>
                    )}

                    {/* Combined Mode Controls */}
                    {!generateStandaloneEwb && companySettings.einvoice_enabled && (
                      <div className="flex items-center gap-3">
                        <input
                          id="include_ewb"
                          type="checkbox"
                          checked={includeEwayBill}
                          onChange={(e) => setIncludeEwayBill(e.target.checked)}
                          className="h-4 w-4 cursor-pointer accent-primary"
                        />
                        <Label htmlFor="include_ewb" className="cursor-pointer flex items-center gap-1.5 font-medium text-xs">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          Generate E-Way Bill along with E-Invoice
                        </Label>
                      </div>
                    )}

                    {/* Transport Details Section (shown if standalone EWB OR combined checked) */}
                    {(generateStandaloneEwb || (includeEwayBill && !generateStandaloneEwb)) && (
                      <div className="p-3 border rounded bg-background space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground">Transport & Vehicle Details</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="distance" className="text-xs">Distance (km)</Label>
                            <Input
                              id="distance"
                              type="number"
                              className="h-8 text-xs"
                              value={distance || ''}
                              onChange={(e) => setDistance(parseInt(e.target.value) || 0)}
                              placeholder="e.g. 150"
                            />
                            {companySettings?.einvoice_sandbox && (
                              <p className="text-[10px] text-amber-600 mt-1 leading-normal font-medium">
                                Sandbox: 605001 (Seller) ➔ {customer?.pin_code || '605201'} (Buyer). Enter ~15-25 km.
                              </p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="trans_id" className="text-xs">Transporter GSTIN</Label>
                            <Input
                              id="trans_id"
                              className="h-8 text-xs"
                              value={transporterId}
                              onChange={(e) => setTransporterId(e.target.value.toUpperCase())}
                              placeholder="29AWGPV..."
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="trans_name" className="text-xs">Transporter Name</Label>
                            <Input
                              id="trans_name"
                              className="h-8 text-xs"
                              value={transporterName}
                              onChange={(e) => setTransporterName(e.target.value)}
                              placeholder="XYZ Logistics"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="trans_doc_no" className="text-xs">LR / Doc No</Label>
                            <Input
                              id="trans_doc_no"
                              className="h-8 text-xs"
                              value={transDocNo}
                              onChange={(e) => setTransDocNo(e.target.value)}
                              placeholder="LR-1025"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="trans_doc_dt" className="text-xs">LR / Doc Date</Label>
                            <Input
                              id="trans_doc_dt"
                              type="date"
                              className="h-8 text-xs"
                              value={transDocDt}
                              onChange={(e) => setTransDocDt(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="trans_mode" className="text-xs">Mode</Label>
                            <select
                              id="trans_mode"
                              className="w-full h-8 text-xs px-2 border rounded bg-background"
                              value={transMode}
                              onChange={(e: any) => setTransMode(e.target.value)}
                            >
                              <option value="1">Road</option>
                              <option value="2">Rail</option>
                              <option value="3">Air</option>
                              <option value="4">Ship</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="veh_type" className="text-xs">Vehicle Type</Label>
                            <select
                              id="veh_type"
                              className="w-full h-8 text-xs px-2 border rounded bg-background"
                              value={vehType}
                              onChange={(e: any) => setVehType(e.target.value)}
                            >
                              <option value="R">Regular</option>
                              <option value="O">Over Dimensional</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {generateStandaloneEwb ? (
                      <Button 
                        onClick={handleGenerateStandaloneEWayBill} 
                        disabled={generating} 
                        className="w-full"
                      >
                        {generating ? 'Processing API Call...' : 'Generate Standalone E-Way Bill'}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleGenerateEInvoice} 
                        disabled={generating} 
                        className="w-full"
                      >
                        {generating ? 'Processing API Call...' : includeEwayBill ? 'Generate E-Invoice & E-Way Bill' : 'Generate E-Invoice'}
                      </Button>
                    )}
                  </div>
                )}

                {/* Case 2: E-Invoice generated but E-Way Bill missing */}
                {currentSale.irn && currentSale.einvoice_status === 'GENERATED' && !currentSale.eway_bill_no && (
                  <div className="space-y-4 border-t pt-3">
                    <div className="p-3 border rounded bg-background space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Generate E-Way Bill for Existing IRN
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="distance" className="text-xs">Distance (km)</Label>
                          <Input
                            id="distance"
                            type="number"
                            className="h-8 text-xs"
                            value={distance || ''}
                            onChange={(e) => setDistance(parseInt(e.target.value) || 0)}
                            placeholder="e.g. 150"
                          />
                          {companySettings?.einvoice_sandbox && (
                            <p className="text-[10px] text-amber-600 mt-1 leading-normal font-medium">
                              Sandbox: 605001 (Seller) ➔ {customer?.pin_code || '605201'} (Buyer). Enter ~15-25 km.
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="trans_id" className="text-xs">Transporter GSTIN</Label>
                          <Input
                            id="trans_id"
                            className="h-8 text-xs"
                            value={transporterId}
                            onChange={(e) => setTransporterId(e.target.value.toUpperCase())}
                            placeholder="29AWGPV..."
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="trans_name" className="text-xs">Transporter Name</Label>
                          <Input
                            id="trans_name"
                            className="h-8 text-xs"
                            value={transporterName}
                            onChange={(e) => setTransporterName(e.target.value)}
                            placeholder="XYZ Logistics"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="trans_doc_no" className="text-xs">LR / Doc No</Label>
                          <Input
                            id="trans_doc_no"
                            className="h-8 text-xs"
                            value={transDocNo}
                            onChange={(e) => setTransDocNo(e.target.value)}
                            placeholder="LR-1025"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="trans_doc_dt" className="text-xs">LR / Doc Date</Label>
                          <Input
                            id="trans_doc_dt"
                            type="date"
                            className="h-8 text-xs"
                            value={transDocDt}
                            onChange={(e) => setTransDocDt(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="trans_mode" className="text-xs">Mode</Label>
                          <select
                            id="trans_mode"
                            className="w-full h-8 text-xs px-2 border rounded bg-background"
                            value={transMode}
                            onChange={(e: any) => setTransMode(e.target.value)}
                          >
                            <option value="1">Road</option>
                            <option value="2">Rail</option>
                            <option value="3">Air</option>
                            <option value="4">Ship</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="veh_type" className="text-xs">Vehicle Type</Label>
                          <select
                            id="veh_type"
                            className="w-full h-8 text-xs px-2 border rounded bg-background"
                            value={vehType}
                            onChange={(e: any) => setVehType(e.target.value)}
                          >
                            <option value="R">Regular</option>
                            <option value="O">Over Dimensional</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={handleGenerateEWayBill} 
                      disabled={generating} 
                      variant="outline" 
                      className="w-full border-primary text-primary hover:bg-primary/10"
                    >
                      {generating ? 'Processing API Call...' : 'Generate E-Way Bill'}
                    </Button>
                  </div>
                )}

                {/* E-Way Bill Lifecycle Operations (Active Vehicle Update / Extension) */}
                {currentSale.eway_bill_no && currentSale.eway_bill_status === 'GENERATED' && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Truck className="h-4 w-4 text-primary" />
                      E-Way Bill Actions
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setNewVehicleNo(currentSale.lorry_no || '');
                          setVehUpdatePlace(companySettings.locality || '');
                          setVehUpdateState(parseInt(companySettings.state_code || '33', 10));
                          setVehUpdateReason('1');
                          setVehUpdateRemark('Due to Break down');
                          setShowVehicleUpdateDialog(true);
                        }}
                        disabled={generating}
                        variant="outline"
                        type="button"
                        className="flex-1 border-primary text-primary hover:bg-primary/5 flex items-center gap-1.5 justify-center h-9 text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Update Vehicle
                      </Button>
                      <Button
                        onClick={() => {
                          setExtVehicleNo(currentSale.lorry_no || '');
                          setExtPlace(companySettings.locality || '');
                          setExtState(parseInt(companySettings.state_code || '33', 10));
                          setExtPincode(companySettings.pin_code?.toString() || '');
                          setExtRemainingDistance(0);
                          setExtReasonCode(5);
                          setExtRemarks('Due to Break down');
                          setExtAddr1(companySettings.address_line1 || '');
                          setExtAddr2(companySettings.address_line2 || '');
                          setExtTransitType('R');
                          setExtConsignmentStatus('T');
                          setShowValidityExtensionDialog(true);
                        }}
                        disabled={generating}
                        variant="outline"
                        type="button"
                        className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50 flex items-center gap-1.5 justify-center h-9 text-xs"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Extend Validity
                      </Button>
                    </div>
                  </div>
                )}

                {/* Case 3: E-Invoice generated (Cancellation options) */}
                <div className="flex gap-2 pt-2 border-t">
                  {currentSale.irn && currentSale.einvoice_status === 'GENERATED' && (
                    <Button 
                      onClick={() => {
                        setCancelReason('2');
                        setCancelRemark('Data entry mistake');
                        setShowCancelIrnDialog(true);
                      }} 
                      disabled={generating} 
                      variant="destructive"
                      className="flex-1"
                    >
                      Cancel E-Invoice
                    </Button>
                  )}

                  {currentSale.eway_bill_no && currentSale.eway_bill_status === 'GENERATED' && (
                    <Button 
                      onClick={() => {
                        setCancelReason('3');
                        setCancelRemark('Data entry mistake');
                        setShowCancelEwbDialog(true);
                      }} 
                      disabled={generating} 
                      variant="destructive"
                      className="flex-1"
                    >
                      Cancel E-Way Bill
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handlePrintButtonClick} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {language === 'english' ? 'Print Invoice' : 'இன்வாய்ஸ் அச்சிடவும்'}
            </Button>
            <Button onClick={() => setShowIrnDialog(true)} variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              {language === 'english' ? 'Save IRN' : 'IRN சேமி'}
            </Button>
            <Button onClick={generateEInvoiceJSON} variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {language === 'english' ? 'Download E-Invoice JSON' : 'ஈ-இன்வாய்ஸ் JSON பதிவிறக்கவும்'}
            </Button>
            {currentSale.eway_bill_no && currentSale.eway_bill_status === 'GENERATED' && (
              <Button
                onClick={handlePrintEWayBill}
                disabled={printingEwb}
                variant="outline"
                className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <Printer className="h-4 w-4" />
                {printingEwb
                  ? (language === 'english' ? 'Preparing...' : 'தயாரிக்கிறது...')
                  : (language === 'english' ? 'Print E-Way Bill' : 'ஈ-வே பில் அச்சிடவும்')
                }
              </Button>
            )}
            {currentSale.eway_bill_no && currentSale.eway_bill_status === 'GENERATED' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={downloadingPdf}
                    variant="outline"
                    className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5"
                  >
                    <Download className="h-4 w-4" />
                    {downloadingPdf
                      ? (language === 'english' ? 'Downloading...' : 'பதிவிறக்கப்படுகிறது...')
                      : (language === 'english' ? 'Download EWB PDF' : 'ஈ-வே பில் PDF')
                    }
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {language === 'english' ? 'Select print format' : 'அச்சு வடிவம் தேர்வு'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDownloadEWayBillPDF('printewb')} className="cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    {language === 'english' ? 'Standard (printewb)' : 'நிலையான அச்சு'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadEWayBillPDF('printdetailewb')} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    {language === 'english' ? 'Detailed (printdetailewb)' : 'விரிவான அச்சு'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadEWayBillPDF('printcewb')} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    {language === 'english' ? 'Consolidated (printcewb)' : 'ஒருங்கிணைந்த அச்சு'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {currentSale.eway_bill_no && currentSale.eway_bill_status === 'GENERATED' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={downloadingOfficialPdf}
                    variant="outline"
                    className="flex items-center gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  >
                    <Download className="h-4 w-4 text-emerald-600" />
                    {downloadingOfficialPdf
                      ? (language === 'english' ? 'Downloading...' : 'பதிவிறக்கப்படுகிறது...')
                      : (language === 'english' ? 'Official EWB (API)' : 'அதிகாரப்பூர்வ ஈ-வே பில்')
                    }
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {language === 'english' ? 'Select official format' : 'அதிகாரப்பூர்வ வடிவம்'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDownloadOfficialEWayBillPDF('printewb')} className="cursor-pointer">
                    <Download className="h-4 w-4 mr-2 text-emerald-600" />
                    {language === 'english' ? 'Standard (printewb)' : 'நிலையான அச்சு'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadOfficialEWayBillPDF('printdetailewb')} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2 text-emerald-600" />
                    {language === 'english' ? 'Detailed (printdetailewb)' : 'விரிவான அச்சு'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadOfficialEWayBillPDF('printcewb')} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2 text-emerald-600" />
                    {language === 'english' ? 'Consolidated (printcewb)' : 'ஒருங்கிணைந்த அச்சு'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="outline" onClick={onClose}>
              {language === 'english' ? 'Close' : 'மூடு'}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* IRN Input Dialog */}
      <IrnInputDialog
        open={showIrnDialog}
        onOpenChange={setShowIrnDialog}
        saleId={currentSale.id}
        onIrnSaved={handleIrnSaved}
      />

      {/* Cancel IRN Dialog */}
      <Dialog open={showCancelIrnDialog} onOpenChange={setShowCancelIrnDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel E-Invoice (IRN)</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel E-Invoice for bill {currentSale.bill_serial_no}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="cancel_reason">Reason</Label>
              <select
                id="cancel_reason"
                className="w-full h-10 px-3 border rounded-md bg-background"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              >
                <option value="1">1 - Duplicate</option>
                <option value="2">2 - Data Entry Mistake</option>
                <option value="3">3 - Order Cancelled</option>
                <option value="4">4 - Others</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cancel_remark">Remarks</Label>
              <Input
                id="cancel_remark"
                value={cancelRemark}
                onChange={(e) => setCancelRemark(e.target.value)}
                placeholder="Enter cancellation remarks..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelIrnDialog(false)} disabled={generating}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancelEInvoice} disabled={generating || !cancelRemark.trim()}>
              {generating ? 'Cancelling...' : 'Confirm Cancel E-Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel E-Way Bill Dialog */}
      <Dialog open={showCancelEwbDialog} onOpenChange={(open) => {
        if (!open) {
          // Reset fields when dialog is closed/cancelled
          setEwbCancelReason('2');
          setEwbCancelRemark('Order cancelled');
        }
        setShowCancelEwbDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel E-Way Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel E-Way Bill {currentSale.eway_bill_no}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="cancel_ewb_reason">Reason</Label>
              <select
                id="cancel_ewb_reason"
                className="w-full h-10 px-3 border rounded-md bg-background"
                value={ewbCancelReason}
                onChange={(e) => setEwbCancelReason(e.target.value)}
              >
                <option value="1">1 - Duplicate</option>
                <option value="2">2 - Order Cancelled</option>
                <option value="3">3 - Data Entry Mistake</option>
                <option value="4">4 - Others</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cancel_ewb_remark">Remarks <span className="text-muted-foreground text-xs">({ewbCancelRemark.length}/50)</span></Label>
              <Input
                id="cancel_ewb_remark"
                value={ewbCancelRemark}
                onChange={(e) => setEwbCancelRemark(e.target.value.slice(0, 50))}
                placeholder="Enter cancellation remarks..."
                maxLength={50}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelEwbDialog(false)} disabled={generating}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancelEWayBill} disabled={generating || !ewbCancelRemark.trim()}>
              {generating ? 'Cancelling...' : 'Confirm Cancel E-Way Bill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Vehicle Dialog */}
      <Dialog open={showVehicleUpdateDialog} onOpenChange={setShowVehicleUpdateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update E-Way Bill Vehicle</DialogTitle>
            <DialogDescription>
              Update active vehicle details for E-Way Bill {currentSale.eway_bill_no}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="new_veh_no" className="text-xs">New Vehicle Number</Label>
              <Input
                id="new_veh_no"
                value={newVehicleNo}
                onChange={(e) => setNewVehicleNo(e.target.value.toUpperCase())}
                placeholder="e.g. KA01XX1234"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="veh_upd_place" className="text-xs">From Place</Label>
              <Input
                id="veh_upd_place"
                value={vehUpdatePlace}
                onChange={(e) => setVehUpdatePlace(e.target.value)}
                placeholder="Place where vehicle is updated"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="veh_upd_state" className="text-xs">From State</Label>
              <select
                id="veh_upd_state"
                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                value={vehUpdateState}
                onChange={(e) => setVehUpdateState(parseInt(e.target.value, 10))}
              >
                <option value="33">Tamil Nadu (33)</option>
                <option value="29">Karnataka (29)</option>
                <option value="37">Andhra Pradesh (37)</option>
                <option value="32">Kerala (32)</option>
                <option value="09">Uttar Pradesh (09)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="veh_upd_reason" className="text-xs">Reason Code</Label>
              <select
                id="veh_upd_reason"
                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                value={vehUpdateReason}
                onChange={(e) => setVehUpdateReason(e.target.value)}
              >
                <option value="1">1 - Transshipment</option>
                <option value="2">2 - Due to Break down</option>
                <option value="3">3 - Incident/Accident</option>
                <option value="4">4 - First Time</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="veh_upd_remark" className="text-xs">Remarks</Label>
              <Input
                id="veh_upd_remark"
                value={vehUpdateRemark}
                onChange={(e) => setVehUpdateRemark(e.target.value)}
                placeholder="Remarks..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowVehicleUpdateDialog(false)} disabled={generating}>
              Cancel
            </Button>
            <Button onClick={handleUpdateVehicle} disabled={generating || !newVehicleNo || !vehUpdatePlace}>
              {generating ? 'Updating...' : 'Update Vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Validity Dialog */}
      <Dialog open={showValidityExtensionDialog} onOpenChange={setShowValidityExtensionDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Extend E-Way Bill Validity</DialogTitle>
            <DialogDescription>
              Extend the validity of E-Way Bill {currentSale.eway_bill_no} if it is delayed in transit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="ext_veh_no" className="text-xs">Current/New Vehicle No</Label>
              <Input
                id="ext_veh_no"
                value={extVehicleNo}
                onChange={(e) => setExtVehicleNo(e.target.value.toUpperCase())}
                placeholder="e.g. KA01XX1234"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ext_place" className="text-xs">From Place</Label>
              <Input
                id="ext_place"
                value={extPlace}
                onChange={(e) => setExtPlace(e.target.value)}
                placeholder="Place where vehicle is delayed"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ext_state" className="text-xs">From State</Label>
              <select
                id="ext_state"
                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                value={extState}
                onChange={(e) => setExtState(parseInt(e.target.value, 10))}
              >
                <option value="33">Tamil Nadu (33)</option>
                <option value="29">Karnataka (29)</option>
                <option value="37">Andhra Pradesh (37)</option>
                <option value="32">Kerala (32)</option>
                <option value="09">Uttar Pradesh (09)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ext_pincode" className="text-xs">From Pincode</Label>
              <Input
                id="ext_pincode"
                value={extPincode}
                onChange={(e) => setExtPincode(e.target.value)}
                placeholder="e.g. 560001"
                maxLength={6}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ext_distance" className="text-xs">Remaining Distance (km)</Label>
              <Input
                id="ext_distance"
                type="number"
                value={extRemainingDistance || ''}
                onChange={(e) => setExtRemainingDistance(parseInt(e.target.value, 10) || 0)}
                placeholder="e.g. 50"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ext_reason" className="text-xs">Extension Reason</Label>
              <select
                id="ext_reason"
                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                value={extReasonCode}
                onChange={(e) => setExtReasonCode(parseInt(e.target.value, 10))}
              >
                <option value={1}>1 - Natural Calamity</option>
                <option value={2}>2 - Law & Order Situation</option>
                <option value={3}>3 - Transshipment</option>
                <option value={4}>4 - Accident</option>
                <option value={5}>5 - Due to Break down</option>
                <option value={99}>99 - Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ext_cons_status" className="text-xs">Consignment Status</Label>
              <select
                id="ext_cons_status"
                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                value={extConsignmentStatus}
                onChange={(e: any) => setExtConsignmentStatus(e.target.value)}
              >
                <option value="M">In Movement</option>
                <option value="T">In Transit (Storage)</option>
              </select>
            </div>
            {/* Goods Status: M = In Movement, T = In Transit/Storage */}
            <div className="space-y-1">
              <Label htmlFor="ext_cons_status" className="text-xs font-medium">Goods Status (Consignment Status)</Label>
              <select
                id="ext_cons_status"
                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                value={extConsignmentStatus}
                onChange={(e: any) => setExtConsignmentStatus(e.target.value)}
              >
                <option value="M">M – In Movement (on the road)</option>
                <option value="T">T – In Transit/Storage (warehouse)</option>
              </select>
            </div>
            {/* Storage-specific fields: only when consignmentStatus = 'T' */}
            {extConsignmentStatus === 'T' && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="ext_transit_type" className="text-xs">Transit Type</Label>
                  <select
                    id="ext_transit_type"
                    className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                    value={extTransitType}
                    onChange={(e: any) => setExtTransitType(e.target.value)}
                  >
                    <option value="R">Road</option>
                    <option value="W">Warehouse</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="ext_addr1" className="text-xs">Storage Location Address Line 1 <span className="text-destructive">*</span></Label>
                  <Input
                    id="ext_addr1"
                    value={extAddr1}
                    onChange={(e) => setExtAddr1(e.target.value)}
                    placeholder="Storage/transit location address line 1"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="ext_addr2" className="text-xs">Address Line 2 (Optional)</Label>
                  <Input
                    id="ext_addr2"
                    value={extAddr2}
                    onChange={(e) => setExtAddr2(e.target.value)}
                    placeholder="Address line 2"
                  />
                </div>
              </>
            )}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="ext_remarks" className="text-xs">Extension Remarks</Label>
              <Input
                id="ext_remarks"
                value={extRemarks}
                onChange={(e) => setExtRemarks(e.target.value)}
                placeholder="Reason details..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowValidityExtensionDialog(false)} disabled={generating}>
              Cancel
            </Button>
            <Button onClick={handleExtendValidity} disabled={generating || !extVehicleNo || !extPlace || !extPincode || !extRemainingDistance || (extConsignmentStatus === 'T' && !extAddr1)}>
              {generating ? 'Processing...' : 'Extend Validity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};