# Dedicated Sperin Services review system

Updated 1 October 2026. The application now uses only the dedicated Neon PostgreSQL and Neon Better Auth project, with Resend email delivery. Legacy shared Supabase routes, client keys and EV account sign-in have been removed from the application.

## Provisioned

- Neon Free, London: `sperin-services-reviews`, project `silent-cell-22036391`.
- Resend Free, Ireland: `sperin-services-review-email`. Domain verified.
- SMTP configured in Neon using the dedicated Resend key; sender `reviews@sperinservices.co.uk`, brand `Sperin Services`.
- Owner authorization requires verified email `info@sperinservices.co.uk` on every private request.
- Original eight Sperin records migrated with IDs, timestamps, consent and status intact (seven hidden test records, one pending). No other application records or authentication were modified.

## Server environment

- `SPERIN_DATABASE_URL` (Neon integration)
- `SPERIN_NEON_AUTH_URL` (or provisioned `SPERIN_NEON_AUTH_BASE_URL`)
- `SPERIN_RESEND_API_KEY` (Resend integration)
- `SPERIN_OWNER_EMAIL=info@sperinservices.co.uk`
- `SPERIN_EMAIL_FROM=Sperin Services <reviews@sperinservices.co.uk>`
- `SPERIN_SITE_URL` (exact stable HTTPS origin; trusted in Neon Auth)

Application values are initially configured for Preview. Provider integration values exist for Preview and Production. Production release must set its own site origin before promotion. The obsolete `SPERIN_INDEPENDENT_REVIEWS` switch is no longer consulted: this version cannot fall back to another application's authentication.

## Behaviour

Review text accepts any nonempty length. Normal transport/request-size limits still apply. Submission and notification outbox are atomic; request UUID prevents duplicate reviews. Delivery uses a provider idempotency key and database lease. Mail failure leaves the review safely stored. Owner can retry queued email with an authenticated POST. A protected `/api/reviews/notifications` endpoint is available for a future production daily cron after `CRON_SECRET` is configured; no cron is currently scheduled.

Email links open `/owner-reviews?review=<id>`. Opening a link never publishes. Managed email OTP produces a Secure HttpOnly SameSite cookie; each request revalidates the managed session and verified owner email. Approval and unpublication require explicit authenticated same-origin POSTs. Private job references never appear in public responses.

## Verification completed before preview

- Build and TypeScript passed; lint zero errors, six pre-existing refresh warnings.
- 17 automated routing/security/notification tests passed.
- Real dedicated database/API submission of `good` succeeded; replay returned same UUID, one database row and one notification provider ID.
- Test stayed absent from public response and was hidden after checking.
- Neon SMTP configuration test was shown as Delivered in Resend.

Remaining release gates: deployed browser submission; real owner OTP sign-in; approve/public/unpublish through the browser; production domain cutover from the existing Cloudflare Worker to Vercel. Do not claim these completed until observed.
