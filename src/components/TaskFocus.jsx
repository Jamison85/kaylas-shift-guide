import { useState } from "react";
import CharacterProp from "./CharacterProp";
import { contacts } from "../data/guide";
import { useLocalStorage } from "../hooks/useLocalStorage";

const taskCharacterPoses = {
  "store-walk": "wave",
  "cashier-break": "hold",
  "yesterday-sources": "hold",
  "register-two": "wave",
  "gas-inspection": "hold",
  "price-server": "wave",
  "paperwork-packet": "hold",
  "lottery-audit-start": "wave",
  "lottery-variance": "celebrate",
  "safe-deposit": "hold",
  "tender-totals": "wave",
  "finalize-eod": "celebrate",
  "power-inventory": "celebrate",
};

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

const callableContactIds = new Set(["jamo", "loretta"]);
const phoneDigits = (value = "") => value.replace(/\D/g, "");
const phoneHref = (value = "") => `${value.trim().startsWith("+") ? "+" : ""}${phoneDigits(value)}`;

function Contacts({ ids = [] }) {
  const [phoneNumbers, setPhoneNumbers] = useLocalStorage("kayla-guide-contact-numbers", {});
  const [editingId, setEditingId] = useState(null);
  const [draftNumber, setDraftNumber] = useState("");
  const unique = [...new Set(ids)].map((id) => [id, contacts[id]]).filter(([, contact]) => contact);

  const startEditing = (id) => {
    setDraftNumber(phoneNumbers?.[id] || "");
    setEditingId(id);
  };

  const saveNumber = (event, id) => {
    event.preventDefault();
    if (phoneDigits(draftNumber).length < 7) return;
    setPhoneNumbers((current) => ({ ...(current || {}), [id]: draftNumber.trim() }));
    setEditingId(null);
  };

  const removeNumber = (id) => {
    setPhoneNumbers((current) => {
      const next = { ...(current || {}) };
      delete next[id];
      return next;
    });
    setEditingId(null);
    setDraftNumber("");
  };

  if (!unique.length) return null;
  return (
    <section className="contacts">
      <small>If you need help</small>
      <div>
        {unique.map(([id, contact]) => (
          <details key={id}>
            <summary>{contact.name}</summary>
            <section>
              <b>{contact.role}</b><p>{contact.text}</p>
              {callableContactIds.has(id) && (
                <div className="contact-phone">
                  {phoneNumbers?.[id] && editingId !== id && (
                    <>
                      <a className="contact-call" href={`tel:${phoneHref(phoneNumbers[id])}`} aria-label={`Call ${contact.name} at ${phoneNumbers[id]}`}>
                        <span>Call {contact.name}</span><small>{phoneNumbers[id]}</small>
                      </a>
                      <button type="button" className="contact-edit" onClick={() => startEditing(id)}>Change number</button>
                    </>
                  )}

                  {!phoneNumbers?.[id] && editingId !== id && (
                    <button type="button" className="contact-add" onClick={() => startEditing(id)}>Add {contact.name}&apos;s number</button>
                  )}

                  {editingId === id && (
                    <form onSubmit={(event) => saveNumber(event, id)}>
                      <label htmlFor={`contact-number-${id}`}>{phoneNumbers?.[id] ? `Change ${contact.name}’s number` : `Add ${contact.name}’s number`}</label>
                      <input id={`contact-number-${id}`} type="tel" inputMode="tel" autoComplete="tel" placeholder="(555) 555-0123" value={draftNumber} onChange={(event) => setDraftNumber(event.target.value)} autoFocus />
                      <div>
                        <button type="submit" disabled={phoneDigits(draftNumber).length < 7}>Save number</button>
                        <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                        {phoneNumbers?.[id] && <button type="button" className="contact-remove" onClick={() => removeNumber(id)}>Remove</button>}
                      </div>
                      <small>Saved only on this device. It is not added to the public app code.</small>
                    </form>
                  )}
                </div>
              )}
            </section>
          </details>
        ))}
      </div>
    </section>
  );
}

function normalizedStep(step, index) {
  const isDetailed = typeof step === "object" && step !== null;
  return { title: isDetailed ? step.title : `Step ${index + 1}`, detail: isDetailed ? step.detail : step, more: isDetailed ? step.more : null };
}

export default function TaskFocus({ task, index, total, done, mode, decisionAnswer, canComplete, onDecisionChange, onDoneNext, onBack }) {
  const taskPercent = Math.round(((index + 1) / total) * 100);
  const [zoom, setZoom] = useState(null);
  const steps = task.steps.map(normalizedStep);
  const characterPose = taskCharacterPoses[task.id] || null;
  const openZoom = (label, title, body) => setZoom({ label, title, body });

  return (
    <section className="task-card">
      <div className="task-progress" aria-hidden="true"><span style={{ width: `${taskPercent}%` }} /></div>
      <header><span>Screen {index + 1} of {total}</span><em>{task.category}</em></header>

      <div className="title-row">
        <div><small>{task.short}</small><h1>{task.title}</h1></div>
        <b className={done ? "status done" : "status"}>{done ? "Done" : "Current"}</b>
      </div>

      {mode === "learn" && <p className="purpose">{task.purpose}</p>}

      {task.location && mode === "learn" && (
        <section className="task-location">
          <small>Where you are</small><p>{task.location}</p>
        </section>
      )}

      <div className="steps-heading">
        <div><small>{mode === "learn" ? "Step by step" : "Quick steps"}</small><strong>Do these in order</strong></div>
        <span>{steps.length} steps</span>
      </div>

      <ol className={`steps ${mode === "learn" ? "steps--detailed" : "steps--quick"}`}>
        {steps.map((step, stepIndex) => (
          <li key={`${task.id}-${stepIndex}`}>
            <b>{stepIndex + 1}</b>
            <div>
              <strong>{step.title}</strong>
              {mode === "learn" && <p>{step.detail}</p>}
              {mode === "learn" && step.more && (
                <button type="button" className="step-more" onClick={() => openZoom(`Extra context · Step ${stepIndex + 1}`, step.title, step.more)}>
                  More context <span>↗</span>
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>

      {characterPose && (
        <div className={`task-cameo task-cameo--${characterPose}`}>
          <span aria-hidden="true" />
          <CharacterProp pose={characterPose} />
        </div>
      )}

      {task.decision && <Decision decision={task.decision} answer={decisionAnswer} onChange={onDecisionChange} />}

      {task.check && mode === "learn" && (
        <section className="move-on-check">
          <small>Before you move on</small><p>{task.check}</p>
        </section>
      )}

      {task.tip && mode === "learn" && <aside><small>Shift note</small><p>{task.tip}</p></aside>}
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
