import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../components/MobileLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, Users, Package, TrendingUp, TrendingDown, FileSpreadsheet } from 'lucide-react';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

const MobileReports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customerId, setCustomerId] = useState<string>('');
  const [itemId, setItemId] = useState<string>('');

  const { data: sales, loading: salesLoading, isServicesReady } = useEnhancedOfflineData('offline_sales');
  const { data: customers } = useEnhancedOfflineData('offline_customers');
  const { data: items } = useEnhancedOfflineData('offline_items');

  const [reportData, setReportData] = useState<any>(null);

  const reportTypes = [
    { value: 'sales-summary', label: 'Sales Summary', icon: TrendingUp },
    { value: 'customer-summary', label: 'Customer Summary', icon: Users },
    { value: 'item-summary', label: 'Item Summary', icon: Package },
    { value: 'receipt-summary', label: 'Receipt Summary', icon: FileText },
    { value: 'transit-summary', label: 'Transit Summary', icon: TrendingDown }
  ];

  const generateReport = () => {
    if (!selectedReport) {
      toast({ title: 'Error', description: 'Please select a report type', variant: 'destructive' });
      return;
    }

    const filteredSales = (sales || []).filter((sale: any) => {
      const saleDate = new Date(sale.sale_date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      let matchesDate = saleDate >= start && saleDate <= end;
      let matchesCustomer = !customerId || sale.customer_id === customerId;
      let matchesItem = !itemId || sale.item_id === itemId;
      
      return matchesDate && matchesCustomer && matchesItem;
    }) || [];

    switch (selectedReport) {
      case 'sales-summary':
        const totalSales = filteredSales.reduce((sum: number, sale: any) => sum + (Number(sale.total_amount) || 0), 0);
        const totalQuantity = filteredSales.reduce((sum: number, sale: any) => sum + (Number(sale.quantity) || 0), 0);
        
        setReportData({
          type: 'Sales Summary',
          period: `${startDate} to ${endDate}`,
          totalRecords: filteredSales.length,
          totalAmount: totalSales,
          totalQuantity: totalQuantity,
          averagePerSale: filteredSales.length > 0 ? (Number(totalSales) / Number(filteredSales.length)) : 0,
          items: filteredSales
        });
        break;

      case 'customer-summary':
        const customerSales = filteredSales.reduce((acc: any, sale: any) => {
          const customer = (customers || []).find((c: any) => c.id === sale.customer_id);
          const customerName = (customer as any)?.name_english || 'Unknown';
          
          if (!acc[sale.customer_id]) {
            acc[sale.customer_id] = {
              customerName,
              totalAmount: 0,
              totalQuantity: 0,
              salesCount: 0
            };
          }
          
          acc[sale.customer_id].totalAmount += (Number(sale.total_amount) || 0);
          acc[sale.customer_id].totalQuantity += (Number(sale.quantity) || 0);
          acc[sale.customer_id].salesCount += 1;
          
          return acc;
        }, {});
        
        setReportData({
          type: 'Customer Summary',
          period: `${startDate} to ${endDate}`,
          totalCustomers: Object.keys(customerSales).length,
          items: Object.entries(customerSales).map(([id, data]: [string, any]) => ({
            id,
            ...data
          }))
        });
        break;

      case 'item-summary':
        const itemSales = filteredSales.reduce((acc: any, sale: any) => {
          const item = (items || []).find((i: any) => i.id === sale.item_id);
          const itemName = (item as any)?.name_english || 'Unknown';
          
          if (!acc[sale.item_id]) {
            acc[sale.item_id] = {
              itemName,
              totalAmount: 0,
              totalQuantity: 0,
              salesCount: 0
            };
          }
          
          acc[sale.item_id].totalAmount += (Number(sale.total_amount) || 0);
          acc[sale.item_id].totalQuantity += (Number(sale.quantity) || 0);
          acc[sale.item_id].salesCount += 1;
          
          return acc;
        }, {});
        
        setReportData({
          type: 'Item Summary',
          period: `${startDate} to ${endDate}`,
          totalItems: Object.keys(itemSales).length,
          items: Object.entries(itemSales).map(([id, data]: [string, any]) => ({
            id,
            ...data
          }))
        });
        break;

      default:
        setReportData(null);
    }

    toast({ title: 'Report generated', description: 'Report generated successfully' });
  };

  const exportReport = () => {
    if (!reportData) {
      toast({ title: 'Error', description: 'Please generate a report first', variant: 'destructive' });
      return;
    }

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedReport}-${startDate}-to-${endDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Report exported', description: 'Report exported successfully' });
  };

  const exportGSTExcel = () => {
    // Filter sales within date range and exclude D series bills
    const filteredSales = (sales || []).filter((sale: any) => {
      const saleDate = new Date(sale.sale_date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const matchesDate = saleDate >= start && saleDate <= end;
      // Exclude D series bills (bill_serial_no starting with 'D')
      const notDSeries = !sale.bill_serial_no || !sale.bill_serial_no.startsWith('D');
      
      return matchesDate && notDSeries;
    }) || [];

    if (filteredSales.length === 0) {
      toast({ title: 'No Data', description: 'No sales data found for the selected period (excluding D series)', variant: 'destructive' });
      return;
    }

    // Prepare Excel data
    const excelData = filteredSales.map((sale: any, index: number) => {
      const customer = (customers || []).find((c: any) => c.id === sale.customer_id);
      const item = (items || []).find((i: any) => i.id === sale.item_id);
      
      const quantity = Number(sale.quantity) || 0;
      const rate = Number(sale.rate) || 0;
      const amount = quantity * rate;
      const gstPercentage = Number(sale.gst_percentage) || 0;
      const gstAmount = amount * (gstPercentage / 100);
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;
      const total = amount + gstAmount;

      return {
        '': index + 1,
        'DATE': format(new Date(sale.sale_date), 'dd/MM/yyyy'),
        'BILL NO': sale.bill_serial_no || '',
        'PARTY': (customer as any)?.name_english || '',
        'GSTIN': (customer as any)?.gstin || '',
        'FEED': (item as any)?.name_english || '',
        'HSN': (item as any)?.hsn_no || '',
        'KG': quantity,
        'BAGS': sale.bags || '',
        'TOTAL WEIGHT': quantity,
        'RATE': rate,
        'AMOUNT': amount,
        'GST%': gstPercentage,
        'CGST': cgst.toFixed(2),
        'SGST': sgst.toFixed(2),
        'DISCOUNT': '',
        'ADD AMOUNT': '',
        'FINAL TOTAL': total.toFixed(2)
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

    toast({ title: 'GST Report Exported', description: `Exported ${filteredSales.length} records (excluding D series)` });
  };

  if (salesLoading) {
    return (
      <MobileLayout title="Reports">
        <div className="py-10 text-center text-muted-foreground">Loading reports...</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Reports">
      <div className="space-y-6">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Configure and generate various business reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Optional Filters */}
            <div>
              <Label htmlFor="customer">Customer (Optional)</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All customers</SelectItem>
                  {(customers || []).map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name_english}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="item">Item (Optional)</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="All items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All items</SelectItem>
                  {(items || []).map((item: any) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name_english}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={generateReport} className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              {reportData && (
                <Button onClick={exportReport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              <Button onClick={exportGSTExcel} variant="secondary">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                GST Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportData && (
          <Card>
            <CardHeader>
              <CardTitle>{reportData.type}</CardTitle>
              <CardDescription>Period: {reportData.period}</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedReport === 'sales-summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {reportData.totalRecords}
                      </div>
                      <div className="text-sm text-primary">Total Sales</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/20 rounded-lg">
                      <div className="text-2xl font-bold text-secondary-foreground">
                        ₹{reportData.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-secondary-foreground">Total Amount</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-accent/20 rounded-lg">
                      <div className="text-2xl font-bold text-accent-foreground">
                        {reportData.totalQuantity.toFixed(2)}
                      </div>
                      <div className="text-sm text-accent-foreground">Total Quantity</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-muted-foreground">
                        ₹{reportData.averagePerSale.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Per Sale</div>
                    </div>
                  </div>
                </div>
              )}

              {(selectedReport === 'customer-summary' || selectedReport === 'item-summary') && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {selectedReport === 'customer-summary' ? reportData.totalCustomers : reportData.totalItems}
                    </div>
                    <div className="text-sm text-primary">
                      {selectedReport === 'customer-summary' ? 'Total Customers' : 'Total Items'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {reportData.items.map((item: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium">
                          {selectedReport === 'customer-summary' ? item.customerName : item.itemName}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-muted-foreground">
                          <div>Sales: {item.salesCount}</div>
                          <div>Qty: {item.totalQuantity.toFixed(2)}</div>
                          <div>₹{item.totalAmount.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileReports;