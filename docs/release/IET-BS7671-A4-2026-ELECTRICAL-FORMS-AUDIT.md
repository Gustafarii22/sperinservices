# Sperin Certificates — IET BS 7671+A4:2026 electrical model-form comparison

**Source-of-truth model forms:** [IET BS 7671:2018+A4:2026 complete model forms, dated 15 April 2026](https://electrical.theiet.org/media/vasih5wg/bs7671_all_forms_a4.pdf). The IET expressly permits manipulation of the forms for electrical contracting purposes subject to its conditions; do not reproduce the IET logo.

**Scope:** The six forms in the source PDF: Electrical Installation Certificate (EIC), Minor Electrical Installation Works Certificate (MEIWC), Electrical Installation Condition Report (EICR), Schedule of Inspection, Schedule of Circuit Details and Schedule of Test Results. This is **blank template and supporting schedule completeness**, **not** certification of any actual installation or assessment of actual test values. Specialist emergency-lighting and domestic smoke/heat model forms are separately audited.

| IET A4 model form | Reference items accounted for in the app and printed PDF | QA evidence |
| --- | --- | --- |
| EIC | A–J; client/address and work extent; design/construction/inspection declarations, three roles and optional second designer; amendments/departures/411.3.3 exception and risk assessment, next inspection, signatories; earthing/live supply/device characteristics; RA vs Ze, installation earth electrode and bonding, main switch/RCD and other-supply/protective-setting references; 14 inspection points; linked schedules and recipient guidance | `tests/certificates-form-completeness-2026.test.mjs`, `tests/certificates-eicr-a4-structure.test.mjs`, EIC PDF regression |
| EICR | A–K; client, report reason, premises, scope/limitations, condition, next inspection, inspector/authoriser independent signatures and details, schedules, source and installation particulars, observations with C1/C2/C3/FI descriptions and location refs, dated test record, EICR recipient guidance | model completeness tests, `tests/certificates-eicr-a4-structure.test.mjs`, end-to-end print/edit/backup tests |
| Minor Works | A–E exactly; completion date, circuit alterations and departures/risks/comments; earthing and bonding to water/gas/oil/steel/other; OCPD/RCD/AFDD/SPD details; protective conductor/ring/IR/polarity/Zs/RCD/AFDD/SPD tests; declaration, signatures and date, recipient guidance | model completeness tests, `certificate-android/qa/minor-iet-a4.e2e.mjs`, `certificate-android/qa/check-minor-layout.py` |
| Schedule of Inspection — EIC | 14 headings numbered 1.0–14.0; outcomes **✓ or N/A only** on new forms, without an invented failed option | exact inventory assertions |
| Schedule of Inspection — EICR | 66 detailed checklist items: 1.1–1.3, 2.0, 3.1–3.8, 4.1–4.23, 5.1–5.21, 6.1–6.8, 7.1, 8.1 | exact inventory assertions |
| Circuit Details & Test Results | Generic 31-column schedule, circuit details 1–16; test results 17–31. Includes distribution board OCPD/RCD/SPD, correct polarity, phase sequence, SPD functional confirmation, six test instrument serial/asset numbers and separate printed tester name/signature/date; printed continuation and remarks | exact column/index assertions, PDF regressions, EICR/EIC output |

## Discrepancies detected and corrected during the source-to-source comparison

- Added recordable EIC supply OCPD type and electrode **RA / Ze** choice where the printed field existed but the editor lacked an independent input.
- Added a separate test-schedule tester signature for EIC and EICR. Previously the rendered schedule could fall back to a certification signature.
- Preserved optional second EIC designer rows on a blank printout.
- Added specified **Other** bonding, supply overcurrent device and RCD type where the IET provides a free-text alternative.
- Corrected EIC/EICR numeric switch entry so the model's rating/setting values are not artificially limited to standard dropdown options.
- Corrected EIC inspection outcome choices to the model's tick or N/A; legacy saved ✕ is still preserved/printed visibly.
- Prevented EICR from falsely filling empty inspection outcomes, signatories, test instruments and certain report conclusions with N/A or No remedial action required.
- Kept existing certificate data/schema and user backups; did not clear or replace saved certificates.

## Forms versus editor metadata

The generated certificates are **model-form aligned**, not an exact typographic reproduction of the IET PDF. Internal/editor-only fields (e.g., phone-friendly postcode entry, settings, board registers, quick-entry aids, data migration information) are not independent BS 7671 certification requirements. They must not be represented as additional mandatory certification fields, and must not be silently added as unsupported PDF declarations. Model references on printed schedules and continuation attachments are permitted by the model.

**Evidence limit:** Test assertions establish a known mandatory form inventory and printed-output checks, but do not certify the accuracy of user-entered installation data, actual inspection results, actual suitability or the present legal compliance of completed work. When the IET issues further amended model forms, re-run the comparison and update the version reference. Domain-specific additional reports (e.g. medical locations supplementary bonding) are outside the six common forms and may be required by the particular installation.

## Release conditions

Before calling the updated Android application production ready: finish full end-to-end CI on the exact committed source, build `permanent` variant with the owner-confirmed retained signing key and package, verify in-place update over v215 and existing data. Do not substitute debug-signed test APK for the permanent update.
