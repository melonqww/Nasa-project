export const WALKTHROUGH = [
  { title: "A clear overview", body: "Review the sphere and the five summaries. This is a temporary synthetic session." },
  { title: "Inspect the measurements", body: "Open a sample on the graph. Minute and daily views answer different questions." },
  { title: "A signal goes missing", body: "The operator has injected an oxygen-sensor interruption. Notice the reason and the suggested action." },
  { title: "A prepared sensor check", body: "Choose your own quick replies in Help. No answers or measurements are confirmed automatically." },
  { title: "Simulate signal recovery", body: "The operator restores the synthetic signal. The chat did not repair or reconnect a device." },
  { title: "Record how you feel", body: "Try the three-question check-in. This walkthrough's answers are discarded when you finish." },
] as const;
export function GuidedWalkthrough({ step, onStep, onEnd }: { step: number; onStep: (step: number) => void; onEnd: () => void }) {
  const item = WALKTHROUGH[step]!;
  return <aside className="walkthrough" aria-label="Guided walkthrough">
    <div aria-live="polite"><span>Walkthrough · {step + 1}/{WALKTHROUGH.length}</span><h2>{item.title}</h2><p>{item.body}</p></div>
    <div className="walkthrough__buttons"><button type="button" disabled={step === 0} onClick={() => onStep(step - 1)}>Back</button><button type="button" onClick={() => step === WALKTHROUGH.length - 1 ? onEnd() : onStep(step + 1)}>{step === WALKTHROUGH.length - 1 ? "Finish" : "Next"}</button><button type="button" onClick={onEnd}>Exit</button></div>
  </aside>;
}
