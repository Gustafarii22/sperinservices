# Website update — 28 October 2026

## Production source

Gustafarii22/sperinservices, main branch; Vercel project sperinservices; custom domain https://sperinservices.co.uk. Production was matched to commit 876f941effec9071f5d300222c616b40c2d94033 before editing. Preserve the existing Vercel environment and database. No schema migration is required.

## Changes

- Shared white/navy/blue design, rounded cards, restrained shadows and consistent quote calls to action. Existing dark palette and theme switch preserved.
- Homepage uses genuine Rowley Park photography, service cards, owner/qualification context, four-step process, FAQs, coverage and contact actions.
- Data & Network Cabling route, service catalogue links, breadcrumbs and sitemap entry.
- Gallery filters hide categories without genuine content; projects can carry multiple categories and before/during/after photos. Lightbox supports previous/next, arrow keys, Escape and restored focus.
- Calculator keeps existing rates and VAT treatment, labels survey-only work, separates survey requests, uses 48px quantity controls, has a sticky subtotal and removable rows, and transfers the estimate to contact.
- Tab-scoped drafts expire after 24 hours. Contact details and booking text survive navigation; photographs must be reattached after leaving a form, as disclosed in the form. Session storage is optional and failures do not block forms.
- General enquiries accept an optional address and validated estimate IDs. Server recalculates costs; submitted totals are never trusted. Stable retry references, existing spam limits, photo checks and mail-provider idempotency are retained.
- Customer acknowledgement support is enabled only with SPERIN_ENQUIRY_ACKNOWLEDGEMENTS=true. It is not enabled in production by this change. Acknowledgement failure does not turn a successful owner notification into a failed enquiry.
- Owner review visits retry the existing durable notification queue; the manual retry remains available. Existing moderation, authentication and data are preserved. Review invitation text can be copied without automatically messaging customers.
- Optional measurement is off by default, respects Do Not Track and records only allowlisted event names in existing Vercel logs. No visitor IDs or form data. There is no analytics dashboard or paid analytics subscription.
- Logo delivered as a smaller WebP; original branding asset retained. Privacy text now describes actual Resend handling and draft storage instead of obsolete FormSubmit processing.

## Content maintenance

Add approved genuine project photographs to public/projects/<project-slug>/ and an entry in src/lib/projects.ts. Include slug, title, truthful scope, date, area, cover and photos. Each photo has src, alt and stage (before, during or after). Set categories only for work actually performed. Empty categories stay hidden. Add the new project URL to public/sitemap.xml. Never label illustrative images as completed work.

The owner's portrait slot is configured by OWNER_PHOTO in src/lib/site.ts. It is hidden until an approved genuine photograph is supplied. Current insurance amounts and 18th Edition claims were removed from the About trade record pending verification; the owner's stated C&G 2360 and 2391 qualifications remain. No NICEIC claim was added.

## Verification

Run `node --test tests/*.test.mjs`, `npx tsc --noEmit`, and `npm run build`. Test additions cover general enquiry estimate tampering, unknown/survey work, draft expiry/storage denial and analytics payload minimisation/origin checks. Existing tests cover calculations, PDFs, travel thresholds and fallback, email failures, review approval/authentication/notifications and certificate scans.

Browser checks cover white and dark themes, desktop/mobile navigation, a 320px frame and 360px/412px frames, calculator quantities (£120 for one switch plus two sockets), survey exclusions, estimate handoff and gallery routes. These are responsive Chromium checks, not a physical Samsung or Safari certification. Production checks and any limits are reported in the delivery message. Field Core Web Vitals need real visitor data over time.

## Outstanding external dependencies

- The approved latest price list was not located; no rates were changed or certified against a new list.
- Existing public endpoints returned no approved reviews and Google configured=false. Google Business Profile OAuth setup is documented in GOOGLE_REVIEWS_SETUP.md. Do not fabricate ratings or counts.
- More genuine project photographs, a genuine owner portrait, and current insurance/qualification documents are needed for richer verified content.
- CRON_SECRET was not configured, so no scheduled notification retry was enabled. Authenticated owner visits and manual retry use the existing queue.
- Provider acceptance of an email is distinct from inbox delivery. Inbox confirmation requires the business mailbox.
