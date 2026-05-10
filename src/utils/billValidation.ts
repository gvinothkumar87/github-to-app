import { getFinancialYear } from './financialYear';

export interface BillRecord {
  bill_serial_no: string | null;
  sale_date: string | null;
}

export function validateBillSequence(
  newBillSerial: string,
  newSaleDate: string, // YYYY-MM-DD
  existingBills: BillRecord[],
  isSpecialSerial: boolean = false
): { isValid: boolean; error?: string; errorEn?: string; errorTa?: string } {
  if (!newBillSerial || !newSaleDate) return { isValid: true };

  const match = newBillSerial.match(/^(.*?)(\d+)$/);
  if (!match) return { isValid: true }; // Cannot parse, skip chronological validation

  const prefix = match[1];
  const newNum = parseInt(match[2], 10);
  const newDateObj = new Date(newSaleDate);
  const newFY = getFinancialYear(newDateObj);
  const newDateTime = newDateObj.getTime();

  // Filter bills with the same prefix AND same financial year
  const samePrefixBills = existingBills.filter(bill => {
    if (!bill.bill_serial_no || !bill.sale_date) return false;
    
    // Check FY first
    const billFY = getFinancialYear(new Date(bill.sale_date));
    if (billFY !== newFY) return false;

    const bMatch = bill.bill_serial_no.match(/^(.*?)(\d+)$/);
    if (!bMatch) return false;
    return bMatch[1] === prefix;
  });

  for (const bill of samePrefixBills) {
    if (!bill.bill_serial_no || !bill.sale_date) continue;
    
    const bMatch = bill.bill_serial_no.match(/^(.*?)(\d+)$/)!;
    const bNum = parseInt(bMatch[2], 10);
    
    if (bNum === newNum) {
      return { 
        isValid: false, 
        error: `Bill number ${newBillSerial} has already been used.`,
        errorEn: `Bill number ${newBillSerial} has already been used.`,
        errorTa: `பில் எண் ${newBillSerial} ஏற்கனவே பயன்படுத்தப்பட்டுள்ளது.`
      };
    }

    if (!isSpecialSerial) {
      const bDateObj = new Date(bill.sale_date).getTime();
      
      // If existing bill has a smaller number, its date must be <= newDate
      if (bNum < newNum && bDateObj > newDateTime) {
        return { 
          isValid: false, 
          error: `Invalid Date: Bill ${newBillSerial} cannot be on ${newSaleDate} because an earlier Bill ${bill.bill_serial_no} is on a later date (${bill.sale_date}).`,
          errorEn: `Invalid Date: Bill ${newBillSerial} cannot be on ${newSaleDate} because an earlier Bill ${bill.bill_serial_no} is on a later date (${bill.sale_date}).`,
          errorTa: `தவறான தேதி: முந்தைய பில் ${bill.bill_serial_no} பிந்தைய தேதியில் (${bill.sale_date}) உள்ளதால், புதிய பில் ${newBillSerial} ஐ ${newSaleDate} தேதியில் உருவாக்க முடியாது.`
        };
      }
      
      // If existing bill has a larger number, its date must be >= newDate
      if (bNum > newNum && bDateObj < newDateTime) {
        return { 
          isValid: false, 
          error: `Invalid Date: Bill ${newBillSerial} cannot be on ${newSaleDate} because a later Bill ${bill.bill_serial_no} is on an earlier date (${bill.sale_date}).`,
          errorEn: `Invalid Date: Bill ${newBillSerial} cannot be on ${newSaleDate} because a later Bill ${bill.bill_serial_no} is on an earlier date (${bill.sale_date}).`,
          errorTa: `தவறான தேதி: பிந்தைய பில் ${bill.bill_serial_no} முந்தைய தேதியில் (${bill.sale_date}) உள்ளதால், புதிய பில் ${newBillSerial} ஐ ${newSaleDate} தேதியில் உருவாக்க முடியாது.`
        };
      }
    }
  }

  return { isValid: true };
}
