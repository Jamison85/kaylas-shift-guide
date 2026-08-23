import { useEffect, useMemo, useState } from "react";
import CharacterProp from "./components/CharacterProp";
import TaskFocus from "./components/TaskFocus";
import { closingLines, guideTasks, wisdomLines } from "./data/guide";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { usePwaInstall } from "./hooks/usePwaInstall";

const APP_NAME = "Before the Rush";
const PROFILE_KEY = "before-rush-profile";
const OPENING_KEY = "before-rush-opening-played";
const emptyProgress = { completed: [], currentIndex: 0, mode: "learn", answers: {} };

const dateKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const pick = (items, seed) =>
  items[[...seed].reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0) % items.length];

function legacyProgress(day) {
  try {
    const saved = window.localStorage.getItem(`kayla-guide-${day}`);
    return saved ? JSON.parse(saved) : emptyProgress;
  } catch {
    return emptyProgress;
  }
}

function openingAlreadyPlayed() {
  try { return window.sessionStorage.getItem(OPENING_KEY) === "yes"; }
  catch { return false; }
}

function markOpeningPlayed() {
  try { window.sessionStorage.setItem(OPENING_KEY, "yes"); } catch {}
}

function NameCard({ initialName = "", onSave, onCancel }) {
  const [draft, setDraft] = useState(initialName);
  const cleanName = draft.trim().replace(/\s+/g, " ");
  const isEditor = Boolean(onCancel);

  const submit = (event) => {
    event.preventDefault();
    if (!cleanName) return;
    onSave(cleanName);
  };

  return (
    <section className={`name-card ${isEditor ? "name-card--editor" : ""}`} onClick={(event) => event.stopPropagation()}>
      <div className="name-card__copy">
        <small>{APP_NAME} · Store 2593</small>
        <h1>{isEditor ? "Make it yours." : "Who’s opening today?"}</h1>
        <p>{isEditor ? "Change the name used in greetings and milestones." : "Your guide will remember you on this device and make the morning feel a little less generic."}</p>
        <form onSubmit={submit}>
          <label htmlFor={isEditor ? "profile-name-edit" : "profile-name"}>What should I call you?</label>
          <input
            id={isEditor ? "profile-name-edit" : "profile-name"}
            type="text"
            autoComplete="given-name"
            maxLength="24"
            placeholder="Your name"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoFocus
          />
          <div className="name-card__actions">
            <button type="submit" className="primary" disabled={!cleanName}>{isEditor ? "Save name" : "Make it mine"}</button>
            {isEditor && <button type="button" onClick={onCancel}>Cancel</button>}
          </div>
        </form>
        <em>Saved only on this device.</em>
      </div>
      <CharacterProp pose={isEditor ? "point" : "wave"} className="name-prop" />
    </section>
  );
}

function NavIcon({ name }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (name === "home") return <svg {...common}><path d="M3.5 10.7 12 3.5l8.5 7.2v9a1 1 0 0 1-1 1h-5.2v-6H9.7v6H4.5a1 1 0 0 1-1-1z" /></svg>;
  if (name === "guide") return <svg {...common}><rect x="4.5" y="3.5" width="15" height="17" rx="2.2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
  return <svg {...common}><path d="M20 11a8 8 0 1 1-2.3-5.7L20 7.6" /><path d="M20 3.5v4.1h-4.1" /></svg>;
}

function InstallIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v11" /><path d="m7.5 10 4.5 4.5 4.5-4.5" /><path d="M5 18.5h14" /></svg>;
}

export default function App() {
  const day = dateKey();
  const [profile, setProfile] = useLocalStorage(PROFILE_KEY, { name: "" });
  const displayName = typeof profile?.name === "string" ? profile.name.trim() : "";
  const [progress, setProgress] = useLocalStorage(`before-rush-${day}`, legacyProgress(day));
  const [screen, setScreen] = useState(() => displayName ? (openingAlreadyPlayed() ? "home" : "splash") : "setup");
  const [isLaunching, setIsLaunching] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [installMessage, setInstallMessage] = useState("");
  const { canInstall, install } = usePwaInstall();

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

  useEffect(() => { document.title = APP_NAME; }, []);

  useEffect(() => {
    if (screen !== "splash") return undefined;
    const timer = window.setTimeout(() => {
      markOpeningPlayed();
      setScreen("home");
    }, 3900);
    return () => window.clearTimeout(timer);
  }, [screen]);

  const saveName = (name) => {
    setProfile({ name });
    setShowProfile(false);
    if (screen === "setup") setScreen("splash");
  };

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
    }, 320);
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
    setProgress({ ...emptyProgress });
    setScreen("home");
  };

  const installApp = async () => {
    const outcome = await install();
    if (outcome !== "accepted") return;
    setInstallMessage("Before the Rush is being added to your phone.");
    window.setTimeout(() => setInstallMessage(""), 3200);
  };

  if (!displayName || screen === "setup") {
    return (
      <main className="name-gate scene-surface">
        <NameCard onSave={saveName} />
      </main>
    );
  }

  if (screen === "splash") {
    return (
      <main className="splash scene-surface">
        <section className="splash-sheet">
          <div className="splash-copy">
            <small>{APP_NAME} · Store 2593</small>
            <h1>Good morning, {displayName}.</h1>
            <p>{wisdom}</p>
            <button type="button" onClick={() => { markOpeningPlayed(); setScreen("home"); }}>Start shift <span>→</span></button>
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
          <span><b>{APP_NAME}</b><small>Opening guide · 2593</small></span>
        </button>
        <div className="mini__actions">
          {canInstall && (
            <button type="button" className="install-button" onClick={installApp} aria-label="Install Before the Rush on this phone">
              <InstallIcon /><span>Install</span>
            </button>
          )}
          <button type="button" className="profile-button" onClick={() => setShowProfile(true)} aria-label={`Change profile name, currently ${displayName}`}>
            <b>{displayName.charAt(0).toUpperCase()}</b><span>{displayName}</span>
          </button>
          <div className="mode-toggle" aria-label="Guide detail mode">
            <button type="button" className={mode === "learn" ? "active" : ""} onClick={() => setMode("learn")}>Learn</button>
            <button type="button" className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>Quick</button>
          </div>
        </div>
      </header>

      <main className="content">
        {screen === "home" && (
          <section className="home home--compact">
            <div className="home-head">
              <small>Good morning, {displayName}</small>
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
              <div className="home-card-scene">
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
                <CharacterProp pose="push" className="home-action home-action--anchor" />
              </div>
            </div>
          </section>
        )}

        {screen === "task" && (
          <TaskFocus task={task} index={index} total={guideTasks.length} done={completed.has(task.id)} mode={mode} decisionAnswer={decisionAnswer} canComplete={canComplete} onDecisionChange={(answer) => setDecision(task.id, answer)} onDoneNext={doneAndNext} onBack={goBack} />
        )}

        {screen === "complete" && (
          <section className="finish">
            <div className="finish__card">
              <div className="finish__copy"><small>Morning guide complete</small><h1>{displayName}, you survived the paperwork.</h1><p>{closing}</p><div className="finish__actions"><button type="button" className="primary" onClick={() => setScreen("home")}>Back home</button><button type="button" onClick={reset}>Reset today</button></div></div>
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

      {showProfile && (
        <div className="profile-overlay" role="dialog" aria-modal="true" aria-label="Change your name" onClick={() => setShowProfile(false)}>
          <NameCard initialName={displayName} onSave={saveName} onCancel={() => setShowProfile(false)} />
        </div>
      )}

      {installMessage && <div className="install-toast" role="status">{installMessage}</div>}
    </div>
  );
}
