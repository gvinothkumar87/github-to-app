import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Customer, CreditNote } from "@/types";

interface EditCreditNoteFormProps {
  creditNote: CreditNote;
  customer: Customer;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditCreditNoteForm = ({ creditNote, customer: initialCustomer, onSuccess, onCancel }: EditCreditNoteFormProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customer_id: creditNote.customer_id,
    reference_bill_no: creditNote.reference_bill_no || '',
    amount: creditNote.amount.toString(),
    gst_percentage: (creditNote.gst_percentage || 18).toString(),
    reason: creditNote.reason,
    note_date: parseISO(creditNote.note_date),
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('name_english');

    if (error) {
      toast.error('Error fetching customers');
      return;
    }

    setCustomers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('credit_notes')
        .update({
          customer_id: formData.customer_id,
          reference_bill_no: formData.reference_bill_no || null,
          amount: parseFloat(formData.amount),
          gst_percentage: parseFloat(formData.gst_percentage),
          reason: formData.reason,
          note_date: format(formData.note_date, 'yyyy-MM-dd'),
        })
        .eq('id', creditNote.id);

      if (error) {
        toast.error('Error updating credit note');
        return;
      }

      toast.success('Credit Note updated successfully');
      onSuccess();
    } catch (error) {
      toast.error('Error updating credit note');
    } finally {
      setIsLoading(false);
    }
  };

  const currentSelectedCustomer = customers.find(c => c.id === formData.customer_id);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Credit Note - {creditNote.note_no}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer_id">Customer *</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Customer" />
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

          <div>
            <Label htmlFor="reference_bill_no">Reference Bill No.</Label>
            <Input
              id="reference_bill_no"
              value={formData.reference_bill_no}
              onChange={(e) => setFormData(prev => ({ ...prev, reference_bill_no: e.target.value }))}
              placeholder="Enter reference bill number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount"
                required
              />
            </div>
            <div>
              <Label htmlFor="gst_percentage">GST Percentage *</Label>
              <Input
                id="gst_percentage"
                type="number"
                step="0.01"
                value={formData.gst_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, gst_percentage: e.target.value }))}
                placeholder="Enter GST percentage"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for credit note"
              required
            />
          </div>

          <div>
            <Label>Note Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.note_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.note_date ? format(formData.note_date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.note_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, note_date: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {currentSelectedCustomer && (
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Customer Details</h4>
              <p><strong>Name:</strong> {currentSelectedCustomer.name_english}</p>
              <p><strong>Code:</strong> {currentSelectedCustomer.code}</p>
              {currentSelectedCustomer.contact_person && (
                <p><strong>Contact:</strong> {currentSelectedCustomer.contact_person}</p>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Credit Note'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};