# Supabase Database Webhooks Setup

These Edge Functions are triggered by Supabase Database Webhooks — configured in the dashboard, not in code. Follow these steps after deploying the functions.

## 1. Deploy Edge Functions

```bash
supabase functions deploy notify-message
supabase functions deploy notify-session-assigned
supabase functions deploy notify-time-logged
```

## 2. Set the Resend API key secret

```bash
supabase secrets set RESEND_API_KEY=<your_resend_key>
```

Get your key at [resend.com](https://resend.com). The `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets are provided automatically by the runtime.

## 3. Configure Database Webhooks

Go to **Supabase Dashboard → Database → Webhooks → Create a new hook**.

### Hook 1 — notify-message

| Field | Value |
|-------|-------|
| Name | `notify-message` |
| Table | `messages` |
| Events | `INSERT` |
| Type | Supabase Edge Functions |
| Function | `notify-message` |

### Hook 2 — notify-session-assigned

| Field | Value |
|-------|-------|
| Name | `notify-session-assigned` |
| Table | `session_assignments` |
| Events | `INSERT` |
| Type | Supabase Edge Functions |
| Function | `notify-session-assigned` |

### Hook 3 — notify-time-logged

| Field | Value |
|-------|-------|
| Name | `notify-time-logged` |
| Table | `time_entries` |
| Events | `INSERT` |
| Type | Supabase Edge Functions |
| Function | `notify-time-logged` |

## 4. Verify

Insert a test row into each table and check **Edge Functions → Logs** to confirm the function fired and returned a 200. Check the recipient's inbox (and spam folder) for the notification email.

## Notes

- Emails are sent from `notifications@swimphoria.app` — you must verify this domain in Resend before it will deliver.
- Each function uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for profile lookups, so it can read any user's email. The key is never exposed to the client.
- The functions are idempotent on re-delivery — a duplicate webhook fires a duplicate email, but Supabase webhooks have at-least-once delivery guarantees so this is rare.
