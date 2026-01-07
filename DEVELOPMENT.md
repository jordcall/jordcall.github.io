# Development

## Substack data updates (local)
Substack blocks GitHub-hosted runners (403), so updates run on a local scheduled job.

Manual run:
```
powershell -ExecutionPolicy Bypass -File .\scripts\update-substack-local.ps1
```

Task Scheduler setup (checklist):
- Create Task: "Update Substack JSON"
- Trigger: Daily (pick a time)
- Check: "Run task as soon as possible after a scheduled start is missed"
- Check: "Wake the computer to run this task" (optional)
- Action:
  Program/script: powershell.exe
  Add arguments:
    -NoProfile -ExecutionPolicy Bypass -File "C:\FULL\PATH\TO\REPO\scripts\update-substack-local.ps1"
  Start in:
    "C:\FULL\PATH\TO\REPO"
- Conditions: disable "Start only if on AC power" if desired, etc.

Notes:
- Git credentials must already work for non-interactive push.
- Logs are appended to `_local_logs/substack-update.log`.

## Now page archive workflow
The current and archived items are collapsible via `<details>` and are closed by default.

Steps:
1. Run the archive script:
```
node scripts/archive-now.js
```
2. Edit the current section in `now.html`.
3. Commit and push.
