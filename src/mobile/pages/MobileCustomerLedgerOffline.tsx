import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Filter, Receipt, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useEnhancedOfflineData } from '../hooks/useEnhancedOfflineData';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';
import { databaseService } from '../services/database.service';

interface CustomerLedgerEntry {
  id: string;
  customer_id: string;
  transaction_type: string;
  transaction_date: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
  reference_id: string;
  created_at: string;
  updated_at: string;
}

const MobileCustomerLedgerOffline: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntry[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  const { data: customers, isOnline, isServicesReady, error } = useEnhancedOfflineData('customers');

  useEffect(() => {
    if (selectedCustomerId && isServicesReady) {
      fetchLedgerEntries();
    }
  }, [selectedCustomerId, dateFrom, dateTo, isServicesReady]);

  const fetchLedgerEntries = async () => {
    if (!selectedCustomerId || !isServicesReady) return;

    setLoading(true);
    try {
      const allEntries = await databaseService.findAll('customer_ledger');
      
      let filteredEntries = allEntries.filter((entry: any) => entry.customer_id === selectedCustomerId);
      
      if (dateFrom) {
        filteredEntries = filteredEntries.filter((entry: any) => entry.transaction_date >= dateFrom);
      }
      if (dateTo) {
        filteredEntries = filteredEntries.filter((entry: any) => entry.transaction_date <= dateTo);
      }
      
      // Sort by transaction date
      filteredEntries.sort((a: any, b: any) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
      
      setLedgerEntries(filteredEntries);
      
      // Calculate current balance
      const balance = filteredEntries.reduce((acc, entry) => {
        return acc + entry.debit_amount - entry.credit_amount;
      }, 0);
      setCustomerBalance(balance);
      
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalDebit = () => {
    return ledgerEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
  };

  const getTotalCredit = () => {
    return ledgerEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
  };

  const selectedCustomer = customers.find((c: any) => c.id === selectedCustomerId);

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
              <Receipt className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Customer Ledger</h1>
            </div>
          </div>
          {selectedCustomerId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="p-2"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Customer Selection & Filters */}
        <div className="p-4 border-t bg-muted/30">
          <OfflineStatusBanner 
            isOnline={isOnline} 
            isServicesReady={isServicesReady}
            error={error}
          />
          <div className="space-y-4">
            <div>
              <Label>Customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choose customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name_english} {customer.code && `(${customer.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showFilters && selectedCustomerId && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div>
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        {selectedCustomer && (
          <>
            {/* Customer Info */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="text-center">
                  <h2 className="text-lg font-semibold">{(selectedCustomer as any)?.name_english}</h2>
                  <p className="text-sm text-muted-foreground">{(selectedCustomer as any)?.code}</p>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <div className="flex-1">
                    <div className="text-lg font-bold text-red-600">₹{getTotalDebit().toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Total Sales</div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="text-lg font-bold text-green-600">₹{getTotalCredit().toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Total Received</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Balance Card */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className={`h-8 w-8 ${customerBalance >= 0 ? 'text-red-500' : 'text-green-500'}`} />
                  <div className="flex-1">
                    <div className={`text-2xl font-bold ${customerBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{Math.abs(customerBalance).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {customerBalance >= 0 ? 'Balance Due' : 'Advance'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{ledgerEntries.length}</div>
                    <div className="text-xs text-muted-foreground">Entries</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ledger Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaction History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <div className="ml-2 text-muted-foreground">Loading...</div>
                  </div>
                ) : ledgerEntries.length > 0 ? (
                  <div className="divide-y">
                    {ledgerEntries.map((entry) => (
                      <div key={entry.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                entry.transaction_type === 'sale' 
                                  ? 'bg-red-100 text-red-800' 
                                  : entry.transaction_type === 'receipt'
                                  ? 'bg-green-100 text-green-800'
                                  : entry.transaction_type === 'debit_note'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {entry.transaction_type === 'sale' ? 'Sale' : 
                                 entry.transaction_type === 'receipt' ? 'Receipt' :
                                 entry.transaction_type === 'debit_note' ? 'Debit Note' : 'Credit Note'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.transaction_date), 'dd/MM/yyyy')}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.description}
                            </div>
                          </div>
                          <div className="text-right">
                            {entry.debit_amount > 0 && (
                              <div className="text-red-600 font-medium">
                                +₹{entry.debit_amount.toFixed(2)}
                              </div>
                            )}
                            {entry.credit_amount > 0 && (
                              <div className="text-green-600 font-medium">
                                -₹{entry.credit_amount.toFixed(2)}
                              </div>
                            )}
                            <div className={`text-xs font-medium ${entry.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              Balance: ₹{Math.abs(entry.balance).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center text-muted-foreground">
                      <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No transactions found</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedCustomerId && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a customer to view their ledger</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MobileCustomerLedgerOffline;