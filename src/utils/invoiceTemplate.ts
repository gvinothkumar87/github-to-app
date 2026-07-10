export const generateInvoiceHtml = ({
  sale,
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
  ewbDetails,
  windowOrigin = window?.location?.origin || ''
}: any) => {
  const currentSale = sale; // Map sale to currentSale for the template

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
    ? '<img src="' + qrCodeDataUrl + '" alt="IRN QR Code" class="logo" />'
    : '<img src="' + windowOrigin + '/lovable-uploads/8ef45f84-cd7a-4909-9f31-86a578d28f2f.png" alt="GRM Logo" class="logo" onerror="this.style.display=\'none\'" />';

  return `
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

            .page-break { page-break-after: always; }
            @media print {
              body { margin: 0; }
              .invoice-container { max-width: none; border: none; }
              .page-break { page-break-after: always; page-break-inside: avoid; }
            }
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
                <div style="padding: 8px; border-bottom: 1px solid #000;">
                  <div style="font-weight: bold; font-size: 8px;">Invoice No.</div>
                  <div style="font-size: 9px; margin-top: 2px;">${currentSale.bill_serial_no}</div>
                </div>
                <div style="padding: 8px; border-bottom: 1px solid #000;">
                  <div style="font-weight: bold; font-size: 8px;">Dated</div>
                  <div style="font-size: 9px; margin-top: 2px;">${new Date(currentSale.sale_date).toLocaleDateString('en-IN')}</div>
                </div>
                <div style="padding: 8px;">
                  <div style="font-weight: bold; font-size: 8px;">Motor Vehicle No.</div>
                  <div style="font-size: 9px; margin-top: 2px;">${currentSale.lorry_no || outwardEntry?.lorry_no || 'N/A'}</div>
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
                  ${customer.pin_code ? 'PIN: ' + customer.pin_code + '<br>' : ''}
                  ${customer.phone ? 'Phone: ' + customer.phone + '<br>' : ''}
                  ${customer.gstin ? 'GSTIN/UIN: ' + customer.gstin + '<br>' : ''}
                  State Name: Tamil Nadu, Code: 33
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
                  <strong style="font-size: 10px;">Bank Details</strong><br>
                  <span style="font-size: 10px;">Bank Name: ${companySettings?.bank_name || ''}</span><br>
                  <span style="font-size: 10px;">A/c No.: ${companySettings?.bank_account_no || ''}</span><br>
                  <span style="font-size: 10px;">Branch: ${companySettings?.bank_branch || ''}</span><br>
                  <span style="font-size: 10px;">IFSC: ${companySettings?.bank_ifsc || ''}</span>
                </div>
                <div class="signature-area">
                  <div style="margin-bottom: 40px;">${signHtml}</div>
                  <div style="border-top: 1px solid #000; padding-top: 5px;">Authorised Signatory</div>
                </div>
              </div>

              ${currentSale.irn ? `
              <div class="irn-section" style="margin-top: 10px; padding: 5px; border-top: 1px solid #ddd; font-size: 8px; text-align: left; line-height: 1.4;">
                <strong>IRN:</strong> ${currentSale.irn}<br>
                ${currentSale.ack_no ? '<strong>Ack No:</strong> ' + currentSale.ack_no + ' &nbsp;&nbsp;&nbsp; <strong>Ack Date:</strong> ' + currentSale.ack_date + '<br>' : ''}
                ${currentSale.eway_bill_no ? '<strong>E-Way Bill No:</strong> ' + currentSale.eway_bill_no + ' &nbsp;&nbsp;&nbsp; <strong>E-Way Bill Date:</strong> ' + currentSale.eway_bill_date : ''}
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Page 2: E-Invoice Details Copy -->
          ${currentSale.irn ? `
          <div class="invoice-container ${currentSale.eway_bill_no ? 'page-break' : ''}" style="padding: 15px; border: 2px solid #000; min-height: 275mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; margin-top: 20px;">
            <div>
              <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 16px; font-weight: bold; color: #1e3a8a;">E-INVOICE DETAILS (NIC COPY)</div>
                <div>
                  ${qrCodeDataUrl ? '<img src="' + qrCodeDataUrl + '" style="width: 100px; height: 100px;" />' : ''}
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9px;">
                <tr>
                  <td style="width: 15%; border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #f5f5f5;">IRN:</td>
                  <td colspan="3" style="border: 1px solid #000; padding: 5px; font-family: monospace; font-size: 10px; word-break: break-all;">${currentSale.irn}</td>
                </tr>
                <tr>
                  <td style="width: 15%; border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #f5f5f5;">Ack No:</td>
                  <td style="width: 35%; border: 1px solid #000; padding: 5px;">${currentSale.ack_no || 'N/A'}</td>
                  <td style="width: 15%; border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #f5f5f5;">Ack Date:</td>
                  <td style="width: 35%; border: 1px solid #000; padding: 5px;">${currentSale.ack_date || 'N/A'}</td>
                </tr>
              </table>

              <div style="display: flex; border: 1px solid #000; margin-bottom: 15px; font-size: 9px;">
                <div style="flex: 1; padding: 8px; border-right: 1px solid #000; line-height: 1.3;">
                  <div style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 5px;">Seller Details</div>
                  <strong>${companySettings?.company_name}</strong><br>
                  ${companySettings?.address_line1}, ${companySettings?.address_line2 || ''}<br>
                  ${companySettings?.locality} - ${companySettings?.pin_code}<br>
                  <strong>GSTIN:</strong> ${companySettings?.gstin}<br>
                  <strong>State Code:</strong> ${companySettings?.state_code}
                </div>
                <div style="flex: 1; padding: 8px; line-height: 1.3;">
                  <div style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 5px;">Buyer Details</div>
                  <strong>${getDisplayName(customer)}</strong><br>
                  ${customer.address_english || customer.address_tamil || ''}<br>
                  ${customer.pin_code ? 'PIN: ' + customer.pin_code + '<br>' : ''}
                  <strong>GSTIN:</strong> ${customer.gstin || 'URP'}<br>
                  <strong>State Code:</strong> ${customer.state_code || '33'}
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9px;">
                <tr>
                  <td style="width: 25%; border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Doc Type:</td>
                  <td style="width: 25%; border: 1px solid #000; padding: 5px;">Invoice (INV)</td>
                  <td style="width: 25%; border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Doc No:</td>
                  <td style="width: 25%; border: 1px solid #000; padding: 5px;">${currentSale.bill_serial_no}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Doc Date:</td>
                  <td style="border: 1px solid #000; padding: 5px;">${new Date(currentSale.sale_date).toLocaleDateString('en-IN')}</td>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Place of Supply:</td>
                  <td style="border: 1px solid #000; padding: 5px;">${customer.place_of_supply || customer.state_code || '33'}</td>
                </tr>
              </table>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 8px;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="border: 1px solid #000; padding: 4px; text-align: center;">Sl</th>
                    <th style="border: 1px solid #000; padding: 4px; text-align: left;">Product Description</th>
                    <th style="border: 1px solid #000; padding: 4px; text-align: center;">HSN</th>
                    <th style="border: 1px solid #000; padding: 4px; text-align: right;">Qty</th>
                    <th style="border: 1px solid #000; padding: 4px; text-align: right;">Rate</th>
                    <th style="border: 1px solid #000; padding: 4px; text-align: right;">Value</th>
                    <th style="border: 1px solid #000; padding: 4px; text-align: center;">GST %</th>
                    <th style="border: 1px solid #000; padding: 4px; text-align: right;">GST Amt</th>
                    <th style="border: 1px solid #000; padding: 4px; text-align: right;">Total</th>
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
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
                        <td style="border: 1px solid #000; padding: 4px;">${currentItem.name_english}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${currentItem.hsn_no || ''}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: right;">${s.quantity} ${currentItem.unit}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: right;">&#8377;${s.rate.toFixed(2)}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: right;">&#8377;${itemBase.toFixed(2)}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${currentItem.gst_percentage}%</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: right;">&#8377;${itemGst.toFixed(2)}</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">&#8377;${itemTotal.toFixed(2)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              <div style="display: flex; justify-content: flex-end; margin-bottom: 20px; font-size: 9px;">
                <table style="width: 40%; border-collapse: collapse;">
                  <tr>
                    <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">Taxable Value:</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right;">&#8377;${baseAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">CGST:</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right;">&#8377;${(gstAmount / 2).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">SGST:</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right;">&#8377;${(gstAmount / 2).toFixed(2)}</td>
                  </tr>
                  <tr style="background-color: #f5f5f5; font-weight: bold;">
                    <td style="border: 1px solid #000; padding: 5px;">Invoice Value:</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: right;">&#8377;${totalAmount.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
            </div>

            <div style="border-top: 1px dashed #000; padding-top: 8px; font-size: 8px; text-align: center; color: #666;">
              This is a system generated copy of the E-Invoice registered with the Government Portal.
            </div>
          </div>
          ` : ''}

          <!-- Page 3: E-Way Bill Details -->
          ${currentSale.eway_bill_no ? `
          <div class="invoice-container" style="padding: 15px; border: 2px solid #000; min-height: 275mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; margin-top: 20px;">
            <div>
              <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 16px; font-weight: bold; color: #1e3a8a;">E-WAY BILL DETAILS (FORM GST EWB-01)</div>
                <div>
                  ${ewbQrCodeDataUrl ? '<img src="' + ewbQrCodeDataUrl + '" style="width: 70px; height: 70px;" />' : ''}
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9px;">
                <tr>
                  <td style="width: 25%; border: 1px solid #000; padding: 6px; font-weight: bold; background-color: #f5f5f5;">E-Way Bill No:</td>
                  <td style="width: 25%; border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 11px; color: #1e3a8a;">${ewbDetails?.ewbNo || ewbDetails?.ewayBillNo || currentSale.eway_bill_no}</td>
                  <td style="width: 25%; border: 1px solid #000; padding: 6px; font-weight: bold; background-color: #f5f5f5;">E-Way Bill Date:</td>
                  <td style="width: 25%; border: 1px solid #000; padding: 6px;">${ewbDetails?.ewayBillDate || ewbDetails?.EwayBillDate || ewbDetails?.EwbDt || currentSale.eway_bill_date || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background-color: #f5f5f5;">Generated By:</td>
                  <td style="border: 1px solid #000; padding: 6px;">${ewbDetails?.fromGstin || ewbDetails?.FromGstin || companySettings?.gstin || 'N/A'}</td>
                  <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background-color: #f5f5f5;">Valid Till:</td>
                  <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${ewbDetails?.validUpto || ewbDetails?.ValidUpto || ewbDetails?.EwbValidTill || currentSale.eway_bill_valid_upto || 'N/A (Refer Portal)'}</td>
                </tr>
              </table>

              <div style="font-weight: bold; font-size: 10px; margin-bottom: 5px; text-decoration: underline;">PART - A</div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9px;">
                <tr>
                  <td style="width: 25%; border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Transaction Type:</td>
                  <td style="width: 25%; border: 1px solid #000; padding: 5px;">${ewbDetails?.supplyType || ewbDetails?.SupplyType || 'Outward - Supply'}</td>
                  <td style="width: 25%; border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Doc Type &amp; No:</td>
                  <td style="width: 25%; border: 1px solid #000; padding: 5px;">${ewbDetails?.docType || ewbDetails?.DocType || 'Tax Invoice'} / ${ewbDetails?.docNo || ewbDetails?.DocNo || currentSale.bill_serial_no}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Doc Date:</td>
                  <td style="border: 1px solid #000; padding: 5px;">${ewbDetails?.docDate || ewbDetails?.DocDate || new Date(currentSale.sale_date).toLocaleDateString('en-IN')}</td>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Total Taxable Value:</td>
                  <td style="border: 1px solid #000; padding: 5px;">&#8377;${parseFloat(ewbDetails?.taxableAmount || ewbDetails?.TaxableAmount || baseAmount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Total Tax Amount:</td>
                  <td style="border: 1px solid #000; padding: 5px;">&#8377;${parseFloat(ewbDetails?.cgstValue || ewbDetails?.CgstValue || ewbDetails?.sgstValue || ewbDetails?.SgstValue ? (parseFloat(ewbDetails?.cgstValue || ewbDetails?.CgstValue || 0) + parseFloat(ewbDetails?.sgstValue || ewbDetails?.SgstValue || 0)) : gstAmount).toFixed(2)}</td>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Total Invoice Value:</td>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">&#8377;${parseFloat(ewbDetails?.totInvValue || ewbDetails?.TotInvValue || totalAmount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Primary HSN Code:</td>
                  <td style="border: 1px solid #000; padding: 5px;">${ewbDetails?.hsnCode || ewbDetails?.HsnCode || item.hsn_no || 'N/A'}</td>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold; background-color: #fafafa;">Main Product:</td>
                  <td style="border: 1px solid #000; padding: 5px;">${ewbDetails?.mainProduct || ewbDetails?.MainProduct || item.name_english}</td>
                </tr>
              </table>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9px;">
                <tr style="background-color: #f5f5f5;">
                  <th style="width: 50%; border: 1px solid #000; padding: 5px; text-align: left;">From (Dispatch Place)</th>
                  <th style="width: 50%; border: 1px solid #000; padding: 5px; text-align: left;">To (Delivery Place)</th>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; vertical-align: top; line-height: 1.4;">
                    <strong>GSTIN:</strong> ${ewbDetails?.fromGstin || ewbDetails?.FromGstin || companySettings?.gstin}<br>
                    <strong>Name:</strong> ${ewbDetails?.fromTrdName || ewbDetails?.FromTrdName || companySettings?.company_name}<br>
                    <strong>Address:</strong> ${ewbDetails?.fromAddr1 || ewbDetails?.FromAddr1 || companySettings?.address_line1 || ''}, ${ewbDetails?.fromAddr2 || ewbDetails?.FromAddr2 || ''}<br>
                    ${ewbDetails?.fromPlace || ewbDetails?.FromPlace || companySettings?.locality || ''} - ${ewbDetails?.fromPincode || ewbDetails?.FromPincode || companySettings?.pin_code || ''}<br>
                    <strong>State:</strong> State Code: ${ewbDetails?.fromStateCode || ewbDetails?.FromStateCode || companySettings?.state_code || '33'}
                  </td>
                  <td style="border: 1px solid #000; padding: 8px; vertical-align: top; line-height: 1.4;">
                    <strong>GSTIN:</strong> ${ewbDetails?.toGstin || ewbDetails?.ToGstin || customer.gstin || 'URP'}<br>
                    <strong>Name:</strong> ${ewbDetails?.toTrdName || ewbDetails?.ToTrdName || getDisplayName(customer)}<br>
                    <strong>Address:</strong> ${ewbDetails?.toAddr1 || ewbDetails?.ToAddr1 || customer.address_english || customer.address_tamil || 'N/A'}, ${ewbDetails?.toAddr2 || ewbDetails?.ToAddr2 || ''}<br>
                    ${ewbDetails?.toPlace || ewbDetails?.ToPlace || ''} - ${ewbDetails?.toPincode || ewbDetails?.ToPincode || customer.pin_code || ''}<br>
                    <strong>State Code:</strong> ${ewbDetails?.toStateCode || ewbDetails?.ToStateCode || customer.state_code || '33'}
                  </td>
                </tr>
              </table>

              <div style="font-weight: bold; font-size: 10px; margin-bottom: 5px; text-decoration: underline;">PART - B</div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9px;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="border: 1px solid #000; padding: 5px;">Mode</th>
                    <th style="border: 1px solid #000; padding: 5px;">Vehicle No / Trans Doc No</th>
                    <th style="border: 1px solid #000; padding: 5px;">From</th>
                    <th style="border: 1px solid #000; padding: 5px;">Entered Date</th>
                    <th style="border: 1px solid #000; padding: 5px;">Entered By</th>
                  </tr>
                </thead>
                <tbody>
                  ${(ewbDetails?.VehiclListDetails || ewbDetails?.vehicleListDetails || []).length > 0
                    ? (ewbDetails?.VehiclListDetails || ewbDetails?.vehicleListDetails).map((v: any) => `
                      <tr>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">
                          ${v.transMode === '1' || v.TransMode === '1' ? 'Road' : v.transMode === '2' || v.TransMode === '2' ? 'Rail' : v.transMode === '3' || v.TransMode === '3' ? 'Air' : v.transMode === '4' || v.TransMode === '4' ? 'Ship' : (v.transMode || v.TransMode || 'Road')}
                        </td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">
                          ${v.vehicleNo || v.VehicleNo || v.transDocNo || v.TransDocNo || 'N/A'}
                        </td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${v.fromPlace || v.FromPlace || 'N/A'}</td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${v.enteredDate || v.EnteredDate || 'N/A'}</td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${v.gstinNo || v.GstinNo || companySettings?.gstin || 'N/A'}</td>
                      </tr>
                    `).join('')
                    : `
                      <tr>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">Road</td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">
                          ${ewbDetails?.vehicleNo || ewbDetails?.VehicleNo || currentSale.lorry_no || outwardEntry?.lorry_no || 'N/A'}
                        </td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${ewbDetails?.fromPlace || ewbDetails?.FromPlace || companySettings?.locality || 'N/A'}</td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${ewbDetails?.ewayBillDate || ewbDetails?.EwayBillDate || ewbDetails?.EwbDt || currentSale.eway_bill_date || 'N/A'}</td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${companySettings?.gstin || 'N/A'}</td>
                      </tr>
                    `
                  }
                </tbody>
              </table>
            </div>

            <div style="border-top: 1px dashed #000; padding-top: 8px; font-size: 8px; text-align: center; color: #666;">
              This is a system generated copy of the E-Way Bill. Goods should be transported with a valid copy of this document.
            </div>
          </div>
          ` : ''}
        </body>
        </html>
      `;
};
