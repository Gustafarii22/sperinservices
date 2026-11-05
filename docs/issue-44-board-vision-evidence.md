# Issue #44 — experimental scanner safety and real-photo QA

**Not a release.** This branch is based on the data-safe v1.9.7 work in PR #45,
and intentionally does not publish an APK, modify signing, alter Android storage
keys, or change the issued PDF renderer.

## Actual scan flow

- Cloud vision analyses up to six consented photos; offline Android ML Kit is
  **text OCR with geometry heuristics only**. Neither is proved to classify
  devices or read handwriting accurately on real installations.
- New proposals never carry measured test results or conductor/method fields.
- Main-switch/position ordering is only a suggested photographic arrangement;
  populated existing circuit identities are **not automatically selected**.
  The installer must choose a destination and ensure the circuit number matches.
- With existing measured values, changed protection details trigger a separate
  **before/after** acknowledgement. Without that explicit acknowledgement the
  core mutation is rejected. Test rows retain their original identities.
- Scan audit records value, source-photo text/index, confidence, reason,
  original source (observed, inferred or installer-entered) and review status.
  Inferring BS EN 61009-1 from apparent RCBO class does **not** turn the
  product standard into an observed marking. Photos are still session-only;
  audit text is not a durable image archive.
- These safeguards do not prove a correct circuit match. When uncertain, stop
  and leave the device unassociated rather than transferring test readings.

## Scoring real photo recognition

The new `certificate-android/qa/score-labelled-scans.mjs` reports:
per-field precision, recall and omission rate, unmatched/duplicate devices,
missing physical devices, incorrect way mapping and unknown ways.
Its companion unit test uses **synthetic records only** and is NOT accuracy
evidence.

A separately approved evaluation set is needed. Store real board pictures and
ground truth outside the public repository and outside publicly downloadable
CI artifacts. Remove customer details and addresses where feasible and retain
consent and access controls. The independent electrician should label the
unmodified photos BEFORE reviewing model output; predictions must be frozen
before the assessor assigns `matchedTruthId`. Do not set the predicted `wayId`
based on the assessor's corrected position.

Example **illustrative schema, not a scored real photograph**:

```json
{
  "datasetVersion": 1,
  "isMock": false,
  "cases": [
    {
      "id": "redacted-approved-case-001",
      "truth": [
        {
          "id": "physical-device-1",
          "wayId": "bank-A/rail-1/way-3",
          "fields": {
            "deviceKind": "RCBO",
            "ocpdBs": "BS EN 61009-1",
            "ocpdRating": "32",
            "rcdType": "A",
            "poleCount": "1"
          }
        }
      ],
      "predicted": [
        {
          "matchedTruthId": "physical-device-1",
          "wayId": "bank-A/rail-1/way-3",
          "fields": {
            "deviceKind": "RCBO",
            "ocpdBs": "BS EN 61009-1",
            "ocpdRating": "32",
            "rcdType": "A",
            "poleCount": "1"
          }
        }
      ]
    }
  ]
}
```

Run with:

```sh
node certificate-android/qa/score-labelled-scans.mjs private-evaluation.json private-evaluation-report.json
```

A report with any device mapping errors exits non-zero. If it reports no
usable nonblank predictions it also exits non-zero. A zero error count in a
small or unrepresentative dataset is **not sufficient** for release.

The fixture must include documented cross-manufacturer single/dual rail,
multi-bank, closed-cover handwriting, multi-pole TP&N, three-phase split
rows, shared RCCB groups, mixed AFDD and SPD, masked printing, equal-rating
adjacent breakers, spares and multiple-angle duplicate photos. Record sample
sizes and omissions; publish aggregate metrics without exposing images.

## Outstanding gates — issue #44 is NOT complete

- No structured verified relation model for physical module spans, bank/rail,
  group-protected devices, label-sheet association, cross-image device identity
  or pole-to-way/phase mapping. Current phase/pole **metadata** is not TP&N
  mapping and is not represented end-to-end in the issued PDF.
- No independently labelled real-photo QA has been supplied or scored.
  Do not claim field accuracy from mock browser tests or synthetic scorer tests.
- No verified additive migration/backup/restore/PDF round trip for three-phase
  topology. Existing single-phase PDF must remain identical until separately
  approved output is ready.
- Current experimental branch and PR #45 require full green latest-source CI
  plus an actual installed-phone package/signer/data export and compatible
  production signing strategy. Never uninstall, clear or silently overwrite
  the existing app.

**Release decision:** draft-only; no APK or production sign-off.
