import { supabase } from '@/integrations/supabase/client';
import { Sale, Customer, Item, OutwardEntry } from '@/types';
import { CompanySetting } from '@/types/company';

// Helper to format date in DD/MM/YYYY format
const formatDateDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Helper to safely check if an error message contains a specific numeric error code as a distinct word
const hasErrorCode = (message: string | null | undefined, code: string): boolean => {
  if (!message) return false;
  const regex = new RegExp(`(?<!\\d)${code}(?!\\d)`);
  return regex.test(message);
};

// Helper to format unit code to standard 3 to 8 character UQC
const formatUnitCode = (unit: string | null | undefined) => {
  if (!unit) return 'NOS';
  const u = unit.trim().toUpperCase();
  if (!u) return 'NOS';
  
  // Direct mappings for common units in Cash Ledger app
  if (u === 'KG' || u === 'KGS' || u === 'KILO' || u === 'KILOGRAM' || u === 'KILOGRAMS') return 'KGS';
  if (u === 'PC' || u === 'PCS' || u === 'PIECE' || u === 'PIECES') return 'PCS';
  if (u === 'BG' || u === 'BGS' || u === 'BAG' || u === 'BAGS') return 'BAG';
  if (u === 'BX' || u === 'BOX' || u === 'BOXES') return 'BOX';
  if (u === 'TN' || u === 'TNE' || u === 'TON' || u === 'TONS' || u === 'TONNES') return 'TNE';
  if (u === 'NO' || u === 'NOS' || u === 'NUMBER' || u === 'NUMBERS') return 'NOS';
  if (u === 'MTR' || u === 'MTRS' || u === 'METER' || u === 'METERS' || u === 'MT' || u === 'M') return 'MTR';
  if (u === 'G' || u === 'GM' || u === 'GMS' || u === 'GRAM' || u === 'GRAMS') return 'GMS';
  if (u === 'BTL' || u === 'BTLS' || u === 'BOTTLE' || u === 'BOTTLES') return 'BTL';
  if (u === 'DOZ' || u === 'DOZEN' || u === 'DOZENS') return 'DOZ';
  if (u === 'SET' || u === 'SETS') return 'SET';
  if (u === 'ROL' || u === 'ROLS' || u === 'ROLL' || u === 'ROLLS') return 'ROL';
  if (u === 'PAC' || u === 'PACK' || u === 'PACKS' || u === 'PKT' || u === 'PKTS') return 'PAC';
  if (u === 'LTR' || u === 'LTRS' || u === 'LITRE' || u === 'LITRES' || u === 'L') return 'KLR';
  
  let formatted = u;
  if (formatted.length < 3) {
    formatted = `${formatted}S`.padEnd(3, 'S');
  }
  return formatted.substring(0, 8);
};

// Helper to format HSN code to standard 6 to 8 character string
const formatHsnCode = (hsn: string | null | undefined): string => {
  if (!hsn) return '520511'; // Default service/others/yarn HSN if missing
  const clean = hsn.replace(/[^\d]/g, '');
  if (clean.length < 6) {
    return clean.padEnd(6, '0');
  }
  return clean.substring(0, 8);
};


// Helper to derive state code from GSTIN
const getStateCodeFromGstin = (gstin: string | null | undefined, defaultStateCode: string = '33'): string => {
  if (!gstin) return defaultStateCode;
  const clean = gstin.trim();
  if (clean.length >= 2) {
    const code = clean.substring(0, 2);
    if (/^\d{2}$/.test(code)) {
      return code;
    }
  }
  return defaultStateCode;
};

// Helper to get a valid pin code for a derived state code if there is a mismatch
const getValidPinForState = (
  derivedStateCode: string,
  configuredStateCode: string | null | undefined,
  originalPin: string | number | null | undefined
): number => {
  const pinStr = originalPin ? originalPin.toString().trim() : '';
  
  // If the derived state matches the configured state, keep the original pin if it is a valid 6 digit number
  const cleanDerived = derivedStateCode.trim().padStart(2, '0');
  const cleanConfigured = configuredStateCode ? configuredStateCode.trim().padStart(2, '0') : '';
  
  if (cleanDerived === cleanConfigured && pinStr.length === 6 && /^\d{6}$/.test(pinStr)) {
    return parseInt(pinStr, 10);
  }
  
  const statePinDefaults: Record<string, string> = {
    '01': '190001', // Jammu & Kashmir
    '02': '171001', // Himachal Pradesh
    '03': '141001', // Punjab
    '04': '160017', // Chandigarh
    '05': '248001', // Uttarakhand
    '06': '121001', // Haryana
    '07': '110001', // Delhi
    '08': '302001', // Rajasthan
    '09': '226001', // Uttar Pradesh
    '10': '800001', // Bihar
    '11': '797112', // Sikkim
    '12': '791111', // Arunachal Pradesh
    '13': '797001', // Nagaland
    '14': '795001', // Manipur
    '15': '796001', // Mizoram
    '16': '799001', // Tripura
    '17': '793001', // Meghalaya
    '18': '781001', // Assam
    '19': '700001', // West Bengal
    '20': '834001', // Jharkhand
    '21': '751001', // Odisha
    '22': '492001', // Chhattisgarh
    '23': '462001', // Madhya Pradesh
    '24': '380001', // Gujarat
    '26': '396230', // Dadra & Nagar Haveli and Daman & Diu
    '27': '400001', // Maharashtra
    '29': '560001', // Karnataka
    '30': '403001', // Goa
    '31': '682001', // Lakshadweep
    '32': '682001', // Kerala
    '33': '600001', // Tamil Nadu
    '34': '605001', // Puducherry
    '35': '744101', // Andaman & Nicobar Islands
    '36': '500001', // Telangana
    '37': '520001', // Andhra Pradesh
    '38': '792001', // Ladakh
    '97': '999999', // Other Territory
  };

  const defaultPin = statePinDefaults[cleanDerived] || '600001';
  return parseInt(defaultPin, 10);
};

// Helper to handle GSP non-ok responses (400, 412, etc.) and extract detailed error message if present
const handleNonOkResponse = async (response: Response, defaultErrorPrefix: string): Promise<never> => {
  let text = '';
  try {
    text = await response.text();
    console.error(`Non-OK response body from ${response.url}:`, text);
  } catch (err) {
    // ignore read failure
  }

  if (text) {
    try {
      const result = JSON.parse(text);
      const errorMsg = result.ErrorDetails?.[0]?.ErrorMessage || result.error?.message || result.message || result.Message || result.errorMessage || result.ErrorMessage;
      const errorCode = result.ErrorDetails?.[0]?.ErrorCode || result.error?.error_cd || result.errorCode || result.ErrorCode || '';
      if (errorMsg) {
        throw new Error(`${defaultErrorPrefix}: ${errorMsg}${errorCode ? ` (${errorCode})` : ''}`);
      }
    } catch (e: any) {
      if (e.message && e.message.includes(defaultErrorPrefix)) {
        throw e;
      }
    }

    // Strip HTML tags and summarize text if not JSON
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (cleanText) {
      const shortText = cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
      throw new Error(`${defaultErrorPrefix}: ${shortText}`);
    }
  }

  throw new Error(`${defaultErrorPrefix} (Status Code: ${response.status})`);
};

const isEWayBillAuthUnavailableError = (err: any): boolean => {
  const message = err?.message || String(err || '');
  return message.includes('NIC404') || message.includes('Upstream Server Error: Not Found');
};

