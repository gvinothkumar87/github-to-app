# API Usage Audit Report

Date: 9 October 2026  
Scope: TaxPro e-Invoice / e-Way Bill integration in the current repository  
Evidence: supplied TaxPro usage screenshot and static review of the current source code

## Executive summary

The screenshot shows **504 billable balance units**, not 504 invoices:

| API bucket | Balance used | Share |
|---|---:|---:|
| DINV | 342 | 67.9% |
| DEWB | 150 | 29.8% |
| EWB | 12 | 2.4% |
| **Total** | **504** | **100%** |

The usage is concentrated in June 2026 (339 of 504 units, 67.3%), then July (99), August (33), and September (33). The portal's `Total API Count` is larger than `Total Balance Used` for some rows because not every provider request consumes a balance unit. For example, the displayed DINV rows total 347 calls but 342 billed units.

The application has several request-amplification paths. The most important is the E-way bill details/print fallback: one click can perform dedicated E-way authentication, a direct `GetEwayBill` request, and then an e-invoice-details fallback. A failed authentication capability is not negatively cached, so this sequence can repeat on every print/details action. Separately, production proxy failover can send the same operation to as many as three servers, including non-idempotent POST operations.

The source proves that amplification is possible and likely. It does not contain provider transaction IDs or production request logs, so exact attribution of all 504 billed units requires the detailed TaxPro transaction export or Supabase Edge Function logs.

## Findings

### Critical: one user action can fan out into several billable API calls

`getEWayBillDetails()` first calls `authenticateEWayBill()`. When that API reports an unavailable/`NIC404` condition, it falls back to e-invoice authentication. It still attempts the direct `GetEwayBill` endpoint and, on another unavailable response, calls `getEInvoiceDetails()` as a second data lookup.

This path is used by:

- Print E-Way Bill
- Local PDF download
- Official PDF download in production

Therefore a print/download is not a local-only action. It fetches provider data every time.

Evidence:

- `src/services/einvoiceService.ts:2370-2465`
- `src/services/einvoiceService.ts:2510-2539`
- `src/services/einvoiceService.ts:2550-2679`
- `src/components/InvoiceGenerator.tsx:465-548`

### High: failed E-way authentication is retried on every later action

Successful tokens are stored in `sessionStorage`, but the known “dedicated E-way auth unavailable” outcome is not cached. If this account/GSTIN must use the IRN/e-invoice route, every E-way details, print, cancel, vehicle update, extension, distance, or standalone call can attempt the failing auth again before falling back.

The token cache is also tab/session scoped. Closing the app, opening a new browser context, or losing session storage causes fresh authentication calls even while the provider token may still be valid.

Evidence:

- `src/services/einvoiceService.ts:445-500`
- `src/services/einvoiceService.ts:505-571`
- `src/services/einvoiceService.ts:1866-2004`
- `src/services/einvoiceService.ts:2370-2465`

### High: proxy failover may submit one logical request up to three times

For production, the Supabase Edge Function loops across three TaxPro hosts. It retries any network error or HTTP 5xx response. This behavior also applies to POST operations such as generation and cancellation. If a provider processed the first POST but returned a 5xx or the response was lost, the same logical operation may be sent again to backup hosts. Even where TaxPro de-duplicates the business document, each transport attempt may still appear in the API transaction count.

Evidence: `supabase/functions/taxpro-gsp/index.ts:190-238`.

### High: cancellation fallback can probe multiple endpoint/payload combinations

IRN-linked E-way cancellation contains two path variants and three payload variants. Depending on the returned 404/`NIC404`, a single cancellation can probe several requests. It can then be entered again after token refresh/fallback logic.

Evidence: `src/services/einvoiceService.ts:1916-2004`.

### Medium: endpoint classification is incomplete

`executeRequest()` recognizes E-way service paths only when they contain `/ewaybillapi` or `/ewayapi`. IRN-linked E-way paths under `/eiewb/...` do not match and default to `serviceType = 'einvoice'`. The proxy may therefore inject e-invoice credentials and the provider may record these operations in the DINV bucket. This is consistent with DINV being the largest bucket, although the exact meanings of TaxPro's DINV/DEWB labels are not publicly documented well enough to assert a one-to-one mapping without their transaction export.

Evidence: `src/services/einvoiceService.ts:329-340` and the `/eiewb/...` calls at `src/services/einvoiceService.ts:990` and `src/services/einvoiceService.ts:1916-1918`.

### Medium: repeat clicks are only UI-guarded

Buttons are disabled while React's `generating` state is true, which prevents ordinary repeated clicks after the state update renders. There is no service-layer in-flight deduplication or idempotency key, so double events, multiple windows, or retries from different callers can still run concurrently.

## Likely explanation of the screenshot

1. Normal e-invoice generation and detail calls account for some DINV usage.
2. Viewing, printing, or downloading E-way bills performs live detail lookups rather than using the already saved local data.
3. Where dedicated E-way authentication/direct detail lookup is unavailable, each action follows the repeated auth + direct lookup + DINV fallback path.
4. Provider/server errors can add retries through both client retry logic and the three-host proxy failover.
5. The result is a count of API transactions substantially larger than the number of bills the user remembers creating.

## Recommended remediation order

1. Add structured server-side audit logging with request ID, user, GSTIN, action, endpoint, retry number, response status, and bill/IRN/EWB identifier (hashed or redacted where appropriate).
2. Add a short-lived cache for E-way details keyed by GSTIN + EWB number; printing and local PDF creation should reuse cached/local data unless the user explicitly refreshes.
3. Cache the known dedicated-EWB-auth-unavailable capability per GSTIN and go directly to the supported IRN route during its TTL.
4. Correct service classification so `/eiewb/` is explicitly routed according to TaxPro's documented credential/product category.
5. Restrict automatic multi-host retries to safe GET/auth requests. For generation/cancellation POSTs, reconcile status before retrying and use an idempotency/operation record in the application database.
6. Replace cancellation endpoint/payload probing with one provider-confirmed endpoint and schema.
7. Add a service-layer single-flight guard so the same operation and document cannot be submitted concurrently.
8. Obtain the TaxPro detailed transaction export for June-September 2026 and join it to the new audit log to validate which UI actions produced DINV and DEWB charges.

## Immediate operational advice

- Until fixed, avoid repeatedly clicking E-way print/download/cancel after an error.
- Prefer the local invoice print where provider data is already stored.
- Do not treat the 504 figure as 504 generated bills; it is billed API balance consumption across multiple endpoint types and retries.

## Confidence and limitation

Confidence is high that the app can amplify calls and that print/details/cancellation are the riskiest paths. Confidence is medium that these paths explain the precise DINV/DEWB split, because only TaxPro's detailed transaction ledger or production Edge Function logs can prove the exact call-to-charge mapping.
