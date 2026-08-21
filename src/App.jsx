import { useEffect, useMemo, useState } from "react";
import { closingLines, guideTasks, wisdomLines } from "./data/guide";
import { useLocalStorage } from "./hooks/useLocalStorage";
import CoworkerWorld from "./components/CoworkerWorld";
import TaskFocus from "./components/TaskFocus";

const dateKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const pick = (items, seed) =>
  items[[...seed].reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0) % items.length];

function openingAlreadyPlayed() {
  try { return window.sessionStorage.getItem("kayla-guide-opening-played") === "yes"; }
  catch { return false; }
}

export default function App() {
  const day = dateKey();
  const [progress, setProgress] = useLocalStorage(`kayla-guide-${day}`, { completed: [], currentIndex: 0, mode: "learn", answers: {} });
  const [screen, setScreen] = useState(() => (openingAlreadyPlayed() ? "home" : "splash"));

  const wisdom = useMemo(() => pick(wisdomLines, day), [day]);
  const closing = useMemo(() => pick(closingLines, `${day}-close`), [day]);
  const completed = useMemo(() => new Set(progress.completed || []), [progress.completed]);
  const completedCount = completed.size;
  const mode = progress.mode === "quick" ? "quick" : "learn";
  const answers = progress.answers || {};
  const firstIncomplete = guideTasks.findIndex((item) => !completed.has(item.id));
  const resumeIndex = firstIncomplete === -1 ? guideTasks.length - 1 : firstIncomplete;
  const index = Math.max(0, Math.min(progress.currentIndex ?? resumeIndex, guideTasks.length - 1));
  const task = guideTasks[index];
  const percent = Math.round((completedCount / guideTasks.length) * 100);
  const decisionAnswer = answers[task.id] || null;
  const canComplete = !task.decision || Boolean(decisionAnswer);

  useEffect(() => {
    if (screen !== "splash") return undefined;
    const timer = window.setTimeout(() => {
      try { window.sessionStorage.setItem("kayla-guide-opening-played", "yes"); } catch {}
      setScreen("home");
    }, 3900);
    return () => window.clearTimeout(timer);
  }, [screen]);

  const go = (nextIndex) => {
    const safeIndex = Math.max(0, Math.min(nextIndex, guideTasks.length - 1));
    setProgress((current) => ({ ...current, currentIndex: safeIndex }));
    setScreen("task");
  };
  const startOrResume = () => go(resumeIndex);
  const setMode = (nextMode) => setProgress((current) => ({ ...current, mode: nextMode }));
  const setDecision = (taskId, answer) => setProgress((current) => ({ ...current, answers: { ...(current.answers || {}), [taskId]: answer } }));

  const doneAndNext = () => {
    if (!canComplete) return;
    const nextCompleted = completed.has(task.id) ? [...(progress.completed || [])] : [...(progress.completed || []), task.id];
    const nextCount = new Set(nextCompleted).size;
    if (nextCount === guideTasks.length) {
      setProgress((current) => ({ ...current, completed: nextCompleted, currentIndex: index }));
      window.setTimeout(() => setScreen("complete"), 380);
      return;
    }
    const nextIndex = Math.min(index + 1, guideTasks.length - 1);
    setProgress((current) => ({ ...current, completed: nextCompleted, currentIndex: nextIndex }));
    setScreen("task");
  };

  const reset = () => {
    setProgress({ completed: [], currentIndex: 0, mode: "learn", answers: {} });
    setScreen("home");
  };

  if (screen === "splash") {
    return (
      <main className="splash">
        <div className="splash__orb splash__orb--one" /><div className="splash__orb splash__orb--two" />
        <div className="splash-copy">
          <small>SHIFT GUIDE · 2593</small><h1>Good morning, Kayla.</h1><p>{wisdom}</p>
          <button type="button" onClick={() => { try { window.sessionStorage.setItem("kayla-guide-opening-played", "yes"); } catch {} setScreen("home"); }}>Start shift</button>
        </div>
      </main>
    );
  }

  return (
    <div className="shell">
      <header className="mini">
        <button type="button" onClick={() => setScreen("home")} className="mini__brand"><i /><span><b>Kayla&apos;s Shift Guide</b><small>Casey&apos;s 2593</small></span></button>
        <div className="mode-toggle" aria-label="Guide detail mode">
          <button type="button" className={mode === "learn" ? "active" : ""} onClick={() => setMode("learn")}>Learn</button>
          <button type="button" className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>Quick</button>
        </div>
      </header>

      <main className="content">
        {screen === "home" && (
          <section className="home home--compact">
            <div className="home-head">
              <div><small>Good morning, Kayla</small><h1>{percent}% done</h1><p>{completedCount ? `${completedCount} of ${guideTasks.length} screens finished.` : "Start at the beginning. One thing at a time."}</p></div>
              <div className="progress-ring" style={{ "--p": `${percent * 3.6}deg` }} aria-label={`${percent}% complete`}><span>{completedCount}</span><small>of {guideTasks.length}</small></div>
            </div>

            <button type="button" className="start" onClick={startOrResume}>
              <div className="start-copy">
                <small>Start here</small>
                <strong>{completedCount ? "Continue where you left off" : "Begin the morning guide"}</strong>
                <p>{mode === "learn" ? "Learn mode shows the full directions and checks." : "Quick mode keeps the same order with shorter directions."}</p>
                <span>{completedCount ? "Continue" : "Start"} <b>→</b></span>
              </div>
            </button>
          </section>
        )}

        {screen === "task" && (
          <TaskFocus task={task} index={index} total={guideTasks.length} done={completed.has(task.id)} mode={mode} decisionAnswer={decisionAnswer} canComplete={canComplete} onDecisionChange={(answer) => setDecision(task.id, answer)} onDoneNext={doneAndNext} onBack={() => go(index - 1)} />
        )}

        {screen === "complete" && (
          <section className="finish">
            <div className="finish__card"><small>Morning guide complete</small><h1>Kayla, you survived the paperwork.</h1><p>{closing}</p><div className="finish__actions"><button type="button" className="primary" onClick={() => setScreen("home")}>Back home</button><button type="button" onClick={reset}>Reset today</button></div></div>
          </section>
        )}
      </main>

      <CoworkerWorld screen={screen} />

      {screen !== "complete" && (
        <nav className="bottom-nav" aria-label="Primary navigation">
          <button type="button" className={screen === "home" ? "active" : ""} onClick={() => setScreen("home")}><span>⌂</span><small>Home</small></button>
          <button type="button" className={screen === "task" ? "active" : ""} onClick={startOrResume}><span>✓</span><small>Guide</small></button>
          <button type="button" onClick={reset}><span>↻</span><small>Reset</small></button>
        </nav>
      )}
    </div>
  );
}
