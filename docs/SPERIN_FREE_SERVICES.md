# Sperin Services free-service provisioning — 30 September 2026

## Confirmed resources

- Neon project `sperin-services-reviews` (`silent-cell-22036391`) created in London, Free plan, built-in Auth enabled.
- Connected only to Vercel project `sperinservices`, Production and Preview, prefix `SPERIN`. Automatic per-deployment database branches are disabled.
- Resend resource `sperin-services-review-email` created, Ireland region, Free plan (3,000 emails/month, 100/day).
- Connected only to `sperinservices`, Production and Preview, prefix `SPERIN`.
- Resend variables provisioned: `SPERIN_RESEND_API_KEY`, `SPERIN_RESEND_EMAIL_DOMAIN`.
- Resend Usage page verified both pay-as-you-go switches OFF and disabled. No paid plan selected.
- No changes to EV Installer or Word of Trade resources, databases, or authentication.

## Sender-domain verification complete

Resend domain `sperinservices.co.uk` (ID `88c2eff5-1349-4e41-bfc6-ca4e3b15e812`) was verified on 30 September. The user added the following DNS records. Neon SMTP test email to `info@sperinservices.co.uk` was confirmed Delivered.

Add only these new records after obtaining access; first check for existing conflicts.
Do not replace the apex MX or existing inbox configuration.

| Type | Host | Value | Priority |
| --- | --- | --- | --- |
| TXT | resend._domainkey | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDMGpMmImMMJS8UFNcTh2X+ZMSG0cwmn27Toif+UDk/InhQmAKyWFo77PGOJ9LVrw88wSovQGApqoppYZVrMkq2E6ZmDddu1PCsUs3i0Gqh5TUSsC47Wk7JqkQdXbZrnHoJq90UezeyTngb9vAVWPlUwMegQ2Njvil6/mUn3eyCGQIDAQAB | — |
| MX | send | feedback-smtp.eu-west-1.amazonses.com | 10 |
| TXT | send | v=spf1 include:amazonses.com ~all | — |

TTL Auto. Email receiving remains OFF in Resend.
Notification recipient: `info@sperinservices.co.uk`.

## Remaining cutover work

The adapter and schema now use the dedicated Neon database and managed email OTP. Existing Sperin reviews were copied without modifying the other applications. See `SPERIN_REVIEW_CUTOVER.md` for current verification evidence and remaining release gates.

The production domain still needs its Vercel DNS configuration and the intended branch needs a deliberate
production release. Protected preview links are not permanent customer approval links.

## Google reviews

Existing customer write-review link:
https://search.google.com/local/writereview?placeid=ChIJL3jjyAK9cEgRpfDz2qeXROA

Already present in website review sections. An automatic Google review feed is NOT connected.
Official Business Profile API setup requires account authorization and Google API access approval:
https://developers.google.com/my-business/content/basic-setup
https://developers.google.com/my-business/content/review-data
Do not fabricate a feed, scrape around access controls, or enable a paid API under the no-payment instruction.

