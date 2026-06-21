import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface Sale {
  id: string;
  sale_date: string;
  bill_serial_no?: string;
  customer_id: string;
  item_id: string;
  quantity: number;
  rate: number;
  total_amount: number;
  gst_percentage?: number;
  bags?: number;
}

interface DebitNote {
  id: string;
  note_no: string;
  note_date: string;
  customer_id: string;
  item_id: string;
  amount: number;
  gst_percentage?: number;
  reason: string;
}

interface CreditNote {
  id: string;
  note_no: string;
  note_date: string;
  customer_id: string;
  item_id: string;
  amount: number;
  gst_percentage?: number;
  reason: string;
}

interface Customer {
  id: string;
  name_english: string;
  gstin?: string;
}

interface Item {
  id: string;
  name_english: string;
  hsn_no?: string;
  unit_weight: number;
  gst_percentage: number;
}

export interface GSTExcelOptions {
  sales: Sale[];
  debitNotes?: DebitNote[];
  creditNotes?: CreditNote[];
  customers: Customer[];
  items: Item[];
  startDate: string;
  endDate: string;
  excludeDSeries?: boolean;
}

export interface GSTSummary {
  totalTaxableAmount: number;
  totalCGST: number;
  totalSGST: number;
  grandTotal: number;
  recordCount: number;
}

