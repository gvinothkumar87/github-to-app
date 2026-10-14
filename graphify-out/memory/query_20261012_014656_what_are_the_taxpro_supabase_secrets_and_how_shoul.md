---
type: "query"
date: "2026-10-12T01:46:56.275782+00:00"
question: "What are the TAXPRO Supabase secrets and how should another GSTIN be onboarded?"
contributor: "graphify"
source_nodes: ["taxpro-gsp", "company_settings", "TAXPRO_ASPID", "TAXPRO_USERNAME"]
---

# Q: What are the TAXPRO Supabase secrets and how should another GSTIN be onboarded?

## Answer

TAXPRO_ASPID and TAXPRO_ASPPASSWORD are TaxPro GSP/ASP account credentials and are usually shared across onboarded GSTINs. TAXPRO_USERNAME, TAXPRO_EINVOICE_PASSWORD, and TAXPRO_EWAYBILL_PASSWORD are taxpayer API credentials tied to a GSTIN. For additional GSTINs, the app should store credentials in that GSTIN company_settings row; Supabase TAXPRO_* secrets are only global fallback values. The taxpro-gsp function selects DB credentials by gstin before environment fallback.

## Source Nodes

- taxpro-gsp
- company_settings
- TAXPRO_ASPID
- TAXPRO_USERNAME