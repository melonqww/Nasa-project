/** Source-checked interaction prototype, NOT an approved flight medical procedure. */
export const GUIDANCE_VERSION = "2026-11-14.1";
export const GUIDANCE_SOURCES = {
  operations: { label: "NASA · Medical operations", url: "https://www.nasa.gov/reference/6-0-medical-operations/" },
  flightCPR: { label: "NASA · CPR in microgravity", url: "https://www.nasa.gov/image-article/astronaut-josh-cassada-practices-cpr-space-station/" },
  responsiveness: { label: "Red Cross · Responsiveness and breathing", url: "https://www.redcross.org/take-a-class/resources/learn-first-aid/unresponsive-and-breathing-person" },
  resuscitation: { label: "AHA · Adult basic life support", url: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support/" },
  chest: { label: "AHA / Red Cross · First aid", url: "https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines" },
  sensor: { label: "FDA · Pulse oximeter basics", url: "https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics" },
} as const;
export type GuidanceSource = keyof typeof GUIDANCE_SOURCES;
export interface GuidanceNode {
  body: string[];
  question?: string;
  choices?: { label: string; next: string }[];
  sources: GuidanceSource[];
  urgent?: boolean;
}
export const GUIDANCE_FLOW: Record<string, GuidanceNode> = {
  start: {
    body: ["I can walk you through a short onboard check. If someone has collapsed or has chest discomfort or breathing trouble, alert another crew member immediately."],
    question: "What happened?",
    choices: [
      { label: "Someone collapsed", next: "collapsed" },
      { label: "Chest discomfort or breathing trouble", next: "acute" },
      { label: "Missing or unreliable sensor reading", next: "sensor" },
      { label: "Routine check-in", next: "routine" },
    ], sources: ["operations", "responsiveness", "chest"],
  },
  collapsed: {
    urgent: true,
    body: ["Get crew medical help now and activate the onboard emergency response. Do not wait for this chat or a reply from Earth.", "If it is safe to approach, check for a response to your voice and a gentle shoulder tap. Keep the check brief."],
    question: "Does the person respond?",
    choices: [{ label: "Yes, they respond", next: "medical" }, { label: "No response", next: "breathing" }, { label: "I am not sure", next: "responseUnknown" }],
    sources: ["responsiveness", "operations"],
  },
  breathing: {
    urgent: true,
    body: ["Keep the crew emergency response active. Check for normal breathing as trained; occasional gasps are not normal breathing. Do not spend time looking for a wearable pulse reading."],
    question: "Are they breathing normally?",
    choices: [{ label: "Yes, breathing normally", next: "monitor" }, { label: "No / only gasping", next: "resuscitation" }, { label: "I cannot tell", next: "uncertain" }],
    sources: ["responsiveness", "resuscitation"],
  },
  responseUnknown: {
    urgent: true,
    body: ["Get the responding crew member to assess responsiveness and breathing now. Tell them that you could not establish a response.", "If the person is unresponsive and breathing is absent or abnormal, begin the trained mission resuscitation response immediately. Use the onboard emergency checklist."],
    sources: ["responsiveness", "resuscitation", "flightCPR"],
  },
  resuscitation: {
    urgent: true,
    body: ["An unresponsive adult with absent or abnormal breathing needs an immediate resuscitation response. Begin your trained mission CPR/AED procedure and get crew medical assistance now.", "Use the approved onboard checklist and equipment. No approved flight CPR checklist is loaded in this prototype; Earth-based positioning instructions cannot simply be applied in microgravity."],
    sources: ["resuscitation", "flightCPR"],
  },
  uncertain: {
    urgent: true,
    body: ["Treat this as an urgent crew medical assessment. Tell the responding crew member that the person is unresponsive and you cannot establish normal breathing.", "If breathing is absent or abnormal, begin the trained mission resuscitation response immediately. Do not wait for a sensor result or a ground reply. Use the approved onboard emergency checklist."],
    sources: ["resuscitation", "flightCPR"],
  },
  monitor: {
    urgent: true,
    body: ["An unresponsive person still needs urgent medical help even when breathing normally. Stay with them and keep checking breathing and responsiveness while the crew medical officer takes over.", "Follow your trained onboard airway and monitoring procedure. If breathing becomes abnormal or stops, move immediately to the mission resuscitation response."],
    choices: [{ label: "Breathing is now abnormal", next: "resuscitation" }],
    sources: ["responsiveness", "flightCPR"],
  },
  acute: {
    urgent: true,
    body: ["Stop nonessential activity and alert the crew medical officer now. Chest discomfort or breathing trouble needs prompt assessment. A reassuring wearable number does not rule out a serious problem.", "Keep checking responsiveness and breathing. This chat does not diagnose the cause or prescribe medication."],
    question: "Does the person respond to you?",
    choices: [{ label: "Yes, they respond", next: "medical" }, { label: "No response", next: "breathing" }, { label: "I am not sure", next: "responseUnknown" }],
    sources: ["chest", "sensor", "operations"],
  },
  medical: {
    urgent: true,
    body: ["Continue with the crew medical officer and the approved mission assessment procedure. Share what happened, when it started, symptoms and available measurements.", "Do not wait for a chart threshold or an Earth response to begin the onboard emergency response. Preparing a report here does not notify anyone."],
    sources: ["chest", "operations"],
  },
  sensor: {
    body: ["First check how the person feels. Symptoms matter alongside the number."],
    question: "Any chest discomfort, breathing trouble or collapse?",
    choices: [{ label: "Yes / not sure", next: "acute" }, { label: "No, only a sensor issue", next: "sensorFit" }],
    sources: ["sensor"],
  },
  sensorFit: {
    body: ["For a finger pulse oximeter, follow its instructions. Keep the hand warm and relaxed, hold still and wait for the displayed value to settle. Check the device fit and connection according to its manual.", "Record the repeated value and time. A successful repeat does not establish that someone is medically well."],
    question: "What happened after the check?",
    choices: [{ label: "Reading is available", next: "sensorAvailable" }, { label: "Still missing or concerning", next: "sensorUnresolved" }, { label: "Symptoms appeared", next: "acute" }],
    sources: ["sensor"],
  },
  sensorAvailable: {
    body: ["Keep the repeated result, its time and the symptoms you observed for medical review. Follow the medical team's measurement plan; persistent concern should be raised with them.", "This conversation does not reconnect a device or change the synthetic readings. Use Health to inspect the available demo history."],
    sources: ["sensor"],
  },
  sensorUnresolved: {
    body: ["Tell the crew medical officer that the reading remains unavailable or concerning. Use another approved measurement method if directed.", "Keep the signal marked as missing. A previous reading does not confirm the present condition. If symptoms appear, use the urgent assistance branch."],
    choices: [{ label: "Symptoms appeared", next: "acute" }],
    sources: ["sensor", "operations"],
  },
  routine: {
    body: ["Review the measurements requested by your crew medical team, note your sleep and how you feel, and record any symptoms. Keep the measurement time and method with the result."],
    question: "Is something concerning you?",
    choices: [{ label: "Chest or breathing symptoms", next: "acute" }, { label: "A missing reading", next: "sensor" }, { label: "No, just reviewing", next: "routineDone" }],
    sources: ["operations", "sensor"],
  },
  routineDone: {
    body: ["You can review the trends in Health or prepare a local report in Connection. This check-in does not certify fitness for duty or replace the mission's scheduled medical review."],
    sources: ["operations"],
  },
};
