export interface PrintableNote {
  note_no: string; note_date: string; amount: number; gst_percentage?: number;
  reason: string; reference_bill_no?: string | null; irn?: string | null;
  ack_no?: string | null; ack_date?: string | null; einvoice_status?: string | null;
}
export interface NotePrintParty {
  name_english?: string; company_name?: string; address_english?: string;
  address_line1?: string; address_line2?: string; locality?: string;
  pin_code?: string | number; gstin?: string; state_code?: string;
  place_of_supply?: string; phone?: string; email?: string;
}
export interface NotePrintData {
  type: 'DBN' | 'CRN'; note: PrintableNote; company: NotePrintParty;
  customer: NotePrintParty; item: { name_english: string; hsn_no?: string }; qrCodeDataUrl?: string;
}
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export function noteTax(data: NotePrintData) {
  const rate = data.note.gst_percentage ?? 18;
  const taxable = Math.round(data.note.amount / (1 + rate / 100) * 100) / 100;
  const tax = Math.round((data.note.amount - taxable) * 100) / 100;
  const interstate = (data.customer.place_of_supply || data.customer.state_code || data.customer.gstin?.slice(0, 2)) !== (data.company.state_code || data.company.gstin?.slice(0, 2));
  const cgst = interstate ? 0 : Math.round(tax / 2 * 100) / 100;
  return { rate, taxable, tax, interstate, cgst, sgst: interstate ? 0 : Math.round((tax - cgst) * 100) / 100, igst: interstate ? tax : 0 };
}
export function buildNotePrintHtml(data: NotePrintData) {
  const { note, company, customer, item } = data;
  const tax = noteTax(data);
  const title = data.type === 'DBN' ? 'DEBIT NOTE' : 'CREDIT NOTE';
  const money = (n: number) => `₹${n.toFixed(2)}`;
  const row = (label: string, value: unknown) => `<div><strong>${escape(label)}:</strong> ${escape(value || '—')}</div>`;
  const cancelled = note.einvoice_status === 'CANCELLED';
  const qr = !cancelled && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data.qrCodeDataUrl || '') ? `<img width="130" height="130" src="${data.qrCodeDataUrl}" alt="Signed e-invoice QR code"><small>Signed e-invoice QR code</small>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)} ${escape(note.note_no)}</title><style>
  @page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{margin:0;color:#111;background:white;font:12px Arial,sans-serif;line-height:1.5}.document{max-width:186mm;margin:0 auto;border:1px solid #222}header{text-align:center;padding:16px;border-bottom:1px solid #222}h1{font-size:23px;margin:0 0 4px}h2{font-size:18px;text-align:center;margin:0;padding:8px;border-bottom:1px solid #222;letter-spacing:1px}.columns{display:grid;grid-template-columns:1fr 1fr}.box{padding:14px;overflow-wrap:anywhere}.box+.box{border-left:1px solid #222}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #555;padding:8px;vertical-align:top;overflow-wrap:anywhere}th{background:#eee;text-align:left}.right{text-align:right}.reason{padding:12px;border-bottom:1px solid #222;white-space:pre-wrap}.totals{margin-left:auto;width:52%;padding:12px}.total-row{display:flex;justify-content:space-between;gap:12px;padding:3px 0}.grand{font-size:16px;font-weight:bold;border-top:1px solid #222;margin-top:6px;padding-top:8px}.einvoice{border-top:1px solid #222;padding:12px;display:flex;gap:16px;align-items:center}.einvoice .details{flex:1;min-width:0;overflow-wrap:anywhere;font-size:11px}.qr{text-align:center;flex:0 0 130px}.qr small{display:block;font-size:9px}.cancelled{color:#b91c1c;font-weight:bold;font-size:17px;text-align:center;border-bottom:1px solid #222;padding:8px}.sign{border-top:1px solid #222;text-align:right;padding:14px;min-height:90px}.sign p{margin:34px 0 0}header,.columns,table,.totals,.einvoice,.sign{break-inside:avoid}thead{display:table-header-group}@media screen{body{background:#e5e7eb;padding:24px}.document{background:white}}@media print{body{padding:0}.document{max-width:none}th{print-color-adjust:exact}}
  </style></head><body><main class="document"><header><h1>${escape(company.company_name)}</h1>
  <div>${escape([company.address_line1, company.address_line2, company.locality, company.pin_code].filter(Boolean).join(', '))}</div>
  ${row('GSTIN', company.gstin)}<div>${escape([company.phone, company.email].filter(Boolean).join(' | '))}</div></header>
  <h2>${title}</h2>${cancelled ? '<div class="cancelled">E-INVOICE CANCELLED</div>' : ''}
  <div class="columns"><section class="box">${row('Note No', note.note_no)}${row('Date', note.note_date)}${row('Reference Bill No', note.reference_bill_no)}</section>
  <section class="box"><strong>Bill To</strong><div><strong>${escape(customer.name_english)}</strong></div><div>${escape(customer.address_english)}</div>${row('PIN', customer.pin_code)}${row('GSTIN', customer.gstin)}${row('Place of Supply', customer.place_of_supply || customer.state_code)}${row('Phone', customer.phone)}</section></div>
  <table><thead><tr><th style="width:8%">#</th><th style="width:42%">Description</th><th style="width:18%">HSN/SAC</th><th class="right">Taxable Value</th></tr></thead><tbody><tr><td>1</td><td>${escape(item.name_english)}</td><td>${escape(item.hsn_no)}</td><td class="right">${money(tax.taxable)}</td></tr></tbody></table>
  <div class="reason"><strong>Reason:</strong> ${escape(note.reason)}</div><section class="totals"><div class="total-row"><span>Taxable value</span><span>${money(tax.taxable)}</span></div>
  ${tax.interstate ? `<div class="total-row"><span>IGST (${tax.rate}%)</span><span>${money(tax.igst)}</span></div>` : `<div class="total-row"><span>CGST (${tax.rate / 2}%)</span><span>${money(tax.cgst)}</span></div><div class="total-row"><span>SGST (${tax.rate / 2}%)</span><span>${money(tax.sgst)}</span></div>`}
  <div class="total-row grand"><span>Total</span><span>${money(note.amount)}</span></div></section>
  ${note.irn ? `<section class="einvoice"><div class="details">${row('IRN', note.irn)}${row('Ack No', note.ack_no)}${row('Ack Date', note.ack_date)}${row('Status', cancelled ? 'CANCELLED' : note.einvoice_status || 'GENERATED')}</div>${qr ? `<div class="qr">${qr}</div>` : ''}</section>` : ''}
  <footer class="sign"><strong>For ${escape(company.company_name)}</strong><p>Authorised Signatory</p></footer></main></body></html>`;
}

export async function printNote(data: NotePrintData) {
  const popup = window.open('', '_blank');
  if (!popup) throw new Error('Please allow pop-ups to print this note.');
  popup.document.write(buildNotePrintHtml(data));
  popup.document.close();
  await Promise.all(Array.from(popup.document.images).map(img => img.decode().catch(() => undefined)));
  await popup.document.fonts.ready;
  popup.focus();
  popup.print();
}
