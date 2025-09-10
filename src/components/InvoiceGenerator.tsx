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
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 11px; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; align-items: center; border: 2px solid #000; padding: 15px; margin-bottom: 0; }
            .logo { width: 80px; height: 80px; margin-right: 15px; }
            .company-info { flex: 1; }
            .company-name { font-size: 20px; font-weight: bold; color: #d4a574; margin-bottom: 5px; }
            .company-details { font-size: 10px; line-height: 1.2; }
            .invoice-details { display: flex; justify-content: space-between; border-left: 2px solid #000; border-right: 2px solid #000; padding: 10px; margin-bottom: 0; }
            .invoice-info, .transport-info { font-size: 10px; }
            .customer-section { border: 2px solid #000; border-top: none; padding: 15px; margin-bottom: 0; }
            .customer-row { display: flex; margin-bottom: 8px; }
            .customer-label { width: 100px; font-weight: bold; font-size: 10px; }
            .customer-value { flex: 1; font-size: 11px; }
            .table { width: 100%; border-collapse: collapse; border: 2px solid #000; border-top: none; }
            .table th, .table td { border: 1px solid #000; padding: 6px; text-align: center; font-size: 10px; }
            .table th { background-color: #f0f0f0; font-weight: bold; }
            .table .desc-col { text-align: left; }
            .amount-section { border: 2px solid #000; border-top: none; padding: 10px; }
            .amount-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 10px; }
            .amount-words { margin: 15px 0; font-size: 10px; }
            .bank-details { margin-top: 20px; border: 1px solid #000; padding: 10px; font-size: 10px; }
            .signature-section { margin-top: 30px; text-align: right; font-size: 10px; }
            .total-row { border-top: 1px solid #000; margin-top: 5px; padding-top: 5px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <img src="/lovable-uploads/8ef45f84-cd7a-4909-9f31-86a578d28f2f.png" alt="GRM Logo" class="logo" />
              <div class="company-info">
                <div class="company-name">${companyDetails.name}</div>
                <div class="company-details">
                  ${companyDetails.address}<br>
                  Phone: 9790404001, 9444066558<br>
                  GSTIN/UIN: ${companyDetails.gstin}<br>
                  State Name: Tamil Nadu, Code: 33
                </div>
              </div>
            </div>

            <div class="invoice-details">
              <div class="invoice-info">
                <div><strong>Invoice No.</strong></div>
                <div>${sale.bill_serial_no}</div>
                <div style="margin-top: 10px;"><strong>Dated</strong></div>
                <div>${new Date().toLocaleDateString('en-IN')}</div>
              </div>
              <div class="transport-info">
                <div><strong>Motor Vehicle No.</strong></div>
                <div>${outwardEntry.lorry_no}</div>
              </div>
            </div>

            <div class="customer-section">
              <div style="display: flex;">
                <div style="flex: 1; margin-right: 20px;">
                  <div style="font-weight: bold; margin-bottom: 10px;">Consignee (Ship to)</div>
                  <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">${getDisplayName(customer)}</div>
                  ${customer.address_english || customer.address_tamil ? `<div style="margin-bottom: 5px;">${customer.address_english || customer.address_tamil}</div>` : ''}
                  ${customer.phone ? `<div style="margin-bottom: 5px;">Phone: ${customer.phone}</div>` : ''}
                  ${customer.gstin ? `<div>GSTIN/UIN: ${customer.gstin}</div>` : ''}
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: bold; margin-bottom: 10px;">Buyer (Bill to)</div>
                  <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">${getDisplayName(customer)}</div>
                  ${customer.address_english || customer.address_tamil ? `<div style="margin-bottom: 5px;">${customer.address_english || customer.address_tamil}</div>` : ''}
                  ${customer.phone ? `<div style="margin-bottom: 5px;">Phone: ${customer.phone}</div>` : ''}
                  ${customer.gstin ? `<div>GSTIN/UIN: ${customer.gstin}</div>` : ''}
                </div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th style="width: 5%;">Sl<br>No.</th>
                  <th style="width: 25%;">Description of Goods</th>
                  <th style="width: 10%;">HSN/SAC</th>
                  <th style="width: 8%;">GST<br>Rate</th>
                  <th style="width: 12%;">Quantity</th>
                  <th style="width: 10%;">Rate</th>
                  <th style="width: 8%;">per</th>
                  <th style="width: 12%;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td class="desc-col">${getDisplayName(item)}</td>
                  <td>${item.hsn_no}</td>
                  <td>${item.gst_percentage}%</td>
                  <td>${sale.quantity} ${item.unit}</td>
                  <td>₹${sale.rate.toFixed(2)}</td>
                  <td>${item.unit}</td>
                  <td>₹${baseAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="4" style="text-align: right; font-weight: bold;">Total</td>
                  <td style="font-weight: bold;">${sale.quantity} ${item.unit}</td>
                  <td></td>
                  <td></td>
                  <td style="font-weight: bold;">₹ ${baseAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="amount-section">
              <div class="amount-words">
                <strong>Amount Chargeable (in words):</strong><br>
                <strong>${convertNumberToWords(totalAmount)} Only</strong>
              </div>
              
              <div style="display: flex;">
                <div style="flex: 1;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                    <tr>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">HSN/SAC</td>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Taxable<br>Value</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${item.hsn_no}</td>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center;">₹${baseAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Total</td>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">₹${baseAmount.toFixed(2)}</td>
                    </tr>
                  </table>
                </div>
                <div style="flex: 1; margin-left: 20px;">
                  <div class="amount-row">
                    <span>Taxable Amount:</span>
                    <span>₹${baseAmount.toFixed(2)}</span>
                  </div>
                  ${item.gst_percentage > 0 ? `
                  <div class="amount-row">
                    <span>CGST ${(item.gst_percentage / 2)}%:</span>
                    <span>₹${(gstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div class="amount-row">
                    <span>SGST ${(item.gst_percentage / 2)}%:</span>
                    <span>₹${(gstAmount / 2).toFixed(2)}</span>
                  </div>
                  ` : '<div class="amount-row"><span>Tax Amount:</span><span>NIL</span></div>'}
                  <div class="amount-row total-row">
                    <span><strong>Total:</strong></span>
                    <span><strong>₹${totalAmount.toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>

              <div class="bank-details">
                <strong>Company's Bank Details</strong><br>
                Bank Name: ICICI BANK<br>
                A/c No.: 305105000641<br>
                Branch: ANANTHAPURAM<br>
                IFSC Code: ICIC0003051
              </div>
            </div>

            <div class="signature-section">
              <div>for ${companyDetails.name}</div>
              <div style="margin-top: 50px;">Authorised Signatory</div>
            </div>
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
                <p className="text-lg font-semibold">{getDisplayName(customer)}</p>
                {(customer.address_english || customer.address_tamil) && (
                  <p>{customer.address_english || customer.address_tamil}</p>
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