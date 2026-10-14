---
type: "query"
date: "2026-10-12T01:50:10.713721+00:00"
question: "Can the same GSP ASP credentials be used for separate clients and can anyone use them?"
contributor: "graphify"
source_nodes: ["taxpro-gsp", "CompanySettingsForm", "TAXPRO_ASPID", "GSTIN authorization"]
---

# Q: Can the same GSP ASP credentials be used for separate clients and can anyone use them?

## Answer

One TaxPro ASP ID/password may generally serve multiple authorized client GSTINs, subject to the TaxPro account agreement. NIC registration alone is insufficient: each GSTIN must explicitly select/authorize the GSP and have its own API username/password. ASP credentials must remain server-side. Current app design is risky because Company Settings accepts and stores ASP ID/password per company; safer design is global Supabase secrets for ASP credentials and per-GSTIN storage only for NIC credentials.

## Source Nodes

- taxpro-gsp
- CompanySettingsForm
- TAXPRO_ASPID
- GSTIN authorization