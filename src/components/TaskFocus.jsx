import { useState } from "react";
import { contacts } from "../data/guide";

function Decision({ decision }) {
  const [answer, setAnswer] = useState(null);

  return (
    <section className="decision" aria-label={decision.question}>
      <strong>{decision.question}</strong>
      <div className="decision-buttons">
        <button
          type="button"
          className={answer === "no" ? "selected" : ""}
          aria-pressed={answer === "no"}
          onClick={() => setAnswer("no")}
        >
          No
        </button>
        <button
          type="button"
          className={answer === "yes" ? "selected" : ""}
          aria-pressed={answer === "yes"}
          onClick={() => setAnswer("yes")}
        >
          Yes
        </button>
      </div>
      {answer && (
        <div className="bubble" role="status">
          <b>{answer === "yes" ? decision.yesTitle : decision.noTitle}</b>
          <p>{answer === "yes" ? decision.yesText : decision.noText}</p>
        </div>
      )}
    </section>
  );
}

function Contacts({ ids = [] }) {
  const unique = [...new Set(ids)]
    .map((id) => [id, contacts[id]])
    .filter(([, contact]) => contact);

  if (!unique.length) return null;

  return (
    <section className="contacts">
      <small>If you need help</small>
      <div>
        {unique.map(([id, contact]) => (
          <details key={id}>
            <summary>{contact.name}</summary>
            <section>
              <b>{contact.role}</b>
              <p>{contact.text}</p>
            </section>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function TaskFocus({ task, index, total, done, onComplete, onBack, onNext }) {
  const taskPercent = Math.round(((index + 1) / total) * 100);

  return (
    <section className="task-card">
      <div className="task-progress" aria-hidden="true">
        <span style={{ width: `${taskPercent}%` }} />
      </div>

      <header>
        <span>Task {index + 1} of {total}</span>
        <em data-coworker-safe="task-category">{task.category}</em>
      </header>

      <div className="title-row">
        <div>
          <small>{task.short}</small>
          <h1>{task.title}</h1>
        </div>
        <b className={done ? "status done" : "status"}>{done ? "Done" : "Current"}</b>
      </div>

      <p className="purpose">{task.purpose}</p>

      <ol className="steps">
        {task.steps.map((step, stepIndex) => (
          <li key={`${task.id}-${stepIndex}`}>
            <b>{stepIndex + 1}</b>
            <p>{step}</p>
          </li>
        ))}
      </ol>

      {task.decision && <Decision decision={task.decision} />}

      {task.tip && (
        <aside>
          <small>Shift note</small>
          <p>{task.tip}</p>
        </aside>
      )}

      <Contacts ids={task.contacts} />

      <footer>
        <button type="button" disabled={index === 0} onClick={onBack}>Back</button>
        <button type="button" className={done ? "complete" : "primary"} onClick={onComplete}>
          {done ? "Completed ✓" : task.completeLabel}
        </button>
        <button type="button" disabled={index === total - 1} onClick={onNext}>Next</button>
      </footer>
    </section>
  );
}
