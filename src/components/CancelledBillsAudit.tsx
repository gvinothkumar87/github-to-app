import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Audit = Database['public']['Tables']['cancelled_bills']['Row'];
const object = (value: Json): Record<string, Json> => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
export function CancelledBillsAudit() {
  const [rows, setRows] = useState<Audit[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Audit | null>(null);
  const snapshot = object(selected?.snapshot);
  const records = Array.isArray(snapshot.records) ? snapshot.records.map(object) : [];
  useEffect(() => {
    supabase.from('cancelled_bills').select('*').order('cancelled_at', { ascending: false }).then(({ data, error }) => {
      if (error) setError(error.message);
      else setRows(data || []);
      setLoading(false);
    });
  }, []);
  return <div className="space-y-4">
    <p className="text-muted-foreground">Cancelled bills are retained for audit only and excluded from active bills, balances and sales totals.</p>
    <Input aria-label="Search cancelled bills" placeholder="Search bill number or reason" value={search} onChange={e => setSearch(e.target.value)} />
    {loading && <p>Loading cancellation audit…</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {!loading && !error && rows.length === 0 && <p>No cancelled bills.</p>}
    <Table><TableHeader><TableRow><TableHead>Bill</TableHead><TableHead>Type</TableHead><TableHead>Cancelled at</TableHead><TableHead>Reason</TableHead><TableHead>Audit</TableHead></TableRow></TableHeader>
      <TableBody>{rows.filter(row => `${row.bill_no} ${row.reason}`.toLowerCase().includes(search.toLowerCase())).map(row => <TableRow key={row.id}>
        <TableCell>{row.bill_no}</TableCell><TableCell>{row.bill_type.replace(/_/g, ' ')}</TableCell>
        <TableCell>{new Date(row.cancelled_at).toLocaleString('en-IN')}</TableCell><TableCell>{row.reason}</TableCell>
        <TableCell><Button variant="outline" size="sm" onClick={() => setSelected(row)}>View audit</Button></TableCell>
      </TableRow>)}</TableBody></Table>
    {selected && <section className="rounded border p-4 space-y-3">
      <div className="flex justify-between"><h3 className="font-semibold">Cancelled bill {selected.bill_no}</h3><Button variant="outline" onClick={() => setSelected(null)}>Close</Button></div>
      <p>Cancelled by user: {selected.cancelled_by}</p>
      <p>Reason: {selected.reason}</p>
      <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>E-invoice</TableHead><TableHead>E-way bill</TableHead></TableRow></TableHeader>
        <TableBody>{records.map((record, index) => <TableRow key={index}>
          <TableCell>{String(record.sale_date || record.note_date || record.entry_date || '-')}</TableCell>
          <TableCell>{record.total_amount != null || record.amount != null ? `₹${Number(record.total_amount ?? record.amount).toFixed(2)}` : '-'}</TableCell>
          <TableCell className="max-w-64 break-all">{record.irn ? `${record.irn} (${record.einvoice_status})` : 'Not generated'}</TableCell>
          <TableCell>{record.eway_bill_no ? `${record.eway_bill_no} (${record.eway_bill_status})` : 'Not generated'}</TableCell>
        </TableRow>)}</TableBody></Table>
      <details><summary className="cursor-pointer">Full audit record, customer, items and ledger entries</summary>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(selected.snapshot, null, 2)}</pre>
      </details>
    </section>}
  </div>;
}
