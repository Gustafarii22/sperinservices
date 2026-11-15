# HaMuch: free Gmail + Samsung SIM SMS (no Twilio)

## Verified source state (15 November 2026)
Feature branch: `feat/hamuch-free-gmail-phone-sms-20261115`. CI success: https://github.com/Gustafarii22/sperinservices/actions/runs/43694368251

- Sends owner-approved email via Gmail if separate Gmail OAuth config is present; otherwise opens prefilled Gmail compose page for manual sending.
- Sends owner-approved SMS automatically through free **SMS Gateway for Android (SMSGate)** Cloud Server on owner's S23 Ultra if SMSGate secrets are present; otherwise opens native SMS composer for manual sending. Twilio is not called on new sends.
- SMS status is persisted as pending/sending/sent/delivered/failed/unknown; gateway delivery statuses are reconciled via API on workspace refresh.
- Existing idempotency protections avoid duplicate automatic sends. Manual sends are marked sent **only on explicit owner confirmation**; this is not proof of network delivery.
- The email's Sperin Services footer is added exactly once at send/compose time, not to the unsent saved draft.
- GitHub CI tests all external service calls with mocks; **no live customer message was sent**.

## External configuration still needed for real one-click operation

1. On Samsung, install SMS Gateway for Android from https://sms-gate.app. Choose Public Cloud Server, grant SMS permission and start the service. Generate unique gateway username/password (do **not** disclose in chat/issue/commit).
2. Save credentials as sensitive encrypted **Production** Vercel variables on project `hamuch-lead-assistant`: `SMSGATE_USERNAME`, `SMSGATE_PASSWORD`. Restricted project access is recommended. Public cloud will process customer mobile numbers and SMS text; review privacy policy and business consent before use. Use the owner's existing unlimited texts only if the mobile carrier's fair use and business rules allow automated messages.
3. Configure separate Gmail OAuth client ID, client secret and account refresh token, held in Vercel Production secrets `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, with Gmail send scope and confirmed Send mail as alias `info@sperinservices.co.uk` on the signed-in `sperinservices@gmail.com` account. Never commit or publish tokens.
4. Verify the live Supabase project backing the HaMuch app has the `outbound_channels` table and protected `approve_quote` RPC before enabling sends. That live project ref is not currently accessible via the connected Supabase plugin and therefore was not modified.
5. Use only an owner-controlled test customer email and SMS number to test: approve -> Gmail Sent -> Samsung sends -> gateway Sent/Delivered -> HaMuch Sent history. Inspect absence of duplicates and bounce/unknown error handling.
6. Only after green live tests deploy branch to production. Do not overwrite live production implicitly.

## Cost
- SMSGate Cloud Server is currently listed **free** with existing users' current features remaining free: https://docs.sms-gate.app/pricing/
- No Twilio charges.
- SMS is carried by owner's phone network; network fair-use/business automation terms apply. This is not a guarantee a consumer SMS plan can be used for unlimited automated business messages.
- Gmail uses user's existing account, subject to Google's sending limits and OAuth configuration.

## Do not
- Never paste Gmail/SMSGate secrets into public repository, chat screenshot or PR.
- Never mark a queued SMS as delivered, or assume that opening the native SMS editor constitutes sending.
- Never enable unattended promotional/bulk messaging. Only respond to solicited leads after individual owner approval.
