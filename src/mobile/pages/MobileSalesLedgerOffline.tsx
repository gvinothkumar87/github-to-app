import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { databaseService } from '../services/database.service';
import type { Customer, Item } from '@/types';

interface SalesLedgerEntry {
  id: string;
  customer_id: string;
  item_id: string;
  outward_entry_id: string;
  quantity: number;
  rate: number;
  total_amount: number;
  sale_date: string;
  bill_serial_no?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  customer_name_english?: string;
  customer_code?: string;
  item_name_english?: string;
  item_code?: string;
  empty_weight?: number;
  load_weight?: number;
  net_weight?: number;
  is_completed?: boolean;
}

const MobileSalesLedgerOffline: React.FC = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState<SalesLedgerEntry[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const { data: customers, isServicesReady } = useEnhancedOfflineData<Customer>('customers');
  const { data: items } = useEnhancedOfflineData<Item>('items');

  useEffect(() => {
    if (isServicesReady) {
      fetchSalesData();
    }
  }, [isServicesReady, selectedCustomerId, selectedItemId, fromDate, toDate]);

  const fetchSalesData = async () => {
    if (!isServicesReady) return;
    
    setLoading(true);
    try {
      // Get all sales data from offline database
      const allSales = await databaseService.findAll('sales');
      
      // Get customers and items data for joining
      const allCustomers = await databaseService.findAll('customers');
      const allItems = await databaseService.findAll('items');
      const allOutwardEntries = await databaseService.findAll('outward_entries');

      // Create lookup maps for efficient joining
      const customerMap = new Map(allCustomers.map(c => [c.id, c]));
      const itemMap = new Map(allItems.map(i => [i.id, i]));
      const outwardMap = new Map(allOutwardEntries.map(o => [o.id, o]));

      // Join the data
      let enrichedSales = allSales.map(sale => {
        const customer = customerMap.get(sale.customer_id);
        const item = itemMap.get(sale.item_id);
        const outward = outwardMap.get(sale.outward_entry_id);

        return {
          ...sale,
          customer_name_english: customer?.name_english,
          customer_code: customer?.code,
          item_name_english: item?.name_english,
          item_code: item?.code,
          empty_weight: outward?.empty_weight,
          load_weight: outward?.load_weight,
          net_weight: outward?.net_weight,
          is_completed: outward?.is_completed
        };
      });

      // Apply filters
      if (selectedCustomerId !== 'all') {
        enrichedSales = enrichedSales.filter(sale => sale.customer_id === selectedCustomerId);
      }

      if (selectedItemId !== 'all') {
        enrichedSales = enrichedSales.filter(sale => sale.item_id === selectedItemId);
      }

      if (fromDate) {
        enrichedSales = enrichedSales.filter(sale => sale.sale_date >= fromDate);
      }

      if (toDate) {
        enrichedSales = enrichedSales.filter(sale => sale.sale_date <= toDate);
      }

      // Sort by sale date (newest first)
      enrichedSales.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());

      setSalesData(enrichedSales);
    } catch (error) {
      console.error('Error fetching offline sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (entry: any) => {
    if (entry.is_completed) {
      return 'Completed';
    } else if (entry.load_weight) {
      return 'Loaded';
    } else {
      return 'Entry Only';
    }
  };

  const getStatusColor = (entry: any) => {
    if (entry.is_completed) {
      return 'bg-green-100 text-green-800';
    } else if (entry.load_weight) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-blue-100 text-blue-800';
    }
  };

  const totalAmount = salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const totalQuantity = salesData.reduce((sum, sale) => sum + Number(sale.quantity), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Sales Ledger</h1>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="p-2"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-t bg-muted/30">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name_english} ({customer.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Item</Label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Items" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name_english} ({item.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div>
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{salesData.length}</div>
              <div className="text-xs text-muted-foreground">Records</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{totalQuantity.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total KG</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Amount</div>
            </div>
          </Card>
        </div>

        {/* Sales List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : salesData.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data found</p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {salesData.map((sale) => (
                  <div key={sale.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {sale.customer_name_english} ({sale.customer_code})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sale.item_name_english} ({sale.item_code})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">₹{sale.total_amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(sale.sale_date), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex gap-4">
                        <span>Qty: {sale.quantity} KG</span>
                        <span>Rate: ₹{sale.rate}</span>
                        {sale.net_weight && (
                          <span>Net: {sale.net_weight} KG</span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale)}`}>
                        {getStatus(sale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileSalesLedgerOffline;