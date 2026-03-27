import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import type { Customer, Item, Sale, OutwardEntry } from '@/types';

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
  customers?: {
    id: string;
    name_english: string;
    name_tamil: string;
    code: string;
  };
  items?: {
    id: string;
    name_english: string;
    name_tamil: string;
    code: string;
  };
  outward_entries?: {
    id: string;
    entry_date: string;
    empty_weight: number;
    load_weight: number;
    net_weight: number;
    is_completed: boolean;
  };
}

interface CustomerSelect {
  id: string;
  name_english: string;
  name_tamil?: string;
  code: string;
}

interface ItemSelect {
  id: string;
  name_english: string;
  name_tamil?: string;
  code: string;
}

interface OutwardEntrySelect {
  id: string;
  entry_date: string;
  empty_weight: number;
  load_weight: number;
  net_weight: number;
  is_completed: boolean;
}

export const SalesLedgerView: React.FC = () => {
  const { language } = useLanguage();
  const [salesData, setSalesData] = useState<SalesLedgerEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [selectedCustomerId, selectedItemId, fromDate, toDate]);

  const fetchInitialData = async () => {
    try {
      const [customersResponse, itemsResponse] = await Promise.all([
        supabase.from('customers').select('*').order('name_english'),
        supabase.from('items').select('*').order('name_english')
      ]);

      if (customersResponse.data) setCustomers(customersResponse.data);
      if (itemsResponse.data) setItems(itemsResponse.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sales')
        .select(`
          *,
          customers (
            id,
            name_english,
            name_tamil,
            code
          ),
          items (
            id,
            name_english,
            name_tamil,
            code
          ),
          outward_entries (
            id,
            entry_date,
            empty_weight,
            load_weight,
            net_weight,
            is_completed
          )
        `)
        .order('sale_date', { ascending: false });

      // Apply filters
      if (selectedCustomerId !== 'all') {
        query = query.eq('customer_id', selectedCustomerId);
      }

      if (selectedItemId !== 'all') {
        query = query.eq('item_id', selectedItemId);
      }

      if (fromDate) {
        query = query.gte('sale_date', fromDate);
      }

      if (toDate) {
        query = query.lte('sale_date', toDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSalesData(data || []);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customer?: CustomerSelect) => {
    if (!customer) return 'N/A';
    return language === 'english' ? customer.name_english : (customer.name_tamil || customer.name_english);
  };

  const getItemName = (item?: ItemSelect) => {
    if (!item) return 'N/A';
    return language === 'english' ? item.name_english : (item.name_tamil || item.name_english);
  };

  const getStatus = (entry?: OutwardEntrySelect) => {
    if (!entry) return language === 'english' ? 'Unknown' : 'தெரியாது';
    
    if (entry.is_completed) {
      return language === 'english' ? 'Completed' : 'முடிந்தது';
    } else if (entry.load_weight) {
      return language === 'english' ? 'Loaded' : 'ஏற்றப்பட்டது';
    } else {
      return language === 'english' ? 'Entry Only' : 'என்ட்ரி மட்டும்';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'english' ? 'Sales Ledger' : 'விற்பனை லெட்ஜர்'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Customer Filter */}
            <div className="space-y-2">
              <Label>{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'english' ? 'Select Customer' : 'வாடிக்கையாளரைத் தேர்ந்தெடுக்கவும்'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'english' ? 'All Customers' : 'அனைத்து வாடிக்கையாளர்கள்'}
                  </SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {getCustomerName(customer)} ({customer.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Item Filter */}
            <div className="space-y-2">
              <Label>{language === 'english' ? 'Item' : 'பொருள்'}</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'english' ? 'Select Item' : 'பொருளைத் தேர்ந்தெடுக்கவும்'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'english' ? 'All Items' : 'அனைத்து பொருட்கள்'}
                  </SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {getItemName(item)} ({item.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* From Date */}
            <div className="space-y-2">
              <Label>{language === 'english' ? 'From Date' : 'தொடக்க தேதி'}</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <Label>{language === 'english' ? 'To Date' : 'இறுதி தேதி'}</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          {/* Sales Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'english' ? 'Entry Date' : 'என்ட்ரி தேதி'}</TableHead>
                  <TableHead>{language === 'english' ? 'Bill Date' : 'பில் தேதி'}</TableHead>
                  <TableHead>{language === 'english' ? 'Customer' : 'வாடிக்கையாளர்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Item' : 'பொருள்'}</TableHead>
                  <TableHead>{language === 'english' ? 'Empty Weight' : 'வெற்று எடை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Load Weight' : 'ஏற்றப்பட்ட எடை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Net Weight' : 'நிகர எடை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Rate' : 'விலை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Total Amount' : 'மொத்த தொகை'}</TableHead>
                  <TableHead>{language === 'english' ? 'Status' : 'நிலை'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      {language === 'english' ? 'Loading...' : 'ஏற்றுகிறது...'}
                    </TableCell>
                  </TableRow>
                ) : salesData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {language === 'english' ? 'No sales data found' : 'விற்பனை தரவு கிடைக்கவில்லை'}
                    </TableCell>
                  </TableRow>
                ) : (
                  salesData.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {sale.outward_entries?.entry_date ? format(new Date(sale.outward_entries.entry_date), 'dd/MM/yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(sale.sale_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getCustomerName(sale.customers)}</div>
                          <div className="text-sm text-muted-foreground">
                            {sale.customers?.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getItemName(sale.items)}</div>
                          <div className="text-sm text-muted-foreground">
                            {sale.items?.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.outward_entries?.empty_weight ? `${sale.outward_entries.empty_weight} KG` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {sale.outward_entries?.load_weight ? `${sale.outward_entries.load_weight} KG` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {sale.outward_entries?.net_weight ? `${sale.outward_entries.net_weight} KG` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        ₹{sale.rate.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{sale.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.outward_entries?.is_completed 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : sale.outward_entries?.load_weight
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {getStatus(sale.outward_entries)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {salesData.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">
                    {language === 'english' ? 'Total Records:' : 'மொத்த பதிவுகள்:'}
                  </span>
                  <span className="ml-2">{salesData.length}</span>
                </div>
                <div>
                  <span className="font-medium">
                    {language === 'english' ? 'Total Quantity:' : 'மொத்த அளவு:'}
                  </span>
                  <span className="ml-2">
                    {salesData.reduce((sum, sale) => sum + Number(sale.quantity), 0).toLocaleString()} KG
                  </span>
                </div>
                <div>
                  <span className="font-medium">
                    {language === 'english' ? 'Total Amount:' : 'மொத்த தொகை:'}
                  </span>
                  <span className="ml-2">
                    ₹{salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};