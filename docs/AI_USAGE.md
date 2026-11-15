# AI use and human contributions

AI-assisted development was used in this project.

| Tool | Contribution |
| --- | --- |
| OpenAI Codex | Assisted with architecture and planning, React/TypeScript/CSS implementation, procedural sphere/shader work, synthetic demo logic, chart fixes, local persistence, guided walkthrough, documentation and software checks. |

The two human participants directed the concept, divided responsibilities, supplied design preferences and feedback, and selected the user flows. The code and text are AI-assisted; this disclosure does not describe them as wholly human-authored. Automated checks and source lookups are not medical approval, independent usability research or scientific validation.

## Runtime behaviour

- The application does not call Codex or another LLM at runtime.
- Help uses locally stored, prepared branching text; it does not generate new treatment instructions from a prompt.
- Fixture histories and live sample variations are synthetic software-generated data, not NASA patient data or a trained physiological prediction model.
- Confirmed notes are stored locally. Optional browser speech recognition may send audio to the browser provider and may require internet; a notice appears before dictation. This app does not store audio.
- The fluid sphere is rendered procedurally in WebGL with a CSS fallback.
- Both workspaces use an AI-generated Earth-orbit background at `apps/web/public/images/earth-orbit-wide.jpg`, created with OpenAI image generation through Codex. It is an illustration, not mission imagery. The supplied raster spacecraft was cut out using the same tool and saved as `spacecraft-cutout.png`; SVG hit zones provide module interaction. Module readings and positions come from a local deterministic simulator; no spacecraft is connected.

## Submission materials

The website visibly labels the background image as AI-generated in the lower-right corner in both workspaces.

The project submission page and presentation should disclose the Codex assistance described above. A screen recording of the actual application should be identified accurately as a recording.

This file records the development workflow observed in this repository's preparation. It does not certify regulatory compliance, medical safety or endorsement by a source organisation.
