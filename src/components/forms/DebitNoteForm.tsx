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
import type { Customer, Item } from "@/types";
import { DebitNoteInvoiceGenerator } from "@/components/DebitNoteInvoiceGenerator";

const DebitNoteForm = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    item_id: '',
    reference_bill_no: '',
    amount: '',
    gst_percentage: '18.00',
    reason: '',
    note_date: new Date(),
    mill: 'PULIVANTHI',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [createdNote, setCreatedNote] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [previewNoteNo, setPreviewNoteNo] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
    fetchItems();
  }, []);

  useEffect(() => {
    const fetchPreviewNoteNo = async () => {
      const noteNo = await generateDebitNoteNo(formData.mill);
      if (noteNo) {
        setPreviewNoteNo(noteNo);
      }
    };
    fetchPreviewNoteNo();
  }, [formData.mill]);

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

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('name_english');

    if (error) {
      toast.error('Error fetching items');
      return;
    }

    setItems(data || []);
  };

  const generateDebitNoteNo = async (mill: string) => {
    const { data, error } = await supabase.rpc('generate_debit_note_no', { p_mill: mill });
    if (error) {
      console.error('Error generating debit note number:', error);
      return null;
    }
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '';

      const noteNo = await generateDebitNoteNo(formData.mill);
      if (!noteNo) {
        toast.error('Error generating debit note number');
        return;
      }

      const noteDate = format(formData.note_date, 'yyyy-MM-dd');

      // Prepare debit note data
      const noteDataPayload = {
        note_no: noteNo,
        customer_id: formData.customer_id,
        item_id: formData.item_id,
        reference_bill_no: formData.reference_bill_no || null,
        amount: parseFloat(formData.amount),
        gst_percentage: parseFloat(formData.gst_percentage),
        reason: formData.reason,
        note_date: noteDate,
        mill: formData.mill,
        created_by: userId,
      };

      // Prepare ledger data
      const ledgerDataPayload = {
        customer_id: formData.customer_id,
        transaction_date: noteDate,
        debit_amount: parseFloat(formData.amount),
        description: `Debit Note ${noteNo} - ${formData.reason}`,
      };

      // Use transactional RPC function
      const { data: result, error: rpcError } = await supabase.rpc('create_debit_note_with_ledger', {
        p_note_data: noteDataPayload,
        p_ledger_data: ledgerDataPayload,
      });

      if (rpcError) throw rpcError;
      
      const resultData = result as { note_id: string; ledger_id: string; success: boolean };
      if (!resultData || !resultData.success) throw new Error('Failed to create debit note');

      // Fetch the created note for invoice
      const { data: noteData, error: fetchError } = await supabase
        .from('debit_notes')
        .select()
        .eq('id', resultData.note_id)
        .single();

      if (fetchError) throw fetchError;

      toast.success(`Debit Note ${noteNo} created successfully`);
      
      // Set created note and show invoice
      setCreatedNote(noteData);
      setSelectedCustomer(customers.find(c => c.id === formData.customer_id) || null);
      setSelectedItem(items.find(i => i.id === formData.item_id) || null);
      setShowInvoice(true);
    } catch (error) {
      toast.error('Error creating debit note');
    } finally {
      setIsLoading(false);
    }
  };

  if (showInvoice && createdNote && selectedCustomer && selectedItem) {
    return (
      <DebitNoteInvoiceGenerator
        debitNote={createdNote}
        customer={selectedCustomer}
        item={selectedItem}
        onClose={() => {
          setShowInvoice(false);
          setCreatedNote(null);
          setSelectedCustomer(null);
          setSelectedItem(null);
          setFormData({
            customer_id: '',
            item_id: '',
            reference_bill_no: '',
            amount: '',
            gst_percentage: '18.00',
            reason: '',
            note_date: new Date(),
            mill: 'PULIVANTHI',
          });
        }}
      />
    );
  }

  const currentSelectedCustomer = customers.find(c => c.id === formData.customer_id);
  const currentSelectedItem = items.find(i => i.id === formData.item_id);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Debit Note</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mill">Mill/Location *</Label>
              <Select
                value={formData.mill}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mill: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Mill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PULIVANTHI">Pulivanthi</SelectItem>
                  <SelectItem value="MATTAPARAI">Mattaparai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="preview_note_no">Debit Note No. (Preview)</Label>
              <Input
                id="preview_note_no"
                value={previewNoteNo}
                readOnly
                className="bg-muted font-semibold"
                placeholder="Select mill to generate"
              />
            </div>
          </div>

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

          <div>
            <Label htmlFor="item_id">Product/Item *</Label>
            <Select
              value={formData.item_id}
              onValueChange={(value) => {
                const selectedItem = items.find(item => item.id === value);
                setFormData(prev => ({ 
                  ...prev, 
                  item_id: value,
                  gst_percentage: selectedItem?.gst_percentage.toString() || '18.00'
                }));
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Product/Item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name_english} ({item.code}) - HSN: {item.hsn_no || 'N/A'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Label htmlFor="gst_percentage">GST Percentage (Auto-filled from Product)</Label>
              <Input
                id="gst_percentage"
                type="number"
                step="0.01"
                value={formData.gst_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, gst_percentage: e.target.value }))}
                placeholder="GST percentage from product"
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for debit note"
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

          {currentSelectedItem && (
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Product Details</h4>
              <p><strong>Name:</strong> {currentSelectedItem.name_english}</p>
              <p><strong>Code:</strong> {currentSelectedItem.code}</p>
              <p><strong>HSN:</strong> {currentSelectedItem.hsn_no || 'N/A'}</p>
              <p><strong>GST %:</strong> {currentSelectedItem.gst_percentage}%</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Debit Note'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DebitNoteForm;