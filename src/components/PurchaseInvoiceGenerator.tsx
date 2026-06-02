import { Purchase, InwardEntry, Supplier, Item } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface PurchaseInvoiceGeneratorProps {
  purchase: Purchase;
  inwardEntry?: InwardEntry | null;
  supplier: Supplier;
  item: Item;
  onClose: () => void;
}

interface CompanyDetails {
  name: string;
  address: string;
  gstin: string;
}

export const PurchaseInvoiceGenerator = ({ purchase, inwardEntry, supplier, item, onClose }: PurchaseInvoiceGeneratorProps) => {
  const { language, getDisplayName } = useLanguage();
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([purchase]);
  const [allItems, setAllItems] = useState<Item[]>([item]);

  useEffect(() => {
    const fetchAllPurchasesForBill = async () => {
      if (purchase.bill_serial_no) {
        try {
          const { data, error } = await supabase
            .from('purchases')
            .select(`
              *,
              items(*)
            `)
            .eq('bill_serial_no', purchase.bill_serial_no)
            .order('created_at');

          if (error) throw error;

          if (data && data.length > 1) {
            setAllPurchases(data);
            setAllItems(data.map((s: any) => s.items).filter(Boolean));
          }
        } catch (error) {
          console.error('Error fetching all purchases:', error);
        }
      }
    };

    fetchAllPurchasesForBill();
  }, [purchase.bill_serial_no]);

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const loadingPlace = purchase.mill || 'PULIVANTHI';
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .eq('location_code', loadingPlace)
          .eq('is_active', true)
          .single();

        if (!error && data) {
          setCompanySettings(data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchCompanySettings();
  }, [purchase.mill]);

  const handlePrintButtonClick = () => {
    printInvoice();
  };

  const calculateTotals = () => {
    return allPurchases.reduce((acc, p, index) => {
      const currentItem = allItems[index] || item;
      const base = p.quantity * p.rate;
      const gst = base * (currentItem.gst_percentage / 100);
      return {
        baseAmount: acc.baseAmount + base,
        gstAmount: acc.gstAmount + gst,
        totalAmount: acc.totalAmount + base + gst,
        totalQuantity: acc.totalQuantity + p.quantity
      };
    }, { baseAmount: 0, gstAmount: 0, totalAmount: 0, totalQuantity: 0 });
  };

  const { baseAmount, gstAmount, totalAmount, totalQuantity } = calculateTotals();

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const companyHtml = companySettings ? `
        <div class="company-name">${companySettings.company_name}</div>
        <div class="company-address">
          ${companySettings.address_line1}<br>
          ${companySettings.address_line2}, ${companySettings.locality} - ${companySettings.pin_code}<br>
          Phone: ${companySettings.phone}<br>
          GSTIN/UIN: ${companySettings.gstin} &nbsp;&nbsp;&nbsp; State Name: Tamil Nadu, Code: ${companySettings.state_code}
        </div>
      ` : `
        <div style="font-weight: bold;">GOVINDAN RICE MILL</div>
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Purchase Bill - ${purchase.bill_serial_no || 'N/A'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 9px; }
            .invoice-container { max-width: 210mm; margin: 0 auto; border: 2px solid #000; }
            
            .header { display: flex; border-bottom: 1px solid #000; }
            .company-section { flex: 1; padding: 10px; text-align: center; }
            .company-name { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
            .company-address { font-size: 8px; margin-bottom: 2px; line-height: 1.2; }
            .invoice-info-section { width: 200px; border-left: 1px solid #000; }
            
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
            
            .total-section { padding: 8px; }
            .total-row { display: flex; justify-content: flex-end; margin-bottom: 2px; font-size: 10px; }
            .total-row span { width: 100px; text-align: right; }
            .total-final { border-top: 1px solid #000; margin-top: 5px; padding-top: 3px; font-weight: bold; }
            
            @media print {
              body { margin: 0; }
              .invoice-container { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-section">
                ${companyHtml}
              </div>
              <div class="invoice-info-section">
                <div style="padding: 8px; border-bottom: 1px solid #000;">
                  <div style="font-weight: bold; font-size: 8px;">Bill No.</div>
                  <div style="font-size: 9px; margin-top: 2px;">${purchase.bill_serial_no || 'N/A'}</div>
                </div>
                <div style="padding: 8px; border-bottom: 1px solid #000;">
                  <div style="font-weight: bold; font-size: 8px;">Dated</div>
                  <div style="font-size: 9px; margin-top: 2px;">${new Date(purchase.purchase_date).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
            </div>

            <div class="consignee-section">
              <div class="consignee-left">
                <div class="section-title">Supplier (Billed from)</div>
                <div class="customer-name">${getDisplayName(supplier)}</div>
                <div class="customer-details">
                  ${supplier.address_english || supplier.address_tamil || ''}<br>
                  ${supplier.pin_code ? `PIN: ${supplier.pin_code}<br>` : ''}
                  ${supplier.phone ? `Phone: ${supplier.phone}<br>` : ''}
                  ${supplier.gstin ? `GSTIN/UIN: ${supplier.gstin}<br>` : ''}
                </div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 4%;">Sl<br>No.</th>
                  <th style="width: 30%;">Description of Goods</th>
                  <th style="width: 10%;">HSN/SAC</th>
                  <th style="width: 15%;">Quantity</th>
                  <th style="width: 15%;">Rate</th>
                  <th style="width: 10%;">per</th>
                  <th style="width: 16%;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${allPurchases.map((p, index) => {
                  const currentItem = allItems[index] || item;
                  const baseAmt = p.quantity * p.rate;
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td class="desc-col">${getDisplayName(currentItem)}</td>
                      <td>${currentItem.hsn_no || ''}</td>
                      <td>${p.quantity} ${currentItem.unit}</td>
                      <td class="amount-col">₹${p.rate.toFixed(2)}</td>
                      <td>${currentItem.unit}</td>
                      <td class="amount-col">₹${baseAmt.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
                <tr style="background-color: #f9f9f9;">
                  <td colspan="3" style="text-align: right; font-weight: bold; padding-right: 10px;">Total</td>
                  <td style="font-weight: bold;">${totalQuantity.toFixed(2)} ${item.unit}</td>
                  <td></td>
                  <td></td>
                  <td class="amount-col" style="font-weight: bold;">₹ ${baseAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer-section">
              <div class="total-section">
                ${item.gst_percentage > 0 ? `
                <div class="total-row">
                  <span>Taxable Amount:</span>
                  <span>₹${baseAmount.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>CGST ${(item.gst_percentage / 2)}%:</span>
                  <span>₹${(gstAmount / 2).toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>SGST ${(item.gst_percentage / 2)}%:</span>
                  <span>₹${(gstAmount / 2).toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="total-row total-final">
                  <span>Total Amount:</span>
                  <span>₹${totalAmount.toFixed(2)}</span>
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {language === 'english' ? 'Purchase Bill Details' : 'கொள்முதல் பில் விவரங்கள்'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{companySettings?.company_name || "GOVINDAN RICE MILL"}</h3>
            <p className="text-sm">
              {companySettings?.address_line1}, {companySettings?.address_line2}
            </p>
            <p className="text-sm">{companySettings?.locality} - {companySettings?.pin_code}</p>
            <p className="text-sm font-medium">GSTIN: {companySettings?.gstin}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">
                {language === 'english' ? 'Bill Details' : 'பில் விவரங்கள்'}
              </h4>
              <p><strong>{language === 'english' ? 'Bill No:' : 'பில் எண்:'}</strong> {purchase.bill_serial_no || 'N/A'}</p>
              <p><strong>{language === 'english' ? 'Date:' : 'தேதி:'}</strong> {new Date(purchase.purchase_date).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">
                {language === 'english' ? 'Supplier Details' : 'சப்ளையர் விவரங்கள்'}
              </h4>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{getDisplayName(supplier)}</p>
                {(supplier.address_english || supplier.address_tamil) && (
                  <p><strong>{language === 'english' ? 'Address:' : 'முகவரி:'}</strong> {language === 'english' ? supplier.address_english : supplier.address_tamil || supplier.address_english}</p>
                )}
                {supplier.phone && <p><strong>{language === 'english' ? 'Phone:' : 'தொலைபேசி:'}</strong> {supplier.phone}</p>}
                {supplier.gstin && <p><strong>GSTIN:</strong> {supplier.gstin}</p>}
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">GST %</th>
                  <th className="p-3 text-right">GST Amt</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {allPurchases.map((p, index) => {
                  const currentItem = allItems[index] || item;
                  const itemBase = p.quantity * p.rate;
                  const itemGst = itemBase * (currentItem.gst_percentage / 100);
                  const itemTotal = itemBase + itemGst;
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">{getDisplayName(currentItem)}</td>
                      <td className="p-3 text-right">{p.quantity} {currentItem.unit}</td>
                      <td className="p-3 text-right">₹{p.rate.toFixed(2)}</td>
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

          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between font-semibold">
              <span>{language === 'english' ? 'Total Amount:' : 'மொத்த தொகை:'}</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handlePrintButtonClick} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {language === 'english' ? 'Print Bill' : 'பில் அச்சிடவும்'}
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
