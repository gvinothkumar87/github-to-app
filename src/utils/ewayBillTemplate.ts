// E-Way Bill Print Template - Matches Official NIC Government Format
// Includes QR Code at top and Code128 Barcode at bottom

// ─── Code128 Barcode Generator ───────────────────────────────────────────────

const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

const START_CODE_C = 105;
const START_CODE_B = 104;
const STOP_CODE = 106;

function generateCode128Svg(data: string, width: number = 350, height: number = 55): string {
  const codes: number[] = [];
  let checksum = 0;

  // Use Code C for all-numeric even-length data, otherwise Code B
  const isAllNumeric = /^\d+$/.test(data);
  const useCodeC = isAllNumeric && data.length % 2 === 0;

  if (useCodeC) {
    codes.push(START_CODE_C);
    checksum = START_CODE_C;
    for (let i = 0; i < data.length; i += 2) {
      const value = parseInt(data.substring(i, i + 2), 10);
      codes.push(value);
      checksum += value * ((i / 2) + 1);
    }
  } else {
    codes.push(START_CODE_B);
    checksum = START_CODE_B;
    for (let i = 0; i < data.length; i++) {
      const value = data.charCodeAt(i) - 32;
      codes.push(value);
      checksum += value * (i + 1);
    }
  }

  codes.push(checksum % 103);
  codes.push(STOP_CODE);

  // Build bar pattern string
  let pattern = '';
  for (const code of codes) {
    pattern += CODE128_PATTERNS[code];
  }

  // Calculate total modules including quiet zones
  let totalModules = 20; // 10-module quiet zone on each side
  for (const ch of pattern) {
    totalModules += parseInt(ch, 10);
  }

  const moduleWidth = width / totalModules;

  // Generate SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;

  let x = 10 * moduleWidth; // Start after quiet zone
  let isBar = true;
  for (const ch of pattern) {
    const w = parseInt(ch, 10) * moduleWidth;
    if (isBar) {
      svg += `<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${height}" fill="black"/>`;
    }
    x += w;
    isBar = !isBar;
  }

  svg += '</svg>';
  return svg;
}

// ─── State Code to Name Mapping ──────────────────────────────────────────────

const STATE_NAMES: Record<string, string> = {
  '01': 'JAMMU AND KASHMIR', '02': 'HIMACHAL PRADESH', '03': 'PUNJAB',
  '04': 'CHANDIGARH', '05': 'UTTARAKHAND', '06': 'HARYANA',
  '07': 'DELHI', '08': 'RAJASTHAN', '09': 'UTTAR PRADESH',
  '10': 'BIHAR', '11': 'SIKKIM', '12': 'ARUNACHAL PRADESH',
  '13': 'NAGALAND', '14': 'MANIPUR', '15': 'MIZORAM',
  '16': 'TRIPURA', '17': 'MEGHALAYA', '18': 'ASSAM',
  '19': 'WEST BENGAL', '20': 'JHARKHAND', '21': 'ODISHA',
  '22': 'CHHATTISGARH', '23': 'MADHYA PRADESH', '24': 'GUJARAT',
  '25': 'DAMAN AND DIU', '26': 'DADRA AND NAGAR HAVELI', '27': 'MAHARASHTRA',
  '28': 'ANDHRA PRADESH (OLD)', '29': 'KARNATAKA', '30': 'GOA',
  '31': 'LAKSHADWEEP', '32': 'KERALA', '33': 'TAMIL NADU',
  '34': 'PUDUCHERRY', '35': 'ANDAMAN AND NICOBAR', '36': 'TELANGANA',
  '37': 'ANDHRA PRADESH', '38': 'LADAKH', '97': 'OTHER TERRITORY'
};

function getStateName(code: string | number | null | undefined): string {
  if (!code) return '';
  const c = code.toString().padStart(2, '0');
  return STATE_NAMES[c] || '';
}

// ─── Mapping Helpers ─────────────────────────────────────────────────────────

function getTransModeName(mode: string | number | null | undefined): string {
  const m = (mode || '1').toString();
  switch (m) {
    case '1': return 'Road';
    case '2': return 'Rail';
    case '3': return 'Air';
    case '4': return 'Ship';
    default: return m;
  }
}

