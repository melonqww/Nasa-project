# Scientific context and demo data

This prototype processes synthetic measurements for a fictional crew member. Neither the current readings nor the preloaded history are NASA patient records. The interface does not provide a validated diagnosis, medical score, or treatment protocol.

| Source | How it informs this prototype |
| --- | --- |
| [NASA Human Research Program: Risks](https://www.nasa.gov/hrp/risks/) | Selection of cardiovascular, oxygen, activity, sleep and wellbeing information; explaining the limits of those measurements. |
| [NASA: Five Hazards](https://www.nasa.gov/hrp/hazards/) | Context for self-assessment during space missions. The display is not a detector for every spaceflight hazard. |
| [NASA OCHMO-STD-100.1A, Revision A (2024), section 6.1.1, page 38](https://www.nasa.gov/wp-content/uploads/2023/04/ochmo-std-100.1a.pdf#page=38) | Its examination description includes pulse, blood pressure, body temperature and respiratory rate. This informed the additional vital-sign categories. The examination standard is not a prescription to measure everything continuously, and its thresholds are not implemented here. |
| [NASA: Tempus Pro](https://www.nasa.gov/reference/tempus-pro/) | Precedent for collecting and integrating measurements and supporting medical care. No Tempus Pro integration is present. |
| [NASA: ARCHeR](https://www.nasa.gov/reference/archer/) | Supports combining activity/sleep observations with subjective wellbeing reports. No validated sleep or stress inference algorithm is implemented. |

Temperature is labeled as a simulated oral-probe measurement, not skin temperature. Blood pressure is split into systolic (upper) and diastolic (lower) readings with paired timestamps. All added readings have fictional preloaded history. No glucose estimate is inferred from heart rate or other displayed readings.

The demo status is prepared scenario content. Recommendation text is written in advance; an external language model does not issue live medical instructions. Source links explain the choice of information and do not certify this software for flight or clinical use.

Checked: 14 November 2026. See the application's measurement details for source context and provenance.

## Prepared assistance chat

The ambulance button opens a local, deterministic question-and-answer flow. It does not call an LLM, contact a responder, detect unconsciousness or change sensor readings. Version 2026-11-14.1 was checked against the public sources below; it has not received clinical or flight-medical approval.

| Source | Scope of use |
| --- | --- |
| [NASA: Medical operations](https://www.nasa.gov/reference/6-0-medical-operations/) | Mission medical context, planned care and communication constraints. It does not supply an approved emergency procedure for this prototype. |
| [NASA: CPR drill in microgravity](https://www.nasa.gov/image-article/astronaut-josh-cassada-practices-cpr-space-station/) | Shows that flight CPR has stabilization considerations. No ground recovery-position or compression-position tutorial is substituted for an approved flight checklist. |
| [American Red Cross: Unresponsive and breathing](https://www.redcross.org/take-a-class/resources/learn-first-aid/unresponsive-and-breathing-person) | Responsiveness/breathing questions and continued observation. General first-aid evidence, not flight approval. |
| [AHA: Adult basic life support](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support/) | Distinguishes unresponsiveness with abnormal/absent breathing from a person who is responsive. |
| [AHA / Red Cross: 2024 first-aid guidelines](https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines) | Prompt escalation of chest discomfort; no medication dosing or diagnosis is implemented. |
| [FDA: Pulse oximeter basics](https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics) | Device instructions, stable repeat measurements, symptoms and measurement limitations. The sensor check does not restore a real connection or certify health. |

The urgent branches explicitly say that an approved flight emergency checklist is not loaded. Medical review, approved mission procedures and validation remain prerequisites for operational use. All source links are visible in the relevant messages.

## Daily plan and demo self-reports

The activity-day target of 30 minutes is an illustrative demo assignment, not a NASA exercise prescription. Recovery mode has no numeric target. Steps are not measured. Task completion and recognition use explicit actions, not generated measurement history or a favourable wellbeing rating.

The user enters energy, an optional note and an overall wellbeing rating. Only the chosen 1–10 rating supplies today's wellbeing value; no score is inferred from the note or energy answer. Without today's check-in the current wellbeing reading is unavailable. These manual demo entries and activity minutes are stored in this browser, with UTC dates and actual entry timestamps. Older generated metric history remains synthetic. The application remains a demonstration, not a validated questionnaire or clinical record system.
