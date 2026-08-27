import { useEffect, useState } from "react";
import CharacterProp from "./CharacterProp";
import { contacts } from "../data/guide";
import { useLocalStorage } from "../hooks/useLocalStorage";

const taskCharacterActions = {
  "store-walk": "walk",
  "register-two": "register",
  "cashier-break": "register",
  "yesterday-sources": "paperwork",
  "lottery-refill": "lottery",
  "health-dept": "computer",
  "gas-inspection": "computer",
  "receipt-sort": "paperwork",
  "price-server": "computer",
  "eod-status": "computer",
  "paperwork-packet": "paperwork",
  "paperwork-details": "paperwork",
  "lottery-audit-start": "lottery",
  "lottery-books": "lottery",
  "lottery-received-returns": "lottery",
  "lottery-variance": "lottery",
  "safe-deposit": "reconcile",
  "drawer-mismatch": "reconcile",
  "tender-totals": "reconcile",
  "finalize-eod": "computer",
  "power-inventory": "inventory",
};

function Decision({ decision, answer, onChange }) {
  const steps = answer === "yes" ? decision.yesSteps : decision.noSteps;

  return (
    <section className="decision" aria-label={decision.question}>
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

function legacyPhoneNumbers() {
  try {
    const saved = window.localStorage.getItem("kayla-guide-contact-numbers");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function Contacts({ ids = [] }) {
  const [phoneNumbers, setPhoneNumbers] = useLocalStorage("before-rush-contact-numbers", legacyPhoneNumbers());
  const [editingId, setEditingId] = useState(null);
  const [draftNumber, setDraftNumber] = useState("");
  const pairedIds = [...new Set(ids)];
  const jamoIndex = pairedIds.indexOf("jamo");
  if (jamoIndex !== -1 && !pairedIds.includes("loretta")) pairedIds.splice(jamoIndex + 1, 0, "loretta");
  const unique = pairedIds.map((id) => [id, contacts[id]]).filter(([, contact]) => contact);

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
  const [expandedStep, setExpandedStep] = useState(mode === "learn" ? 0 : null);
  const [explanation, setExplanation] = useState(null);
  const steps = task.steps.map(normalizedStep);
  const characterAction = taskCharacterActions[task.id] || null;
  const displayTitle = task.title.replace(/^Start with (?:the )?/i, "");
  const thingsLabel = `${steps.length} ${steps.length === 1 ? "thing" : "things"} to check`;
  const whyLabel = index === 0 ? "Ask Till why this comes first" : "Ask Till why this matters";
  const completeLabel = displayTitle.length <= 22 ? `Complete ${displayTitle} →` : "Complete this task →";

  useEffect(() => {
    setExpandedStep(mode === "learn" ? 0 : null);
    setExplanation(null);
  }, [task.id, mode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [task.id]);

  useEffect(() => {
    if (!explanation) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setExplanation(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [explanation]);

  const openExplanation = (label, title, body) => setExplanation({ label, title, body });

  return (
    <section className="task-focus">
      <article className="task-card">
        <div className="task-progress" aria-hidden="true"><span style={{ width: `${taskPercent}%` }} /></div>
        <header>
          <span>Task {index + 1} of {total}</span>
          {done && <span className="task-state task-state--done">✓ Completed</span>}
        </header>

        <section className={`task-intro ${mode === "learn" && characterAction ? "task-intro--with-till" : ""}`}>
          <div className="task-intro__copy">
            <p className="task-intro__summary">{task.short}</p>
            <h1>{displayTitle}</h1>
            {task.location && mode === "learn" && (
              <div className="task-location-line">
                <span>Location</span>
                <p>{task.location}</p>
              </div>
            )}
            {mode === "learn" && (
              <button
                type="button"
                className="task-why-link"
                onClick={() => openExplanation(index === 0 ? "Till explains why this comes first" : "Till explains why this matters", displayTitle, task.purpose)}
              >
                {whyLabel}<span aria-hidden="true">→</span>
              </button>
            )}
          </div>
          {mode === "learn" && characterAction && (
            <CharacterProp key={`${task.id}-intro`} pose={characterAction} moment="working" className="task-intro__till" />
          )}
        </section>

        <div className="steps-heading">
          <div><small>{mode === "learn" ? "Step by step" : "Quick list"}</small><strong>Do these in order</strong></div>
          <span>{thingsLabel}</span>
        </div>

        <ol className={`steps ${mode === "learn" ? "steps--detailed" : "steps--quick"}`}>
          {steps.map((step, stepIndex) => {
            const isExpanded = mode === "learn" && expandedStep === stepIndex;
            const detailsId = `step-${task.id}-${stepIndex}`;
            return (
              <li key={`${task.id}-${stepIndex}`} className={isExpanded ? "is-expanded" : ""}>
                {mode === "learn" ? (
                  <>
                    <button
                      type="button"
                      className="step-toggle"
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                      onClick={() => setExpandedStep(isExpanded ? null : stepIndex)}
                    >
                      <b>{stepIndex + 1}</b>
                      <span><strong>{step.title}</strong><small>{isExpanded ? "Hide detail" : "Show detail"}</small></span>
                      <i aria-hidden="true">{isExpanded ? "−" : "+"}</i>
                    </button>
                    {isExpanded && (
                      <div className="step-detail" id={detailsId}>
                        <p>{step.detail}</p>
                        {step.more && (
                          <button type="button" className="step-more" onClick={() => openExplanation(`Step ${stepIndex + 1} · Why this matters`, step.title, step.more)}>
                            Ask why <span>→</span>
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="quick-step-row"><b>{stepIndex + 1}</b><strong>{step.title}</strong></div>
                )}
              </li>
            );
          })}
        </ol>

        {task.decision && <Decision decision={task.decision} answer={decisionAnswer} onChange={onDecisionChange} />}

        {task.check && mode === "learn" && (
          <section className="move-on-check">
            <small>Before you move on</small><p>{task.check}</p>
          </section>
        )}

        {task.tip && mode === "learn" && <aside><small>Shift note</small><p>{task.tip}</p></aside>}
        <Contacts ids={task.contacts} />

        {task.decision && !canComplete && <p className="completion-gate">Answer the Yes / No question above before moving on.</p>}
      </article>

      <footer className={`guided-footer ${index === 0 ? "guided-footer--single" : ""}`}>
        {index > 0 && <button type="button" className="guided-back" onClick={onBack}>← Back</button>}
        <button type="button" className={done ? "complete done-next" : "primary done-next"} disabled={!canComplete} onClick={onDoneNext}>
          {index === total - 1 ? "Finish morning" : done ? "Next task →" : completeLabel}
        </button>
      </footer>

      {explanation && (
        <div className="panel-zoom" role="dialog" aria-modal="true" aria-label={explanation.label} onClick={() => setExplanation(null)}>
          <article className="explanation-card" onClick={(event) => event.stopPropagation()}>
            <div className="explanation-head">
              <div><small>{explanation.label}</small><h2>{explanation.title}</h2></div>
              <CharacterProp key={`${task.id}-why`} pose={characterAction || "point"} moment="explaining" />
            </div>
            <p>{explanation.body}</p>
            <button type="button" onClick={() => setExplanation(null)} autoFocus>Got it, Till</button>
          </article>
        </div>
      )}
    </section>
  );
}