function getSupplyTypeLabel(supplyType: string | null | undefined, subSupplyType: string | number | null | undefined): string {
  const st = (supplyType || 'O').toString().toUpperCase();
  const sst = (subSupplyType || '1').toString();

  const typeLabel = st === 'I' ? 'Inward' : 'Outward';

  const subTypeMap: Record<string, string> = {
    '1': 'Supply', '2': 'Import', '3': 'Export', '4': 'Job Work',
    '5': 'For Own Use', '6': 'Job Work Returns', '7': 'Sales Return',
    '8': 'Others', '9': 'SKD/CKD/Lots', '10': 'Line Sales',
    '11': 'Recipient Not Known', '12': 'Exhibition or Fairs'
  };

  const subLabel = subTypeMap[sst] || 'Supply';
  return `${typeLabel}  -  ${subLabel}`;
}

function getTransactionTypeLabel(type: string | number | null | undefined): string {
  const t = (type || '1').toString();
  switch (t) {
    case '1': return 'Regular';
    case '2': return 'Bill To - Ship To';
    case '3': return 'Bill From - Dispatch From';
    case '4': return 'Combination of 2 and 3';
    default: return t;
  }
}

// Safely get a value from an object trying multiple key names
function get(obj: any, ...keys: string[]): string {
  if (!obj) return '';
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== '') return String(val);
  }
  return '';
}

// ─── Main Template Generator ─────────────────────────────────────────────────

export interface EwayBillPrintParams {
  ewbNo: string;
  ewbDetails: any;
  qrCodeDataUrl: string;
  sale?: any;
  companySettings?: any;
  customer?: any;
  item?: any;
}

export const getEwayBillStyles = (): string => {
  return `
    #ewb-print-page {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #000;
      background: #fff;
      padding: 15px 20px;
      line-height: 1.4;
      box-sizing: border-box;
    }
    #ewb-print-page *, #ewb-print-page *::before, #ewb-print-page *::after {
      box-sizing: border-box;
    }
    #ewb-print-page .header {
      display: flex;
      flex-direction: column;
      align-items: center;
      border-bottom: 1px solid #000;
      padding-bottom: 15px;
      margin-bottom: 15px;
      text-align: center;
    }
    #ewb-print-page .header h1 {
      font-size: 17px;
      font-weight: bold;
      margin: 0 0 8px 0;
    }
    #ewb-print-page .qr-code {
      width: 120px;
      height: 120px;
    }
    #ewb-print-page .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2px;
    }
    #ewb-print-page .details-table td {
      padding: 2px 4px;
      vertical-align: top;
      line-height: 1.5;
    }
    #ewb-print-page .details-table .label {
      width: 190px;
      min-width: 190px;
      font-weight: normal;
      white-space: nowrap;
    }
    #ewb-print-page .details-table .value {
      font-weight: bold;
    }
    #ewb-print-page .section-header {
      font-weight: bold;
      font-size: 12px;
      padding: 4px 5px;
      margin: 4px 0 2px 0;
      border-bottom: 1px solid #888;
    }
    #ewb-print-page .part-b-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 4px;
    }
    #ewb-print-page .part-b-table th {
      border: 1px solid #000;
      padding: 5px 4px;
      text-align: left;
      font-weight: bold;
      font-size: 11px;
      background-color: #fff;
    }
    #ewb-print-page .part-b-table td {
      border: 1px solid #000;
      padding: 4px;
      text-align: left;
      vertical-align: top;
      font-size: 11px;
    }
    #ewb-print-page .barcode-container {
      text-align: center;
      margin-top: 25px;
    }
    #ewb-print-page .barcode-number {
      text-align: center;
      font-size: 13px;
      font-weight: normal;
      margin-top: 3px;
      letter-spacing: 1px;
    }
    #ewb-print-page .value-sub {
      font-weight: bold;
      display: block;
      padding-left: 0;
    }
  `;
};

