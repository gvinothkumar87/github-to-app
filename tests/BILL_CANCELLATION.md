# Bill cancellation

Apply `supabase/migrations/20260926120000_bill_cancellation_audit.sql` before deploying the frontend. It creates the audit table, atomic cancellation RPC, number-history views and guards against reusing archived IDs/numbers. No existing bills are cancelled by this migration.

In Bill Management, select **Cancel bill**, enter a reason and confirm. Linked e-way bills are cancelled before IRNs through the existing GST integration. Rejected portal requests stop local cancellation. Successfully cancelled portal documents retain their status so retries can finish the remaining work. Cancellation requires a connection; no offline portal cancellation is queued.

The RPC copies source records, customer/item/outward details and customer/stock ledger entries into `cancelled_bills`, then applies the existing delete behavior in the same transaction. Existing DELETE permissions and triggers still apply. As with Delete, cancelling a sale leaves its outward entry available. Audit rows cannot be updated or deleted by authenticated clients. The **Cancelled bills (audit)** tab provides read-only inspection.

Run orchestration tests with `node --test tests/billCancellation.test.mjs`. They mock portal calls; they do not cancel real documents.

Run the SQL integration checks with `node tests/billCancellation.database.mjs` after installing `@electric-sql/pglite` in a test environment. Alternatively set `PGLITE_MODULE` to its absolute `dist/index.js` path. Tests use an isolated in-memory PostgreSQL database with representative tables and a stock deletion trigger. They verify grouping, rollback, permissions, archive retention, active GST document guards and number reuse prevention. They do not replace testing against a staging copy of the full production schema.

Production GSP calls and the deployed database migration have not been exercised by these local checks. Portal restrictions can prevent cancellation; errors remain visible and the local bill stays active until cancellation completes.
