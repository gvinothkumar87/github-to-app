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
            body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 9px; }
            .invoice-container { max-width: 210mm; margin: 0 auto; border: 2px solid #000; }
            
            .header { display: flex; border-bottom: 1px solid #000; }
            .logo-section { width: 80px; padding: 10px; border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; }
            .logo { width: 60px; height: 60px; }
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
            .amount-words { padding: 8px; border-bottom: 1px solid #000; font-size: 8px; }
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
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNnui8sowAAABjGlDQ1BJQ0MgUHJvZmlsZQAAKM+VkT1Iw0AcxV9TpSIVBzuIOGSoThZERRy1CkWoEGqFVh1MLv2CJg1Jiouj4Fpw8GOx6uDirKuDqyAIfoA4OjkpukiJ/0sKLWI8OO7Hu3uPu3eAUC8zzeoYBzTdNlOJuJjJroqhVwQQRgiDGJWZZcxJUhK+4+seAb7exXiW/7k/R6+as2JAQCQ+YcY0m3iDeHrTNjjvE4dZUVaJz4nHTLog8SPXFY/fOBdcFnhm2Eyn5onDxGKhg5UOZkVTI54ijqqaTvlCxmOV8xZnrVxlzXvyFwZz+soy12kOI4FFLEGCCAVVlFCGjRitOikWUrQf9/APOf4kuWRylcDIsYAKNEiOH/wPfndrFiYnvKRQHOh8cZyPESC0CzRqjvN97DiNE8D/DFzpLX+lDsx8kl5radEjYGAbOL9uafIecLkDDD3pkiE5kp+mkM8D72f0TVlg4BboXfN6a+3j9AFIU1fJG+DgEBgtUPa6x7u72737t6c5vx8lJXKwRg+l7QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+gKCwohMa8sKRYAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAtklEQVR42u3BMQ0AAAwCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8DCAaQABGgGpf0QAAAAASUVORK5CYII=" alt="GRM Logo" class="logo" />
              </div>
              <div class="company-section">
                <div class="company-name">${companyDetails.name}</div>
                <div class="company-address">
                  ${companyDetails.address.split(',').slice(0, 2).join(',')}<br>
                  ${companyDetails.address.split(',').slice(2).join(',')}<br>
                  Phone: 9790404001, 9444066558<br>
                  GSTIN/UIN: ${companyDetails.gstin} &nbsp;&nbsp;&nbsp; State Name: Tamil Nadu, Code: 33
                </div>
              </div>
              <div class="invoice-info-section">
                <div style="padding: 8px; border-bottom: 1px solid #000;">
                  <div style="font-weight: bold; font-size: 8px;">Invoice No.</div>
                  <div style="font-size: 9px; margin-top: 2px;">${sale.bill_serial_no}</div>
                </div>
                <div style="padding: 8px; border-bottom: 1px solid #000;">
                  <div style="font-weight: bold; font-size: 8px;">Dated</div>
                  <div style="font-size: 9px; margin-top: 2px;">${new Date().toLocaleDateString('en-IN')}</div>
                </div>
                <div style="padding: 8px;">
                  <div style="font-weight: bold; font-size: 8px;">Motor Vehicle No.</div>
                  <div style="font-size: 9px; margin-top: 2px;">${outwardEntry.lorry_no}</div>
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
              <div class="amount-words">
                <strong>Amount Chargeable (in words)</strong><br>
                <span class="amount-words-bold">${convertNumberToWords(totalAmount)} Only</span>
              </div>
              
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
              
              <div class="bank-signature">
                <div class="bank-details">
                  <strong style="font-size: 9px;">Bank Details</strong><br>
                  <span style="font-size: 9px;">Bank Name: ICICI</span><br>
                  <span style="font-size: 9px;">A/c No.: 305105000641</span><br>
                  <span style="font-size: 9px;">Branch: ANANTHAPURAM</span><br>
                  <span style="font-size: 9px;">IFSC: ICIC0003051</span>
                </div>
                <div class="signature-area">
                  <div style="margin-bottom: 40px;">for ${companyDetails.name}</div>
                  <div style="border-top: 1px solid #000; padding-top: 5px;">Authorised Signatory</div>
                </div>
              </div>
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