const parseMaybeJson = (value: any): any => {
  if (typeof value !== 'string' || !value.trim()) {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const findEWayBillDetailsInObject = (value: any, expectedEwbNo?: string, depth = 0): any | null => {
  if (!value || depth > 6) {
    return null;
  }

  const parsed = parseMaybeJson(value);
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const directEwbNo = (parsed.EwbNo || parsed.ewbNo || parsed.EwayBillNo || parsed.ewayBillNo)?.toString();
  if (directEwbNo && (!expectedEwbNo || directEwbNo === expectedEwbNo)) {
    return parsed;
  }

  for (const child of Object.values(parsed)) {
    const found = findEWayBillDetailsInObject(child, expectedEwbNo, depth + 1);
    if (found) {
      return found;
    }
  }

  return null;
};

// Helper to extract error message from dynamic GSP JSON response objects
const extractErrorMessage = (result: any, defaultMsg: string): string => {
  if (!result) return defaultMsg;
  const msg = result.ErrorDetails?.[0]?.ErrorMessage || 
              result.error?.message || 
              result.ErrorMessage || 
              result.ErrorMsg || 
              result.errorMsg || 
              result.message || 
              result.Message;
  const code = result.ErrorDetails?.[0]?.ErrorCode || 
               result.error?.error_cd || 
               result.ErrorCode || 
               result.errorCode || 
               result.ErrorCode;
  if (msg) {
    return `${msg}${code ? ` (${code})` : ''}`;
  }
  return defaultMsg;
};

// Helper to extract calculated distance from GSP distance mismatch error messages (e.g. error 702 / 4013)
const parseDistanceLimit = (errorMsg: string | null | undefined): number | null => {
  if (!errorMsg) return null;
  
  try {
    // Check if the error message contains a JSON-like substring representing the pincodes and distance
    const jsonMatch = errorMsg.match(/\{.*?\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      if (data.distance !== undefined && data.distance !== null) {
        const d = parseInt(data.distance.toString(), 10);
        if (!isNaN(d) && d >= 0) return d;
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  // Fallback to regex checks (e.g., "distance:36" or "distance":36 or "distance: 36")
  const regexes = [
    /distance["'\s:]+(\d+)/i,
    /(\d+)\s*km/i
  ];

  for (const regex of regexes) {
    const match = errorMsg.match(regex);
    if (match) {
      const d = parseInt(match[1], 10);
      if (!isNaN(d) && d >= 0) return d;
    }
  }

  return null;
};



interface TokenCache {
  token: string;
  expiry: number;
}

export const einvoiceService = {
  /**
   * Helper to execute a request with failover support for production.
   * Urged by TaxPro GSP Team:
   * - Primary Server: https://einvapi.charteredinfo.com
   * - Backup1: https://einvapimum1.charteredinfo.com
   * - Backup2: https://einvapidel2.charteredinfo.com
   */
  async executeRequest(
    sandbox: boolean, 
    pathAndQuery: string, 
    options: RequestInit
  ): Promise<Response> {
    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) {
      throw new Error('GSP API requests can only be executed in a browser context.');
    }

    // Parse path, query parameters, and secrets from pathAndQuery
    const urlObj = new URL(pathAndQuery, 'http://localhost');
    const cleanPath = urlObj.pathname;
    const gstin = urlObj.searchParams.get('Gstin') || urlObj.searchParams.get('gstin') || '';
    const authToken = urlObj.searchParams.get('AuthToken') || urlObj.searchParams.get('authtoken') || '';

    // Deduce serviceType based on path
    let serviceType = 'einvoice';
    if (cleanPath.includes('/auth')) {
      if (cleanPath.includes('/eivital') || cleanPath.includes('/eicore') || cleanPath.includes('/eivapi')) {
        serviceType = 'einvoice-auth';
      } else {
        serviceType = 'ewaybill-auth';
      }
    } else if (cleanPath.includes('/ewaybillapi')) {
      serviceType = 'ewaybill';
    } else if (cleanPath.includes('/aspapi')) {
      serviceType = 'print';
    }

    // Strip secrets from queryParams to prevent logging or transmitting them
    const queryParams: Record<string, string> = {};
    urlObj.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'aspid' &&
        lowerKey !== 'password' &&
        lowerKey !== 'gstin' &&
        lowerKey !== 'user_name' &&
        lowerKey !== 'username' &&
        lowerKey !== 'authtoken' &&
        lowerKey !== 'einvpwd' &&
        lowerKey !== 'ewbpwd'
      ) {
        queryParams[key] = val;
      }
    });

    // Clean headers to remove plain-text secrets
    const cleanHeaders: Record<string, string> = {};
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((val, key) => {
          const lowerKey = key.toLowerCase();
          if (lowerKey !== 'aspid' && lowerKey !== 'password' && lowerKey !== 'gstin') {
            cleanHeaders[key] = val;
          }
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, val]) => {
          const lowerKey = key.toLowerCase();
          if (lowerKey !== 'aspid' && lowerKey !== 'password' && lowerKey !== 'gstin') {
            cleanHeaders[key] = val;
          }
        });
      } else {
        for (const [key, val] of Object.entries(options.headers)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey !== 'aspid' && lowerKey !== 'password' && lowerKey !== 'gstin') {
            cleanHeaders[key] = val;
          }
        }
      }
    }

    let requestBody: any = null;
    if (options.body) {
      try {
        requestBody = JSON.parse(options.body as string);
      } catch {
        requestBody = options.body;
      }
    }

    console.log(`[Proxy] Invoking taxpro-gsp edge function for path: ${cleanPath}`);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://swxbydfypyojcerentsz.supabase.co';
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    
    // Get caller user session token for secure authorization
    const { data: { session } } = await supabase.auth.getSession();
    const userToken = session?.access_token || '';

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/taxpro-gsp`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        sandbox,
        serviceType,
        path: cleanPath,
        method: options.method || 'GET',
        queryParams,
        headers: cleanHeaders,
        body: requestBody,
        authToken,
        gstin
      })
    });

    return response;
  },

  /**
   * Performs authentication to get AuthToken. Caches token in sessionStorage.
   */
  async authenticate(settings: CompanySetting, forceRefresh = false): Promise<string> {
    const sandbox = settings.einvoice_sandbox ?? true;
    const aspid = settings.einvoice_aspid || '';
    const password = settings.einvoice_asppassword || '';
    const gstin = settings.gstin || '';
    const username = settings.einvoice_username || '';
    const eInvPwd = settings.einvoice_password || '';

    if (!aspid || !password || !gstin || !username || !eInvPwd) {
      throw new Error('E-Invoice GSP credentials are not fully configured in Company Settings.');
    }

    const cacheKey = `einvoice_token_${gstin}_${sandbox ? 'sandbox' : 'prod'}`;
    if (forceRefresh) {
      sessionStorage.removeItem(cacheKey);
    } else {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const cachedData: TokenCache = JSON.parse(cached);
        if (cachedData.expiry > Date.now()) {
          return cachedData.token;
        }
      }
    }

    const pathAndQuery = `/eivital/dec/v1.04/auth?aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&Gstin=${encodeURIComponent(gstin)}&User_name=${encodeURIComponent(username)}&eInvPwd=${encodeURIComponent(eInvPwd)}`;

    console.log('Authenticating with TaxPro GSP...');
    const response = await this.executeRequest(sandbox, pathAndQuery, {
      method: 'GET',
      headers: {
        'aspid': aspid,
        'password': password,
      }
    });

    if (!response.ok) {
      await handleNonOkResponse(response, 'Authentication server returned error');
    }

    const result = await response.json();
    console.log('Authentication response:', result);

    const statusVal = result.Status !== undefined ? result.Status : (result.status !== undefined ? result.status : result.status_cd);
    const isSuccess = statusVal === 1 || statusVal === '1' || statusVal === 'SUCCESS' || statusVal === 'success';
    
    let token = '';
    if (result.Data && typeof result.Data === 'object') {
      token = result.Data.AuthToken || result.Data.authtoken || result.Data.token || result.Data.Auth_Token;
    }
    if (!token && result.data && typeof result.data === 'object') {
      token = result.data.AuthToken || result.data.authtoken || result.data.token || result.data.Auth_Token;
    }
    if (!token) {
      token = result.AuthToken || result.authtoken || result.token || result.Auth_Token;
    }

    if (isSuccess && token) {
      // Tokens are typically valid for 6 hours. Cache for 5 hours and 50 minutes to be safe.
      const expiry = Date.now() + 5.8 * 60 * 60 * 1000;
      sessionStorage.setItem(cacheKey, JSON.stringify({ token, expiry }));
      return token;
    } else {
      console.error('GSP authentication error result:', JSON.stringify(result));
      const fullError = extractErrorMessage(result, 'Unknown authentication error');
      throw new Error(`GSP Authentication Failed: ${fullError}`);
    }
  },

  /**
   * Performs authentication to get E-Way Bill AuthToken. Caches token in sessionStorage.
   */
  async authenticateEWayBill(settings: CompanySetting, forceRefresh = false): Promise<string> {
    const sandbox = settings.einvoice_sandbox ?? true;
    const aspid = settings.einvoice_aspid || '';
    const password = settings.einvoice_asppassword || '';
    const gstin = settings.gstin || '';
    const username = settings.einvoice_username || '';
    const ewbpwd = settings.ewaybill_password || '';

    if (!aspid || !password || !gstin || !username || !ewbpwd) {
      throw new Error('E-Way Bill GSP credentials are not fully configured in Company Settings (E-Way Bill password is required).');
    }

    const cacheKey = `ewaybill_token_${gstin}_${sandbox ? 'sandbox' : 'prod'}`;
    if (forceRefresh) {
      sessionStorage.removeItem(cacheKey);
    } else {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const cachedData: TokenCache = JSON.parse(cached);
        if (cachedData.expiry > Date.now()) {
          return cachedData.token;
        }
      }
    }

    const pathAndQuery = `/ewaybillapi/dec/v1.03/auth?action=ACCESSTOKEN&aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&gstin=${encodeURIComponent(gstin)}&username=${encodeURIComponent(username)}&ewbpwd=${encodeURIComponent(ewbpwd)}`;

    console.log('Authenticating for E-Way Bill with TaxPro GSP...');
    const response = await this.executeRequest(sandbox, pathAndQuery, {
      method: 'GET',
      headers: {
        'aspid': aspid,
        'password': password,
      }
    });

    if (!response.ok) {
      await handleNonOkResponse(response, 'E-Way Bill authentication server returned error');
    }

    const result = await response.json();
    console.log('E-Way Bill Authentication response:', result);

    const statusVal = result.Status !== undefined ? result.Status : (result.status !== undefined ? result.status : result.status_cd);
    const isSuccess = statusVal === 1 || statusVal === '1' || statusVal === 'SUCCESS' || statusVal === 'success';
    
    let token = '';
    if (result.Data && typeof result.Data === 'object') {
      token = result.Data.AuthToken || result.Data.authtoken || result.Data.token || result.Data.Auth_Token;
    }
    if (!token && result.data && typeof result.data === 'object') {
      token = result.data.AuthToken || result.data.authtoken || result.data.token || result.data.Auth_Token;
    }
    if (!token) {
      token = result.AuthToken || result.authtoken || result.token || result.Auth_Token;
    }

    if (isSuccess && token) {
      // Cache for 5.8 hours
      const expiry = Date.now() + 5.8 * 60 * 60 * 1000;
      sessionStorage.setItem(cacheKey, JSON.stringify({ token, expiry }));
      return token;
    } else {
      console.error('GSP E-Way Bill authentication error result:', JSON.stringify(result));
      const fullError = extractErrorMessage(result, 'Unknown authentication error');
      throw new Error(`GSP E-Way Bill Authentication Failed: ${fullError}`);
    }
  },

  /**
   * Generate E-Invoice (IRN) and optionally E-Way Bill
   */
  async generateEInvoice(params: {
    sale: Sale;
    allSales: Sale[];
    allItems: Item[];
    customer: Customer;
    item: Item;
    companySettings: CompanySetting;
    outwardEntry?: OutwardEntry | null;
    generateEwayBill: boolean;
    distance?: number;
    transporterId?: string;
    transporterName?: string;
    transDocNo?: string;
    transDocDt?: string;
    vehType?: 'R' | 'O';
    transMode?: '1' | '2' | '3' | '4';
  }): Promise<{ irn: string; ewayBillNo?: string; signedQrcode: string }> {
    const {
      sale,
      allSales,
      allItems,
      customer,
      item,
      companySettings,
      outwardEntry,
      generateEwayBill,
      distance = 0,
      transporterId = '',
      transporterName = '',
      transDocNo = '',
      transDocDt = '',
      vehType = 'R',
      transMode = '1',
    } = params;

    // 1. Authenticate first
    const token = await this.authenticate(companySettings);
    const sandbox = companySettings.einvoice_sandbox ?? true;

    // 2. Prepare payload
    const calculateTotals = () => {
      return allSales.reduce((acc, s, index) => {
        const currentItem = allItems[index] || item;
        const base = s.quantity * s.rate;
        const gst = base * (currentItem.gst_percentage / 100);
        return {
          baseAmount: acc.baseAmount + base,
          gstAmount: acc.gstAmount + gst,
          totalAmount: acc.totalAmount + base + gst,
        };
      }, { baseAmount: 0, gstAmount: 0, totalAmount: 0 });
    };

    const { baseAmount, gstAmount, totalAmount } = calculateTotals();
    const roundedBaseAmount = Math.round(baseAmount * 100) / 100;
    const roundedGstAmount = Math.round(gstAmount * 100) / 100;
    const roundedCgstAmount = Math.round((roundedGstAmount / 2) * 100) / 100;
    const roundedSgstAmount = Math.round((roundedGstAmount / 2) * 100) / 100;
    const roundedTotalAmount = Math.round((roundedBaseAmount + roundedCgstAmount + roundedSgstAmount) * 100) / 100;

    const customerAddress = customer.address_english || customer.address_tamil || '';
    const buyerAddr1 = customerAddress.substring(0, 100);
    const buyerAddr2 = customerAddress.length > 100 ? customerAddress.substring(100, 200) : '';

    const addressParts = customerAddress.split(',');
    let buyerLoc = addressParts.length > 0 ? addressParts[addressParts.length - 1].trim() : '';
    buyerLoc = buyerLoc.replace(/\d{6}/g, '').replace(/[^\w\s]/g, '').trim() || 'Tamil Nadu';

    // Vehicle details
    const vehicleNo = sale.lorry_no || outwardEntry?.lorry_no || '';

    // Combined E-Way Bill Details if checked
    let ewbDtls = null;
    if (generateEwayBill && vehicleNo) {
      ewbDtls = {
        TransId: transporterId || null,
        TransName: transporterName || null,
        Distance: distance || 0,
        TransDocNo: transDocNo || null,
        TransDocDt: transDocDt ? formatDateDDMMYYYY(transDocDt) : null,
        VehNo: vehicleNo.replace(/\s+/g, '').toUpperCase(),
        VehType: vehType,
        TransMode: transMode
      };
    }

    const payload = {
      Version: '1.1',
      TranDtls: {
        TaxSch: 'GST',
        SupTyp: 'B2B',
        IgstOnIntra: 'N',
        RegRev: 'N',
        EcmGstin: null
      },
      DocDtls: {
        Typ: 'INV',
        No: sale.bill_serial_no,
        Dt: formatDateDDMMYYYY(sale.sale_date)
      },
      SellerDtls: {
        Gstin: companySettings.gstin,
        LglNm: companySettings.company_name,
        Addr1: companySettings.address_line1,
        Addr2: companySettings.address_line2 || null,
        Loc: companySettings.locality,
        Pin: getValidPinForState(
          getStateCodeFromGstin(companySettings.gstin, companySettings.state_code),
          companySettings.state_code,
          companySettings.pin_code
        ),
        Stcd: getStateCodeFromGstin(companySettings.gstin, companySettings.state_code),
        Ph: companySettings.phone || null,
        Em: companySettings.email || null
      },
      BuyerDtls: {
        Gstin: customer.gstin || 'URP',
        LglNm: customer.name_english || customer.name_tamil || 'UNKNOWN',
        TrdNm: customer.name_english || customer.name_tamil || 'UNKNOWN',
        Addr1: buyerAddr1,
        Addr2: buyerAddr2 || null,
        Loc: buyerLoc,
        Pin: getValidPinForState(
          getStateCodeFromGstin(customer.gstin || '', customer.state_code || '33'),
          customer.state_code || '33',
          customer.pin_code
        ),
        Pos: getStateCodeFromGstin(customer.gstin || '', customer.place_of_supply || customer.state_code || '33'),
        Stcd: getStateCodeFromGstin(customer.gstin || '', customer.state_code || '33'),
        Ph: customer.phone || null,
        Em: customer.email || null
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
        InvRm: 'NICGEPP'
      },
      ItemList: allSales.map((s, index) => {
        const currentItem = allItems[index] || item;
        const itemBase = s.quantity * s.rate;
        const itemGst = itemBase * (currentItem.gst_percentage / 100);
        const itemCgst = Math.round((itemGst / 2) * 100) / 100;
        const itemSgst = Math.round((itemGst / 2) * 100) / 100;
        const itemTotal = Math.round((itemBase + itemCgst + itemSgst) * 100) / 100;

        return {
          SlNo: (index + 1).toString(),
          PrdDesc: currentItem.name_english,
          IsServc: 'N',
          HsnCd: formatHsnCode(currentItem.hsn_no),
          Qty: s.quantity,
          FreeQty: 0,
          Unit: formatUnitCode(currentItem.unit),
          UnitPrice: Math.round(s.rate * 100) / 100,
          TotAmt: Math.round(itemBase * 100) / 100,
          Discount: 0,
          PreTaxVal: 0,
          AssAmt: Math.round(itemBase * 100) / 100,
          GstRt: currentItem.gst_percentage,
          IgstAmt: 0,
          CgstAmt: itemCgst,
          SgstAmt: itemSgst,
          CesRt: 0,
          CesAmt: 0,
          CesNonAdvlAmt: 0,
          StateCesRt: 0,
          StateCesAmt: 0,
          StateCesNonAdvlAmt: 0,
          OthChrg: 0,
          TotItemVal: itemTotal
        };
      }),
      ...(ewbDtls ? { EwbDtls: ewbDtls } : {})
    };

    console.log('Sending payload to TaxPro IRN Generation:', payload);

    const aspid = companySettings.einvoice_aspid || '';
    const password = companySettings.einvoice_asppassword || '';
    const gstin = companySettings.gstin || '';
    const username = companySettings.einvoice_username || '';

    let finalToken = token;
    let finalDistance = distance;

    const makeRequest = async (tokenVal: string, distVal: number) => {
      if (payload.EwbDtls) {
        payload.EwbDtls.Distance = distVal;
      }
      const pathAndQuery = `/eicore/dec/v1.03/Invoice?aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&Gstin=${encodeURIComponent(gstin)}&AuthToken=${encodeURIComponent(tokenVal)}&QrCodeSize=250&User_name=${encodeURIComponent(username)}`;
      return await this.executeRequest(sandbox, pathAndQuery, {
        method: 'POST',
        headers: {
          'aspid': aspid,
          'password': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    };

    let response: Response;
    try {
      response = await makeRequest(finalToken, finalDistance);
      if (!response.ok) {
        await handleNonOkResponse(response, 'IRN generation server error');
      }
    } catch (err: any) {
      // 1. Check if token expired
      if (err.message && (err.message.includes('GSP752') || err.message.includes('AuthToken not found') || err.message.includes('expired'))) {
        console.warn('AuthToken expired. Retrying IRN generation with a fresh token...');
        finalToken = await this.authenticate(companySettings, true);
        try {
          response = await makeRequest(finalToken, finalDistance);
          if (!response.ok) {
            await handleNonOkResponse(response, 'IRN generation server error');
          }
        } catch (innerErr: any) {
          // If the second attempt failed due to distance mismatch
          if (innerErr.message && (hasErrorCode(innerErr.message, '702') || hasErrorCode(innerErr.message, '4013') || innerErr.message.includes('distance'))) {
            const correctDist = parseDistanceLimit(innerErr.message);
            if (correctDist) {
              console.warn(`Distance mismatch after token refresh. Retrying IRN generation with corrected distance: ${correctDist} km`);
              finalDistance = correctDist;
              response = await makeRequest(finalToken, finalDistance);
              if (!response.ok) {
                await handleNonOkResponse(response, 'IRN generation server error');
              }
            } else {
              throw innerErr;
            }
          } else {
            throw innerErr;
          }
        }
      } 
      // 2. Check if distance mismatch on first attempt
      else if (err.message && (hasErrorCode(err.message, '702') || hasErrorCode(err.message, '4013') || err.message.includes('distance'))) {
        const correctDist = parseDistanceLimit(err.message);
        if (correctDist) {
          console.warn(`Distance mismatch. Retrying IRN generation with corrected distance: ${correctDist} km`);
          finalDistance = correctDist;
          try {
            response = await makeRequest(finalToken, finalDistance);
            if (!response.ok) {
              await handleNonOkResponse(response, 'IRN generation server error');
            }
          } catch (innerErr: any) {
            // What if the second attempt fails with expired token?
            if (innerErr.message && (innerErr.message.includes('GSP752') || innerErr.message.includes('AuthToken not found') || innerErr.message.includes('expired'))) {
              console.warn('AuthToken expired on retry. Retrying IRN generation with a fresh token...');
              finalToken = await this.authenticate(companySettings, true);
              response = await makeRequest(finalToken, finalDistance);
              if (!response.ok) {
                await handleNonOkResponse(response, 'IRN generation server error');
              }
            } else {
              throw innerErr;
            }
          }
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    const result = await response.json();
    console.log('IRN Generation Response:', result);

    const isSuccess = result.Status === 1 || result.Status === '1' || result.status_cd === '1' || result.status === 1 || result.status === '1';

    let parsedData = result.Data || result.data;
    if (typeof parsedData === 'string' && parsedData) {
      try {
        parsedData = JSON.parse(parsedData);
      } catch (e) {
        // ignore
      }
    }

    const isDuplicate = result.ErrorDetails?.[0]?.ErrorCode === '2150' || 
                        result.ErrorDetails?.[0]?.ErrorMessage?.includes('Duplicate') ||
                        result.ErrorDetails?.[0]?.ErrorMessage?.includes('duplicate');
    const dupInfo = result.InfoDtls?.find((info: any) => info.InfCd === 'DUPIRN' || info.Desc?.Irn);

    if ((isSuccess && parsedData?.Irn) || (isDuplicate && dupInfo)) {
      const data = parsedData || {};
      const irn = data.Irn || dupInfo.Desc.Irn;
      const ackNo = (data.AckNo || dupInfo.Desc.AckNo)?.toString() || '';
      const ackDate = data.AckDt || dupInfo.Desc.AckDt || '';
      const signedInvoice = data.SignedInvoice || '';
      const signedQrcode = data.SignedQRCode || '';
      const ewayBillNo = (data.EwbNo || data.ewbNo || result.EwbNo || result.ewbNo)?.toString() || '';
      const ewayBillDate = data.EwbDt || '';
      const ewayBillValidUpto = data.EwbValidTill || data.validUpto || data.ValidUpto || '';

      // Update in Supabase
      const updateData: any = {
        irn,
        ack_no: ackNo,
        ack_date: ackDate,
        signed_invoice: signedInvoice,
        signed_qrcode: signedQrcode,
        einvoice_status: 'GENERATED',
      };

      if (ewayBillNo) {
        updateData.eway_bill_no = ewayBillNo;
        updateData.eway_bill_date = ewayBillDate;
        updateData.eway_bill_valid_upto = ewayBillValidUpto || null;
        updateData.eway_bill_status = 'GENERATED';
      }

      const { error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('bill_serial_no', sale.bill_serial_no);

      if (error) {
        console.error('Error updating sale in DB:', error);
      }

      return { irn, ewayBillNo, signedQrcode, correctedDistance: finalDistance, ackNo, ackDate, ewayBillDate, ewayBillValidUpto };
    } else {
      console.error('IRN generation error result:', JSON.stringify(result));
      const fullError = extractErrorMessage(result, 'Failed to generate IRN');
      throw new Error(`E-Invoice Generation Failed: ${fullError}`);
    }
  },

  /**
   * Generate E-Way Bill separately for an existing IRN
   */
  async generateEWayBill(params: {
    sale: Sale;
    companySettings: CompanySetting;
    distance: number;
    transporterId?: string;
    transporterName?: string;
    transDocNo?: string;
    transDocDt?: string;
    vehType?: 'R' | 'O';
    transMode?: '1' | '2' | '3' | '4';
    outwardEntry?: OutwardEntry | null;
  }): Promise<{ ewayBillNo: string; ewayBillDate: string }> {
    const {
      sale,
      companySettings,
      distance,
      transporterId = '',
      transporterName = '',
      transDocNo = '',
      transDocDt = '',
      vehType = 'R',
      transMode = '1',
      outwardEntry
    } = params;

    if (!sale.irn) {
      throw new Error('E-Invoice (IRN) must be generated before generating E-Way Bill.');
    }

    const token = await this.authenticate(companySettings);
    const sandbox = companySettings.einvoice_sandbox ?? true;

    const vehicleNo = sale.lorry_no || outwardEntry?.lorry_no || '';
    if (!vehicleNo) {
      throw new Error('Vehicle number (Lorry No) is required to generate E-Way Bill.');
    }

    try {
      const payload = {
        Irn: sale.irn,
        Distance: distance,
        TransMode: transMode,
        TransId: transporterId || null,
        TransName: transporterName || null,
        TransDocDt: transDocDt ? formatDateDDMMYYYY(transDocDt) : null,
        TransDocNo: transDocNo || null,
        VehNo: vehicleNo.replace(/\s+/g, '').toUpperCase(),
        VehType: vehType,
      };

      console.log('Sending payload to TaxPro E-Way Bill Generation:', payload);

      const aspid = companySettings.einvoice_aspid || '';
      const password = companySettings.einvoice_asppassword || '';
      const gstin = companySettings.gstin || '';
      const username = companySettings.einvoice_username || '';

      let finalToken = token;
      let finalDistance = distance;

      const makeRequest = async (tokenVal: string, distVal: number) => {
        payload.Distance = distVal;
        const pathAndQuery = `/eiewb/dec/v1.03/ewaybill?aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&Gstin=${encodeURIComponent(gstin)}&User_name=${encodeURIComponent(username)}&AuthToken=${encodeURIComponent(tokenVal)}`;
        return await this.executeRequest(sandbox, pathAndQuery, {
          method: 'POST',
          headers: {
            'aspid': aspid,
            'password': password,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      };

      const isDuplicateEwbError = (errMsg: string) => {
        return errMsg && (errMsg.includes('4002') || errMsg.includes('already generated') || errMsg.includes('Already generated'));
      };

      const handleAlreadyGenerated = async (errMsg: string) => {
        console.warn('E-Way Bill already generated for this IRN. Fetching existing E-Way Bill details...');
        let ewayBillNo = '';
        let ewayBillDate = '';
        if (sale.irn) {
          try {
            const invDetails = await this.getEInvoiceDetails(sale.irn, companySettings);
            let invData = invDetails.Data || invDetails.data || invDetails;
            if (typeof invData === 'string' && invData) {
              try { invData = JSON.parse(invData); } catch (e) {}
            }
            ewayBillNo = (invData?.EwbNo || invData?.ewbNo || invData?.EwayBillNo || invData?.ewayBillNo)?.toString() || '';
            ewayBillDate = invData?.EwbDt || invData?.EwbDate || invData?.ewayBillDate || '';
          } catch (fetchErr) {
            console.error('Failed to fetch existing E-Invoice details:', fetchErr);
          }

          if (!ewayBillNo && sandbox) {
            console.warn('Sandbox mode fallback: Generating mock E-Way Bill details...');
            ewayBillNo = '88' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
            ewayBillDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
          }

          if (ewayBillNo) {
            const { error } = await supabase
              .from('sales')
              .update({
                eway_bill_no: ewayBillNo,
                eway_bill_date: ewayBillDate,
                eway_bill_status: 'GENERATED'
              })
              .eq('bill_serial_no', sale.bill_serial_no);

            if (error) {
              console.error('Error updating existing E-Way Bill in DB:', error);
            }

            return { ewayBillNo, ewayBillDate, correctedDistance: finalDistance };
          }
        }
        throw new Error(errMsg);
      };

      let response: Response;
      try {
        response = await makeRequest(finalToken, finalDistance);
        if (!response.ok) {
          await handleNonOkResponse(response, 'E-Way Bill generation server error');
        }
      } catch (err: any) {
        if (isDuplicateEwbError(err.message)) {
          return await handleAlreadyGenerated(err.message);
        }
        // 1. Check if token expired
        else if (err.message && (err.message.includes('GSP752') || err.message.includes('AuthToken not found') || err.message.includes('expired'))) {
          console.warn('AuthToken expired. Retrying E-Way Bill with a fresh token...');
          finalToken = await this.authenticate(companySettings, true);
          try {
            response = await makeRequest(finalToken, finalDistance);
            if (!response.ok) {
              await handleNonOkResponse(response, 'E-Way Bill generation server error');
            }
          } catch (innerErr: any) {
            if (isDuplicateEwbError(innerErr.message)) {
              return await handleAlreadyGenerated(innerErr.message);
            }
            // If the second attempt failed due to distance mismatch
            if (innerErr.message && (innerErr.message.includes('702') || innerErr.message.includes('4013') || innerErr.message.includes('distance'))) {
              const correctDist = parseDistanceLimit(innerErr.message);
              if (correctDist) {
                console.warn(`Distance mismatch after token refresh. Retrying E-Way Bill with corrected distance: ${correctDist} km`);
                finalDistance = correctDist;
                response = await makeRequest(finalToken, finalDistance);
                if (!response.ok) {
                  await handleNonOkResponse(response, 'E-Way Bill generation server error');
                }
              } else {
                throw innerErr;
              }
            } else {
              throw innerErr;
            }
          }
        } 
        // 2. Check if distance mismatch on first attempt
        else if (err.message && (err.message.includes('702') || err.message.includes('4013') || err.message.includes('distance'))) {
          const correctDist = parseDistanceLimit(err.message);
          if (correctDist) {
            console.warn(`Distance mismatch. Retrying E-Way Bill with corrected distance: ${correctDist} km`);
            finalDistance = correctDist;
            try {
              response = await makeRequest(finalToken, finalDistance);
              if (!response.ok) {
                await handleNonOkResponse(response, 'E-Way Bill generation server error');
              }
            } catch (innerErr: any) {
              if (isDuplicateEwbError(innerErr.message)) {
                return await handleAlreadyGenerated(innerErr.message);
              }
              // What if the second attempt fails with expired token?
              if (innerErr.message && (innerErr.message.includes('GSP752') || innerErr.message.includes('AuthToken not found') || innerErr.message.includes('expired'))) {
                console.warn('AuthToken expired on retry. Retrying E-Way Bill with a fresh token...');
                finalToken = await this.authenticate(companySettings, true);
                response = await makeRequest(finalToken, finalDistance);
                if (!response.ok) {
                  await handleNonOkResponse(response, 'E-Way Bill generation server error');
                }
              } else {
                throw innerErr;
              }
            }
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      const result = await response.json();
      console.log('E-Way Bill Generation Response:', result);

      const isSuccess = result.Status === 1 || result.Status === '1' || result.status_cd === '1' || result.status === 1 || result.status === '1';
      
      let parsedData = result.Data || result.data;
      if (typeof parsedData === 'string' && parsedData) {
        try {
          parsedData = JSON.parse(parsedData);
        } catch (e) {
          // ignore
        }
      }

      const ewayBillNo = (parsedData?.EwbNo || parsedData?.ewbNo || result.EwbNo || result.ewbNo)?.toString();
      const ewayBillDate = parsedData?.EwbDt || parsedData?.EwbDate || parsedData?.ewayBillDate || result.EwbDt || '';
      const ewayBillValidUpto = parsedData?.EwbValidTill || parsedData?.validUpto || parsedData?.ValidUpto || result.EwbValidTill || '';

      if (isSuccess && ewayBillNo) {
        const { error } = await supabase
          .from('sales')
          .update({
            eway_bill_no: ewayBillNo,
            eway_bill_date: ewayBillDate,
            eway_bill_valid_upto: ewayBillValidUpto || null,
            eway_bill_status: 'GENERATED'
          })
          .eq('bill_serial_no', sale.bill_serial_no);

        if (error) {
          console.error('Error updating sale E-Way Bill in DB:', error);
        }

        return { ewayBillNo, ewayBillDate, ewayBillValidUpto, correctedDistance: finalDistance };
      } else {
        console.error('E-Way Bill generation error result:', JSON.stringify(result));
        const fullError = extractErrorMessage(result, 'Failed to generate E-Way Bill');
        if (isDuplicateEwbError(fullError)) {
          return await handleAlreadyGenerated(fullError);
        }
        throw new Error(`E-Way Bill Generation Failed: ${fullError}`);
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      if (hasErrorCode(errMsg, '2302') || errMsg.includes('IRN is not active') || hasErrorCode(errMsg, '9999') || errMsg.includes('Invoice is not active')) {
        console.warn('IRN is not active. Updating local einvoice_status to CANCELLED...');
        const { error } = await supabase
          .from('sales')
          .update({ einvoice_status: 'CANCELLED' })
          .eq('bill_serial_no', sale.bill_serial_no);
        if (error) {
          console.error('Error updating cancelled E-Invoice status in DB:', error);
        }
        throw new Error(`E-Way Bill Generation Failed: The linked E-Invoice (IRN) is not active (cancelled on the portal). Local E-Invoice status has been updated to CANCELLED.`);
      }
      throw err;
    }
  },

  /**
   * Generate Standalone E-Way Bill (without IRN)
   */
  async generateStandaloneEWayBill(params: {
    sale: Sale;
    allSales: Sale[];
    allItems: Item[];
    customer: Customer;
    item: Item;
    companySettings: CompanySetting;
    outwardEntry?: OutwardEntry | null;
    distance: number;
    transporterId?: string;
    transporterName?: string;
    transDocNo?: string;
    transDocDt?: string;
    vehType?: 'R' | 'O';
    transMode?: '1' | '2' | '3' | '4';
    transactionType?: number;
  }): Promise<{ ewayBillNo: string; ewayBillDate: string }> {
    const {
      sale,
      allSales,
      allItems,
      customer,
      item,
      companySettings,
      outwardEntry,
      distance,
      transporterId = '',
      transporterName = '',
      transDocNo = '',
      transDocDt = '',
      vehType = 'R',
      transMode = '1',
      transactionType = 1,
    } = params;

    const token = await this.authenticateEWayBill(companySettings);
    const sandbox = companySettings.einvoice_sandbox ?? true;

    const calculateTotals = () => {
      return allSales.reduce((acc, s, index) => {
        const currentItem = allItems[index] || item;
        const base = s.quantity * s.rate;
        const gst = base * (currentItem.gst_percentage / 100);
        return {
          baseAmount: acc.baseAmount + base,
          gstAmount: acc.gstAmount + gst,
          totalAmount: acc.totalAmount + base + gst,
        };
      }, { baseAmount: 0, gstAmount: 0, totalAmount: 0 });
    };

    const { baseAmount, gstAmount } = calculateTotals();
    const roundedBaseAmount = Math.round(baseAmount * 100) / 100;
    const roundedGstAmount = Math.round(gstAmount * 100) / 100;
    const roundedCgstAmount = Math.round((roundedGstAmount / 2) * 100) / 100;
    const roundedSgstAmount = Math.round((roundedGstAmount / 2) * 100) / 100;
    const roundedTotalAmount = Math.round((roundedBaseAmount + roundedCgstAmount + roundedSgstAmount) * 100) / 100;

    const customerAddress = customer.address_english || customer.address_tamil || '';
    const buyerAddr1 = customerAddress.substring(0, 100);
    const buyerAddr2 = customerAddress.length > 100 ? customerAddress.substring(100, 200) : '';

    const addressParts = customerAddress.split(',');
    let buyerLoc = addressParts.length > 0 ? addressParts[addressParts.length - 1].trim() : '';
    buyerLoc = buyerLoc.replace(/\d{6}/g, '').replace(/[^\w\s]/g, '').trim() || 'Tamil Nadu';

    const vehicleNo = sale.lorry_no || outwardEntry?.lorry_no || '';

    const payload = {
      supplyType: "O",
      subSupplyType: "1",
      subSupplyDesc: "",
      docType: "INV",
      docNo: sale.bill_serial_no,
      docDate: formatDateDDMMYYYY(sale.sale_date),
      fromGstin: companySettings.gstin,
      fromTrdName: companySettings.company_name,
      fromAddr1: companySettings.address_line1,
      fromAddr2: companySettings.address_line2 || "",
      fromPlace: companySettings.locality,
      fromPincode: getValidPinForState(
        getStateCodeFromGstin(companySettings.gstin, companySettings.state_code),
        companySettings.state_code,
        companySettings.pin_code
      ),
      actFromStateCode: parseInt(getStateCodeFromGstin(companySettings.gstin, companySettings.state_code), 10),
      fromStateCode: parseInt(getStateCodeFromGstin(companySettings.gstin, companySettings.state_code), 10),
      toGstin: customer.gstin || "URP",
      toTrdName: customer.name_english || customer.name_tamil || "UNKNOWN",
      toAddr1: buyerAddr1,
      toAddr2: buyerAddr2 || "",
      toPlace: buyerLoc,
      toPincode: getValidPinForState(
        getStateCodeFromGstin(customer.gstin || "", customer.state_code || "33"),
        customer.state_code || "33",
        customer.pin_code
      ),
      actToStateCode: parseInt(getStateCodeFromGstin(customer.gstin || "", customer.state_code || "33"), 10),
      toStateCode: parseInt(getStateCodeFromGstin(customer.gstin || "", customer.state_code || "33"), 10),
      transactionType: transactionType,
      otherValue: "0",
      totalValue: roundedBaseAmount,
      cgstValue: roundedCgstAmount,
      sgstValue: roundedSgstAmount,
      igstValue: 0,
      cessValue: 0,
      cessNonAdvolValue: 0,
      totInvValue: roundedTotalAmount,
      transporterId: transporterId || "",
      transporterName: transporterName || "",
      transDocNo: transDocNo || "",
      transMode: transMode,
      transDistance: distance.toString(),
      transDocDate: transDocDt ? formatDateDDMMYYYY(transDocDt) : "",
      vehicleNo: vehicleNo.replace(/\s+/g, '').toUpperCase(),
      vehicleType: vehType,
      itemList: allSales.map((s, index) => {
        const currentItem = allItems[index] || item;
        const itemBase = s.quantity * s.rate;
        const itemGst = itemBase * (currentItem.gst_percentage / 100);
        const itemCgst = Math.round((itemGst / 2) * 100) / 100;
        const itemSgst = Math.round((itemGst / 2) * 100) / 100;
        const cleanHsn = parseInt(formatHsnCode(currentItem.hsn_no), 10);

        return {
          productName: currentItem.name_english || "Product",
          productDesc: currentItem.name_english || "Product",
          hsnCode: cleanHsn,
          quantity: s.quantity,
          qtyUnit: formatUnitCode(currentItem.unit),
          cgstRate: currentItem.gst_percentage / 2,
          sgstRate: currentItem.gst_percentage / 2,
          igstRate: 0,
          cessRate: 0,
          cessNonadvol: 0,
          taxableAmount: Math.round(itemBase * 100) / 100
        };
      })
    };

    console.log('Sending payload to Standalone E-Way Bill Generation:', payload);

    const aspid = companySettings.einvoice_aspid || '';
    const password = companySettings.einvoice_asppassword || '';
    const gstin = companySettings.gstin || '';

    let finalToken = token;
    let finalDistance = distance;

    const makeRequest = async (tokenVal: string, distVal: number) => {
      payload.transDistance = distVal.toString();
      const pathAndQuery = `/ewaybillapi/dec/v1.03/ewayapi?action=GENEWAYBILL&aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&gstin=${encodeURIComponent(gstin)}&authtoken=${encodeURIComponent(tokenVal)}`;
      return await this.executeRequest(sandbox, pathAndQuery, {
        method: 'POST',
        headers: {
          'aspid': aspid,
          'password': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    };

    let response: Response;
    try {
      response = await makeRequest(finalToken, finalDistance);
      if (!response.ok) {
        await handleNonOkResponse(response, 'Standalone E-Way Bill generation server error');
      }
    } catch (err: any) {
      // 1. Check if token expired
      if (err.message && (err.message.includes('GSP752') || err.message.includes('AuthToken not found') || err.message.includes('expired'))) {
        console.warn('AuthToken expired. Retrying Standalone E-Way Bill with a fresh token...');
        finalToken = await this.authenticateEWayBill(companySettings, true);
        try {
          response = await makeRequest(finalToken, finalDistance);
          if (!response.ok) {
            await handleNonOkResponse(response, 'Standalone E-Way Bill generation server error');
          }
        } catch (innerErr: any) {
          // If the second attempt failed due to distance mismatch
          if (innerErr.message && (innerErr.message.includes('702') || innerErr.message.includes('4013') || innerErr.message.includes('distance'))) {
            const correctDist = parseDistanceLimit(innerErr.message);
            if (correctDist) {
              console.warn(`Distance mismatch after token refresh. Retrying Standalone E-Way Bill with corrected distance: ${correctDist} km`);
              finalDistance = correctDist;
              response = await makeRequest(finalToken, finalDistance);
              if (!response.ok) {
                await handleNonOkResponse(response, 'Standalone E-Way Bill generation server error');
              }
            } else {
              throw innerErr;
            }
          } else {
            throw innerErr;
          }
        }
      } 
      // 2. Check if distance mismatch on first attempt
      else if (err.message && (err.message.includes('702') || err.message.includes('4013') || err.message.includes('distance'))) {
        const correctDist = parseDistanceLimit(err.message);
        if (correctDist) {
          console.warn(`Distance mismatch. Retrying Standalone E-Way Bill with corrected distance: ${correctDist} km`);
          finalDistance = correctDist;
          try {
            response = await makeRequest(finalToken, finalDistance);
            if (!response.ok) {
              await handleNonOkResponse(response, 'Standalone E-Way Bill generation server error');
            }
          } catch (innerErr: any) {
            // What if the second attempt fails with expired token?
            if (innerErr.message && (innerErr.message.includes('GSP752') || innerErr.message.includes('AuthToken not found') || innerErr.message.includes('expired'))) {
              console.warn('AuthToken expired on retry. Retrying Standalone E-Way Bill with a fresh token...');
              finalToken = await this.authenticateEWayBill(companySettings, true);
              response = await makeRequest(finalToken, finalDistance);
              if (!response.ok) {
                await handleNonOkResponse(response, 'Standalone E-Way Bill generation server error');
              }
            } else {
              throw innerErr;
            }
          }
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    const result = await response.json();
    console.log('Standalone E-Way Bill Generation Response:', result);

    const isSuccess = result.Status === 1 || result.Status === '1' || result.status_cd === '1' || result.status === 1 || result.status === '1';
    
    let parsedData = result.Data || result.data;
    if (typeof parsedData === 'string' && parsedData) {
      try {
        parsedData = JSON.parse(parsedData);
      } catch (e) {
        // ignore
      }
    }

    const ewayBillNo = (parsedData?.EwbNo || parsedData?.ewbNo || result.EwbNo || result.ewbNo)?.toString();
    const ewayBillDate = parsedData?.EwbDt || parsedData?.EwbDate || parsedData?.ewayBillDate || result.EwbDt || '';

    if (isSuccess && ewayBillNo) {
      const { error } = await supabase
        .from('sales')
        .update({
          eway_bill_no: ewayBillNo,
          eway_bill_date: ewayBillDate,
          eway_bill_status: 'GENERATED'
        })
        .eq('bill_serial_no', sale.bill_serial_no);

      if (error) {
        console.error('Error updating sale Standalone E-Way Bill in DB:', error);
      }

      return { ewayBillNo, ewayBillDate, correctedDistance: finalDistance };
    } else {
      console.error('Standalone E-Way Bill generation error result:', JSON.stringify(result));
      const fullError = extractErrorMessage(result, 'Failed to generate Standalone E-Way Bill');
      throw new Error(`Standalone E-Way Bill Generation Failed: ${fullError}`);
    }
  },

  /**
   * Cancel E-Invoice
   */
  async cancelEInvoice(sale: Sale, companySettings: CompanySetting, reasonCode: string, remark: string): Promise<boolean> {
    if (!sale.irn) {
      throw new Error('No IRN found for this sale.');
    }

    const token = await this.authenticate(companySettings);
    const sandbox = companySettings.einvoice_sandbox ?? true;

    try {
      const payload = {
        Irn: sale.irn,
        CnlRsn: reasonCode, // "1": Duplicate, "2": Data Entry Mistake, "3": Order Cancelled, "4": Others
        CnlRem: remark || 'Cancelled'
      };

      console.log('Sending payload to Cancel E-Invoice:', payload);

      const aspid = companySettings.einvoice_aspid || '';
      const password = companySettings.einvoice_asppassword || '';
      const gstin = companySettings.gstin || '';
      const username = companySettings.einvoice_username || '';

      const makeRequest = async (tokenVal: string) => {
        const pathAndQuery = `/eicore/dec/v1.03/Invoice/Cancel?aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&Gstin=${encodeURIComponent(gstin)}&User_name=${encodeURIComponent(username)}&AuthToken=${encodeURIComponent(tokenVal)}`;
        return await this.executeRequest(sandbox, pathAndQuery, {
          method: 'POST',
          headers: {
            'aspid': aspid,
            'password': password,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      };

      let response: Response;
      try {
        response = await makeRequest(token);
        if (!response.ok) {
          await handleNonOkResponse(response, 'Cancel E-Invoice server error');
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('GSP752') || err.message.includes('AuthToken not found') || err.message.includes('expired'))) {
          console.warn('AuthToken expired. Retrying Cancel E-Invoice with a fresh token...');
          const freshToken = await this.authenticate(companySettings, true);
          response = await makeRequest(freshToken);
          if (!response.ok) {
            await handleNonOkResponse(response, 'Cancel E-Invoice server error');
          }
        } else {
          throw err;
        }
      }

      const result = await response.json();
      console.log('Cancel E-Invoice Response:', result);

      if (result.Status === 1 || result.Status === '1') {
        const { error } = await supabase
          .from('sales')
          .update({
            einvoice_status: 'CANCELLED',
          })
          .eq('bill_serial_no', sale.bill_serial_no);

        if (error) {
          console.error('Error updating cancelled IRN in DB:', error);
        }

        return true;
      } else {
        const errorMsg = result.ErrorDetails?.[0]?.ErrorMessage || 'Failed to cancel E-Invoice';
        const errorCode = result.ErrorDetails?.[0]?.ErrorCode || '';
        throw new Error(`Cancel E-Invoice Failed: ${errorMsg} (${errorCode})`);
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      if (hasErrorCode(errMsg, '9999') || errMsg.includes('Invoice is not active') || errMsg.includes('already cancelled') || errMsg.includes('already been cancelled')) {
        console.warn('E-Invoice is already inactive/cancelled on the portal. Updating local status...');
        const { error } = await supabase
          .from('sales')
          .update({
            einvoice_status: 'CANCELLED',
          })
          .eq('bill_serial_no', sale.bill_serial_no);

        if (error) {
          console.error('Error updating cancelled IRN status in DB:', error);
        }
        return true;
      }
      if (hasErrorCode(errMsg, '2270') || errMsg.includes('time limit is crossed') || errMsg.includes('time limit crossed')) {
        throw new Error(`Cancel E-Invoice Failed: The allowed cancellation time limit (24 hours) has passed. You cannot cancel this IRN via API. Please issue a Credit Note in the system instead.`);
      }
      throw err;
    }
  },

  /**
   * Generate E-Invoice for Credit Note (CRN) or Debit Note (DBN)
   */
  async generateNoteEInvoice(params: {
    note: { id: string; note_no: string; note_date: string; amount: number; gst_percentage?: number; reason: string; reference_bill_no?: string | null; irn?: string | null };
    noteType: 'CRN' | 'DBN';
    table: 'credit_notes' | 'debit_notes';
    companySettings: CompanySetting;
    customer: { id: string; name_english: string; name_tamil?: string; code: string; address_english?: string; address_tamil?: string; gstin?: string; phone?: string; email?: string; pin_code?: string; state_code?: string; place_of_supply?: string };
    item: { id: string; name_english: string; name_tamil?: string; code: string; hsn_no?: string; gst_percentage: number; unit: string };
  }): Promise<{ irn: string; signedQrcode: string }> {
    const { note, noteType, table, companySettings, customer, item } = params;

    const token = await this.authenticate(companySettings);
    const sandbox = companySettings.einvoice_sandbox ?? true;

    // Calculate amounts
    const gstPct = note.gst_percentage ?? item.gst_percentage ?? 5;
    const baseAmount = Math.round((note.amount / (1 + gstPct / 100)) * 100) / 100;
    const gstAmount = Math.round((note.amount - baseAmount) * 100) / 100;
    const cgstAmount = Math.round((gstAmount / 2) * 100) / 100;
    const sgstAmount = Math.round((gstAmount / 2) * 100) / 100;
    const totalAmount = Math.round((baseAmount + cgstAmount + sgstAmount) * 100) / 100;

    const customerAddress = customer.address_english || customer.address_tamil || '';
    const buyerAddr1 = customerAddress.substring(0, 100);
    const buyerAddr2 = customerAddress.length > 100 ? customerAddress.substring(100, 200) : '';
    const addressParts = customerAddress.split(',');
    let buyerLoc = addressParts.length > 0 ? addressParts[addressParts.length - 1].trim() : '';
    buyerLoc = buyerLoc.replace(/\d{6}/g, '').replace(/[^\w\s]/g, '').trim() || 'Tamil Nadu';

    const noteDate = new Date(note.note_date);
    const dd = String(noteDate.getDate()).padStart(2, '0');
    const mm = String(noteDate.getMonth() + 1).padStart(2, '0');
    const yyyy = noteDate.getFullYear();
    const formattedDate = `${dd}/${mm}/${yyyy}`;

    const payload = {
      Version: '1.1',
      TranDtls: {
        TaxSch: 'GST',
        SupTyp: 'B2B',
        IgstOnIntra: 'N',
        RegRev: 'N',
        EcmGstin: null
      },
      DocDtls: {
        Typ: noteType,
        No: note.note_no,
        Dt: formattedDate
      },
      SellerDtls: {
        Gstin: companySettings.gstin,
        LglNm: companySettings.company_name,
        Addr1: companySettings.address_line1,
        Addr2: (companySettings as any).address_line2 || null,
        Loc: companySettings.locality,
        Pin: companySettings.pin_code ? parseInt(companySettings.pin_code.toString()) : 600001,
        Stcd: companySettings.state_code || '33',
        Ph: companySettings.phone || null,
        Em: companySettings.email || null
      },
      BuyerDtls: {
        Gstin: customer.gstin || 'URP',
        LglNm: customer.name_english || customer.name_tamil || 'UNKNOWN',
        TrdNm: customer.name_english || customer.name_tamil || 'UNKNOWN',
        Addr1: buyerAddr1 || 'NA',
        Addr2: buyerAddr2 || null,
        Loc: buyerLoc,
        Pin: customer.pin_code ? parseInt(customer.pin_code.toString()) : 600001,
        Pos: customer.place_of_supply || customer.state_code || '33',
        Stcd: customer.state_code || '33',
        Ph: customer.phone || null,
        Em: customer.email || null
      },
      ValDtls: {
        AssVal: baseAmount,
        IgstVal: 0,
        CgstVal: cgstAmount,
        SgstVal: sgstAmount,
        CesVal: 0,
        StCesVal: 0,
        Discount: 0,
        OthChrg: 0,
        RndOffAmt: 0,
        TotInvVal: totalAmount
      },
      RefDtls: {
        InvRm: 'NICGEPP',
        ...(note.reference_bill_no ? { PrecDocDtls: [{ InvNo: note.reference_bill_no, InvDt: formattedDate, OthrRefNo: '' }] } : {})
      },
      ItemList: [
        {
          SlNo: '1',
          PrdDesc: item.name_english || 'Product',
          IsServc: 'N',
          HsnCd: formatHsnCode(item.hsn_no),
          Qty: 1,
          FreeQty: 0,
          Unit: formatUnitCode(item.unit),
          UnitPrice: baseAmount,
          TotAmt: baseAmount,
          Discount: 0,
          PreTaxVal: 0,
          AssAmt: baseAmount,
          GstRt: gstPct,
          IgstAmt: 0,
          CgstAmt: cgstAmount,
          SgstAmt: sgstAmount,
          CesRt: 0,
          CesAmt: 0,
          CesNonAdvlAmt: 0,
          StateCesRt: 0,
          StateCesAmt: 0,
          StateCesNonAdvlAmt: 0,
          OthChrg: 0,
          TotItemVal: totalAmount
        }
      ]
    };

    console.log(`Sending ${noteType} E-Invoice payload to TaxPro:`, payload);

    const aspid = companySettings.einvoice_aspid || '';
    const password = companySettings.einvoice_asppassword || '';
    const gstin = companySettings.gstin || '';
    const username = companySettings.einvoice_username || '';

    const makeRequest = async (tokenVal: string) => {
      const pathAndQuery = `/eicore/dec/v1.03/Invoice?aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&Gstin=${encodeURIComponent(gstin)}&AuthToken=${encodeURIComponent(tokenVal)}&QrCodeSize=250&User_name=${encodeURIComponent(username)}`;
      return await this.executeRequest(sandbox, pathAndQuery, {
        method: 'POST',
        headers: { 'aspid': aspid, 'password': password, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    };

    let response: Response;
    try {
      response = await makeRequest(token);
      if (!response.ok) {
        await handleNonOkResponse(response, `${noteType} E-Invoice generation server error`);
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('GSP752') || err.message.includes('AuthToken not found') || err.message.includes('expired'))) {
        console.warn(`AuthToken expired. Retrying ${noteType} E-Invoice generation with fresh token...`);
        const freshToken = await this.authenticate(companySettings, true);
        response = await makeRequest(freshToken);
        if (!response.ok) {
          await handleNonOkResponse(response, `${noteType} E-Invoice generation server error`);
        }
      } else {
        throw err;
      }
    }

    const result = await response.json();
    console.log(`${noteType} E-Invoice Generation Response:`, result);

    const isSuccess = result.Status === 1 || result.Status === '1' || result.status_cd === '1';
    let parsedData = result.Data || result.data;
    if (typeof parsedData === 'string' && parsedData) {
      try { parsedData = JSON.parse(parsedData); } catch (e) { /* ignore */ }
    }

    const isDuplicate = result.ErrorDetails?.[0]?.ErrorCode === '2150' ||
                        result.ErrorDetails?.[0]?.ErrorMessage?.toLowerCase().includes('duplicate');
    const dupInfo = result.InfoDtls?.find((info: any) => info.InfCd === 'DUPIRN' || info.Desc?.Irn);

    if ((isSuccess && parsedData?.Irn) || (isDuplicate && dupInfo)) {
      const data = parsedData || {};
      const irn = data.Irn || dupInfo?.Desc?.Irn;
      const ackNo = (data.AckNo || dupInfo?.Desc?.AckNo)?.toString() || '';
      const ackDate = data.AckDt || dupInfo?.Desc?.AckDt || '';
      const signedQrcode = data.SignedQRCode || '';

      const { error } = await supabase
        .from(table as any)
        .update({ irn, ack_no: ackNo, ack_date: ackDate, einvoice_status: 'GENERATED' })
        .eq('id', note.id);

      if (error) {
        console.error(`Error updating ${noteType} E-Invoice in DB:`, error);
      }

      return { irn, signedQrcode };
    } else {
      const fullError = extractErrorMessage(result, `Failed to generate ${noteType} E-Invoice`);
      throw new Error(`E-Invoice Generation Failed: ${fullError}`);
    }
  },

  /**
   * Cancel E-Invoice for Credit Note (CRN) or Debit Note (DBN)
   */
  async cancelNoteEInvoice(params: {
    note: { id: string; irn?: string | null };
    noteType: 'CRN' | 'DBN';
    table: 'credit_notes' | 'debit_notes';
    companySettings: CompanySetting;
    reasonCode: string;
    remark: string;
  }): Promise<boolean> {
    const { note, noteType, table, companySettings, reasonCode, remark } = params;

    if (!note.irn) {
      throw new Error(`No IRN found for this ${noteType === 'CRN' ? 'Credit Note' : 'Debit Note'}.`);
    }

    const token = await this.authenticate(companySettings);
    const sandbox = companySettings.einvoice_sandbox ?? true;

    const payload = {
      Irn: note.irn,
      CnlRsn: reasonCode,
      CnlRem: remark || 'Cancelled'
    };

    console.log(`Sending ${noteType} Cancel E-Invoice payload:`, payload);

    const aspid = companySettings.einvoice_aspid || '';
    const password = companySettings.einvoice_asppassword || '';
    const gstin = companySettings.gstin || '';
    const username = companySettings.einvoice_username || '';

    const makeRequest = async (tokenVal: string) => {
      const pathAndQuery = `/eicore/dec/v1.03/Invoice/Cancel?aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&Gstin=${encodeURIComponent(gstin)}&User_name=${encodeURIComponent(username)}&AuthToken=${encodeURIComponent(tokenVal)}`;
      return await this.executeRequest(sandbox, pathAndQuery, {
        method: 'POST',
        headers: { 'aspid': aspid, 'password': password, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    };

    try {
      let response: Response;
      try {
        response = await makeRequest(token);
        if (!response.ok) {
          await handleNonOkResponse(response, `Cancel ${noteType} E-Invoice server error`);
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('GSP752') || err.message.includes('AuthToken not found') || err.message.includes('expired'))) {
          console.warn(`AuthToken expired. Retrying Cancel ${noteType} E-Invoice with fresh token...`);
          const freshToken = await this.authenticate(companySettings, true);
          response = await makeRequest(freshToken);
          if (!response.ok) {
            await handleNonOkResponse(response, `Cancel ${noteType} E-Invoice server error`);
          }
        } else {
          throw err;
        }
      }

      const result = await response.json();
      console.log(`Cancel ${noteType} E-Invoice Response:`, result);

      if (result.Status === 1 || result.Status === '1') {
        const { error } = await supabase
          .from(table as any)
          .update({ einvoice_status: 'CANCELLED' })
          .eq('id', note.id);

        if (error) {
          console.error(`Error updating cancelled ${noteType} E-Invoice in DB:`, error);
        }
        return true;
      } else {
        const errorMsg = result.ErrorDetails?.[0]?.ErrorMessage || 'Failed to cancel E-Invoice';
        const errorCode = result.ErrorDetails?.[0]?.ErrorCode || '';
        throw new Error(`Cancel E-Invoice Failed: ${errorMsg}${errorCode ? ` (${errorCode})` : ''}`);
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      if (hasErrorCode(errMsg, '9999') || errMsg.includes('Invoice is not active') || errMsg.includes('already cancelled')) {
        console.warn(`${noteType} E-Invoice already cancelled on portal. Updating local status...`);
        await supabase.from(table as any).update({ einvoice_status: 'CANCELLED' }).eq('id', note.id);
        return true;
      }
      if (hasErrorCode(errMsg, '2270') || errMsg.includes('time limit is crossed')) {
        throw new Error(`Cancel E-Invoice Failed: The 24-hour cancellation window has passed. Please issue a counter ${noteType === 'CRN' ? 'Debit Note' : 'Credit Note'} instead.`);
      }
      throw err;
    }
  },

  /**
   * Cancel E-Way Bill
   */

  async cancelEWayBill(sale: Sale, companySettings: CompanySetting, reasonCode: number, remark: string): Promise<boolean> {
    if (!sale.eway_bill_no) {
      throw new Error('No E-Way Bill Number found for this sale.');
    }

    try {
      let token: string;
      try {
        token = await this.authenticateEWayBill(companySettings);
      } catch (err: any) {
        if (sale.irn && isEWayBillAuthUnavailableError(err)) {
          console.warn('Dedicated E-Way Bill auth returned NIC404. Falling back to e-invoice AuthToken for IRN-linked E-Way Bill cancellation...');
          token = await this.authenticate(companySettings);
        } else {
          throw err;
        }
      }
      const sandbox = companySettings.einvoice_sandbox ?? true;

      const payload = {
        ewbNo: parseInt(sale.eway_bill_no, 10),
        cancelRsnCode: reasonCode, // E-Way Bill portal expects number reason code
        cancelRmrk: remark || 'Cancelled'
      };

      console.log('Sending payload to Cancel E-Way Bill:', payload);

      const aspid = companySettings.einvoice_aspid || '';
      const password = companySettings.einvoice_asppassword || '';
      const gstin = companySettings.gstin || '';
      const username = companySettings.einvoice_username || '';

      const makeRequest = async (tokenVal: string) => {
        const pathAndQuery = `/ewaybillapi/dec/v1.03/ewayapi?action=CANEWB&aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&gstin=${encodeURIComponent(gstin)}&username=${encodeURIComponent(username)}&authtoken=${encodeURIComponent(tokenVal)}`;
        return await this.executeRequest(sandbox, pathAndQuery, {
          method: 'POST',
          headers: {
            'aspid': aspid,
            'password': password,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      };

      const makeIrnLinkedCancelRequest = async (tokenVal: string) => {
        if (!sale.irn) {
          throw new Error('IRN is required for IRN-linked E-Way Bill cancellation fallback.');
        }
        const ewbNo = parseInt(sale.eway_bill_no!, 10);
        const pathSuffixes = [
          '/eiewb/dec/v1.03/ewaybill/cancel',
          '/eiewb/dec/v1.03/ewaybill/Cancel'
        ];
        const payloadVariants = [
          { Irn: sale.irn, EwbNo: ewbNo, CnlRsn: reasonCode, CnlRem: remark || 'Cancelled' },
          { Irn: sale.irn, ewbNo, cancelRsnCode: reasonCode, cancelRmrk: remark || 'Cancelled' },
          { Irn: sale.irn, CnlRsn: reasonCode, CnlRem: remark || 'Cancelled' }
        ];

        for (const pathSuffix of pathSuffixes) {
          for (const irnPayload of payloadVariants) {
            const separator = pathSuffix.includes('?') ? '&' : '?';
            const pathAndQuery = `${pathSuffix}${separator}aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&Gstin=${encodeURIComponent(gstin)}&User_name=${encodeURIComponent(username)}&AuthToken=${encodeURIComponent(tokenVal)}`;
            const response = await this.executeRequest(sandbox, pathAndQuery, {
              method: 'POST',
              headers: {
                'aspid': aspid,
                'password': password,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(irnPayload)
            });

            if (response.ok) {
              return response;
            }

            const responseText = await response.clone().text().catch(() => '');
            const canTryNextVariant = response.status === 404 || responseText.includes('NIC404') || responseText.toLowerCase().includes('not found');
            if (!canTryNextVariant) {
              return response;
            }
            if (response.status === 404 || responseText.toLowerCase().includes('not found')) {
              break;
            }
          }
        }

        return new Response(JSON.stringify({
          error: {
            message: 'TaxPro/NIC returned Not Found for all E-Way Bill cancellation endpoints. This E-Way Bill may need to be cancelled on the NIC E-Way Bill portal, or the TaxPro account may not have E-Way Bill cancellation enabled for this GSTIN.'
          }
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      };

      let response: Response;
      try {
        response = await makeRequest(token);
        if (!response.ok) {
          await handleNonOkResponse(response, 'Cancel E-Way Bill server error');
        }
      } catch (err: any) {
        if (sale.irn && isEWayBillAuthUnavailableError(err)) {
          console.warn('Direct E-Way Bill cancel returned NIC404. Retrying through IRN-linked /eiewb cancel endpoint...');
          const einvoiceToken = await this.authenticate(companySettings);
          response = await makeIrnLinkedCancelRequest(einvoiceToken);
          if (!response.ok) {
            await handleNonOkResponse(response, 'IRN-linked Cancel E-Way Bill server error');
          }
        } else if (err.message && (err.message.includes('GSP752') || err.message.includes('authtoken not found') || err.message.includes('expired'))) {
          console.warn('AuthToken expired. Retrying Cancel E-Way Bill with a fresh token...');
          let freshToken: string;
          try {
            freshToken = await this.authenticateEWayBill(companySettings, true);
          } catch (authErr: any) {
            if (sale.irn && isEWayBillAuthUnavailableError(authErr)) {
              freshToken = await this.authenticate(companySettings, true);
            } else {
              throw authErr;
            }
          }
          response = await makeRequest(freshToken);
          if (!response.ok) {
            try {
              await handleNonOkResponse(response, 'Cancel E-Way Bill server error');
            } catch (retryErr: any) {
              if (sale.irn && isEWayBillAuthUnavailableError(retryErr)) {
                const einvoiceToken = await this.authenticate(companySettings, true);
                response = await makeIrnLinkedCancelRequest(einvoiceToken);
                if (!response.ok) {
                  await handleNonOkResponse(response, 'IRN-linked Cancel E-Way Bill server error');
                }
              } else {
                throw retryErr;
              }
            }
          }
        } else {
          throw err;
        }
      }

      const result = await response.json();
      console.log('Cancel E-Way Bill Response:', result);

      // TaxPro wraps the response in a Data field (may be a JSON string or object)
      // RespCancelEwbPl: { ewayBillNo, cancelDate }
      let parsedData = result.Data || result.data;
      if (typeof parsedData === 'string' && parsedData) {
        try {
          parsedData = JSON.parse(parsedData);
        } catch (e) {
          // ignore — may already be a plain string in some error cases
        }
      }

      // TaxPro RespCancelEwbPl success fields (per TaxPro SDK + charteredinfo docs)
      const ewayBillNo = parsedData?.ewayBillNo ?? parsedData?.EwayBillNo ?? result.ewayBillNo ?? result.EwayBillNo;
      const cancelDate = parsedData?.cancelDate ?? parsedData?.CancelDate ?? parsedData?.CancelDt
                      ?? result.cancelDate ?? result.CancelDate;

      // Success: Status=1 (TaxPro wrapper) OR ewayBillNo present in RespCancelEwbPl
      const isSuccess =
        result.Status === 1 || result.Status === '1' ||
        result.status === 1 || result.status === '1' ||
        result.status_cd === '1' ||
        !!(ewayBillNo && cancelDate); // TaxPro RespCancelEwbPl direct response

      if (isSuccess) {
        const { error } = await supabase
          .from('sales')
          .update({
            eway_bill_status: 'CANCELLED',
          })
          .eq('bill_serial_no', sale.bill_serial_no);

        if (error) {
          console.error('Error updating cancelled E-Way Bill in DB:', error);
        }

        return true;
      } else {
        const errorMsg = result.ErrorDetails?.[0]?.ErrorMessage
                      || result.error?.message
                      || result.TxnOutcome  // TaxPro SDK TxnOutcome on failure
                      || 'Failed to cancel E-Way Bill';
        const errorCode = result.ErrorDetails?.[0]?.ErrorCode || result.error?.error_cd || '';
        throw new Error(`Cancel E-Way Bill Failed: ${errorMsg}${errorCode ? ` (${errorCode})` : ''}`);
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      // Check if already cancelled
      if (hasErrorCode(errMsg, '312') || errMsg.includes('already cancelled') || errMsg.includes('not generated by you or cancelled')) {
        console.warn('E-Way Bill is already cancelled on the portal. Updating local status...');
        const { error } = await supabase
          .from('sales')
          .update({
            eway_bill_status: 'CANCELLED',
          })
          .eq('bill_serial_no', sale.bill_serial_no);

        if (error) {
          console.error('Error updating cancelled E-Way Bill status in DB:', error);
        }
        return true;
      }
      throw err;
    }
  },

  /**
   * Update vehicle details on an active E-Way Bill
   */
  async updateEWayBillVehicle(params: {
    sale: Sale;
    vehicleNo: string;
    fromPlace: string;
    fromState: number;
    reasonCode: string;
    reasonRem: string;
    transDocNo?: string;
    transDocDate?: string;
    transMode?: string;
    vehicleType?: string;
    companySettings: CompanySetting;
  }): Promise<boolean> {
    const {
      sale,
      vehicleNo,
      fromPlace,
      fromState,
      reasonCode,
      reasonRem,
      transDocNo = '',
      transDocDate = '',
      transMode = '1',
      vehicleType = 'R',
      companySettings
    } = params;

    if (!sale.eway_bill_no) {
      throw new Error('E-Way Bill has not been generated for this sale.');
    }

    const token = await this.authenticateEWayBill(companySettings);
    const sandbox = companySettings.einvoice_sandbox ?? true;

    const supplierState = getStateCodeFromGstin(companySettings.gstin, companySettings.state_code);
    const resolvedFromState = fromState === parseInt(companySettings.state_code, 10)
      ? parseInt(supplierState, 10)
      : fromState;

    const payload = {
      ewbNo: parseInt(sale.eway_bill_no, 10),
      vehicleNo: vehicleNo.replace(/\s+/g, '').toUpperCase(),
      fromPlace: fromPlace,
      fromState: resolvedFromState,
      reasonCode: reasonCode,
      reasonRem: reasonRem || 'vehicle updated',
      transDocNo: transDocNo || "",
      transDocDate: transDocDate ? formatDateDDMMYYYY(transDocDate) : "",
      transMode: transMode,
      vehicleType: vehicleType
    };

    console.log('Sending payload to Update E-Way Bill Vehicle:', payload);

    const aspid = companySettings.einvoice_aspid || '';
    const password = companySettings.einvoice_asppassword || '';
    const gstin = companySettings.gstin || '';
    const username = companySettings.einvoice_username || '';

    const makeRequest = async (tokenVal: string) => {
      const pathAndQuery = `/ewaybillapi/dec/v1.03/ewayapi?action=VEHEWB&aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&gstin=${encodeURIComponent(gstin)}&username=${encodeURIComponent(username)}&authtoken=${encodeURIComponent(tokenVal)}`;
      return await this.executeRequest(sandbox, pathAndQuery, {
        method: 'POST',
        headers: {
          'aspid': aspid,
          'password': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    };

    let response: Response;
    try {
      response = await makeRequest(token);
      if (!response.ok) {
        await handleNonOkResponse(response, 'Vehicle update server error');
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('GSP752') || err.message.includes('AuthToken not found') || err.message.includes('expired'))) {
        console.warn('AuthToken expired. Retrying Vehicle update with a fresh token...');
        const freshToken = await this.authenticateEWayBill(companySettings, true);
        response = await makeRequest(freshToken);
        if (!response.ok) {
          await handleNonOkResponse(response, 'Vehicle update server error');
        }
      } else {
        throw err;
      }
    }

    const result = await response.json();
    console.log('Vehicle Update Response:', result);

    // TaxPro GSP sandbox may return data unwrapped at root level
    // (e.g. {vehUpdDate: '...', validUpto: '...'}) instead of {Status: 1, Data: {...}}
    const vehUpdDate = result.vehUpdDate || result.VehUpdDate || result.Data?.vehUpdDate || result.Data?.VehUpdDate;
    const isSuccess = result.Status === 1 || result.Status === '1' || result.status === 1 || result.status === '1' || !!vehUpdDate;

    if (isSuccess) {
      const { error } = await supabase
        .from('sales')
        .update({
          lorry_no: vehicleNo.replace(/\s+/g, '').toUpperCase()
        })
        .eq('bill_serial_no', sale.bill_serial_no);

      if (error) {
        console.error('Error updating sale lorry_no in DB:', error);
      }

      return true;
    } else {
      const errorMsg = result.ErrorDetails?.[0]?.ErrorMessage || result.error?.message || 'Failed to update E-Way Bill vehicle';
      const errorCode = result.ErrorDetails?.[0]?.ErrorCode || result.error?.error_cd || '';
      throw new Error(`Vehicle Update Failed: ${errorMsg} (${errorCode})`);
    }
  },

  /**
   * Extend validity of an active E-Way Bill
   * 
   * EXTENDVALIDITY API payload rules:
   *   isInTransit: "Y"  → goods are IN MOVEMENT (on the road/vehicle   * EXTENDVALIDITY NIC EWB API v1.03 payload structure:
   *   consignmentStatus: "M" → goods are IN MOVEMENT on the road
   *                            Send transitType="", addressLine1/2/3="" (empty strings, NOT omitt   * TaxPro GSP EXTENDVALIDITY field rules (derived from error codes):
   *   isInTransit: "N" → goods are IN MOVEMENT (consignmentStatus = "M")
   *                       transit fields must be empty strings
   *   isInTransit: "Y" → goods are IN TRANSIT STORAGE (consignmentStatus = "T")
   *                       transit fields must be filled
   *
   * Error 710 (blank msg) = isInTransit field is MISSING (required)
   * Error 711 = isInTransit field has invalid value
   * Error 712 = transitType sent when goods are in movement
   * Error 713 = addressLine sent when goods are in movement
   */
  async extendEWayBillValidity(params: {
    sale: Sale;
    vehicleNo: string;
    fromPlace: string;
    fromState: number;
    remainingDistance: number;
    transDocNo?: string;
    transDocDate?: string;
    transMode?: string;
    extnRsnCode: number;
    extnRemarks: string;
    fromPincode: number;
    consignmentStatus: 'M' | 'T'; // M = In Movement, T = In Transit/Storage warehouse
    vehicleType?: 'R' | 'O';       // R = Regular, O = Over Dimensional Cargo (required)
    transitType?: 'R' | 'W' | 'O'; // required when consignmentStatus = 'T'
    addressLine1?: string;          // required when consignmentStatus = 'T'
    addressLine2?: string;
    addressLine3?: string;
    companySettings: CompanySetting;
  }): Promise<{ validUpto: string }> {
    const {
      sale,
      vehicleNo,
      fromPlace,
      fromState,
      remainingDistance,
      transDocNo = '',
      transDocDate = '',
      transMode = '1',
      extnRsnCode,
      extnRemarks,
      fromPincode,
      consignmentStatus,
      vehicleType = 'R',
      transitType = 'R',
      addressLine1 = '',
      addressLine2 = '',
      addressLine3 = '',
      companySettings
    } = params;

    if (!sale.eway_bill_no) {
      throw new Error('E-Way Bill has not been generated for this sale.');
    }

    const token = await this.authenticateEWayBill(companySettings);
    const sandbox = companySettings.einvoice_sandbox ?? true;

    const supplierState = getStateCodeFromGstin(companySettings.gstin, companySettings.state_code);
    const resolvedFromState = fromState === parseInt(companySettings.state_code, 10)
      ? parseInt(supplierState, 10)
      : fromState;

    // isInTransit semantic: "N" = goods in movement (M), "Y" = goods in transit storage (T)
    // This is the OPPOSITE of what you might expect from the field name.
    // Error 710 (blank) = field is missing; Error 711 = wrong value.
    const inStorage = consignmentStatus === 'T';
    const isInTransit = inStorage ? 'Y' : 'N';  // "N" for M (moving), "Y" for T (stored)

    const payload: Record<string, any> = {
      ewbNo: parseInt(sale.eway_bill_no, 10),
      vehicleNo: vehicleNo.replace(/\s+/g, '').toUpperCase(),
      vehicleType: vehicleType,                          // "R" or "O" — required
      fromPlace: fromPlace,
      fromState: resolvedFromState,
      remainingDistance: remainingDistance,
      transDocNo: transDocNo || "",
      transDocDate: transDocDate ? formatDateDDMMYYYY(transDocDate) : "",
      transMode: transMode,
      extnRsnCode: extnRsnCode,
      extnRemarks: extnRemarks || 'Validity Extended',
      fromPincode: fromPincode,
      consignmentStatus: consignmentStatus,            // "M" or "T"
      isInTransit: isInTransit,                        // "N" when M, "Y" when T
      transitType: inStorage ? transitType : "",       // empty string when M
      addressLine1: inStorage ? addressLine1 : "",     // empty string when M
      addressLine2: inStorage ? (addressLine2 || "") : "",
      addressLine3: inStorage ? (addressLine3 || "") : "",
    };
    console.log('Sending payload to Extend E-Way Bill Validity:', JSON.stringify(payload, null, 2));

    const aspid = companySettings.einvoice_aspid || '';
    const password = companySettings.einvoice_asppassword || '';
    const gstin = companySettings.gstin || '';
    const username = companySettings.einvoice_username || '';

    const makeRequest = async (tokenVal: string) => {
      const pathAndQuery = `/ewaybillapi/dec/v1.03/ewayapi?action=EXTENDVALIDITY&aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&gstin=${encodeURIComponent(gstin)}&username=${encodeURIComponent(username)}&authtoken=${encodeURIComponent(tokenVal)}`;
      return await this.executeRequest(sandbox, pathAndQuery, {
        method: 'POST',
        headers: {
          'aspid': aspid,
          'password': password,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    };

    let response: Response;
    try {
      response = await makeRequest(token);
      if (!response.ok) {
        await handleNonOkResponse(response, 'Validity extension server error');
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('GSP752') || err.message.includes('AuthToken not found') || err.message.includes('expired'))) {
        console.warn('AuthToken expired. Retrying Validity extension with a fresh token...');
        const freshToken = await this.authenticateEWayBill(companySettings, true);
        response = await makeRequest(freshToken);
        if (!response.ok) {
          await handleNonOkResponse(response, 'Validity extension server error');
        }
      } else {
        throw err;
      }
    }

    const result = await response.json();
    console.log('Validity Extension Response:', result);

    // TaxPro GSP sandbox may return data unwrapped at root level
    // (e.g. {validUpto: '...'}) instead of {Status: 1, Data: {validUpto: '...'}}
    const validUptoVal =
      result.validUpto || result.ValidUpto ||
      result.Data?.validUpto || result.Data?.ValidUpto;
    const isSuccess = result.Status === 1 || result.Status === '1' || result.status === 1 || result.status === '1' || !!validUptoVal;

    if (isSuccess && validUptoVal) {
      const { error } = await supabase
        .from('sales')
        .update({
          lorry_no: vehicleNo.replace(/\s+/g, '').toUpperCase()
        })
        .eq('bill_serial_no', sale.bill_serial_no);

      if (error) {
        console.error('Error updating sale details on validity extension:', error);
      }

      return { validUpto: validUptoVal };
    } else {
      const errorMsg = result.ErrorDetails?.[0]?.ErrorMessage || result.error?.message || 'Failed to extend E-Way Bill validity';
      const errorCode = result.ErrorDetails?.[0]?.ErrorCode || result.error?.error_cd || '';
      throw new Error(`Validity Extension Failed: ${errorMsg} (${errorCode})`);
    }
  },

  /**
   * Fetch complete E-Way Bill details from GSP
   */
  async getEWayBillDetails(ewbNo: string, companySettings: CompanySetting, irn?: string, returnFullResponse: boolean = false): Promise<any> {
    let token: string;
    try {
      token = await this.authenticateEWayBill(companySettings);
    } catch (err: any) {
      if (isEWayBillAuthUnavailableError(err)) {
        console.warn('Dedicated E-Way Bill auth returned NIC404. Falling back to e-invoice AuthToken for E-Way Bill details...');
        token = await this.authenticate(companySettings);
      } else {
        throw err;
      }
    }
    const sandbox = companySettings.einvoice_sandbox ?? true;

    const aspid = companySettings.einvoice_aspid || '';
    const password = companySettings.einvoice_asppassword || '';
    const gstin = companySettings.gstin || '';

    const makeRequest = async (tokenVal: string) => {
      const pathAndQuery = `/ewaybillapi/dec/v1.03/ewayapi?action=GetEwayBill&aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&gstin=${encodeURIComponent(gstin)}&authtoken=${encodeURIComponent(tokenVal)}&ewbNo=${encodeURIComponent(ewbNo)}`;
      return await this.executeRequest(sandbox, pathAndQuery, {
        method: 'GET',
        headers: {
          'aspid': aspid,
          'password': password,
        }
      });
    };

    console.log(`Fetching E-Way Bill details for ${ewbNo}...`);
    let response: Response;
    try {
      response = await makeRequest(token);
      if (!response.ok) {
        await handleNonOkResponse(response, 'GetEwayBill server error');
      }
    } catch (err: any) {
      if (irn && isEWayBillAuthUnavailableError(err)) {
        console.warn('Direct GetEwayBill returned NIC404. Fetching E-Way Bill details through E-Invoice IRN details...');
        const invDetails = await this.getEInvoiceDetails(irn, companySettings);
        const invDetailsStatus = invDetails?.Status ?? invDetails?.status ?? invDetails?.status_cd;
        if (invDetailsStatus === 0 || invDetailsStatus === '0') {
          const invDetailsError = extractErrorMessage(invDetails, 'E-Invoice IRN details did not return E-Way Bill data');
          throw new Error(`Could not fetch E-Way Bill details from IRN details: ${invDetailsError}`);
        }
        let invData = invDetails.Data || invDetails.data || invDetails;
        if (typeof invData === 'string' && invData) {
          try {
            invData = JSON.parse(invData);
          } catch (e) {
            // ignore
          }
        }
        const ewbDetails = findEWayBillDetailsInObject(invData, ewbNo);
        if (ewbDetails) {
          return ewbDetails;
        }
        throw err;
      } else if (err.message && (err.message.includes('GSP752') || err.message.includes('AuthToken not found') || err.message.includes('expired'))) {
        console.warn('AuthToken expired. Retrying GetEwayBill with a fresh token...');
        let freshToken: string;
        try {
          freshToken = await this.authenticateEWayBill(companySettings, true);
        } catch (authErr: any) {
          if (isEWayBillAuthUnavailableError(authErr)) {
            freshToken = await this.authenticate(companySettings, true);
          } else {
            throw authErr;
          }
        }
        response = await makeRequest(freshToken);
        if (!response.ok) {
          try {
            await handleNonOkResponse(response, 'GetEwayBill server error');
          } catch (retryErr: any) {
            if (irn && isEWayBillAuthUnavailableError(retryErr)) {
              const invDetails = await this.getEInvoiceDetails(irn, companySettings);
              const invDetailsStatus = invDetails?.Status ?? invDetails?.status ?? invDetails?.status_cd;
              if (invDetailsStatus === 0 || invDetailsStatus === '0') {
                const invDetailsError = extractErrorMessage(invDetails, 'E-Invoice IRN details did not return E-Way Bill data');
                throw new Error(`Could not fetch E-Way Bill details from IRN details: ${invDetailsError}`);
              }
              let invData = invDetails.Data || invDetails.data || invDetails;
              if (typeof invData === 'string' && invData) {
                try {
                  invData = JSON.parse(invData);
                } catch (e) {
                  // ignore
                }
              }
              const ewbDetails = findEWayBillDetailsInObject(invData, ewbNo);
              if (ewbDetails) {
                return ewbDetails;
              }
            }
            throw retryErr;
          }
        }
      } else {
        throw err;
      }
    }

    const result = await response.json();
    console.log('GetEwayBill Response:', result);

    let dataObj = result.Data || result.data || result;
    if (typeof dataObj === 'string' && dataObj) {
      try {
        dataObj = JSON.parse(dataObj);
      } catch (e) {
        // ignore
      }
    }

    const ewbNoVal = result.ewbNo || result.EwbNo || dataObj?.ewbNo || dataObj?.EwbNo;
    if (ewbNoVal || result.Status === 1 || result.Status === '1' || result.status === 1 || result.status === '1') {
      return returnFullResponse ? { ...result, Data: dataObj } : dataObj;
    } else {
      const errorMsg = result.ErrorDetails?.[0]?.ErrorMessage || result.error?.message || 'Failed to fetch E-Way Bill details';
      const errorCode = result.ErrorDetails?.[0]?.ErrorCode || result.error?.error_cd || '';
      throw new Error(`Failed to fetch E-Way Bill: ${errorMsg} (${errorCode})`);
    }
  },

  /**
   * Fetch details and download E-Way Bill PDF directly from the rendering engine.
   * 
   * API Docs (Print eWay Bill):
   * - Sandbox: POST https://gstsandbox.charteredinfo.com/aspapi/v1.0/<action>
   * - Production: POST https://einvapi.charteredinfo.com/aspapi/v1.0/<action>
   * - Headers: aspid, password, Gstin  (params can also be sent as query params)
   * - Body: JSON result from GetEwayBill API
   * - Response: Binary PDF stream (read as blob and save as .pdf)
   * 
   * Supported actions:
   *   printewb         – Standard E-Way Bill print
   *   printdetailewb   – Detailed E-Way Bill print
   *   printcewb        – Consolidated E-Way Bill print
   */
  async downloadEWayBillPDF(
    ewbNo: string,
    companySettings: CompanySetting,
    filename: string = 'ewaybill.pdf',
    printAction: 'printewb' | 'printdetailewb' | 'printcewb' = 'printewb',
    irn?: string
  ): Promise<void> {
    const sandbox = companySettings.einvoice_sandbox ?? true;

    // 1. Always fetch the real EWB details first (works in both sandbox & production)
    let details: any;
    try {
      const res = await this.getEWayBillDetails(ewbNo, companySettings, irn, true);
      let dataObj = res.Data || res.data || res;
      if (typeof dataObj === 'string' && dataObj) {
        try {
          dataObj = JSON.parse(dataObj);
        } catch (e) {
          // ignore
        }
      }
      details = dataObj;
      console.log('EWB details fetched for PDF:', details);
    } catch (err: any) {
      console.warn('Could not fetch EWB details required for print API:', err);
      // details stays undefined — mock PDF will use minimal info
    }

    if (!details) {
      throw new Error('Could not fetch E-Way Bill details required for TaxPro print API. Direct GetEwayBill and IRN details fallback did not return E-Way Bill JSON.');
    }

    // Always generate PDF locally using the fetched details, bypassing the premium print API
    console.info('Generating PDF locally from fetched EWB details...');
    await this.generateLocalEWayBillPDF(ewbNo, companySettings, filename, details);
  },

  /**
   * Fetch details and download official E-Way Bill PDF from TaxPro Print E-Way Bill POST API.
   */
  async downloadOfficialEWayBillPDF(
    ewbNo: string,
    companySettings: CompanySetting,
    filename: string = 'official_ewaybill.pdf',
    printAction: 'printewb' | 'printdetailewb' | 'printcewb' = 'printewb',
    irn?: string
  ): Promise<void> {
    const sandbox = companySettings.einvoice_sandbox ?? true;

    // 1. Resolve credentials
    const aspid = companySettings.einvoice_aspid || '';
    const password = companySettings.einvoice_asppassword || '';
    const gstin = companySettings.gstin || '';

    // If sandbox is true, use the production host (einvapi.charteredinfo.com) and make a GET request
    // with "showdemo" query param as specified in the TaxPro Print API Demo guidelines.
    const targetSandbox = sandbox ? false : false; // always false (production host) for print
    let pathAndQuery = `/aspapi/v1.0/${printAction}?aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&Gstin=${encodeURIComponent(gstin)}`;
    if (sandbox) {
      pathAndQuery += '&showdemo';
    }

    let response: Response;

    if (sandbox) {
      console.info(`Requesting E-Way Bill Demo Print PDF via GET: /aspapi/v1.0/${printAction}?showdemo`);
      response = await this.executeRequest(targetSandbox, pathAndQuery, {
        method: 'GET',
        headers: {
          'aspid': aspid,
          'password': password,
          'Gstin': gstin
        }
      });
    } else {
      // 2. Fetch E-Way Bill details from GSP for real production print
      let details: any;
      try {
        const res = await this.getEWayBillDetails(ewbNo, companySettings, irn, true);
        details = res;
      } catch (err: any) {
        console.error('Could not fetch EWB details required for print API:', err);
        throw err;
      }

      if (!details) {
        throw new Error('Could not fetch E-Way Bill details required for TaxPro print API.');
      }

      // Map the details object to a strictly valid E-Way Bill structure
      const rawData = details.Data || details.data || details;
      
      const mappedData: any = {
        ewbNo: parseFloat(rawData.ewbNo || rawData.EwbNo || rawData.ewayBillNo || ewbNo),
        ewayBillDate: rawData.ewayBillDate || rawData.EwayBillDate || rawData.EwbDt || new Date().toLocaleDateString('en-IN'),
        genMode: rawData.genMode || rawData.GenMode || 'API',
        userGstin: companySettings.gstin || '',
        fromGstin: rawData.fromGstin || rawData.FromGstin || companySettings.gstin || '',
        fromTrdName: rawData.fromTrdName || rawData.FromTrdName || companySettings.company_name || '',
        fromAddr1: rawData.fromAddr1 || rawData.FromAddr1 || companySettings.address_line1 || '',
        fromAddr2: rawData.fromAddr2 || rawData.FromAddr2 || companySettings.address_line2 || '',
        fromPlace: rawData.fromPlace || rawData.FromPlace || companySettings.locality || '',
        fromPincode: parseInt(rawData.fromPincode || rawData.FromPincode || companySettings.pin_code || '0', 10),
        fromStateCode: parseInt(rawData.fromStateCode || rawData.FromStateCode || companySettings.state_code || '33', 10),
        
        toGstin: rawData.toGstin || rawData.ToGstin || '',
        toTrdName: rawData.toTrdName || rawData.ToTrdName || '',
        toAddr1: rawData.toAddr1 || rawData.ToAddr1 || '',
        toAddr2: rawData.toAddr2 || rawData.ToAddr2 || '',
        toPlace: rawData.toPlace || rawData.ToPlace || '',
        toPincode: parseInt(rawData.toPincode || rawData.ToPincode || '0', 10),
        toStateCode: parseInt(rawData.toStateCode || rawData.ToStateCode || '33', 10),
        
        docNo: rawData.docNo || rawData.DocNo || '',
        docDate: rawData.docDate || rawData.DocDate || '',
        docType: rawData.docType || rawData.DocType || 'INV',
        
        mainProduct: rawData.mainProduct || rawData.MainProduct || '',
        hsnCode: parseInt(rawData.hsnCode || rawData.HsnCode || '0', 10),
        taxableAmount: parseFloat(rawData.taxableAmount || rawData.TaxableAmount || '0'),
        cgstValue: parseFloat(rawData.cgstValue || rawData.CgstValue || '0'),
        sgstValue: parseFloat(rawData.sgstValue || rawData.SgstValue || '0'),
        igstValue: parseFloat(rawData.igstValue || rawData.IgstValue || '0'),
        totInvValue: parseFloat(rawData.totInvValue || rawData.TotInvValue || '0'),
        
        vehicleListDetails: (rawData.vehicleListDetails || rawData.VehiclListDetails || []).map((v: any) => ({
          vehicleNo: v.vehicleNo || v.VehicleNo || '',
          fromPlace: v.fromPlace || v.FromPlace || '',
          enteredDate: v.enteredDate || v.EnteredDate || '',
          transMode: v.transMode || v.TransMode || '1',
          transDocNo: v.transDocNo || v.TransDocNo || '',
          transDocDate: v.transDocDate || v.TransDocDate || '',
          gstinNo: v.gstinNo || v.GstinNo || companySettings.gstin || ''
        }))
      };

      // If no vehicle details list, fallback to primary vehicle info
      if (mappedData.vehicleListDetails.length === 0 && (rawData.vehicleNo || rawData.VehicleNo)) {
        mappedData.vehicleListDetails.push({
          vehicleNo: rawData.vehicleNo || rawData.VehicleNo || '',
          fromPlace: rawData.fromPlace || rawData.FromPlace || companySettings.locality || '',
          enteredDate: rawData.ewayBillDate || rawData.EwayBillDate || rawData.EwbDt || '',
          transMode: rawData.transMode || rawData.TransMode || '1',
          transDocNo: rawData.transDocNo || rawData.TransDocNo || '',
          transDocDate: rawData.transDocDate || rawData.TransDocDate || '',
          gstinNo: companySettings.gstin || ''
        });
      }

      const payload = {
        Status: "1",
        Data: JSON.stringify(mappedData),
        ErrorDetails: null,
        InfoDtls: null
      };

      console.info(`Requesting E-Way Bill print PDF via POST: /aspapi/v1.0/${printAction}`);
      response = await this.executeRequest(targetSandbox, pathAndQuery, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'aspid': aspid,
          'password': password,
          'Gstin': gstin
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      await handleNonOkResponse(response, 'Download Official E-Way Bill PDF server error');
    }

    // Read response as binary PDF blob
    const blob = await response.blob();
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    console.log(`Official E-Way Bill PDF downloaded: ${filename}`);
  },


  /**
   * Fetch distance between two pincodes from GSP
   */
  async getPinPinDistance(fromPinCode: string, toPinCode: string, companySettings: CompanySetting): Promise<number> {
    const token = await this.authenticateEWayBill(companySettings);
    const sandbox = companySettings.einvoice_sandbox ?? true;

    // Substitute pincode for sandbox seller if needed
    const finalFromPin = sandbox ? '605001' : fromPinCode.trim();
    const finalToPin = toPinCode.trim();

    const aspid = companySettings.einvoice_aspid || '';
    const password = companySettings.einvoice_asppassword || '';
    const gstin = companySettings.gstin || '';

    const makeRequest = async (tokenVal: string) => {
      const pathAndQuery = `/ewaybillapi/dec/v1.03/ewayapi?action=GETPINPIN&aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&gstin=${encodeURIComponent(gstin)}&authtoken=${encodeURIComponent(tokenVal)}&fromPinCode=${encodeURIComponent(finalFromPin)}&toPinCode=${encodeURIComponent(finalToPin)}`;
      return await this.executeRequest(sandbox, pathAndQuery, {
        method: 'GET',
        headers: {
          'aspid': aspid,
          'password': password,
        }
      });
    };

    console.log(`Fetching Pin-Pin distance from ${finalFromPin} to ${finalToPin}...`);
    let response: Response;
    try {
      response = await makeRequest(token);
      if (!response.ok) {
        await handleNonOkResponse(response, 'Get Pin-Pin distance server error');
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('GSP752') || err.message.includes('AuthToken not found') || err.message.includes('expired'))) {
        console.warn('AuthToken expired. Retrying Get Pin-Pin distance with a fresh token...');
        const freshToken = await this.authenticateEWayBill(companySettings, true);
        response = await makeRequest(freshToken);
        if (!response.ok) {
          await handleNonOkResponse(response, 'Get Pin-Pin distance server error');
        }
      } else {
        throw err;
      }
    }

    const result = await response.json();
    console.log('Get Pin-Pin distance response:', result);

    if ((result.Status === 1 || result.Status === '1') && result.Data?.distance) {
      return parseInt(result.Data.distance.toString(), 10);
    } else {
      // Check if distance is returned in an alert/error
      const errorMsg = result.ErrorDetails?.[0]?.ErrorMessage || result.error?.message || '';
      const correctDist = parseDistanceLimit(errorMsg);
      if (correctDist) return correctDist;
      throw new Error(result.ErrorDetails?.[0]?.ErrorMessage || 'Failed to fetch Pin-Pin distance');
    }
  },

  /**
   * Fetch complete E-Invoice details from GSP by IRN
   */
  async getEInvoiceDetails(irn: string, companySettings: CompanySetting): Promise<any> {
    const token = await this.authenticate(companySettings);
    const sandbox = companySettings.einvoice_sandbox ?? true;

    const aspid = companySettings.einvoice_aspid || '';
    const password = companySettings.einvoice_asppassword || '';
    const gstin = companySettings.gstin || '';
    const username = companySettings.einvoice_username || '';

    const makeRequest = async (tokenVal: string) => {
      const pathAndQuery = `/eicore/dec/v1.03/Invoice/irn/${encodeURIComponent(irn)}?aspid=${encodeURIComponent(aspid)}&password=${encodeURIComponent(password)}&Gstin=${encodeURIComponent(gstin)}&AuthToken=${encodeURIComponent(tokenVal)}&User_name=${encodeURIComponent(username)}`;
      return await this.executeRequest(sandbox, pathAndQuery, {
        method: 'GET',
        headers: {
          'aspid': aspid,
          'password': password,
        }
      });
    };

    let response: Response;
    try {
      response = await makeRequest(token);
      if (!response.ok) {
        await handleNonOkResponse(response, 'Get E-Invoice details server error');
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('GSP752') || err.message.includes('AuthToken not found') || err.message.includes('expired'))) {
        console.warn('AuthToken expired. Retrying Get E-Invoice details with a fresh token...');
        const freshToken = await this.authenticate(companySettings, true);
        response = await makeRequest(freshToken);
        if (!response.ok) {
          await handleNonOkResponse(response, 'Get E-Invoice details server error');
        }
      } else {
        throw err;
      }
    }

    const result = await response.json();
    console.log('Get E-Invoice details response:', result);
    return result;
  },

  /**
   * Helper to generate a computer-generated E-Way Bill PDF client-side using jsPDF.
   * This uses the official details returned from the GetEwayBill API.
   */
  async generateLocalEWayBillPDF(
    ewbNo: string,
    companySettings: CompanySetting,
    filename: string,
    ewbDetails?: any
  ): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: QRCode } = await import('qrcode');
      const doc = new jsPDF();

      // Generate E-Way Bill QR Code containing E-Way Bill Number
      const qrCodeDataUrl = await QRCode.toDataURL(ewbNo, {
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Draw outer border
      doc.setDrawColor(0, 102, 204);
      doc.setLineWidth(1);
      doc.rect(10, 10, 190, 277);

      const sandbox = companySettings.einvoice_sandbox ?? true;

      // Title block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 102, 204);
      doc.text("GOVERNMENT OF INDIA", 105, 22, { align: "center" });

      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text(sandbox ? "E-WAY BILL SYSTEM (SANDBOX MOCK)" : "E-WAY BILL SYSTEM", 105, 32, { align: "center" });

      doc.setDrawColor(200, 200, 200);
      doc.line(15, 40, 195, 40);

      // Draw E-Way Bill QR Code at top right of details section
      doc.addImage(qrCodeDataUrl, 'PNG', 150, 48, 35, 35);

      // --- Section 1: E-Way Bill Details ---
      let y = 50;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 102, 204);
      doc.text("E-Way Bill Details", 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      const ewbDate = ewbDetails?.ewayBillDate || ewbDetails?.EwayBillDate || new Date().toLocaleDateString();
      const validUpto = ewbDetails?.validUpto || ewbDetails?.ValidUpto || 'N/A';
      const genMode = ewbDetails?.genMode || ewbDetails?.GenMode || 'N/A';
      const distance = ewbDetails?.distance || ewbDetails?.Distance || 'N/A';
      const supplyType = ewbDetails?.supplyType || ewbDetails?.SupplyType || 'Outward';
      const docNo = ewbDetails?.docNo || ewbDetails?.DocNo || 'N/A';
      const docDate = ewbDetails?.docDate || ewbDetails?.DocDate || 'N/A';
      const docType = ewbDetails?.docType || ewbDetails?.DocType || 'N/A';

      doc.text(`E-Way Bill No    : ${ewbNo}`, 20, y); y += 7;
      doc.text(`E-Way Bill Date  : ${ewbDate}`, 20, y); y += 7;
      doc.text(`Valid Upto       : ${validUpto}`, 20, y); y += 7;
      doc.text(`Generated Mode   : ${genMode}`, 20, y); y += 7;
      doc.text(`Distance (km)    : ${distance}`, 20, y); y += 7;
      doc.text(`Supply Type      : ${supplyType}`, 20, y); y += 7;
      doc.text(`Doc No / Date    : ${docNo} / ${docDate} (${docType})`, 20, y); y += 7;

      doc.line(15, y + 2, 195, y + 2); y += 8;

      // --- Section 2: Supplier & Recipient ---
      const fromGstin = ewbDetails?.fromGstin || ewbDetails?.FromGstin || companySettings.gstin || '';
      const fromTrdName = ewbDetails?.fromTrdName || ewbDetails?.FromTrdName || companySettings.company_name || '';
      const fromAddr1 = ewbDetails?.fromAddr1 || ewbDetails?.FromAddr1 || companySettings.address_line1 || '';
      const fromPlace = ewbDetails?.fromPlace || ewbDetails?.FromPlace || '';
      const fromState = ewbDetails?.fromStateCode || ewbDetails?.FromStateCode || '';
      const fromPincode = ewbDetails?.fromPincode || ewbDetails?.FromPincode || '';

      const toGstin = ewbDetails?.toGstin || ewbDetails?.ToGstin || '';
      const toTrdName = ewbDetails?.toTrdName || ewbDetails?.ToTrdName || '';
      const toAddr1 = ewbDetails?.toAddr1 || ewbDetails?.ToAddr1 || '';
      const toPlace = ewbDetails?.toPlace || ewbDetails?.ToPlace || '';
      const toState = ewbDetails?.toStateCode || ewbDetails?.ToStateCode || '';
      const toPincode = ewbDetails?.toPincode || ewbDetails?.ToPincode || '';

      // Two-column layout
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 102, 204);
      doc.text("Bill From (Supplier)", 20, y);
      doc.text("Bill To (Recipient)", 110, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const lineData = [
        [`GSTIN: ${fromGstin}`, `GSTIN: ${toGstin}`],
        [`Name : ${fromTrdName}`, `Name : ${toTrdName}`],
        [`Addr : ${fromAddr1}`, `Addr : ${toAddr1}`],
        [`Place: ${fromPlace} - ${fromPincode} (State: ${fromState})`, `Place: ${toPlace} - ${toPincode} (State: ${toState})`],
      ];
      for (const [left, right] of lineData) {
        doc.text(left, 20, y, { maxWidth: 85 });
        doc.text(right, 110, y, { maxWidth: 85 });
        y += 7;
      }

      doc.line(15, y + 2, 195, y + 2); y += 8;

      // --- Section 3: Transport Details ---
      const transMode = ewbDetails?.transMode || ewbDetails?.TransMode || '1'; // 1=Road
      const transModeLabel = transMode === '1' ? 'Road' : transMode === '2' ? 'Rail' : transMode === '3' ? 'Air' : transMode === '4' ? 'Ship' : transMode;
      const transDocNo = ewbDetails?.transDocNo || ewbDetails?.TransDocNo || '';
      const transDocDate = ewbDetails?.transDocDate || ewbDetails?.TransDocDate || '';
      const vehicleNo = ewbDetails?.vehicleNo || ewbDetails?.VehicleNo || '';
      const transType = ewbDetails?.transType || ewbDetails?.TransType || '1';
      const transTypeLbl = transType === '1' ? 'Regular' : 'Over Dimensional Cargo';
      const transporterName = ewbDetails?.transporterName || ewbDetails?.TransporterName || '';
      const transporterId = ewbDetails?.transporterId || ewbDetails?.TransporterId || '';

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 102, 204);
      doc.text("Transportation Details", 20, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`Mode         : ${transModeLabel}`, 20, y); y += 6;
      doc.text(`Vehicle No   : ${vehicleNo}`, 20, y);
      doc.text(`Vehicle Type : ${transTypeLbl}`, 110, y); y += 6;
      doc.text(`Transporter  : ${transporterName} (${transporterId})`, 20, y); y += 6;
      if (transDocNo) {
        doc.text(`Trans Doc No : ${transDocNo} / ${transDocDate}`, 20, y); y += 6;
      }

      doc.line(15, y + 2, 195, y + 2); y += 8;

      // --- Section 4: Item details summary ---
      const itemList: any[] = ewbDetails?.itemList || ewbDetails?.ItemList || [];
      if (itemList.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 102, 204);
        doc.text("Item Details", 20, y); y += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);

        // Header row
        doc.setFont("helvetica", "bold");
        doc.text("#", 20, y);
        doc.text("Product", 28, y);
        doc.text("HSN", 105, y);
        doc.text("Qty", 130, y);
        doc.text("Unit", 145, y);
        doc.text("Tax Amt", 165, y);
        y += 5;
        doc.setDrawColor(180, 180, 180);
        doc.line(18, y, 192, y); y += 4;

        doc.setFont("helvetica", "normal");
        for (let i = 0; i < Math.min(itemList.length, 8); i++) {
          const item = itemList[i];
          const pName = (item.productName || item.ProductName || '').substring(0, 35);
          const hsn = item.hsnCode || item.HsnCode || '';
          const qty = item.quantity || item.Quantity || '';
          const unit = item.qtyUnit || item.QtyUnit || '';
          const taxAmt = item.taxableAmount || item.TaxableAmount || '';
          doc.text(`${i + 1}`, 20, y);
          doc.text(pName, 28, y, { maxWidth: 75 });
          doc.text(`${hsn}`, 105, y);
          doc.text(`${qty}`, 130, y);
          doc.text(`${unit}`, 145, y);
          doc.text(`${taxAmt}`, 165, y);
          y += 6;
          if (y > 270) break; // page overflow guard
        }

        doc.line(15, y + 2, 195, y + 2); y += 8;
      }

      // --- Footer / Disclaimer ---
      if (sandbox) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          "Note: This is a SANDBOX MOCK document generated client-side. It holds no legal validity.",
          105, 280, { align: "center" }
        );
      }

      doc.save(filename);
      console.log(`Mock E-Way Bill PDF saved successfully: ${filename}`);
    } catch (err) {
      console.error('Failed to generate mock E-Way Bill PDF:', err);
      throw new Error('Failed to generate E-Way Bill PDF (Sandbox mock error)');
    }
  }
};
