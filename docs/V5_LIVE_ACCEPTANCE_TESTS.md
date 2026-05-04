# V5 Live Acceptance Tests

## Live Operations Center
- Open admin portal.
- Confirm V5 launcher appears.
- Confirm Supabase status and cache version are displayed.

## Smart Alerts
- Create a high-risk attendance check.
- Confirm `smart_alert_events` receives a pending event.

## Official Messages
- Create a formal message.
- Open employee portal.
- Confirm read/acknowledgement receipt is stored.

## Offline Attendance
- Switch the phone offline.
- Attempt attendance fallback.
- Confirm local queue is created.
- Reconnect and review the queue.

## Visual Permissions
- Open permission matrix in admin workflow.
- Confirm sensitive permissions are categorized.

## Backup Center
- Add a backup job record.
- Confirm it appears in backup status center.
