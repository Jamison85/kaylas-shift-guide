import { useEffect, useMemo, useState } from "react";
import { closingLines, guideTasks, wisdomLines } from "./data/guide";
import { useLocalStorage } from "./hooks/useLocalStorage";
import Coworker from "./components/Coworker";
import CoworkerWorld from "./components/CoworkerWorld";
import TaskFocus from "./components/TaskFocus";

const dateKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const pick = (items, seed) =>
  items[[...seed].reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0) % items.length];

const reactionMoods = ["ready", "thinking", "judge", "panic", "tired", "celebrate"];

export default function App() {
  const day = dateKey();
  const [progress, setProgress] = useLocalStorage(`kayla-guide-${day}`, {
    completed: [],
    currentIndex: 0,
  });

  const [screen, setScreen] = useState("splash");
  const [motion, setMotion] = useState(0);
  const [showReaction, setShowReaction] = useState(false);

  const wisdom = useMemo(() => pick(wisdomLines, day), [day]);
  const closing = useMemo(() => pick(closingLines, `${day}-close`), [day]);
  const completed = useMemo(() => new Set(progress.completed || []), [progress.completed]);
  const completedCount = completed.size;
  const index = Math.min(progress.currentIndex || 0, guideTasks.length - 1);
  const task = guideTasks[index];
  const percent = Math.round((completedCount / guideTasks.length) * 100);
  const reactionMood = reactionMoods[motion % reactionMoods.length];

  useEffect(() => {
    const timer = window.setTimeout(() => setScreen("home"), 3900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showReaction) return undefined;
    const timer = window.setTimeout(() => setShowReaction(false), 1250);
    return () => window.clearTimeout(timer);
  }, [showReaction, motion]);

  const react = () => {
    setMotion((value) => value + 1);
    setShowReaction(true);
  };

  const go = (nextIndex) => {
    const safeIndex = Math.max(0, Math.min(nextIndex, guideTasks.length - 1));
    setProgress((current) => ({ ...current, currentIndex: safeIndex }));
    react();
    setScreen("task");
  };

  const complete = () => {
    const wasDone = completed.has(task.id);
    const nextCompleted = wasDone
      ? progress.completed.filter((id) => id !== task.id)
      : [...(progress.completed || []), task.id];

    setProgress((current) => ({
      ...current,
      completed: nextCompleted,
      currentIndex: !wasDone && index < guideTasks.length - 1 ? index + 1 : index,
    }));

    react();
    if (!wasDone && completedCount + 1 === guideTasks.length) {
      window.setTimeout(() => setScreen("complete"), 420);
    }
  };

  const reset = () => {
    setProgress({ completed: [], currentIndex: 0 });
    setScreen("home");
    react();
  };

  if (screen === "splash") {
    return (
      <main className="splash">
        <div className="splash__orb splash__orb--one" />
        <div className="splash__orb splash__orb--two" />
        <div className="splash-copy">
          <small>SHIFT GUIDE · 2593</small>
          <h1>Good morning, Kayla.</h1>
          <p>{wisdom}</p>
          <button type="button" onClick={() => setScreen("home")}>Start shift</button>
        </div>
        <div className="splash-character">
          <Coworker variant="full" mood="ready" transitionKey={wisdom} />
        </div>
      </main>
    );
  }

  return (
    <div className="shell">
      <header className="mini">
        <button type="button" onClick={() => setScreen("home")} className="mini__brand">
          <i />
          <span>
            <b data-coworker-safe="brand">Kayla&apos;s Shift Guide</b>
            <small>Casey&apos;s 2593</small>
          </span>
        </button>
        <span className="mini-status">Morning · 2593</span>
      </header>

      <main className="content">
        {screen === "home" && (
          <section className="home">
            <div className="home-head">
              <div>
                <small data-coworker-safe="greeting">Good morning, Kayla</small>
                <h1>{percent}% done</h1>
                <p>{completedCount ? `${completedCount} tasks handled. Keep the machine moving.` : "Bookwork first. Chaos can wait in line."}</p>
              </div>
              <div className="progress-ring" style={{ "--p": `${percent * 3.6}deg` }} aria-label={`${percent}% complete`}>
                <span>{completedCount}</span>
                <small>of {guideTasks.length}</small>
              </div>
            </div>

            <button type="button" className="start" onClick={() => go(index)}>
              <div className="start-copy">
                <small data-coworker-safe="start-label">Start here</small>
                <strong>{completedCount ? "Continue the morning guide" : "Begin the morning guide"}</strong>
                <p>One task at a time. The store can manufacture its own chaos.</p>
                <span>{completedCount ? "Continue" : "Start"} <b>→</b></span>
              </div>
              <div className="start-character">
                <Coworker variant="bust" mood={completedCount ? "thinking" : "ready"} transitionKey={motion} />
              </div>
            </button>

            <div className="character-stage">
              <div className="character-stage__copy">
                <small data-coworker-safe="energy">Coworker status</small>
                <b>{completedCount ? "Still employed. Mildly impressed." : "Helpful. Slightly concerned. Already caffeinated."}</b>
                <p>He has been asked to help. What he does with that instruction is apparently between him and God.</p>
              </div>
              <div className="stage-character">
                <Coworker variant="lean" ambient transitionKey={motion} />
              </div>
            </div>
          </section>
        )}

        {screen === "task" && (
          <>
            <TaskFocus
              task={task}
              index={index}
              total={guideTasks.length}
              done={completed.has(task.id)}
              onComplete={complete}
              onBack={() => go(index - 1)}
              onNext={() => go(index + 1)}
            />
            {showReaction && (
              <div key={motion} className={`task-reaction task-reaction--${reactionMood}`}>
                <Coworker variant="reaction" mood={reactionMood} transitionKey={motion} />
              </div>
            )}
          </>
        )}

        {screen === "complete" && (
          <section className="finish">
            <div className="finish__card">
              <small>Morning guide complete</small>
              <h1>Kayla, you survived the paperwork.</h1>
              <p>{closing}</p>
              <div className="finish__actions">
                <button type="button" className="primary" onClick={() => setScreen("home")}>Back home</button>
                <button type="button" onClick={reset}>Reset today</button>
              </div>
            </div>
            <div className="finish-character">
              <Coworker variant="full" mood="celebrate" transitionKey={closing} />
            </div>
          </section>
        )}
      </main>

      <CoworkerWorld screen={screen} />

      {screen !== "complete" && (
        <nav className="bottom-nav" aria-label="Primary navigation">
          <button type="button" className={screen === "home" ? "active" : ""} onClick={() => setScreen("home")}>
            <span>⌂</span><small>Home</small>
          </button>
          <button type="button" className={screen === "task" ? "active" : ""} onClick={() => go(index)}>
            <span>✓</span><small>Guide</small>
          </button>
          <button type="button" onClick={reset}>
            <span>↻</span><small>Reset</small>
          </button>
        </nav>
      )}
    </div>
  );
}
