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
  const { sales, customers, items, startDate, endDate, excludeDSeries = true } = options;

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const matchesDate = saleDate >= start && saleDate <= end;
    const notDSeries = !excludeDSeries || !sale.bill_serial_no || !sale.bill_serial_no.startsWith('D');
    
    return matchesDate && notDSeries;
  });

  // Calculate totals
  let totalTaxableAmount = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let grandTotal = 0;

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

  return {
    totalTaxableAmount,
    totalCGST,
    totalSGST,
    grandTotal,
    recordCount: filteredSales.length
  };
};

export const exportGSTExcel = (options: GSTExcelOptions): { success: boolean; message: string } => {
  const { sales, customers, items, startDate, endDate, excludeDSeries = true } = options;

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const matchesDate = saleDate >= start && saleDate <= end;
    const notDSeries = !excludeDSeries || !sale.bill_serial_no || !sale.bill_serial_no.startsWith('D');
    
    return matchesDate && notDSeries;
  });

  if (filteredSales.length === 0) {
    return {
      success: false,
      message: excludeDSeries 
        ? 'No sales data found for the selected period (excluding D series)'
        : 'No sales data found for the selected period'
    };
  }

  // Prepare Excel data
  const excelData = filteredSales.map((sale, index) => {
    const customer = customers.find((c) => c.id === sale.customer_id);
    const item = items.find((i) => i.id === sale.item_id);
    
    const unitWeight = Number(item?.unit_weight) || 0;
    const bags = Number(sale.quantity) || 0;
    const totalWeight = unitWeight * bags;
    const rate = Number(sale.rate) || 0;
    const gstPercentage = Number(item?.gst_percentage) || 0;
    const finalTotal = Number(sale.total_amount) || 0;
    
    // Reverse calculate amount before GST from final total
    const amount = finalTotal / (1 + gstPercentage / 100);
    const gstAmount = finalTotal - amount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    return {
      '': index + 1,
      'DATE': format(new Date(sale.sale_date), 'dd/MM/yyyy'),
      'BILL NO': sale.bill_serial_no || '',
      'PARTY': customer?.name_english || '',
      'GSTIN': customer?.gstin || '',
      'FEED': item?.name_english || '',
      'HSN': item?.hsn_no || '',
      'KG': unitWeight,
      'BAGS': bags,
      'TOTAL WEIGHT': totalWeight,
      'RATE': rate,
      'AMOUNT': amount.toFixed(2),
      'GST%': gstPercentage,
      'CGST': cgst.toFixed(2),
      'SGST': sgst.toFixed(2),
      'DISCOUNT': '',
      'ADD AMOUNT': '',
      'FINAL TOTAL': finalTotal.toFixed(2)
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
    { wch: 12 }, // BILL NO
    { wch: 25 }, // PARTY
    { wch: 18 }, // GSTIN
    { wch: 15 }, // FEED
    { wch: 10 }, // HSN
    { wch: 10 }, // KG
    { wch: 8 },  // BAGS
    { wch: 12 }, // TOTAL WEIGHT
    { wch: 10 }, // RATE
    { wch: 12 }, // AMOUNT
    { wch: 12 }, // TOTAL
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
    message: excludeDSeries 
      ? `Exported ${filteredSales.length} records (excluding D series)`
      : `Exported ${filteredSales.length} records`
  };
};
