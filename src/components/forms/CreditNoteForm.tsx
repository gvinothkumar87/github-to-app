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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Customer } from "@/types";
import { CreditNoteInvoiceGenerator } from "@/components/CreditNoteInvoiceGenerator";

const CreditNoteForm = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    reference_bill_no: '',
    amount: '',
    gst_percentage: '18.00',
    reason: '',
    note_date: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [createdNote, setCreatedNote] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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

  const generateCreditNoteNo = async () => {
    const { data, error } = await supabase.rpc('generate_credit_note_no');
    if (error) {
      console.error('Error generating credit note number:', error);
      return null;
    }
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const noteNo = await generateCreditNoteNo();
      if (!noteNo) {
        toast.error('Error generating credit note number');
        return;
      }

      const { data: noteData, error } = await supabase
        .from('credit_notes')
        .insert({
          note_no: noteNo,
          customer_id: formData.customer_id,
          reference_bill_no: formData.reference_bill_no || null,
          amount: parseFloat(formData.amount),
          gst_percentage: parseFloat(formData.gst_percentage),
          reason: formData.reason,
          note_date: format(formData.note_date, 'yyyy-MM-dd'),
        })
        .select()
        .single();

      if (error) {
        toast.error('Error creating credit note');
        return;
      }

      toast.success(`Credit Note ${noteNo} created successfully`);
      
      // Set created note and show invoice
      setCreatedNote(noteData);
      setSelectedCustomer(customers.find(c => c.id === formData.customer_id) || null);
      setShowInvoice(true);
    } catch (error) {
      toast.error('Error creating credit note');
    } finally {
      setIsLoading(false);
    }
  };

  if (showInvoice && createdNote && selectedCustomer) {
    return (
      <CreditNoteInvoiceGenerator
        creditNote={createdNote}
        customer={selectedCustomer}
        onClose={() => {
          setShowInvoice(false);
          setCreatedNote(null);
          setSelectedCustomer(null);
          setFormData({
            customer_id: '',
            reference_bill_no: '',
            amount: '',
            gst_percentage: '18.00',
            reason: '',
            note_date: new Date(),
          });
        }}
      />
    );
  }

  const currentSelectedCustomer = customers.find(c => c.id === formData.customer_id);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Credit Note</CardTitle>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Credit Note'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreditNoteForm;