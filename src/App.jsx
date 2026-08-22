import { useEffect, useMemo, useState } from "react";
import CharacterProp from "./components/CharacterProp";
import TaskFocus from "./components/TaskFocus";
import { closingLines, guideTasks, wisdomLines } from "./data/guide";
import { useLocalStorage } from "./hooks/useLocalStorage";

const dateKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const pick = (items, seed) =>
  items[[...seed].reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0) % items.length];

function NavIcon({ name }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (name === "home") return <svg {...common}><path d="M3.5 10.7 12 3.5l8.5 7.2v9a1 1 0 0 1-1 1h-5.2v-6H9.7v6H4.5a1 1 0 0 1-1-1z" /></svg>;
  if (name === "guide") return <svg {...common}><rect x="4.5" y="3.5" width="15" height="17" rx="2.2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
  return <svg {...common}><path d="M20 11a8 8 0 1 1-2.3-5.7L20 7.6" /><path d="M20 3.5v4.1h-4.1" /></svg>;
}

function openingAlreadyPlayed() {
  try { return window.sessionStorage.getItem("kayla-guide-opening-played") === "yes"; }
  catch { return false; }
}

export default function App() {
  const day = dateKey();
  const [progress, setProgress] = useLocalStorage(`kayla-guide-${day}`, { completed: [], currentIndex: 0, mode: "learn", answers: {} });
  const [screen, setScreen] = useState(() => (openingAlreadyPlayed() ? "home" : "splash"));
  const [isLaunching, setIsLaunching] = useState(false);

  const wisdom = useMemo(() => pick(wisdomLines, day), [day]);
  const closing = useMemo(() => pick(closingLines, `${day}-close`), [day]);
  const completed = useMemo(() => new Set(progress.completed || []), [progress.completed]);
  const completedCount = completed.size;
  const mode = progress.mode === "quick" ? "quick" : "learn";
  const answers = progress.answers || {};
  const skippedTaskIds = useMemo(() => {
    const skipped = new Set();
    guideTasks.forEach((item) => {
      const answer = answers[item.id];
      (item.decision?.[`${answer}Skip`] || []).forEach((id) => skipped.add(id));
    });
    return skipped;
  }, [answers]);
  const firstIncomplete = guideTasks.findIndex((item) => !completed.has(item.id));
  const resumeIndex = firstIncomplete === -1 ? guideTasks.length - 1 : firstIncomplete;
  const index = Math.max(0, Math.min(progress.currentIndex ?? resumeIndex, guideTasks.length - 1));
  const task = guideTasks[index];
  const nextTask = guideTasks[resumeIndex];
  const percent = Math.round((completedCount / guideTasks.length) * 100);
  const decisionAnswer = answers[task.id] || null;
  const canComplete = !task.decision || Boolean(decisionAnswer);

  useEffect(() => {
    if (screen !== "splash") return undefined;
    const timer = window.setTimeout(() => {
      try { window.sessionStorage.setItem("kayla-guide-opening-played", "yes"); } catch {}
      setScreen("home");
    }, 4300);
    return () => window.clearTimeout(timer);
  }, [screen]);

  const go = (nextIndex) => {
    const safeIndex = Math.max(0, Math.min(nextIndex, guideTasks.length - 1));
    setProgress((current) => ({ ...current, currentIndex: safeIndex }));
    setScreen("task");
  };
  const startOrResume = () => go(resumeIndex);
  const startFromHome = () => {
    if (isLaunching) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      startOrResume();
      return;
    }
    setIsLaunching(true);
    window.setTimeout(() => {
      setIsLaunching(false);
      startOrResume();
    }, 420);
  };
  const setMode = (nextMode) => setProgress((current) => ({ ...current, mode: nextMode }));
  const setDecision = (taskId, answer) => setProgress((current) => {
    const taskDefinition = guideTasks.find((item) => item.id === taskId);
    const possibleSkips = new Set([
      ...(taskDefinition?.decision?.yesSkip || []),
      ...(taskDefinition?.decision?.noSkip || []),
    ]);
    const taskWasDone = (current.completed || []).includes(taskId);
    const answerSkips = taskWasDone ? (taskDefinition?.decision?.[`${answer}Skip`] || []) : [];
    const nextCompleted = (current.completed || []).filter((id) => !possibleSkips.has(id));
    answerSkips.forEach((id) => nextCompleted.push(id));
    return {
      ...current,
      completed: [...new Set(nextCompleted)],
      answers: { ...(current.answers || {}), [taskId]: answer },
    };
  });

  const doneAndNext = () => {
    if (!canComplete) return;
    const answerSkips = task.decision?.[`${decisionAnswer}Skip`] || [];
    const nextCompleted = completed.has(task.id) ? [...(progress.completed || [])] : [...(progress.completed || []), task.id];
    answerSkips.forEach((id) => nextCompleted.push(id));
    const nextCount = new Set(nextCompleted).size;
    if (nextCount === guideTasks.length) {
      setProgress((current) => ({ ...current, completed: nextCompleted, currentIndex: index }));
      window.setTimeout(() => setScreen("complete"), 380);
      return;
    }
    let nextIndex = Math.min(index + 1, guideTasks.length - 1);
    while (nextIndex < guideTasks.length - 1 && answerSkips.includes(guideTasks[nextIndex].id)) nextIndex += 1;
    setProgress((current) => ({ ...current, completed: [...new Set(nextCompleted)], currentIndex: nextIndex }));
    setScreen("task");
  };

  const goBack = () => {
    let previousIndex = Math.max(0, index - 1);
    while (previousIndex > 0 && skippedTaskIds.has(guideTasks[previousIndex].id)) previousIndex -= 1;
    go(previousIndex);
  };

  const reset = () => {
    setProgress({ completed: [], currentIndex: 0, mode: "learn", answers: {} });
    setScreen("home");
  };

  if (screen === "splash") {
    return (
      <main className="splash scene-surface">
        <section className="splash-sheet">
          <div className="splash-copy">
            <small>KAYLA&apos;S SHIFT GUIDE · 2593</small>
            <h1>Good morning, Kayla.</h1>
            <p>{wisdom}</p>
            <button type="button" onClick={() => { try { window.sessionStorage.setItem("kayla-guide-opening-played", "yes"); } catch {} setScreen("home"); }}>Start shift <span>→</span></button>
          </div>
          <CharacterProp pose="wave" className="splash-prop" />
        </section>
      </main>
    );
  }

  return (
    <div className={`shell shell--${screen}`}>
      <header className="mini">
        <button type="button" onClick={() => setScreen("home")} className="mini__brand">
          <i />
          <span><b>Kayla&apos;s Shift Guide</b><small>2593</small></span>
        </button>
        <div className="mode-toggle" aria-label="Guide detail mode">
          <button type="button" className={mode === "learn" ? "active" : ""} onClick={() => setMode("learn")}>Learn</button>
          <button type="button" className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>Quick</button>
        </div>
      </header>

      <main className="content">
        {screen === "home" && (
          <section className="home home--compact">
            <div className="home-head">
              <small>Good morning, Kayla</small>
              <h1>{completedCount ? "Keep it moving." : "Ready for the first move?"}</h1>
              <div className="home-head__meta">
                <p>{completedCount ? `${completedCount} screens finished. Pick up where you left off.` : "One important thing at a time."}</p>
                <div className="progress-status" aria-label={`${percent}% complete`}>
                  <span>{completedCount}<small>/{guideTasks.length}</small></span>
                  <em>{percent}% done</em>
                </div>
              </div>
            </div>

            <div className={`home-stage ${isLaunching ? "is-launching" : ""}`}>
              <CharacterProp pose="carry" className="home-action home-action--carry" />
              <button type="button" className="start" onClick={startFromHome}>
                <div className="start-sheet">
                  <div className="start-copy">
                    <div className="start-kicker"><small>{completedCount ? "Continue" : "First move"}</small><span>Screen {resumeIndex + 1} of {guideTasks.length}</span></div>
                    <strong>{nextTask.title}</strong>
                    <p>{nextTask.short}</p>
                    <div className="start-meta"><span>{nextTask.category}</span><b>Open task <i>→</i></b></div>
                  </div>
                  <div className="start-progress" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
                </div>
              </button>
              <CharacterProp pose="push" className="home-action home-action--push" />
              <CharacterProp pose="point" className="home-action home-action--point" />
            </div>

            <div className="coach-bubble"><span>Shift note</span><p>{wisdom}</p></div>
          </section>
        )}

        {screen === "task" && (
          <TaskFocus task={task} index={index} total={guideTasks.length} done={completed.has(task.id)} mode={mode} decisionAnswer={decisionAnswer} canComplete={canComplete} onDecisionChange={(answer) => setDecision(task.id, answer)} onDoneNext={doneAndNext} onBack={goBack} />
        )}

        {screen === "complete" && (
          <section className="finish">
            <div className="finish__card">
              <div className="finish__copy"><small>Morning guide complete</small><h1>Kayla, you survived the paperwork.</h1><p>{closing}</p><div className="finish__actions"><button type="button" className="primary" onClick={() => setScreen("home")}>Back home</button><button type="button" onClick={reset}>Reset today</button></div></div>
              <CharacterProp pose="celebrate" className="finish-prop" />
            </div>
          </section>
        )}
      </main>

      {screen !== "complete" && (
        <nav className="bottom-nav" aria-label="Primary navigation">
          <button type="button" className={screen === "home" ? "active" : ""} onClick={() => setScreen("home")}><NavIcon name="home" /><small>Home</small></button>
          <button type="button" className={screen === "task" ? "active" : ""} onClick={startOrResume}><NavIcon name="guide" /><small>Guide</small></button>
          <button type="button" onClick={reset}><NavIcon name="reset" /><small>Reset</small></button>
        </nav>
      )}
    </div>
  );
}