export const getEwayBillContentHtml = (params: EwayBillPrintParams): string => {
  const { ewbNo, ewbDetails, qrCodeDataUrl, sale, companySettings, customer, item } = params;
  const d = ewbDetails || {};

  // ── Extract fields with fallbacks ──

  const ewayBillDate = get(d, 'ewayBillDate', 'EwayBillDate', 'EwbDt') || get(sale, 'eway_bill_date') || '';
  const validUpto = get(d, 'validUpto', 'ValidUpto') || get(sale, 'eway_bill_valid_upto') || '';
  const distance = get(d, 'distance', 'Distance', 'actualDist', 'ActualDist') || '0';

  const generatedByGstin = get(d, 'userGstin', 'UserGstin', 'fromGstin', 'FromGstin') || get(companySettings, 'gstin') || '';
  const generatedByName = get(d, 'fromTrdName', 'FromTrdName') || get(companySettings, 'company_name') || '';

  // IRN Details
  const irn = get(sale, 'irn') || get(d, 'irn', 'Irn', 'IRN') || '';
  const ackNo = get(sale, 'ack_no') || get(d, 'ackNo', 'AckNo', 'ack_no') || '';
  const ackDate = get(sale, 'ack_date') || get(d, 'ackDate', 'AckDate', 'ack_date') || '';

  // Part-A: Supplier
  const fromGstin = get(d, 'fromGstin', 'FromGstin') || get(companySettings, 'gstin') || '';
  const fromTrdName = get(d, 'fromTrdName', 'FromTrdName') || get(companySettings, 'company_name') || '';
  const fromAddr1 = get(d, 'fromAddr1', 'FromAddr1') || get(companySettings, 'address_line1') || '';
  const fromAddr2 = get(d, 'fromAddr2', 'FromAddr2') || get(companySettings, 'address_line2') || '';
  const fromPlace = get(d, 'fromPlace', 'FromPlace') || get(companySettings, 'locality') || '';
  const fromPincode = get(d, 'fromPincode', 'FromPincode') || get(companySettings, 'pin_code') || '';
  const fromStateCode = get(d, 'fromStateCode', 'FromStateCode') || get(companySettings, 'state_code') || '33';
  const fromStateName = getStateName(fromStateCode);
  const dispatchAddress = [fromAddr1, fromAddr2, fromPlace, fromStateName, fromPincode].filter(Boolean).join(' ');

  // Part-A: Recipient
  const toGstin = get(d, 'toGstin', 'ToGstin') || customer?.gstin || sale?.customers?.gstin || '';
  const toTrdName = get(d, 'toTrdName', 'ToTrdName') || customer?.name_english || sale?.customers?.name_english || '';
  const toAddr1 = get(d, 'toAddr1', 'ToAddr1') || customer?.address_english || sale?.customers?.address_english || '';
  const toAddr2 = get(d, 'toAddr2', 'ToAddr2') || '';
  const toPlace = get(d, 'toPlace', 'ToPlace') || customer?.place_of_supply || '';
  const toPincode = get(d, 'toPincode', 'ToPincode') || customer?.pin_code || sale?.customers?.pin_code || '';
  const toStateCode = get(d, 'toStateCode', 'ToStateCode') || customer?.state_code || sale?.customers?.state_code || '';
  const toStateName = getStateName(toStateCode);
  const deliveryAddress = [toAddr1, toAddr2, toPlace, toStateName, toPincode].filter(Boolean).join(' ');

  // Document details
  const docNo = get(d, 'docNo', 'DocNo') || get(sale, 'bill_serial_no') || '';
  const docDate = get(d, 'docDate', 'DocDate') || get(sale, 'sale_date') || '';
  const transactionType = getTransactionTypeLabel(get(d, 'transactionType', 'TransactionType', 'transType', 'TransType') || '1');

  // Values
  let totInvValue = get(d, 'totInvValue', 'TotInvValue', 'totalValue', 'TotalValue') || '';
  if ((!totInvValue || totInvValue === '0' || totInvValue === '0.00') && sale?.total_amount) {
    totInvValue = String(sale.total_amount);
  }
  if (!totInvValue) {
    totInvValue = '0';
  }

  // HSN and product
  const itemList: any[] = d.itemList || d.ItemList || [];
  let hsnDisplay = '';
  if (itemList.length > 0) {
    hsnDisplay = itemList.map(i => {
      const code = get(i, 'hsnCode', 'HsnCode') || '';
      const name = get(i, 'productName', 'ProductName') || '';
      return [code, name].filter(Boolean).join('-');
    }).filter(Boolean).join(', ');
  }

  if (!hsnDisplay) {
    const hsnCode = get(d, 'hsnCode', 'HsnCode', 'mainHsnCode', 'MainHsnCode') || item?.hsn_no || sale?.items?.hsn_no || '';
    const mainProduct = get(d, 'mainProduct', 'MainProduct', 'productName', 'ProductName') || item?.name_english || sale?.items?.name_english || '';
    hsnDisplay = [hsnCode, mainProduct].filter(Boolean).join('-');
  }

  // Supply / Transport
  const supplyType = get(d, 'supplyType', 'SupplyType') || 'O';
  const subSupplyType = get(d, 'subSupplyType', 'SubSupplyType') || '1';
  const reasonForTransport = get(d, 'subSupplyDesc', 'SubSupplyDesc') || getSupplyTypeLabel(supplyType, subSupplyType);

  const transporterName = get(d, 'transporterName', 'TransporterName') || '';
  const transporterId = get(d, 'transporterId', 'TransporterId') || '';
  const transporterDisplay = transporterName || transporterId || '-';

  // ── Part-B: Vehicle List ──

  const vehicleList: any[] = d.vehicleListDetails || d.VehiclListDetails || d.vehicleListDetails || [];
  const singleVehicleNo = get(d, 'vehicleNo', 'VehicleNo') || get(sale, 'lorry_no') || '';
  const singleTransMode = get(d, 'transMode', 'TransMode') || '1';
  const singleTransDocNo = get(d, 'transDocNo', 'TransDocNo') || '';
  const singleTransDocDate = get(d, 'transDocDate', 'TransDocDate') || '';

  // Build vehicle rows
  let vehicleRowsHtml = '';
  if (vehicleList.length > 0) {
    for (const v of vehicleList) {
      const vMode = getTransModeName(v.transMode || v.TransMode || '1');
      const vNo = get(v, 'vehicleNo', 'VehicleNo') || '';
      const vTransDocNo = get(v, 'transDocNo', 'TransDocNo') || '';
      const vTransDocDate = get(v, 'transDocDate', 'TransDocDate') || '';
      const vFrom = get(v, 'fromPlace', 'FromPlace') || '';
      const vEnteredDate = get(v, 'enteredDate', 'EnteredDate') || '';
      const vEnteredBy = get(v, 'gstinNo', 'GstinNo', 'updatedBy', 'UpdatedBy') || generatedByGstin;
      const vCewb = get(v, 'cewbNo', 'CewbNo') || '-';
      const vMulti = get(v, 'multiVehInfo', 'MultiVehInfo') || '-';

      const vDocDisplay = vTransDocNo
        ? `${vNo}/${vTransDocNo} &amp; ${vTransDocDate}`
        : `${vNo}/${docNo} &amp; ${docDate}`;

      vehicleRowsHtml += `
        <tr>
          <td>${vMode}</td>
          <td>${vDocDisplay}</td>
          <td>${vFrom}</td>
          <td>${vEnteredDate}</td>
          <td>${vEnteredBy}</td>
          <td>${vCewb}</td>
          <td>${vMulti}</td>
        </tr>`;
    }
  } else if (singleVehicleNo) {
    const vDocDisplay = singleTransDocNo
      ? `${singleVehicleNo}/${singleTransDocNo} &amp; ${singleTransDocDate}`
      : `${singleVehicleNo}/${docNo} &amp; ${docDate}`;

    vehicleRowsHtml = `
      <tr>
        <td>${getTransModeName(singleTransMode)}</td>
        <td>${vDocDisplay}</td>
        <td></td>
        <td>${ewayBillDate ? ewayBillDate.split(' ')[0] : ''}</td>
        <td>${generatedByGstin}</td>
        <td>-</td>
        <td>-</td>
      </tr>`;
  } else {
    vehicleRowsHtml = `
      <tr>
        <td colspan="7" style="text-align:center;">No vehicle details available</td>
      </tr>`;
  }

  // ── Generate Barcode SVG ──
  const barcodeSvg = generateCode128Svg(ewbNo, 350, 55);

  // ── IRN Section (conditional) ──
  const irnSectionHtml = irn ? `
    <div class="section-header">IRN Details</div>
    <table class="details-table">
      <tr><td class="label">IRN:</td><td class="value" style="word-break:break-all; font-size:11px;">${irn}</td></tr>
      <tr><td class="label">Ack No:</td><td class="value">${ackNo}</td></tr>
      <tr><td class="label">Ack Date:</td><td class="value">${ackDate}</td></tr>
    </table>
  ` : '';

  // ── Complete HTML ──
  return `
  <div id="ewb-print-page" class="page-break">
    <!-- Header with Title and QR Code -->
    <div class="header">
      <h1>e-Way Bill</h1>
      ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" class="qr-code" alt="QR Code" />` : ''}
    </div>

    <!-- E-Way Bill Summary Details -->
    <table class="details-table">
      <tr>
        <td class="label">E-Way Bill No:</td>
        <td class="value">${ewbNo}</td>
      </tr>
      <tr>
        <td class="label">E-Way Bill Date:</td>
        <td class="value">${ewayBillDate}</td>
      </tr>
      <tr>
        <td class="label">Generated By:</td>
        <td class="value">${generatedByGstin}${generatedByName ? '&nbsp;&nbsp;&nbsp;' + generatedByName : ''}</td>
      </tr>
      <tr>
        <td class="label">Valid From:</td>
        <td class="value">${ewayBillDate}${distance ? ' [' + distance + 'KM ]' : ''}</td>
      </tr>
      <tr>
        <td class="label">Valid Until:</td>
        <td class="value">${validUpto}</td>
      </tr>
    </table>

    <!-- IRN Details (conditional) -->
    ${irnSectionHtml}

    <!-- Part - A -->
    <div class="section-header">Part - A</div>
    <table class="details-table">
      <tr>
        <td class="label">GSTIN of Supplier</td>
        <td class="value">
          ${fromGstin}
          <span class="value-sub">${fromTrdName}</span>
        </td>
      </tr>
      <tr>
        <td class="label">Place of Dispatch</td>
        <td class="value">${dispatchAddress}</td>
      </tr>
      <tr>
        <td class="label">GSTIN of Recipient</td>
        <td class="value">
          ${toGstin}
          <span class="value-sub">${toTrdName}</span>
        </td>
      </tr>
      <tr>
        <td class="label">Place of Delivery</td>
        <td class="value">${deliveryAddress}</td>
      </tr>
      <tr>
        <td class="label">Document No.</td>
        <td class="value">${docNo}</td>
      </tr>
      <tr>
        <td class="label">Document Date</td>
        <td class="value">${docDate}</td>
      </tr>
      <tr>
        <td class="label">Transaction Type:</td>
        <td class="value">${transactionType}</td>
      </tr>
      <tr>
        <td class="label">Value of Goods</td>
        <td class="value">${totInvValue}</td>
      </tr>
      <tr>
        <td class="label">HSN Code</td>
        <td class="value">${hsnDisplay}</td>
      </tr>
      <tr>
        <td class="label">Reason for Transportation</td>
        <td class="value">${reasonForTransport}</td>
      </tr>
      <tr>
        <td class="label">Transporter</td>
        <td class="value">${transporterDisplay}</td>
      </tr>
    </table>

    <!-- Part - B -->
    <div class="section-header">Part - B</div>
    <table class="part-b-table">
      <thead>
        <tr>
          <th style="width:55px;">Mode</th>
          <th style="width:155px;">Vehicle / Trans<br/>Doc No &amp; Dt.</th>
          <th style="width:60px;">From</th>
          <th style="width:90px;">Entered Date</th>
          <th style="width:135px;">Entered By</th>
          <th style="width:85px;">CEWB No.<br/>(If any)</th>
          <th style="width:90px;">Multi Veh.Info<br/>(If any)</th>
        </tr>
      </thead>
      <tbody>
        ${vehicleRowsHtml}
      </tbody>
    </table>

    <!-- Barcode Footer -->
    <div class="barcode-container">
      ${barcodeSvg}
      <div class="barcode-number">${ewbNo}</div>
    </div>
  </div>`;
};

export const generateEwayBillHtml = (params: EwayBillPrintParams): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>e-Way Bill - ${params.ewbNo}</title>
  <style>
    @media print {
      @page { margin: 10mm 12mm; size: A4 portrait; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      margin: 0;
      padding: 0;
      background: #fff;
    }
    ${getEwayBillStyles()}
  </style>
</head>
<body>
  ${getEwayBillContentHtml(params)}
</body>
</html>`;
};
