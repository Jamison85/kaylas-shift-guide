import { useState } from "react";
import { contacts } from "../data/guide";

function Decision({ decision, answer, onChange }) {
  const steps = answer === "yes" ? decision.yesSteps : decision.noSteps;

  return (
    <section className="decision zoomable-panel" aria-label={decision.question}>
      <div className="decision-kicker">Decision point</div>
      <strong>{decision.question}</strong>
      <div className="decision-buttons">
        <button type="button" className={answer === "no" ? "selected" : ""} aria-pressed={answer === "no"} onClick={() => onChange("no")}>No</button>
        <button type="button" className={answer === "yes" ? "selected" : ""} aria-pressed={answer === "yes"} onClick={() => onChange("yes")}>Yes</button>
      </div>
      {answer && (
        <div className="bubble" role="status">
          <b>{answer === "yes" ? decision.yesTitle : decision.noTitle}</b>
          <p>{answer === "yes" ? decision.yesText : decision.noText}</p>
          {Array.isArray(steps) && steps.length > 0 && (
            <ol className="decision-steps">
              {steps.map((step, stepIndex) => (
                <li key={`${answer}-${stepIndex}`}><span>{stepIndex + 1}</span><p>{step}</p></li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

function Contacts({ ids = [] }) {
  const unique = [...new Set(ids)].map((id) => [id, contacts[id]]).filter(([, contact]) => contact);
  if (!unique.length) return null;
  return (
    <section className="contacts">
      <small>If you need help</small>
      <div>
        {unique.map(([id, contact]) => (
          <details key={id}>
            <summary>{contact.name}</summary>
            <section><b>{contact.role}</b><p>{contact.text}</p></section>
          </details>
        ))}
      </div>
    </section>
  );
}

function normalizedStep(step, index) {
  const isDetailed = typeof step === "object" && step !== null;
  return { title: isDetailed ? step.title : `Step ${index + 1}`, detail: isDetailed ? step.detail : step };
}

export default function TaskFocus({ task, index, total, done, mode, decisionAnswer, canComplete, onDecisionChange, onDoneNext, onBack }) {
  const taskPercent = Math.round(((index + 1) / total) * 100);
  const [zoom, setZoom] = useState(null);
  const steps = task.steps.map(normalizedStep);
  const openZoom = (label, title, body) => setZoom({ label, title, body });

  return (
    <section className="task-card">
      <div className="task-progress" aria-hidden="true"><span style={{ width: `${taskPercent}%` }} /></div>
      <header><span>Screen {index + 1} of {total}</span><em data-coworker-safe="task-category">{task.category}</em></header>

      <div className="title-row">
        <div><small>{task.short}</small><h1>{task.title}</h1></div>
        <b className={done ? "status done" : "status"}>{done ? "Done" : "Current"}</b>
      </div>

      {mode === "learn" && <p className="purpose">{task.purpose}</p>}

      {task.location && mode === "learn" && (
        <button type="button" className="task-location zoomable-panel" onClick={() => openZoom("Where you are", task.title, task.location)}>
          <small>Where you are</small><p>{task.location}</p><span>Tap to enlarge</span>
        </button>
      )}

      <div className="steps-heading">
        <div><small>{mode === "learn" ? "Step by step" : "Quick steps"}</small><strong>Do these in order</strong></div>
        <span>{steps.length} steps</span>
      </div>

      <ol className={`steps ${mode === "learn" ? "steps--detailed" : "steps--quick"}`}>
        {steps.map((step, stepIndex) => (
          <li key={`${task.id}-${stepIndex}`} className="zoomable-panel" onClick={() => mode === "learn" && openZoom(`Step ${stepIndex + 1}`, step.title, step.detail)}>
            <b>{stepIndex + 1}</b>
            <div><strong>{step.title}</strong>{mode === "learn" && <p>{step.detail}</p>}</div>
          </li>
        ))}
      </ol>

      {task.decision && <Decision decision={task.decision} answer={decisionAnswer} onChange={onDecisionChange} />}

      {task.check && mode === "learn" && (
        <button type="button" className="move-on-check zoomable-panel" onClick={() => openZoom("Before you move on", task.title, task.check)}>
          <small>Before you move on</small><p>{task.check}</p><span>Tap to enlarge</span>
        </button>
      )}

      {task.tip && mode === "learn" && <aside data-coworker-safe="shift-note"><small>Shift note</small><p>{task.tip}</p></aside>}
      <Contacts ids={task.contacts} />

      {task.decision && !canComplete && <p className="completion-gate">Answer the Yes / No question above before moving on.</p>}

      <footer className="guided-footer">
        <button type="button" disabled={index === 0} onClick={onBack}>Back</button>
        <button type="button" className={done ? "complete done-next" : "primary done-next"} disabled={!canComplete} onClick={onDoneNext}>
          {index === total - 1 ? "Finish morning" : done ? "Done · Next →" : "Done & Next →"}
        </button>
      </footer>

      {zoom && (
        <div className="panel-zoom" role="dialog" aria-modal="true" onClick={() => setZoom(null)}>
          <article onClick={(event) => event.stopPropagation()}>
            <small>{zoom.label}</small><h2>{zoom.title}</h2><p>{zoom.body}</p>
            <button type="button" onClick={() => setZoom(null)}>Got it</button>
          </article>
        </div>
      )}
    </section>
  );
}
