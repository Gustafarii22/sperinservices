# EV4i feedback alerts

Both public.app_feedback and public.assistant_feedback enqueue an owner email after each new submission. Recipient: info@sperinservices.co.uk. Existing installed apps use these tables, so email delivery does not require an APK update.

The mailer is api/ev4i-feedback.mjs on sperinservices.co.uk. Preserve it in subsequent website deployments. Production was deployed from commit 5a8dc82d01e7825fc81e2b168b3cbe1d589895c3, based on the previous production website source. PR #32 carries the endpoint forward to main without publishing unrelated work.

## Configuration

- Existing SPERIN_RESEND_API_KEY is used only on the server.
- EV4I_FEEDBACK_RELAY_SECRET must match the vault secret named ev4i_feedback_relay_secret. Never put either in frontend code or logs.
- EV4I_FEEDBACK_DB_KEY is the existing Supabase publishable key, not a service-role key.
- The private settings table controls activation. Disabling it pauses enqueue and dispatch.
- pg_cron invokes dispatch every minute. Queue retries are bounded to 10 provider attempts within 23 hours, using one stable Resend idempotency key. Failed/exhausted records remain available for inspection; inspect pending status and last_error during incident handling. Provider plan limits still apply.

## Owner links and privacy

Emails contain a random 256-bit, single-record capability valid for 90 days. Keep these links private. GET never resolves feedback; the page requires an explicit form submission. Source-record deletion removes the copied snapshot. No email list or unrestricted database endpoint is exposed.

The Supabase security adviser reports the two anonymous SECURITY DEFINER RPCs because they are intentionally reachable for capability authentication. The relay checks its server-only secret; owner actions check the single-item token and expiry. Private tables have no client grants and default-deny RLS. Do not remove these guards to silence adviser notices. Adviser explanation: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

## Verification on 11 October 2026

- Node tests passed: relay authentication, fixed recipient, provider failure, idempotency, HTML escaping, invalid links, GET non-mutation and explicit resolution.
- Both real source-table INSERT triggers produced email. Resend confirmed delivered to info@sperinservices.co.uk for general and AI setup tests.
- Live private page returned the expected report; opening it left the item unresolved.
- Live owner RPC resolved the general setup test. Duplicate notification returned already_sent_or_claimed without another email.
- Anonymous private-schema/table access is denied; an invalid relay secret is rejected.
- Setup emails are clearly labelled. No historic feedback was backfilled.

The installed v0.9.1 app still displays its original no-email wording. The frontend source correction is saved for the next app build; live server notifications already operate for that installed version.
