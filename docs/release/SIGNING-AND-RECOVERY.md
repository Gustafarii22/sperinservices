# Sperin Certificates signing and recovery

## Evidence at 4 November 2026

PR #45 remains draft. The installed phone APK has not been accessed; no claim of
in-place compatibility is authorised by the repository artifact alone.

The downloaded v1.9.6 integrated-dev release has SHA-256
`5f6980a9f56173f482abb4ccf667c9c6f00a62878e99bcb89bc61b2f13323e9e`, matching BUILD-INFO.
Its APK v2 signing block contains Android Debug certificate SHA-256
`d68e83847f45b75170ce43271d3a7e882eb2dfb70ad71c3ecf7432b6ca4d1d9e`.
Its manifest names `uk.co.sperinservices.certificates.stable.preview.team.v196`.
This is downloaded-artifact evidence, NOT independent evidence of the phone installation.

The historical stable signer is separately pinned as
`68d9f4926edc07657183de10039c110329d894d3c6874f5314dfcc7cd16bf573`.
Do not confuse these identities.

Recovery checked: repository history for keystore files and generation procedures;
current Actions cache inventory (empty); all 647 retained artifact metadata entries
(no signing-key/keystore backup candidate); release asset inventories (APK/build info,
not private keys). A fresh Actions audit checks presence of the two previously named
signing secrets without revealing values. APK public certificates cannot reconstruct keys.
Remaining external routes: original developer computers and their ~/.android/debug.keystore,
local/OS backups, any owner password vault or previously downloaded keystore; Google Play
App Signing only if this exact app was enrolled (not established). Never regenerate a
file over an old candidate. Compare every candidate's certificate to the actual phone APK.

## Collect actual phone identity without changing the installation

On an owner-approved computer with Android platform tools and build tools, connect the
phone, approve debugging, and run `bash certificate-android/qa/inspect-installed.sh PRIVATE_DIR`.
This only lists packages, copies APKs and reads public signing identities. It does NOT
copy certificate data. Keep every existing app installed and unchanged.

## Permanent replacement provisioning — not completed yet

No new production key has been generated or retained by this change. No backup restoration
has been performed. A protected secret-writing connection and an independent secure backup
location are required. Do not use ChatGPT files, git, Actions artifacts or cache as a key vault.

1. On a trusted machine, generate one RSA 3072-bit (or stronger) signing key in a password-
   protected keystore, with strong independently stored passwords and long validity.
   Use hidden password prompts or protected files, never command-line literals or logs.
2. Store the primary in the owner's password vault/secure secret manager. Store an encrypted
   backup in a different protected location under the owner's control, with recovery passwords
   in the vault. Restore that backup into a fresh private directory, compare file checksums,
   unlock its private key and sign/verify a disposable test artifact. Record the public fingerprint,
   locations, recovery custodian and restore date only. Destroy temporary plaintext copies.
3. Provision protected GitHub Environment `certificates-production` with secrets:
   `SPERIN_PERMANENT_JKS_BASE64`, `SPERIN_STORE_PASSWORD`, `SPERIN_KEY_PASSWORD`,
   `SPERIN_KEY_ALIAS`, and `SPERIN_BACKUP_VERIFIED_SHA256` (public fingerprint, set only after the restore drill). Require trusted branch/ref restrictions and owner review.
4. Commit ONLY the approved public SHA-256 fingerprint (64 hex characters) in
   `certificate-android/signing/permanent.sha256`, plus a nonsecret backup verification receipt.
5. Build variant `permanent`: package `uk.co.sperinservices.certificates.stable.permanent`.
   It is intentionally separate from all previous stable and preview apps. It cannot update
   old differently signed installs. Never change this identity after the first released build.
6. Use monotonically increasing version codes. Independently rebuild a second APK with the
   stored key on a fresh runner; verify both signers against the committed pin, install the
   first in an emulator, import representative data, then `adb install -r` the second. Confirm
   all data, photos, edits and reopen behaviour survive. No uninstall or clear-data shortcut.
7. Publish only after regression, APK inspection, emulator upgrade and real-data migration
   gates pass. Retain previous APKs/checksums/evidence; rollback data via verified exports.
   Android downgrade restrictions mean rollback is not simply installing a lower version code.

Gradle now blocks release/permanent builds if their expected key is missing or changed,
and rejects Android Debug certificates for production. Preview remains test-only.

## Data transfer

Export JSON using each old app's Profile > Backup & recovery > Share to an external location.
Keep two independent copies and verify they parse. Record counts and IDs by certificate type,
all circuits and measured values, custom/legacy fields, instruments, signatures and templates.
Old JSON exports can omit IndexedDB job photographs and site-sheet data. Export each old job's
handover ZIP separately and inspect its image files. An empty photograph list is not proof of
complete recovery. Do not promise omitted files can be recovered from JSON.

New schema-2 portable exports include photo bytes and site-sheet plans/templates. Export fails
if a referenced photo is absent rather than silently claiming completeness. Legacy imports warn
when photo metadata lacks bytes. Imports stage validation first, preserve an undo snapshot,
and avoid overwriting existing photo bytes on ID collisions. Insufficient local storage blocks
safe import; never bypass this by clearing the original app.

Import only into the separate replacement. Compare the real source/export/destination before
and after editing, closing and reopening. Check PDFs as well as editable results. Keep the old
apps and external copies until the owner has confirmed every needed record and attachment.
