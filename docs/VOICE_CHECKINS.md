# Voice check-ins: a personal health-context record

## Product idea

A sensor can record a heart rate, but it does not record a crew member saying, “I started feeling unwell while working in Habitat A.” Voice check-ins preserve that subjective observation alongside the available measurements and module context, so the person and the crew medical officer can review the same timeline.

The feature is a brief, user-confirmed personal log. It is not an always-listening microphone, a voice-based diagnostic system, or automatic recognition of who is speaking.

## Current interaction

1. The crew member opens **Voice** and chooses **Start dictation**. Text input is also available.
2. The browser requests microphone access and attempts speech recognition. The app takes the recognition language from browser settings; it does not identify an arbitrary spoken language automatically.
3. The transcript appears in an editable field. The user checks the wording and corrects recognition errors.
4. **Confirm and save** creates a personal entry. A transcript is never automatically saved as a confirmed report.
5. The entry captures the confirmation time in UTC, the current demo profile, the available position, environmental readings and their quality, recent simulated presence, and available personal measurement snapshots with their original timestamps.
6. **History** shows confirmed entries. **Context and possible connections** explains the prepared association, its evidence and missing information.
7. **Help → Ship context** can display the latest confirmed entry alongside current source availability. The note's saved context remains historical; it is not silently rewritten when the crew moves.
8. **Connection** can include personal transcripts and context in a local JSON report only when the user explicitly selects that option.

The confirmation time is not necessarily the onset time of a symptom. The prototype does not parse onset, duration, severity, negation or resolution from free text. A note saying “five minutes ago” remains free text and must not be treated as an established structured onset timestamp.

## Example and useful outcome

A demonstration can place Alex and Sam in Habitat A while a synthetic environmental change is active. Sam's prepared report is visibly labelled synthetic. Alex dictates or types a personal observation and confirms it. The saved record can preserve co-location, the cabin readings, another synthetic report and the person's own measurements.

The useful output is: “This report overlaps a prepared environmental-change scenario; here is the recorded evidence and what is still unknown.” It is not: “CO₂ caused this symptom.” The system neither diagnoses the person nor declares the module safe from these observations.

The current association is a narrow prepared rule for Habitat A. It is not a general model of exposure or a validated statistical correlation across arbitrary modules, times or symptoms. The same-module shared-report example does not establish a common medical cause.

## Why this belongs in the space-health concept

The intended contribution is the connection between personal observations, the crew member's presence history, shared environmental conditions and source quality. Voice is the low-effort way to add the human observation to that record. A transcript alone would provide little differentiation from an ordinary notes app.

The current website is the first interface. A future watch or headset client could send the same confirmed record to an onboard service. No watch application is implemented.

## Data and privacy today

- The profile is the fictional **Alex** demo profile, not an authenticated crew identity or voiceprint.
- The app stores confirmed text, not recorded audio. Browser recognition may send audio to the browser provider and may require internet.
- Recognition availability and permission depend on the browser and device. Typed input is the fallback.
- Up to 100 personal entries and 300 ship timeline events are retained in local browser storage. If storage fails, entries remain session-only.
- Local browser storage is not a production medical-record system with authenticated access, encryption management or multi-device synchronisation.
- Closing the voice panel stops recognition. There is no background or closed-page monitoring.
- The report is downloaded locally; it is not transmitted to Earth or crew.

Browser API reference: [MDN — SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

## What would be required for an operational version

| Layer | Required future work | Current prototype |
| --- | --- | --- |
| Identity | Explicit authenticated crew profile and permissions | One fictional personal profile |
| Input | Validated onboard speech recognition, offline language packs and noise testing | Browser recognition with typed fallback |
| Confirmation | Transcript plus structured onset, duration, current location and user corrections | Editable transcript and confirmation |
| Telemetry | Read-only mission adapters with source IDs, timestamps and signal quality | Local deterministic simulator |
| Historical context | Match the reported time window to actual presence intervals and environmental samples | Recent presence retained; a narrow prepared association |
| Assistance | Mission-approved decision support and human review | Prepared public-source guidance; no approved flight checklist |
| Records | Auditable storage, access control, retention and reliable synchronisation | Browser-local notes and local export |

An optional language model could help propose structured fields for the user to confirm, but should not invent symptoms, silently interpret ambiguous statements or generate unapproved treatment instructions. No such runtime language model is connected in the current build. Offline recognition is a future integration, not a demonstrated capability of the browser dictation feature.

## Demo acceptance checks

- Dictation denial or lack of support leaves usable text input.
- A transcript does not become a saved report before confirmation.
- The saved entry preserves its original context after movement.
- A missing position is shown as unknown, rather than an empty module.
- Stale or missing environmental data is not treated as normal.
- Another person's synthetic report is clearly distinguished from a user-confirmed personal entry.
- Private transcripts are excluded from exported reports by default.
- Recognition accuracy must be checked with actual speech on the presentation device. Adapter mocks do not establish that accuracy.
