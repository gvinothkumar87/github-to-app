# API Usage Remediation Plan

## Goal

Reduce TaxPro billable API consumption so one user operation normally produces one necessary provider request, while preserving correct e-Invoice and e-Way Bill behavior.

## Phase 1 — Immediate request-amplification controls (implemented)

- Add a five-minute E-way detail cache keyed by environment, GSTIN, EWB number, IRN, and response shape.
- Coalesce concurrent identical detail requests into one in-flight request.
- Persist the provider's dedicated-EWB-auth-unavailable response per GSTIN and credential fingerprint, and use the supported IRN details route directly until settings change or an operator requests a retry.
- Explicitly classify `/eiewb/` as an IRN-linked e-Invoice-credential route.
- Stop cross-host replay of POST requests in the Supabase proxy; retain failover only for GET/HEAD.
- Replace E-way cancellation endpoint/payload probing with one canonical request.
- Invalidate cached details after cancellation, vehicle update, and validity extension.

## Phase 2 — Observability (next deployment task)

- Add a database-backed API audit table with operation ID, endpoint category, GSTIN, document reference hash, attempt number, duration, status, and provider error code.
- Return the operation ID to the client and include it in user-visible failure messages.
- Build a daily report comparing application operations with TaxPro transaction exports.
- Add alerts for more than one provider submission per operation ID.

## Phase 3 — Durable idempotency and reconciliation

- Create a server-side operation record before generation/cancellation/update POSTs.
- Lock by action + document identifier so multiple clients cannot submit the same operation concurrently.
- On uncertain transport failures, query document status before allowing another POST.
- Store successful provider responses needed for printing so routine printing remains local.

## Verification

- TypeScript compilation and production build must pass.
- Existing cancellation and note e-Invoice tests must pass.
- Add regression coverage for concurrent detail request coalescing, five-minute cache reuse, cache invalidation, known-auth-unavailable bypass, and non-replay of POST requests.
- In staging, perform one operation of each kind and confirm the TaxPro transaction report contains the expected number and category of calls.

## Rollout

1. Deploy the Edge Function change before or together with the client.
2. Smoke-test authentication, IRN generation, combined EWB generation, standalone EWB generation, print, cancellation, vehicle update, and extension.
3. Monitor provider counts for 48 hours.
4. Compare per-operation audit totals with TaxPro's detailed transaction export before declaring the incident closed.

## Expected impact

- Repeated print/download actions within five minutes reuse the same details.
- Simultaneous consumers share one provider lookup.
- Accounts without dedicated EWB authentication no longer repeat the known-failing auth and direct lookup on every IRN-linked print. Changing the GSTIN, environment, ASP ID, username, or EWB password invalidates the decision automatically; Company Settings also provides a manual retry control.
- A POST operation is no longer automatically replayed against up to three production hosts.
- IRN-linked EWB cancellation no longer probes multiple endpoint/payload variants.
