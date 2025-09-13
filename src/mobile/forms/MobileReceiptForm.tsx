import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useOfflineData } from '../hooks/useOfflineData';
import { MobileLayout } from '../components/MobileLayout';
import { Receipt, Save, Camera } from 'lucide-react';

interface Customer {
  id: string;
  name_english: string;
  code: string;
}

interface ReceiptFormData {
  receipt_no: string;
  customer_id: string;
  amount: number;
  receipt_date: string;
  payment_method: string;
  remarks: string;
}

export const MobileReceiptForm: React.FC = () => {
  const { toast } = useToast();
  const { data: customers, loading: loadingCustomers } = useOfflineData<Customer>('customers');
  const { create: createReceipt } = useOfflineData('receipts');
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ReceiptFormData>({
    receipt_no: '',
    customer_id: '',
    amount: 0,
    receipt_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    remarks: ''
  });

  const generateReceiptNo = () => {
    const timestamp = Date.now();
    const receiptNo = `RCP${timestamp.toString().slice(-6)}`;
    setFormData(prev => ({ ...prev, receipt_no: receiptNo }));
  };

  React.useEffect(() => {
    if (!formData.receipt_no) {
      generateReceiptNo();
    }
  }, [formData.receipt_no]);

  const handleInputChange = (field: keyof ReceiptFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.amount || !formData.receipt_no) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await createReceipt({
        ...formData,
        created_by: 'mobile-user' // In real app, get from auth
      });

      toast({
        title: "Receipt Created",
        description: `Receipt ${formData.receipt_no} saved successfully`,
      });

      // Reset form
      setFormData({
        receipt_no: '',
        customer_id: '',
        amount: 0,
        receipt_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        remarks: ''
      });
      
      generateReceiptNo();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create receipt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = () => {
    toast({
      title: "Camera Feature",
      description: "Photo capture will be available in the next update",
    });
  };

  return (
    <MobileLayout title="New Receipt">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Receipt Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Receipt Number */}
            <div className="space-y-2">
              <Label htmlFor="receipt_no">Receipt Number *</Label>
              <Input
                id="receipt_no"
                value={formData.receipt_no}
                onChange={(e) => handleInputChange('receipt_no', e.target.value)}
                placeholder="Enter receipt number"
                required
              />
            </div>

            {/* Customer Selection */}
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => handleInputChange('customer_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name_english} ({customer.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="Enter amount"
                required
              />
            </div>

            {/* Receipt Date */}
            <div className="space-y-2">
              <Label htmlFor="receipt_date">Receipt Date *</Label>
              <Input
                id="receipt_date"
                type="date"
                value={formData.receipt_date}
                onChange={(e) => handleInputChange('receipt_date', e.target.value)}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => handleInputChange('payment_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Receipt'}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleTakePhoto}
            className="w-full"
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
};

export default MobileReceiptForm;