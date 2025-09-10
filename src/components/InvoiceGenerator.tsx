import { Sale, OutwardEntry, Customer, Item } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, FileText } from 'lucide-react';

interface InvoiceGeneratorProps {
  sale: Sale;
  outwardEntry: OutwardEntry;
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

  const getCompanyDetails = (loadingPlace: string): CompanyDetails => {
    if (loadingPlace === 'PULIVANTHI') {
      return {
        name: 'GOVINDAN RICE MILL',
        address: '6/175 GINGEE MAIN ROAD, GINGEE TALUK, VILLUPURAM DISTRICT, PIN CODE: 605201',
        gstin: '33AALFG0221E1Z3'
      };
    } else {
      return {
        name: 'GOVINDAN RICE MILL',
        address: 'S.NO 58, SE. KUNNATHUR ROAD, MATTAPARAI VILLAGE, GINGEE TALUK, VILLUPURAM DISTRICT, PIN CODE: 605201',
        gstin: '33AALFG0221E1Z3'
      };
    }
  };

  const companyDetails = getCompanyDetails(outwardEntry.loading_place);
  const baseAmount = sale.quantity * sale.rate;
  const gstAmount = baseAmount * (item.gst_percentage / 100);
  const totalAmount = baseAmount + gstAmount;

  const generateEInvoiceJSON = () => {
    const eInvoiceData = {
      Version: "1.1",
      TranDtls: {
        TaxSch: "GST",
        SupTyp: "B2B",
        RegRev: "N",
        EcmGstin: null,
        IgstOnIntra: "N"
      },
      DocDtls: {
        Typ: "INV",
        No: sale.bill_serial_no,
        Dt: new Date().toISOString().split('T')[0].split('-').reverse().join('/')
      },
      SellerDtls: {
        Gstin: companyDetails.gstin,
        LglNm: companyDetails.name,
        TrdNm: companyDetails.name,
        Addr1: companyDetails.address.split(',')[0],
        Addr2: companyDetails.address.split(',').slice(1, -2).join(','),
        Loc: "VILLUPURAM",
        Pin: 605201,
        Stcd: "33",
        Ph: null,
        Em: null
      },
      BuyerDtls: {
        Gstin: customer.gstin || null,
        LglNm: getDisplayName(customer),
        TrdNm: getDisplayName(customer),
        Pos: "33",
        Addr1: customer.address_english || customer.address_tamil || "Customer Address",
        Addr2: null,
        Loc: "VILLUPURAM",
        Pin: 605201,
        Stcd: "33",
        Ph: customer.phone || null,
        Em: customer.email || null
      },
      ItemList: [
        {
          SlNo: "1",
          PrdDesc: getDisplayName(item),
          IsServc: "N",
          HsnCd: item.hsn_no,
          Barcde: null,
          Qty: sale.quantity,
          FreeQty: 0,
          Unit: item.unit,
          UnitPrice: sale.rate,
          TotAmt: baseAmount,
          Discount: 0,
          PreTaxVal: baseAmount,
          AssAmt: baseAmount,
          GstRt: item.gst_percentage,
          IgstAmt: 0,
          CgstAmt: gstAmount / 2,
          SgstAmt: gstAmount / 2,
          CesRt: 0,
          CesAmt: 0,
          CesNonAdvlAmt: 0,
          StateCesRt: 0,
          StateCesAmt: 0,
          StateCesNonAdvlAmt: 0,
          OthChrg: 0,
          TotItemVal: totalAmount
        }
      ],
      ValDtls: {
        AssVal: baseAmount,
        CgstVal: gstAmount / 2,
        SgstVal: gstAmount / 2,
        IgstVal: 0,
        CesVal: 0,
        StCesVal: 0,
        Discount: 0,
        OthChrg: 0,
        RndOffAmt: 0,
        TotInvVal: totalAmount,
        TotInvValFc: totalAmount
      },
      PayDtls: {
        Nm: null,
        Accdet: null,
        Mode: null,
        Fininsbr: null,
        Payterm: null,
        Payinstr: null,
        Crtrn: null,
        Dirdr: null,
        Crday: null,
        Paidamt: 0,
        Paymtdue: totalAmount
      },
      RefDtls: {
        InvRm: `Sale of ${getDisplayName(item)} - Lorry No: ${outwardEntry.lorry_no}`,
        DocPerdDtls: {
          InvStDt: new Date().toISOString().split('T')[0].split('-').reverse().join('/'),
          InvEndDt: new Date().toISOString().split('T')[0].split('-').reverse().join('/')
        },
        PrecDocDtls: [],
        ContrDtls: []
      }
    };

    const blob = new Blob([JSON.stringify(eInvoiceData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `einvoice_${sale.bill_serial_no}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tax Invoice - ${sale.bill_serial_no}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .invoice-title { font-size: 16px; font-weight: bold; margin: 10px 0; }
            .details-section { margin: 15px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .table th { background-color: #f5f5f5; font-weight: bold; }
            .total-section { margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; }
            .amount { text-align: right; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${companyDetails.name}</div>
            <div>${companyDetails.address}</div>
            <div>GSTIN: ${companyDetails.gstin}</div>
            <div class="invoice-title">TAX INVOICE</div>
          </div>
          
          <div class="details-section">
            <div class="row">
              <div><strong>Invoice No:</strong> ${sale.bill_serial_no}</div>
              <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
            </div>
            <div class="row">
              <div><strong>Customer:</strong> ${getDisplayName(customer)}</div>
              <div><strong>Lorry No:</strong> ${outwardEntry.lorry_no}</div>
            </div>
            ${customer.address_english || customer.address_tamil ? `<div class="row"><div><strong>Address:</strong> ${customer.address_english || customer.address_tamil}</div></div>` : ''}
            ${customer.phone ? `<div class="row"><div><strong>Phone:</strong> ${customer.phone}</div></div>` : ''}
            ${customer.gstin ? `<div class="row"><div><strong>Customer GSTIN:</strong> ${customer.gstin}</div></div>` : ''}
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Description</th>
                <th>HSN/SAC</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>GST %</th>
                <th>GST Amount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>${getDisplayName(item)}</td>
                <td>${item.hsn_no}</td>
                <td class="amount">${sale.quantity}</td>
                <td>${item.unit}</td>
                <td class="amount">₹${sale.rate.toFixed(2)}</td>
                <td class="amount">₹${baseAmount.toFixed(2)}</td>
                <td class="amount">${item.gst_percentage}%</td>
                <td class="amount">₹${gstAmount.toFixed(2)}</td>
                <td class="amount">₹${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <div class="row">
              <div><strong>Taxable Amount:</strong></div>
              <div class="amount bold">₹${baseAmount.toFixed(2)}</div>
            </div>
            <div class="row">
              <div><strong>CGST (${(item.gst_percentage / 2)}%):</strong></div>
              <div class="amount">₹${(gstAmount / 2).toFixed(2)}</div>
            </div>
            <div class="row">
              <div><strong>SGST (${(item.gst_percentage / 2)}%):</strong></div>
              <div class="amount">₹${(gstAmount / 2).toFixed(2)}</div>
            </div>
            <div class="row" style="border-top: 1px solid #000; padding-top: 5px; margin-top: 10px;">
              <div><strong>Total Amount:</strong></div>
              <div class="amount bold">₹${totalAmount.toFixed(2)}</div>
            </div>
          </div>

          <div style="margin-top: 30px;">
            <div><strong>Amount in Words:</strong> ${convertNumberToWords(totalAmount)} Only</div>
          </div>

          <div style="margin-top: 40px; text-align: right;">
            <div>For ${companyDetails.name}</div>
            <div style="margin-top: 50px;">Authorized Signatory</div>
          </div>
        </body>
        </html>
      `);
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
            <h3 className="font-semibold text-lg mb-2">{companyDetails.name}</h3>
            <p className="text-sm">{companyDetails.address}</p>
            <p className="text-sm font-medium">GSTIN: {companyDetails.gstin}</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">
                {language === 'english' ? 'Invoice Details' : 'இன்வாய்ஸ் விவரங்கள்'}
              </h4>
              <p><strong>{language === 'english' ? 'Invoice No:' : 'இன்வாய்ஸ் எண்:'}</strong> {sale.bill_serial_no}</p>
              <p><strong>{language === 'english' ? 'Date:' : 'தேதி:'}</strong> {new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">
                {language === 'english' ? 'Customer Details' : 'வாடிக்கையாளர் விவரங்கள்'}
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>{language === 'english' ? 'Name:' : 'பெயர்:'}</strong> {getDisplayName(customer)}</p>
                {(customer.address_english || customer.address_tamil) && (
                  <p><strong>{language === 'english' ? 'Address:' : 'முகவரி:'}</strong> {customer.address_english || customer.address_tamil}</p>
                )}
                {customer.phone && <p><strong>{language === 'english' ? 'Phone:' : 'தொலைபேசி:'}</strong> {customer.phone}</p>}
                {customer.gstin && <p><strong>GSTIN:</strong> {customer.gstin}</p>}
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
                <tr className="border-t">
                  <td className="p-3">{getDisplayName(item)}</td>
                  <td className="p-3">{item.hsn_no}</td>
                  <td className="p-3 text-right">{sale.quantity} {item.unit}</td>
                  <td className="p-3 text-right">₹{sale.rate.toFixed(2)}</td>
                  <td className="p-3 text-right">₹{baseAmount.toFixed(2)}</td>
                  <td className="p-3 text-right">{item.gst_percentage}%</td>
                  <td className="p-3 text-right">₹{gstAmount.toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold">₹{totalAmount.toFixed(2)}</td>
                </tr>
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

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={printInvoice} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {language === 'english' ? 'Print Invoice' : 'இன்வாய்ஸ் அச்சிடவும்'}
            </Button>
            <Button onClick={generateEInvoiceJSON} variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {language === 'english' ? 'Download E-Invoice JSON' : 'ஈ-இன்வாய்ஸ் JSON பதிவிறக்கவும்'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {language === 'english' ? 'Close' : 'மூடு'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};