export const calculateGSTSummary = (options: GSTExcelOptions): GSTSummary => {
  const { sales, debitNotes = [], creditNotes = [], customers, items, startDate, endDate, excludeDSeries = true } = options;

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const matchesDate = saleDate >= start && saleDate <= end;
    const notDSeries = !excludeDSeries || !sale.bill_serial_no || !sale.bill_serial_no.startsWith('D');
    
    return matchesDate && notDSeries;
  });

  // Filter debit notes
  const filteredDebitNotes = debitNotes.filter((note) => {
    const noteDate = new Date(note.note_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return noteDate >= start && noteDate <= end;
  });

  // Filter credit notes
  const filteredCreditNotes = creditNotes.filter((note) => {
    const noteDate = new Date(note.note_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return noteDate >= start && noteDate <= end;
  });

  // Calculate totals
  let totalTaxableAmount = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let grandTotal = 0;

  // Add sales
  filteredSales.forEach((sale) => {
    const item = items.find((i) => i.id === sale.item_id);
    const gstPercentage = Number(item?.gst_percentage) || 0;
    const finalTotal = Number(sale.total_amount) || 0;
    
    // Reverse calculate amount before GST from final total
    const amount = finalTotal / (1 + gstPercentage / 100);
    const gstAmount = finalTotal - amount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    totalTaxableAmount += amount;
    totalCGST += cgst;
    totalSGST += sgst;
    grandTotal += finalTotal;
  });

  // Add debit notes
  filteredDebitNotes.forEach((note) => {
    const item = items.find((i) => i.id === note.item_id);
    const gstPercentage = Number(note.gst_percentage) || Number(item?.gst_percentage) || 0;
    const finalTotal = Number(note.amount) || 0;
    
    const amount = finalTotal / (1 + gstPercentage / 100);
    const gstAmount = finalTotal - amount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    totalTaxableAmount += amount;
    totalCGST += cgst;
    totalSGST += sgst;
    grandTotal += finalTotal;
  });

  // Subtract credit notes
  filteredCreditNotes.forEach((note) => {
    const item = items.find((i) => i.id === note.item_id);
    const gstPercentage = Number(note.gst_percentage) || Number(item?.gst_percentage) || 0;
    const finalTotal = Number(note.amount) || 0;
    
    const amount = finalTotal / (1 + gstPercentage / 100);
    const gstAmount = finalTotal - amount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    totalTaxableAmount -= amount;
    totalCGST -= cgst;
    totalSGST -= sgst;
    grandTotal -= finalTotal;
  });

  return {
    totalTaxableAmount,
    totalCGST,
    totalSGST,
    grandTotal,
    recordCount: filteredSales.length + filteredDebitNotes.length + filteredCreditNotes.length
  };
};

export const exportGSTExcel = (options: GSTExcelOptions): { success: boolean; message: string } => {
  const { sales, debitNotes = [], creditNotes = [], customers, items, startDate, endDate, excludeDSeries = true } = options;

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const matchesDate = saleDate >= start && saleDate <= end;
    const notDSeries = !excludeDSeries || !sale.bill_serial_no || !sale.bill_serial_no.startsWith('D');
    
    return matchesDate && notDSeries;
  });

  // Filter debit notes
  const filteredDebitNotes = debitNotes.filter((note) => {
    const noteDate = new Date(note.note_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return noteDate >= start && noteDate <= end;
  });

  // Filter credit notes
  const filteredCreditNotes = creditNotes.filter((note) => {
    const noteDate = new Date(note.note_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return noteDate >= start && noteDate <= end;
  });

  const totalRecordsCount = filteredSales.length + filteredDebitNotes.length + filteredCreditNotes.length;

  if (totalRecordsCount === 0) {
    return {
      success: false,
      message: 'No GST records found for the selected period'
    };
  }

  // Combine and sort all records by date
  interface CombinedRecord {
    date: Date;
    dateStr: string;
    type: 'Sale' | 'Debit Note' | 'Credit Note';
    billNo: string;
    customerName: string;
    gstin: string;
    itemName: string;
    hsnNo: string;
    unitWeight: number;
    bags: number;
    totalWeight: number;
    rate: number;
    amount: number;
    gstPercentage: number;
    cgst: number;
    sgst: number;
    finalTotal: number;
  }

  const combined: CombinedRecord[] = [];

  // Add sales
  filteredSales.forEach((sale) => {
    const customer = customers.find((c) => c.id === sale.customer_id);
    const item = items.find((i) => i.id === sale.item_id);
    
    const unitWeight = Number(item?.unit_weight) || 0;
    const bags = Number(sale.quantity) || 0;
    const totalWeight = unitWeight * bags;
    const rate = Number(sale.rate) || 0;
    const gstPercentage = Number(item?.gst_percentage) || 0;
    const finalTotal = Number(sale.total_amount) || 0;
    
    const amount = finalTotal / (1 + gstPercentage / 100);
    const gstAmount = finalTotal - amount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    combined.push({
      date: new Date(sale.sale_date),
      dateStr: format(new Date(sale.sale_date), 'dd/MM/yyyy'),
      type: 'Sale',
      billNo: sale.bill_serial_no || '',
      customerName: customer?.name_english || '',
      gstin: customer?.gstin || '',
      itemName: item?.name_english || '',
      hsnNo: item?.hsn_no || '',
      unitWeight,
      bags,
      totalWeight,
      rate,
      amount,
      gstPercentage,
      cgst,
      sgst,
      finalTotal
    });
  });

  // Add debit notes
  filteredDebitNotes.forEach((note) => {
    const customer = customers.find((c) => c.id === note.customer_id);
    const item = items.find((i) => i.id === note.item_id);
    
    const gstPercentage = Number(note.gst_percentage) || Number(item?.gst_percentage) || 0;
    const finalTotal = Number(note.amount) || 0;
    
    const amount = finalTotal / (1 + gstPercentage / 100);
    const gstAmount = finalTotal - amount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    combined.push({
      date: new Date(note.note_date),
      dateStr: format(new Date(note.note_date), 'dd/MM/yyyy'),
      type: 'Debit Note',
      billNo: note.note_no || '',
      customerName: customer?.name_english || '',
      gstin: customer?.gstin || '',
      itemName: item?.name_english || '',
      hsnNo: item?.hsn_no || '',
      unitWeight: 0,
      bags: 0,
      totalWeight: 0,
      rate: 0,
      amount,
      gstPercentage,
      cgst,
      sgst,
      finalTotal
    });
  });

  // Add credit notes (make amounts negative for Excel)
  filteredCreditNotes.forEach((note) => {
    const customer = customers.find((c) => c.id === note.customer_id);
    const item = items.find((i) => i.id === note.item_id);
    
    const gstPercentage = Number(note.gst_percentage) || Number(item?.gst_percentage) || 0;
    const finalTotal = Number(note.amount) || 0;
    
    const amount = finalTotal / (1 + gstPercentage / 100);
    const gstAmount = finalTotal - amount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    combined.push({
      date: new Date(note.note_date),
      dateStr: format(new Date(note.note_date), 'dd/MM/yyyy'),
      type: 'Credit Note',
      billNo: note.note_no || '',
      customerName: customer?.name_english || '',
      gstin: customer?.gstin || '',
      itemName: item?.name_english || '',
      hsnNo: item?.hsn_no || '',
      unitWeight: 0,
      bags: 0,
      totalWeight: 0,
      rate: 0,
      amount: -amount,
      gstPercentage,
      cgst: -cgst,
      sgst: -sgst,
      finalTotal: -finalTotal
    });
  });

  // Sort by date ascending
  combined.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Prepare Excel data
  const excelData = combined.map((rec, index) => {
    return {
      '': index + 1,
      'DATE': rec.dateStr,
      'TYPE': rec.type,
      'BILL/NOTE NO': rec.billNo,
      'PARTY': rec.customerName,
      'GSTIN': rec.gstin,
      'FEED': rec.itemName,
      'HSN': rec.hsnNo,
      'KG': rec.unitWeight || '',
      'BAGS': rec.bags || '',
      'TOTAL WEIGHT': rec.totalWeight || '',
      'RATE': rec.rate || '',
      'AMOUNT': rec.amount.toFixed(2),
      'GST%': rec.gstPercentage,
      'CGST': rec.cgst.toFixed(2),
      'SGST': rec.sgst.toFixed(2),
      'DISCOUNT': '',
      'ADD AMOUNT': '',
      'FINAL TOTAL': rec.finalTotal.toFixed(2)
    };
  });

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'GST Report');

  // Auto-size columns
  const colWidths = [
    { wch: 5 },  // S.No
    { wch: 12 }, // DATE
    { wch: 12 }, // TYPE
    { wch: 18 }, // BILL/NOTE NO
    { wch: 25 }, // PARTY
    { wch: 18 }, // GSTIN
    { wch: 15 }, // FEED
    { wch: 10 }, // HSN
    { wch: 10 }, // KG
    { wch: 8 },  // BAGS
    { wch: 12 }, // TOTAL WEIGHT
    { wch: 10 }, // RATE
    { wch: 12 }, // AMOUNT
    { wch: 8 },  // GST%
    { wch: 12 }, // CGST
    { wch: 12 }, // SGST
    { wch: 10 }, // DISCOUNT
    { wch: 12 }, // ADD AMOUNT
    { wch: 12 }  // TOTAL
  ];
  ws['!cols'] = colWidths;

  // Generate file
  const fileName = `GST-Report-${startDate}-to-${endDate}.xlsx`;
  XLSX.writeFile(wb, fileName);

  return {
    success: true,
    message: `Exported ${combined.length} records successfully`
  };
};
