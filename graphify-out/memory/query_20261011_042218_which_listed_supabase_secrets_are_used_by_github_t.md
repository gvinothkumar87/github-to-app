---
type: "query"
date: "2026-10-11T04:22:18.453050+00:00"
question: "Which listed Supabase secrets are used by github-to-app123 and what do they do?"
contributor: "graphify"
source_nodes: ["upload-to-google-drive", "google-drive-oauth", "GOOGLE_OAUTH_CLIENT_ID_CASH", "GOOGLE_DRIVE_FOLDER_ID_CASH"]
---

# Q: Which listed Supabase secrets are used by github-to-app123 and what do they do?

## Answer

github-to-app123 actively invokes upload-to-google-drive for operational photo uploads. The canonical shared function uses GOOGLE_OAUTH_CLIENT_ID_CASH, GOOGLE_OAUTH_CLIENT_SECRET_CASH, GOOGLE_OAUTH_REFRESH_TOKEN_CASH, and GOOGLE_DRIVE_FOLDER_ID_CASH. The app also contains a callback and helper for google-drive-oauth, whose canonical function reads GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI, and GOOGLE_DRIVE_FOLDER_ID, but no normal UI initiation call was found. The remaining listed secrets serve sibling apps or external/shared endpoints.

## Source Nodes

- upload-to-google-drive
- google-drive-oauth
- GOOGLE_OAUTH_CLIENT_ID_CASH
- GOOGLE_DRIVE_FOLDER_ID_CASH