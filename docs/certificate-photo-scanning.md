# Sperin Certificates 1.8.0 — photo review and light theme

This adds an opt-in photo assistant to EIC, EICR and Minor Works. It does not certify an installation or replace inspection/testing.

## Workflow

1. Create/open a certificate; press **Scan Consumer Unit** in its toolbar, a consumer unit, or a circuit editor. Choose the board if there is more than one.
2. Take a photo (Android camera intent) or choose gallery images. Up to six JPEG/PNG/WebP photographs, with rotate/remove controls. Browser decoding handles image orientation; native camera applies EXIF rotation/mirroring. Photos are resized and re-encoded to JPEG, stripping EXIF metadata.
3. Explicitly consent to upload, then analyse all photos together. Owner sign-in uses the existing Sperin Services verified email session. No provider key is included in the app.
4. Review source text/photo numbers and confidence. Every proposal starts unchecked. Edit and confirm individual values. Each device must be assigned to an existing circuit or an explicit new circuit number. Main switches, shared RCDs and SPDs are board information, not outgoing circuits.
5. Apply Confirmed Information displays old and new values; Confirm & save writes a single transaction through the existing autosave/backup/undo workflow. Changing the certificate while reviewing invalidates the transaction. Cable/conductor/method/test fields are not on the scanning allowlist. New circuits receive blank test rows.
6. A rescan retains confirmed corrections and device mappings. New device proposals are separate; duplicate destinations/numbers are rejected rather than silently merged. Unapplied photos and proposals are discarded on closing; confirmed values and text evidence remain in the certificate and backups.

Offline: **Read text on device** reuses ML Kit through the existing sheet OCR bridge. It shows unassociated text only. It does not claim to recognise equipment or assign circuits. Manual device entry and review remain available even without OCR/cloud access. Existing sheet OCR is unchanged.

## Backend

`POST /api/owner/certificate-scan` is inside the existing server's verified owner-session boundary, existing same-origin checks, and database-backed attempt limit (10 / 15 minutes for the owner). It uses the OpenAI Responses API with strict structured output and `store:false`; the default model is `gpt-4.1`, overridable with `CERTIFICATE_SCAN_MODEL`.

The server deployment needs `OPENAI_API_KEY` plus the existing Sperin owner authentication/database configuration. A local ignored key file does **not** configure the deployed server. This PR does not deploy backend credentials or merge/publish the website. If unavailable, analysis fails closed and offers local/manual fallback. Never put the key in web assets, Android resources, public runtime configuration, or git.

The endpoint bounds the body to 15 MB, six JPEGs, 2.4 MB encoded per image, and times out after 75 seconds. It does not persist photographs, upstream response objects or raw provider errors, and sends no customer/certificate metadata. Our application does not retain uploaded photos; `store:false` is not a guarantee of zero retention by OpenAI (provider abuse monitoring policy applies). The service worker excludes API routes from caching.

## Compatibility and UI

Storage key, package name, signing key/fingerprint, native PDF functions and PDF renderer are unchanged. Optional photo metadata is additive. Board/circuit templates include new design metadata; measured readings remain excluded. The white interface includes native light dialogs/status/navigation bars, selectors, voice panels, sheet tools, templates and recovery dialogs. The system keyboard/gallery appearance is controlled by the user's keyboard/gallery app and cannot be guaranteed by web CSS.

## Validation status

- Unit tests exercise no automatic approval, allowlisted fields, unchanged customer/test/conductor data, atomic changes, duplicate/linked targets, Minor Works mappings and bounded/consented cloud requests.
- `scan.e2e.mjs` uses a **mock** analysis response with a real local photo. It tests photo input, consent, corrections, destinations, changes preview, cancel, persistence, orientation and light input backgrounds; it is not a recognition-accuracy test.
- `fixtures/consumer-unit.json` identifies the repository's genuine Wylex job photograph and its limitations. It does not provide verified breaker ratings: the image is too low resolution for reliable independent ground truth.
- The live provider test was blocked by automatic approval review because uploading that job photograph to OpenAI needs explicit approval for the specific payload. It was not retried. No live recognition accuracy is claimed.
- Multiple makes/mixed protective devices, unreadable-label recognition performance, real handset camera/gallery/permissions, and physical printing require further validation. Do not treat this as a production-validated electrical scanner.
- CI builds the existing stable-signed APK and runs the repository's Android emulator upgrade/rotation/keyboard tests. Consult the actual run, not this document, for its result.

Optional live evaluation after approval: use the local `live-scan.mjs` runner with approved JPEG fixtures and an environment-provided key; it writes redacted result JSON, never prints credentials. No live API tests run in CI.
