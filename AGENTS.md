# Required release safety for Sperin projects

These owner requirements apply to all work in this repository, including the website,
Android app, cloud services and CI. Carry them into any new project created for this owner.

- Inventory data, credentials, signing identities, configuration and existing functionality at risk.
- **Before any Sperin Certificates Android build**, read `docs/release/SIGNING-AND-RECOVERY.md` (15 Nov 2026 owner-confirmed signer section) and `certificate-android/signing/permanent.sha256`. The installed S23 Ultra app is v215, package `uk.co.sperinservices.certificates.stable.permanent`, pinned SHA-256 `200881370fa891c1747063d117476567a571835b9fdf5c69c590f26386c205b1`. The owner has confirmed certificate backups. Do not ask to extract or identify these again unless the installed app changes; do not disclose or store the private signing key. Use the retained production signing secrets via the protected GitHub workflow and verify an APK's signer before any upgrade.
- Create recoverable backups and prove restoration before migration or destructive changes.
- Preserve installed package/signing compatibility and origin/storage namespaces. Never infer
  the phone's identity from a similarly named GitHub artifact.
- No disposable/debug key for a production release. Permanent keys require protected durable
  primary storage plus a separate encrypted backup tested by restoration. Never commit keys.
- Test normal operation, clean installation, upgrades, migration and recovery. A green build
  alone is not evidence of an installable, data-preserving update.
- Verify the actual downloadable deliverable and report exact commit, package, version,
  public signer fingerprint and checksums. Distinguish mocks from live services/hardware.
- Keep PR #45 draft until release gates pass. Do not merge, uninstall, clear app data,
  overwrite existing releases or perform destructive deployment without owner authorisation.
- Do not call a preview or an incompletely verified artifact a finished release.
