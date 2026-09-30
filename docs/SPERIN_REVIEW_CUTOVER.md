# Dedicated Sperin Services review system — activation checklist

Status: implementation staged, NOT activated. The user selected free Neon and Resend instead of
a new Supabase project. Both resources are now provisioned; sender DNS verification is pending.
See `SPERIN_FREE_SERVICES.md` for confirmed resources and remaining migration work.
The Supabase-specific adapter and checklist below are historical staging notes and must be
adapted to Neon before activation. No paid subscription has been started.
The existing review system remains active until the dedicated system is provisioned and verified.

## Behaviour prepared

- Dedicated Supabase project and owner user, separate from both other apps.
- Sperin Services email-code sign-in; no app password or shared session.
- New reviews enter a private queue and create an email outbox entry atomically.
- Branded email links to `/owner-reviews?review=<id>`, selecting the exact review after login.
- Links never approve on GET; publication needs an authenticated POST and an explicit click.
- Provider failure leaves the review saved and email pending for retry.
- Server checks refuse the existing EV and Word of Trade project URLs.
- Existing short-review/no-upper-character-limit behaviour is preserved.

## Required setup before activation

1. Use the dedicated free Neon project already provisioned. Do not provision or upgrade Supabase.
   Do not pause, upgrade or delete either existing app. Adapt the staged database/auth adapter to Neon.
2. Apply `database/sperin-dedicated-reviews.sql` to the NEW project only.
3. Create a verified owner account in that new project for the confirmed notification email.
   Do not copy the EV user's auth row, password, UUID or tokens. Disable public signup.
4. Configure a dedicated Resend sending key and verified Sperin Services sender. Do not reuse
   another app's mail key. Confirm recipient and sender before sending the authorized test.
5. Add server-only Vercel variables (never expose service or mail keys through VITE variables):
   - `SPERIN_SUPABASE_URL`
   - `SPERIN_SUPABASE_SERVICE_ROLE_KEY`
   - `SPERIN_OWNER_EMAIL`
   - `SPERIN_OWNER_USER_ID`
   - `SPERIN_SITE_URL` — a stable publicly accessible origin, not an expiring protected preview
   - `SPERIN_RESEND_API_KEY`
   - `SPERIN_EMAIL_FROM` — `Sperin Services <verified-sender-address>`
   - `CRON_SECRET` — generated secret for delivery retries
6. Add a Vercel cron for GET `/api/reviews/notifications`. Hobby permits daily scheduling;
   use `0 8 * * *` on Hobby, or an approved more frequent schedule on an eligible plan.
   The cron uses Vercel's CRON_SECRET bearer header. Set an appropriate function timeout and
   batch size for the chosen plan. Immediate delivery is attempted with every submission.
7. Export only Sperin reviews and private job references from the old project, migrate preserving
   IDs, timestamps, consent and status, and enqueue ONLY genuine pending reviews for notifications.
   Exclude labelled QA reviews from notification backfill. Preserve approved customer reviews.
8. Pause submissions briefly during final copy, compare row IDs and counts, then set
   `SPERIN_INDEPENDENT_REVIEWS=true` and redeploy. Do not enable without all dependencies ready.
9. Verify in the deployed browser: short review → persisted pending row → delivered notification
   (provider delivered status and owner inbox) → exact review deep link → code sign-in → explicit
   approval → public review → unpublish. Test expiry, wrong owner, retry, duplicate submission and
   provider outage. Unit tests use simulated provider responses and do NOT prove email delivery.
10. After cutover succeeds, remove legacy EV review config, endpoint and policies from website code
    and revoke the old submission endpoint. Archive/move legacy Sperin data only after verification;
    leave all EV app data and authentication untouched. Do not delete customer data without approval.

## Verification performed before provisioning

`node --test tests/review-api.test.mjs tests/independent-reviews.test.mjs`

20 tests cover isolation, secure cookies, invalid codes, intended recipient, escaped email content,
exact review links, non-mutating GETs, approval origin checks, notification failures, and existing
review protections. Dedicated database migration, real code delivery and independent production
sign-in are still unverified because provisioning and email credentials are unavailable.
