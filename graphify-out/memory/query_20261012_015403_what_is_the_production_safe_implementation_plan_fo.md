---
type: "query"
date: "2026-10-12T01:54:03.035474+00:00"
question: "What is the production-safe implementation plan for TaxPro credential isolation?"
contributor: "graphify"
source_nodes: ["taxpro-gsp", "company_settings", "CompanySettingsForm", "RLS"]
---

# Q: What is the production-safe implementation plan for TaxPro credential isolation?

## Answer

Production remediation requires an additive server-side credential table with no client SELECT access, ASP ID/password only in Supabase secrets, per-GSTIN NIC credentials managed through an admin-only Edge Function, taxpro-gsp authorization and route allowlisting, backward-compatible sentinel values for old clients, staged migration/backfill, test-project validation, monitored rollout, and delayed column removal. Do not onboard unrelated clients into the current shared database without tenant isolation; prefer a separate Supabase project.

## Source Nodes

- taxpro-gsp
- company_settings
- CompanySettingsForm
- RLS