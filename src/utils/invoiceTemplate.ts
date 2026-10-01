import { getEwayBillStyles, getEwayBillContentHtml } from './ewayBillTemplate';

export const generateInvoiceHtml = ({
  sale,
  allSales,
  allItems,
  item,
  customer,
  shipToAddress,
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
  ewbDetails,
  windowOrigin = window?.location?.origin || ''
}: any) => {
  const currentSale = sale; // Map sale to currentSale for the template
  const shipTo = shipToAddress ? {
    name: shipToAddress.name || shipToAddress.label || getDisplayName(customer),
    address: shipToAddress.address_english || shipToAddress.address_tamil || customer.address_english || customer.address_tamil || '',
    pinCode: shipToAddress.pin_code || customer.pin_code,
    phone: shipToAddress.phone || customer.phone,
    gstin: shipToAddress.gstin || customer.gstin,
    stateCode: shipToAddress.state_code || customer.state_code || '33',
  } : {
    name: getDisplayName(customer),
    address: customer.address_english || customer.address_tamil || '',
    pinCode: customer.pin_code,
    phone: customer.phone,
    gstin: customer.gstin,
    stateCode: customer.state_code || '33',
  };

  const companyHtml = companySettings ? `
    <div class="company-name">${companySettings.company_name}</div>
    <div class="company-address">
      ${companySettings.address_line1}<br>
      ${companySettings.address_line2 || ''}${companySettings.address_line2 ? ', ' : ''}${companySettings.locality} - ${companySettings.pin_code}<br>
      Phone: ${companySettings.phone}<br>
      GSTIN/UIN: ${companySettings.gstin} &nbsp;&nbsp;&nbsp; State Name: Tamil Nadu, Code: ${companySettings.state_code}
    </div>
  ` : `
    <div style="color: red; font-weight: bold;">
      Company settings not configured for ${sale?.loading_place || ''}.<br>
      Please add this location in Company Settings.
    </div>
  `;

  const signHtml = companySettings ? `for ${companySettings.company_name}` : `for [Company Name]`;

  const logoHtml = currentSale.irn && qrCodeDataUrl
    ? '<img src="' + qrCodeDataUrl + '" alt="IRN QR Code" class="logo irn-qr-logo" />'
    : '<img src="' + windowOrigin + '/lovable-uploads/8ef45f84-cd7a-4909-9f31-86a578d28f2f.png" alt="GRM Logo" class="logo" onerror="this.style.display=\'none\'" />';

  return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tax Invoice - ${sale.bill_serial_no}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 12px; }
            .invoice-container { max-width: 210mm; margin: 0 auto; border: 2px solid #000; }

            .header { display: flex; border-bottom: 1px solid #000; }
            .logo-section { width: 105px; padding: 12px; border-right: 1px solid #000; display: flex; align-items: center; justify-content: center; }
            .logo { width: 98px; height: 98px; object-fit: contain; }
            .irn-qr-logo { width: 125px; height: 125px; image-rendering: pixelated; }
            .company-section { flex: 1; padding: 12px; text-align: center; }
            .company-name { font-size: 21px; font-weight: bold; margin-bottom: 5px; }
            .company-address { font-size: 11px; margin-bottom: 3px; line-height: 1.3; }
            .invoice-info-section { width: 240px; border-left: 1px solid #000; }

            .invoice-details { display: flex; }
            .invoice-left { flex: 1; padding: 10px; font-size: 11px; }
            .invoice-right { width: 155px; padding: 10px; border-left: 1px solid #000; font-size: 11px; }

            .consignee-section { display: flex; border-top: 1px solid #000; }
            .consignee-left { flex: 1; padding: 13px; border-right: 1px solid #000; }
            .consignee-right { flex: 1; padding: 13px; }
            .section-title { font-weight: bold; font-size: 11px; margin-bottom: 10px; }
            .customer-name { font-weight: bold; font-size: 13px; margin-bottom: 7px; }
            .customer-details { font-size: 11px; line-height: 1.4; }

            .items-table { width: 100%; border-collapse: collapse; border-top: 1px solid #000; }
            .items-table th { background-color: #f5f5f5; font-weight: bold; font-size: 12px; padding: 7px; border: 1px solid #000; text-align: center; }
            .items-table td { font-size: 11px; padding: 6px; border: 1px solid #000; text-align: center; }
            .items-table .desc-col { text-align: left; }
            .items-table .amount-col { text-align: right; }

            .footer-section { border-top: 1px solid #000; }
            .amount-words { padding: 10px; border-top: 1px solid #000; border-bottom: 1px solid #000; font-size: 11px; }
            .amount-words-bold { font-weight: bold; }

            .tax-details { display: flex; }
            .hsn-table-section { flex: 1; padding: 10px; border-right: 1px solid #000; }
            .hsn-table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .hsn-table th, .hsn-table td { border: 1px solid #000; padding: 7px; text-align: center; }
            .hsn-table th { background-color: #f5f5f5; font-weight: bold; }

            .total-section { flex: 1; padding: 10px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; }
            .total-final { border-top: 1px solid #000; margin-top: 5px; padding-top: 3px; font-weight: bold; }

            .bank-signature { display: flex; border-top: 1px solid #000; }
            .bank-details { flex: 1; padding: 13px; border-right: 1px solid #000; font-size: 12px; }
            .signature-area { width: 195px; padding: 13px; text-align: center; font-size: 11px; }

            .page-break { page-break-after: always; }
            @media print {
              body { margin: 0; }
              .invoice-container { max-width: none; border: none; }
              .einvoice-nic-page { height: 287mm; margin: 0; page-break-after: always; transform-origin: top left; }
              .page-break { page-break-after: always; page-break-inside: avoid; }
            }

            .einvoice-nic-page { max-width: 210mm; height: 287mm; margin: 0 auto 20px; padding: 6mm 7mm; border: 2px solid #c7c7c7; border-radius: 8px; box-sizing: border-box; font-family: Arial, sans-serif; font-size: 9px; color: #111; overflow: hidden; page-break-inside: avoid; }
            .einvoice-top { height: 150px; display: flex; justify-content: space-between; align-items: center; }
            .einvoice-supplier-title { font-size: 18px; font-weight: 700; line-height: 1.45; }
            .einvoice-top-qr img { width: 165px; height: 165px; image-rendering: pixelated; }
            .einvoice-box, .einvoice-footer-box { border: 2px solid #c7c7c7; border-radius: 5px; margin-top: 4px; overflow: hidden; }
            .einvoice-box h3 { margin: 0; padding: 2px 5px; border-bottom: 1px solid #c7c7c7; font-size: 10px; line-height: 1.05; }
            .einvoice-details-row { display: grid; grid-template-columns: 2fr 1.35fr 1.35fr; gap: 8px; padding: 6px; line-height: 1.25; }
            .einvoice-three-col { display: grid; grid-template-columns: 1.1fr 1.25fr 1.35fr; gap: 16px; padding: 5px; min-height: 68px; }
            .einvoice-three-col p { margin: 0 0 8px; }
            .party-grid { display: grid; grid-template-columns: 2fr 1fr; min-height: 210px; }
            .party-left { padding: 8px; }
            .party-right { border-left: 1px solid #c7c7c7; padding: 8px 10px; }
            .party-block { line-height: 1.25; margin-bottom: 14px; }
            .party-title { font-size: 11px; margin-bottom: 3px; }
            .ship-block { margin-top: 16px; }
            .einvoice-goods-table, .einvoice-tax-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 8px; }
            .einvoice-goods-table th, .einvoice-goods-table td, .einvoice-tax-table th, .einvoice-tax-table td { border: 1px solid #555; padding: 3px 2px; vertical-align: top; text-align: left; font-weight: 400; }
            .einvoice-goods-table th:nth-child(1) { width: 4%; }
            .einvoice-goods-table th:nth-child(2) { width: 21%; }
            .einvoice-goods-table th:nth-child(3) { width: 8%; }
            .einvoice-goods-table th:nth-child(4) { width: 7%; }
            .einvoice-goods-table th:nth-child(5) { width: 4%; }
            .einvoice-goods-table th:nth-child(6) { width: 10%; }
            .einvoice-goods-table th:nth-child(7) { width: 10%; }
            .einvoice-goods-table th:nth-child(8) { width: 9%; }
            .einvoice-goods-table th:nth-child(9) { width: 19%; }
            .einvoice-goods-table th:nth-child(10) { width: 10%; }
            .einvoice-goods-table th:nth-child(11) { width: 9%; }
            .einvoice-tax-table { margin-top: 3px; }
            .eway-mini-row { display: grid; grid-template-columns: 1fr 1fr 1fr; padding: 7px 8px; }
            .einvoice-footer-box { display: grid; grid-template-columns: 1.2fr 1fr 1.2fr; align-items: center; padding: 5px 8px; min-height: 70px; }
            .barcode-lines { width: 145px; height: 36px; margin: 0 auto 2px; background: repeating-linear-gradient(90deg, #000 0 2px, #fff 2px 4px, #000 4px 5px, #fff 5px 8px); }
            .ack-barcode { text-align: center; letter-spacing: 1px; }
            .esign-block { text-align: right; line-height: 1.35; }
            .esign-logo { font-size: 32px; color: #159bd3; font-style: italic; font-weight: 700; line-height: 1; }
            ${currentSale.eway_bill_no ? getEwayBillStyles() : ''}
          </style>
        </head>
        <body>
          <div class="invoice-container ${currentSale.irn || currentSale.eway_bill_no ? 'page-break' : ''}">
            <!-- Header Section -->
            <div class="header">
              <div class="logo-section">
                ${logoHtml}
              </div>
              <div class="company-section">
                ${companyHtml}
              </div>
              <div class="invoice-info-section">
                <div style="padding: 10px; border-bottom: 1px solid #000;">
                  <div style="font-weight: bold; font-size: 11px;">Invoice No.</div>
                  <div style="font-size: 12px; margin-top: 2px;">${currentSale.bill_serial_no}</div>
                </div>
                <div style="padding: 10px; border-bottom: 1px solid #000;">
                  <div style="font-weight: bold; font-size: 11px;">Dated</div>
                  <div style="font-size: 12px; margin-top: 2px;">${new Date(currentSale.sale_date).toLocaleDateString('en-IN')}</div>
                </div>
                <div style="padding: 10px;">
                  <div style="font-weight: bold; font-size: 11px;">Motor Vehicle No.</div>
                  <div style="font-size: 12px; margin-top: 2px;">${currentSale.lorry_no || outwardEntry?.lorry_no || 'N/A'}</div>
                </div>
              </div>
            </div>

            <!-- Consignee Section -->
            <div class="consignee-section">
              <div class="consignee-left">
                <div class="section-title">Consignee (Ship to)</div>
                <div class="customer-name">${shipTo.name}</div>
                <div class="customer-details">
                  ${shipTo.address}<br>
                  ${shipTo.pinCode ? 'PIN: ' + shipTo.pinCode + '<br>' : ''}
                  ${shipTo.phone ? 'Phone: ' + shipTo.phone + '<br>' : ''}
                  ${shipTo.gstin ? 'GSTIN/UIN: ' + shipTo.gstin + '<br>' : ''}
                  State Name: Tamil Nadu, Code: ${shipTo.stateCode}
                </div>
              </div>
              <div class="consignee-right">
                <div class="section-title">Buyer (Bill to)</div>
                <div class="customer-name">${getDisplayName(customer)}</div>
                <div class="customer-details">
                  ${customer.address_english || customer.address_tamil || ''}<br>
                  ${customer.pin_code ? 'PIN: ' + customer.pin_code + '<br>' : ''}
                  ${customer.phone ? 'Phone: ' + customer.phone + '<br>' : ''}
                  ${customer.gstin ? 'GSTIN/UIN: ' + customer.gstin + '<br>' : ''}
                  State Name: Tamil Nadu, Code: 33
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 4%;">Sl<br>No.</th>
                  <th style="width: ${allGstZero ? '32%' : '25%'};">Description of Goods</th>
                  <th style="width: 8%;">HSN/SAC</th>
                  ${allGstZero ? '' : '<th style="width: 6%;">GST<br>Rate</th>'}
                  <th style="width: ${allGstZero ? '14%' : '10%'};">Quantity</th>
                  <th style="width: 10%;">Rate</th>
                  <th style="width: 8%;">per</th>
                  <th style="width: ${allGstZero ? '24%' : '10%'};">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${allSales.map((s: any, index: number) => {
        const currentItem = allItems[index] || item;
        const baseAmt = s.quantity * s.rate;
        return `
                    <tr>
                      <td>${index + 1}</td>
                      <td class="desc-col">${getDisplayName(currentItem)}</td>
                      <td>${currentItem.hsn_no}</td>
                      ${allGstZero ? '' : `<td>${currentItem.gst_percentage}%</td>`}
                      <td>${s.quantity} ${currentItem.unit}</td>
                      <td class="amount-col">&#8377;${s.rate.toFixed(2)}</td>
                      <td>${currentItem.unit}</td>
                      <td class="amount-col">&#8377;${baseAmt.toFixed(2)}</td>
                    </tr>
                  `;
      }).join('')}
                <tr style="background-color: #f9f9f9;">
                  <td colspan="${allGstZero ? '3' : '4'}" style="text-align: right; font-weight: bold; padding-right: 10px;">Total</td>
                  <td style="font-weight: bold;">${totalQuantity} ${item.unit}</td>
                  <td></td>
                  <td></td>
                  <td class="amount-col" style="font-weight: bold;">&#8377; ${baseAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <!-- Footer Section -->
            <div class="footer-section">
              <div class="tax-details">
                ${allGstZero ? '' : `
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
                        <td>&#8377;${baseAmount.toFixed(2)}</td>
                      </tr>
                      <tr style="font-weight: bold;">
                        <td>Total</td>
                        <td>&#8377;${baseAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                `}

                <div class="total-section" style="${allGstZero ? 'flex: 1; max-width: 100%;' : ''}">
                  ${!allGstZero && item.gst_percentage > 0 ? `
                  <div class="total-row">
                    <span>CGST ${(item.gst_percentage / 2)}%:</span>
                    <span>&#8377;${(gstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div class="total-row">
                    <span>SGST ${(item.gst_percentage / 2)}%:</span>
                    <span>&#8377;${(gstAmount / 2).toFixed(2)}</span>
                  </div>
                  ` : !allGstZero ? `
                  <div class="total-row">
                    <span>Tax Amount:</span>
                    <span>NIL</span>
                  </div>
                  ` : ''}
                  <div class="total-row total-final">
                    <span>Total:</span>
                    <span>&#8377;${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div class="amount-words">
                <strong>Amount Chargeable (in words)</strong><br>
                <span class="amount-words-bold">${convertNumberToWords(totalAmount)} Only</span>
              </div>

              <div class="bank-signature">
                <div class="bank-details">
                  <strong style="font-size: 13px;">Bank Details</strong><br>
                  <span style="font-size: 13px;">Bank Name: ${companySettings?.bank_name || ''}</span><br>
                  <span style="font-size: 13px;">A/c No.: ${companySettings?.bank_account_no || ''}</span><br>
                  <span style="font-size: 13px;">Branch: ${companySettings?.bank_branch || ''}</span><br>
                  <span style="font-size: 13px;">IFSC: ${companySettings?.bank_ifsc || ''}</span>
                </div>
                <div class="signature-area">
                  <div style="margin-bottom: 40px;">${signHtml}</div>
                  <div style="border-top: 1px solid #000; padding-top: 5px;">Authorised Signatory</div>
                </div>
              </div>

              ${currentSale.irn ? `
              <div class="irn-section" style="margin-top: 10px; padding: 7px; border-top: 1px solid #ddd; font-size: 11px; text-align: left; line-height: 1.4;">
                <strong>IRN:</strong> ${currentSale.irn}<br>
                ${currentSale.ack_no ? '<strong>Ack No:</strong> ' + currentSale.ack_no + ' &nbsp;&nbsp;&nbsp; <strong>Ack Date:</strong> ' + currentSale.ack_date + '<br>' : ''}
                ${currentSale.eway_bill_no ? '<strong>E-Way Bill No:</strong> ' + currentSale.eway_bill_no + ' &nbsp;&nbsp;&nbsp; <strong>E-Way Bill Date:</strong> ' + currentSale.eway_bill_date : ''}
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Page 2: E-Invoice Details Copy -->
          ${currentSale.irn ? `
          <div class="einvoice-nic-page ${currentSale.eway_bill_no ? 'page-break' : ''}">
            <div class="einvoice-top">
              <div class="einvoice-supplier-title">
                <div>${companySettings?.gstin || ''}</div>
                <div>${companySettings?.company_name || ''}</div>
              </div>
              <div class="einvoice-top-qr">
                ${qrCodeDataUrl ? '<img src="' + qrCodeDataUrl + '" alt="Signed e-invoice QR code" />' : ''}
              </div>
            </div>

            <section class="einvoice-box">
              <h3>1.e-Invoice Details</h3>
              <div class="einvoice-details-row">
                <div><strong>IRN :</strong> ${currentSale.irn}</div>
                <div><strong>Ack No. :</strong> ${currentSale.ack_no || 'N/A'}</div>
                <div><strong>Ack Date :</strong> ${currentSale.ack_date || 'N/A'}</div>
              </div>
            </section>

            <section class="einvoice-box">
              <h3>2.Transaction Details</h3>
              <div class="einvoice-three-col">
                <div>
                  <p><strong>Supply type Code :</strong> B2B</p>
                  <p><strong>Place of Supply :</strong> TAMIL NADU</p>
                  <p><strong>Document Type : Tax Invoice</strong></p>
                </div>
                <div>
                  <p><strong>Document No. :</strong> ${currentSale.bill_serial_no}</p>
                  <p>&nbsp;</p>
                  <p><strong>Document Date :</strong> ${new Date(currentSale.sale_date).toLocaleDateString('en-GB').replace(/\//g, '-')}</p>
                </div>
                <div>
                  <p><strong>IGST applicable despite Supplier and Recipient located in same State : No</strong></p>
                </div>
              </div>
            </section>

            <section class="einvoice-box party-box">
              <h3>3.Party Details</h3>
              <div class="party-grid">
                <div class="party-left">
                  <div class="party-block">
                    <div class="party-title">Supplier :</div>
                    <div>GSTIN : ${companySettings?.gstin || ''}</div>
                    <div>${companySettings?.company_name || ''}</div>
                    <div>${companySettings?.address_line1 || ''}${companySettings?.address_line2 ? ' ' + companySettings.address_line2 : ''}</div>
                    <div>${companySettings?.locality || ''} ${companySettings?.pin_code || ''} TAMIL NADU</div>
                    <div>${companySettings?.phone || ''} ${companySettings?.email || ''}</div>
                  </div>
                  <div class="party-block ship-block">
                    <div class="party-title">Ship To :</div>
                    <div>GSTIN : ${shipTo.gstin || customer.gstin || 'URP'}</div>
                    <div>${shipTo.name}</div>
                    <div>${shipTo.address}</div>
                    <div>${shipTo.pinCode || ''} TAMIL NADU</div>
                  </div>
                </div>
                <div class="party-right">
                  <div class="party-title">Recipient :</div>
                  <div>GSTIN : ${customer.gstin || 'URP'}</div>
                  <div>${getDisplayName(customer)}</div>
                  <div>${customer.address_english || customer.address_tamil || ''}</div>
                  <div>${customer.place_of_supply ? 'Place of Supply: TAMIL NADU' : ''}</div>
                  <div>${customer.pin_code || ''} TAMIL NADU</div>
                  <div>${customer.phone || ''}</div>
                </div>
              </div>
            </section>

            <section class="einvoice-box goods-box">
              <h3>4.Details of Goods / Services</h3>
              <table class="einvoice-goods-table">
                <thead>
                  <tr>
                    <th>SlNo</th>
                    <th>Item Description</th>
                    <th>HSN<br>Code</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Unit<br>Price(Rs)</th>
                    <th>Discount(Rs)</th>
                    <th>Taxable<br>Amount(Rs)</th>
                    <th>Tax Rate(GST + Cess |<br>State Cess + Cess<br>Non.Advol</th>
                    <th>Other<br>charges</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${allSales.map((s: any, index: number) => {
                    const currentItem = allItems[index] || item;
                    const itemBase = s.quantity * s.rate;
                    const itemGst = itemBase * (currentItem.gst_percentage / 100);
                    const itemTotal = itemBase + itemGst;
                    return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${getDisplayName(currentItem)}</td>
                      <td>${currentItem.hsn_no || ''}</td>
                      <td>${s.quantity}</td>
                      <td>${currentItem.unit}</td>
                      <td>${s.rate.toFixed(2)}</td>
                      <td>0</td>
                      <td>${itemBase.toFixed(2)}</td>
                      <td>${Number(currentItem.gst_percentage || 0).toFixed(2)} + 0.00 |<br>0.00 + 0</td>
                      <td>0</td>
                      <td>${itemTotal.toFixed(2)}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
              <table class="einvoice-tax-table">
                <tr>
                  <th>Tax'ble Amt</th>
                  <th>CGST Amt</th>
                  <th>SGST Amt</th>
                  <th>IGST Amt</th>
                  <th>CESS Amt</th>
                  <th>State CESS</th>
                  <th>Discount</th>
                  <th>Other Charges</th>
                  <th>Round off Amt</th>
                  <th>Tot Inv. Amt</th>
                </tr>
                <tr>
                  <td>${baseAmount.toFixed(2)}</td>
                  <td>${(gstAmount / 2).toFixed(2)}</td>
                  <td>${(gstAmount / 2).toFixed(2)}</td>
                  <td>0.00</td>
                  <td>0.00</td>
                  <td>0.00</td>
                  <td>0.00</td>
                  <td>0.00</td>
                  <td>0.00</td>
                  <td>${totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </section>

            ${currentSale.eway_bill_no ? `
            <section class="einvoice-box eway-mini-box">
              <h3>5.Eway Bill Details</h3>
              <div class="eway-mini-row">
                <div><strong>Eway Bill No. :</strong> ${currentSale.eway_bill_no}</div>
                <div><strong>Eway Bill Date. :</strong> ${currentSale.eway_bill_date ? new Date(currentSale.eway_bill_date).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A'}</div>
                <div><strong>Valid Till Date :</strong> ${currentSale.eway_bill_valid_upto ? new Date(currentSale.eway_bill_valid_upto).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A'}</div>
              </div>
            </section>` : ''}

            <section class="einvoice-footer-box">
              <div class="einvoice-generated">
                <div><strong>Generated By : ${companySettings?.gstin || ''}</strong></div>
                <div><strong>Print Date : ${new Date().toLocaleString('en-GB').replace(',', '')}</strong></div>
              </div>
              <div class="ack-barcode">
                <div class="barcode-lines"></div>
                <div>${currentSale.ack_no || ''}</div>
              </div>
              <div class="esign-block">
                <div class="esign-logo">eSign</div>
                <div>Digitally Signed by NIC-IRP</div>
                <div>on :${currentSale.ack_date || ''}</div>
              </div>
            </section>
          </div>
          ` : ''}

          <!-- Page 3: E-Way Bill Details -->
          ${currentSale.eway_bill_no ? getEwayBillContentHtml({
            ewbNo: currentSale.eway_bill_no,
            ewbDetails,
            qrCodeDataUrl: ewbQrCodeDataUrl,
            sale: currentSale,
            companySettings,
            customer,
            item
          }) : ''}
        </body>
        </html>
      `;
};
