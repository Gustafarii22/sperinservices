# v1.9.5 certificate review coverage

The review is a deterministic aid, not an exhaustive BS 7671 or other standards compliance engine. It never changes test readings or invents missing test results.

- Reads all schema descriptors from saved data rather than only visible form inputs.
- Combines configured circuit warnings (Zs, IR, RCD timing, polarity, RCD/AFDD buttons, cable pairing/reference methods) with deferred voice items.
- Applies relevant existing test checks to Minor Works as well as EIC/EICR schedules.
- Checks supplied numeric inputs for malformed data, while allowing units, bounded instrument readings, N/A, N/V and LIM.
- Flags companion data missing for entered Zs/IR results. Does not demand every optional field.
- Blocks completion for missing installation/premises address, missing EICR extent/result, unresolved deferred items, satisfactory EICR conflicting with C1/C2/FI, and explicitly failed polarity/functional or initial inspection results on EIC/Minor Works.
- Deferred items can be edited or marked not applicable with a stored reason. Completion records the reviewed warning list, notes and confirmation timestamp.
- EICR adverse observations can legitimately be reported. Technical warnings remain visible for the inspector to assess.
- PDF export remains available while drafting. Specialist final issue restrictions remain in place.

Limitations: does not determine applicability from site inspection, validate all required declarations/test completeness, independently authenticate standards/device tables, assess every installation design or validate every BS 5266/BS 5839 criterion. No automatic regulatory approval is claimed. Conditional IR and selective RCD warnings require professional interpretation.

Primary reference checks, 22 October 2026:
- Current edition: https://electrical.theiet.org/bs-7671-18th-edition-wiring-regulations/ensure-you-are-up-to-date-with-bs-7671
- RCD test conditions: https://electrical.theiet.org/wiring-matters/years/2022/91-july-2022/changes-to-rcd-testing-in-bs-76712018plusa22022/
- Selection of tests/protective measures: https://electrical.theiet.org/wiring-matters/years/2025/105-may-2025/minimizing-unnecessary-live-testing-for-initial-verification/

Regression tests: `tests/certificates-v195-review.e2e.mjs` exercises toolbar undo/redo, scrolling, draft PDF, blocked completion, reviewed completion, persistent deferred items/N/A reasons, contradictory EICR and Minor Works technical warnings. Existing forward/reverse/mixed certificate workflows and Android install/relaunch checks remain build gates.
