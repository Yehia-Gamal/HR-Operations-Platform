# V5 Operations Enhancements Guide

This release adds the next operations layer on top of Identity Guard V4 and Full Workflow QA.

## Included modules

1. Live Operations Center
2. Optional Face Match metadata for punch selfies
3. Smart Alerts Engine
4. Monthly Reports/Exports
5. Visual Permissions Matrix
6. Backup & Restore Status Center
7. Enhanced Internal Tasks
8. Official Messages with Read Receipts
9. Offline Attendance Sync Queue
10. E2E/Health Tracking foundation

## SQL order

Run after patches 051–064:

```sql
supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_065_TO_074_V5.sql
```

## Frontend

`shared/js/live-ops-v5.js` adds a lightweight command-center launcher across the portals. It does not replace existing pages; it exposes status, offline queue controls, and future hooks.

## Required live validation

- Confirm admin/executive can see Live Operations Center data after SQL is applied.
- Trigger a high-risk attendance event and confirm smart alert row creation.
- Create an official message and confirm read receipt.
- Queue offline attendance locally, then review the queue after reconnection.
- Export a monthly report and store its export log.
