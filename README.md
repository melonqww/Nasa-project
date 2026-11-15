# Astronaut Health Monitor

[English](README.md) · [Русский](README.ru.md)

A clear view of health when Earth is far away.

Astronaut Health Monitor is an interactive prototype that helps a crew member review health information, understand what needs attention and follow prepared checks during a space mission. It brings measurements, daily self-reports and practical next steps into one calm interface.

Created for the NASA Space Apps challenge **Create Health Monitoring Software for Astronauts on Space Missions**.

## The problem

During a long mission, a number on a screen is only part of the picture. A crew member needs to understand when it was recorded, whether a signal is missing and what to do next. Sleep, activity and personal wellbeing also deserve a place alongside vital signs.

Our goal is to make that information easier to understand at a glance and easier to explore when more detail is needed.

## The experience

**See your status.** A gently flowing sphere communicates the selected demonstration state. A short explanation gives it meaning, while the main measurements stay within reach. Missing information remains visibly missing.

**Understand your measurements.** Health combines readable trends, point-by-point details and plain-language explanations. It covers heart rate, blood oxygen, breathing, temperature, blood pressure, sleep, activity and wellbeing. Minute views support a closer look; daily views make longer patterns easier to follow.

**Find a next step.** Help offers prepared questions and quick replies for sensor checks, symptoms, collapse and routine review. Relevant sources accompany the messages. The answers are stored with the application and do not depend on a live language-model response.

**Build a daily routine.** Daily plan combines activity or recovery-plan review, measurement review and a short evening check-in. The crew member records their energy, an optional reflection and their own wellbeing rating for today. A calendar recognises completed days; an honest low wellbeing rating still counts as completing the check-in.

**Prepare a health summary.** Connection lets the user review measurements and choose what to include in a downloadable report, including optional history and check-in notes.

**Connect the person to their surroundings.** Ship mode combines a selectable spacecraft with automatically simulated environmental samples and crew movements. Feed freshness and crew-position availability are tracked separately. Personal check-ins preserve their available module context and measurements at confirmation time. Help shows possible temporal associations, supporting evidence and missing information without assigning a diagnosis.

**Capture a quick check-in.** Voice opens a compact dictation or text form and a separate history view. Browser language is selected automatically. A transcript is saved only after confirmation; audio is not stored by this app. Browser dictation may require internet and send audio to the browser provider. Connection includes an incident timeline, while private transcripts and context enter a report only with explicit opt-in.

## What makes the approach useful

The overview, explanations, help and daily routine form one connected journey. A missing oxygen reading can lead directly to a prepared sensor check. An unfinished wellbeing entry leads to today's questions. The sphere provides a memorable visual anchor, while detailed information stays available without crowding the main screen.

The prototype supports both desktop and mobile use. A guided walkthrough lets viewers explore a temporary demonstration without changing their saved daily records.

## Grounded in space-health resources

NASA Human Research Program resources informed the mission-health context and the inclusion of sleep, activity and wellbeing. NASA medical-standard material informed the vital-sign categories. NASA mission-operations resources helped frame the need for prepared crew assistance and communication-aware workflows.

[Sources and how they informed the project](docs/SOURCES.md) explain these connections. The displayed histories are simulated; they are not NASA astronaut patient records.

## Demonstration scope

The prototype uses synthetic measurements and manually entered demo self-reports. Scenario states are selected for demonstration. Prepared Help content has not received flight-medical approval, and an approved mission emergency checklist is not loaded. Reports are downloaded locally; no message is sent to crew or Earth.

Daily records stay in the current browser. Real sensors, validated medical evaluation and mission communications are future integration work. The prototype is not a medical device or a diagnostic system.

## Explore and learn more

On the website, choose **Demo tools → Start guided walkthrough** to explore the complete example: overview, history, signal loss, a prepared sensor check, simulated recovery and a wellbeing check-in.

- [Demonstration guide](docs/DEMO_GUIDE.md)
- [Voice check-ins: concept, current scope and roadmap](docs/VOICE_CHECKINS.md)
- [Scientific sources](docs/SOURCES.md)
- [AI use and human contributions](docs/AI_USAGE.md)

OpenAI Codex assisted the development of this project. Runtime Help uses prepared branches and does not generate medical advice through an AI API.
