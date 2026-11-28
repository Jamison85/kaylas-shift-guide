import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "./components/Modal";
import HomeAtrium from "./components/HomeAtrium";
import TillStage from "./components/TillStage";
import TaskFocus from "./components/TaskFocus";
import { closingLines, guideTasks, wisdomLines } from "./data/guide";
import { useLocalStorage, useStorageWarning } from "./hooks/useLocalStorage";
import { usePwaInstall } from "./hooks/usePwaInstall";
import { createTillSession, getTillPreference } from "./till/director";
import { createTillResident } from "./till/resident";
import { tubeNotes } from "./till/scenery";

const APP_NAME = "Before the Rush";
const PROFILE_KEY = "before-rush-profile";
const INSTALL_GATE_KEY = "before-rush-install-gate-skipped";
const TUBE_NOTE_KEY = "before-rush-tube-note-index";
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

const emptyProfile = { name: "" };
const taskIds = new Set(guideTasks.map((item) => item.id));
const normalizeTubeNoteIndex = (value) => Number.isSafeInteger(value) && value >= 0 ? value % tubeNotes.length : 0;

function normalizeProgress(value) {
  const completed = Array.isArray(value?.completed) ? value.completed.filter((id) => taskIds.has(id)) : [];
  const answers = Object.fromEntries(Object.entries(value?.answers || {}).filter(
    ([id, answer]) => taskIds.has(id) && (answer === "yes" || answer === "no")
  ));
  return {
    ...value,
    completed: [...new Set(completed)],
    answers,
    mode: value?.mode === "quick" ? "quick" : "learn",
    currentIndex: Number.isInteger(value?.currentIndex) ? value.currentIndex : undefined,
  };
}

function installGateAlreadySkipped() {
  try { return window.sessionStorage.getItem(INSTALL_GATE_KEY) === "yes"; }
  catch { return false; }
}

function markInstallGateSkipped() {
  try { window.sessionStorage.setItem(INSTALL_GATE_KEY, "yes"); } catch {}
}

function isMobileInstallTarget() {
  const userAgent = window.navigator.userAgent;
  return /Android|iPad|iPhone|iPod/i.test(userAgent)
    || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

function NameCard({ initialName = "", onSave, onCancel, onReset, till, onTillPreferenceChange }) {
  const [draft, setDraft] = useState(initialName);
  const cleanName = draft.trim().replace(/\s+/g, " ");
  const isEditor = Boolean(onCancel);

  const submit = (event) => {
    event.preventDefault();
    if (!cleanName) return;
    onSave(cleanName);
  };

  return (
    <section className={`name-card ${isEditor ? "name-card--editor" : ""} ${till.preference === "off" ? "no-till" : ""}`} onClick={(event) => event.stopPropagation()}>
      <div className="name-card__copy">
        <small>{isEditor ? "Profile & settings" : `${APP_NAME} · Store 2593`}</small>
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
        {isEditor && (
          <div className="till-settings">
            <label htmlFor="till-preference">Till’s movement</label>
            <select id="till-preference" value={till.preference}
              onChange={(event) => onTillPreferenceChange(event.target.value)}>
              <option value="full">On</option>
              <option value="quiet">Only for help and milestones</option>
              <option value="off">Off</option>
            </select>
          </div>
        )}
        {isEditor && onReset && <button type="button" className="name-card__reset" onClick={onReset}>Reset today’s progress</button>}
        <em>Saved only on this device.</em>
      </div>
      <TillStage {...till} anchor="onboarding" paused={isEditor} />
    </section>
  );
}

function InstallIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v11" /><path d="m7.5 10 4.5 4.5 4.5-4.5" /><path d="M5 18.5h14" /></svg>;
}

function InstallCard({ canInstall, install, onContinue, till }) {
  const [phase, setPhase] = useState("intro");
  const headingRef = useRef(null);
  const isAppleMobile = /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

  useEffect(() => {
    if (phase !== "intro") headingRef.current?.focus();
  }, [phase]);

  const beginInstall = async () => {
    if (!canInstall) {
      setPhase("help");
      return;
    }
    const outcome = await install();
    setPhase(outcome === "accepted" ? "installed" : "help");
  };

  const heading = phase === "installed"
    ? "That did it."
    : phase === "help"
      ? "Two taps. No tiny browser bars."
      : "Give Till the whole screen.";

  return (
    <section className={`install-card install-card--${phase}`}>
      <div className="install-card__copy">
        <small>{APP_NAME} · One quick setup</small>
        <div className="install-card__badge"><InstallIcon /><span>Home screen</span></div>
        <h1 ref={headingRef} tabIndex={phase === "intro" ? undefined : -1}>{heading}</h1>
        {phase === "intro" && (
          <p>Add this guide to your Home screen before we start. It opens like an app, so Till and the office are not squeezed under browser buttons.</p>
        )}
        {phase === "help" && (
          <>
            <p>Your phone wants the scenic route. Here is the short version.</p>
            <ol className="install-card__steps">
              {isAppleMobile ? (
                <>
                  <li><b>Tap Share</b><span>The square with the arrow in your browser.</span></li>
                  <li><b>Add to Home Screen</b><span>Tap Add, then open the new Before Rush icon.</span></li>
                </>
              ) : (
                <>
                  <li><b>Open the browser menu</b><span>Use the three dots in the corner.</span></li>
                  <li><b>Install app</b><span>Or choose Add to Home screen, then open the new icon.</span></li>
                </>
              )}
            </ol>
          </>
        )}
        {phase === "installed" && (
          <>
            <p>Close this browser tab, then open <b>Before Rush</b> from the new icon on your Home screen. That is the full-screen version.</p>
            <div className="install-card__success" role="status"><span aria-hidden="true">✓</span> Ready from the new icon</div>
          </>
        )}
        <div className="install-card__actions">
          {(phase === "intro" || (phase === "help" && canInstall)) && (
            <button type="button" className="primary" onClick={beginInstall}>
              <InstallIcon />{canInstall ? "Add to Home screen" : "Show me how"}
            </button>
          )}
          <button type="button" className="quiet" onClick={onContinue}>Continue in browser</button>
        </div>
        <em>Set it up once. Then the guide opens like a real app.</em>
      </div>
      <TillStage {...till} anchor="onboarding" cue={phase === "installed" ? { kind: "finish", key: "installed" } : null} />
    </section>
  );
}

export default function App() {
  const [day, setDay] = useState(dateKey);
  const storageWarning = useStorageWarning();
  useEffect(() => {
    let timer;
    const checkDay = () => {
      clearTimeout(timer);
      setDay(dateKey());
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      timer = setTimeout(checkDay, midnight - now);
    };
    checkDay();
    window.addEventListener("pageshow", checkDay);
    document.addEventListener("visibilitychange", checkDay);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pageshow", checkDay);
      document.removeEventListener("visibilitychange", checkDay);
    };
  }, []);
  return (
    <>
      {storageWarning && <div className="storage-warning" role="alert">This browser couldn’t save your changes. Keep this tab open to keep using them.</div>}
      <DailyGuide key={day} day={day} />
    </>
  );
}

function DailyGuide({ day }) {
  const [profile, setProfile] = useLocalStorage(PROFILE_KEY, emptyProfile);
  const displayName = typeof profile?.name === "string" ? profile.name.trim() : "";
  const fallback = useMemo(() => legacyProgress(day), [day]);
  const [progress, setProgress] = useLocalStorage(`before-rush-${day}`, fallback, normalizeProgress);
  const [requestedScreen, setScreen] = useState("home");
  const [showProfile, setShowProfile] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [installGateSkipped, setInstallGateSkipped] = useState(() => installGateAlreadySkipped());
  const [installMessage, setInstallMessage] = useState("");
  const [tillSession] = useState(createTillSession);
  const [tillResident] = useState(createTillResident);
  const [tillEvent, setTillEvent] = useState(null);
  const [homeTalking, setHomeTalking] = useState(false);
  const [homeNote, setHomeNote] = useState(null);
  const [nextTubeNote, setNextTubeNote] = useLocalStorage(TUBE_NOTE_KEY, 0, normalizeTubeNoteIndex);
  const tillEventNumber = useRef(0);
  const profileTriggerRef = useRef(null);
  const resetTriggerRef = useRef(null);
  const { canInstall, isStandalone, install } = usePwaInstall();

  const wisdom = useMemo(() => pick(wisdomLines, `${day}-open`), [day]);
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
  const allDone = firstIncomplete === -1;
  const screen = requestedScreen === "complete" && !allDone ? "home" : requestedScreen;
  const resumeIndex = allDone ? guideTasks.length - 1 : firstIncomplete;
  const index = Math.max(0, Math.min(progress.currentIndex ?? resumeIndex, guideTasks.length - 1));
  const task = guideTasks[index];
  const nextTask = guideTasks[resumeIndex];
  const percent = Math.round((completedCount / guideTasks.length) * 100);
  const decisionAnswer = answers[task.id] || null;
  const canComplete = !task.decision || Boolean(decisionAnswer);
  const till = { resident: tillResident, session: tillSession, preference: getTillPreference(profile.tillPreference) };
  const showTill = till.preference !== "off";
  const behindDialog = showProfile || showResetConfirm;

  useEffect(() => () => tillResident.dispose(), [tillResident]);

  const saveName = (name) => {
    setProfile((current) => ({ ...current, name }));
    setShowProfile(false);
  };

  const go = (nextIndex) => {
    const safeIndex = Math.max(0, Math.min(nextIndex, guideTasks.length - 1));
    setProgress((current) => ({ ...current, currentIndex: safeIndex }));
    setTillEvent(null);
    setScreen("task");
  };
  const reactWithTill = (kind, taskId) => {
    tillEventNumber.current += 1;
    setTillEvent({ kind, taskId, key: `shift-${tillEventNumber.current}` });
  };
  const startOrResume = () => go(resumeIndex);
  const goHome = () => {
    if (screen !== "home") {
      setHomeTalking(false);
      setHomeNote(null);
    }
    setScreen("home");
  };
  const talkAtHome = useCallback(() => {
    setHomeNote(null);
    setHomeTalking(talking => !talking);
  }, []);
  const receiveTubeNote = useCallback(() => {
    setHomeTalking(false);
    setHomeNote(tubeNotes[nextTubeNote]);
    setNextTubeNote(nextTubeNote + 1);
  }, [nextTubeNote, setNextTubeNote]);
  const setMode = (nextMode) => setProgress((current) => ({ ...current, mode: nextMode }));
  const setDecision = (taskId, answer) => setProgress((current) => {
    if (current.answers[taskId] === answer) return current;
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
    const nextCompleted = new Set([...completed, task.id, ...answerSkips]);
    let nextIndex = Math.min(index + 1, guideTasks.length - 1);
    while (nextIndex < guideTasks.length - 1 && answerSkips.includes(guideTasks[nextIndex].id)) nextIndex += 1;
    const finished = nextCompleted.size === guideTasks.length;
    setProgress((current) => ({
      ...current,
      completed: [...new Set([...current.completed, task.id, ...answerSkips])],
      currentIndex: finished ? index : nextIndex,
    }));
    if (finished) reactWithTill("finish", task.id);
    else if (Math.floor(nextCompleted.size / 5) > Math.floor(completed.size / 5)) {
      reactWithTill("milestone", guideTasks[nextIndex].id);
    } else setTillEvent(null);
    setScreen(finished ? "complete" : "task");
  };

  const chooseDecision = (answer) => {
    setDecision(task.id, answer);
    const needsAttention = answer === "no" && ["safe-deposit", "lottery-variance"].includes(task.id);
    if (needsAttention && decisionAnswer !== answer && till.preference === "full") reactWithTill("concern", task.id);
    else if (decisionAnswer !== answer) setTillEvent(null);
  };

  const goBack = () => {
    let previousIndex = Math.max(0, index - 1);
    while (previousIndex > 0 && skippedTaskIds.has(guideTasks[previousIndex].id)) previousIndex -= 1;
    go(previousIndex);
  };

  const reset = () => {
    setProgress((current) => ({ ...current, ...emptyProgress, mode: current.mode }));
    setShowResetConfirm(false);
    setScreen("home");
  };

  const requestReset = (event) => {
    resetTriggerRef.current = showProfile ? profileTriggerRef.current : event.currentTarget;
    setShowResetConfirm(true);
  };

  const installApp = async () => {
    const outcome = await install();
    if (outcome !== "accepted") return;
    setInstallMessage("Before the Rush is being added to your phone.");
    window.setTimeout(() => setInstallMessage(""), 3200);
  };

  const continueInBrowser = () => {
    markInstallGateSkipped();
    setInstallGateSkipped(true);
  };

  if (!displayName && isMobileInstallTarget() && !isStandalone && !installGateSkipped) {
    return (
      <main className="name-gate scene-surface">
        <InstallCard canInstall={canInstall} install={install} onContinue={continueInBrowser} till={till} />
      </main>
    );
  }

  if (!displayName) {
    return (
      <main className="name-gate scene-surface">
        <NameCard onSave={saveName} till={till} />
      </main>
    );
  }

  return (
    <div className={`shell shell--${screen}${screen === "home" && showTill ? " shell--atrium" : ""}`}>
      <header className="mini">
        <button type="button" onClick={goHome} className="mini__brand" aria-label="Before the Rush home">
          <i />
          <span><b>{APP_NAME}</b><small>Opening guide · 2593</small></span>
        </button>
        <div className="mini__actions">
          {canInstall && (
            <button type="button" className="install-button" onClick={installApp} aria-label="Install Before the Rush on this phone">
              <InstallIcon /><span>Install</span>
            </button>
          )}
          <button type="button" ref={profileTriggerRef} className="profile-button" onClick={() => setShowProfile(true)} aria-label={`Open profile and settings, currently ${displayName}`}>
            <b>{displayName.charAt(0).toUpperCase()}</b><span>{displayName}</span>
          </button>
          <div className="mode-toggle" role="group" aria-label="Guide detail mode">
            <button type="button" aria-pressed={mode === "learn"} className={mode === "learn" ? "active" : ""} onClick={() => setMode("learn")}>Learn</button>
            <button type="button" aria-pressed={mode === "quick"} className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>Quick</button>
          </div>
        </div>
      </header>

      <main className="content">
        {screen === "home" && (
          <HomeAtrium showTill={showTill} animate={till.preference === "full"} welcome={!completedCount}
            paused={behindDialog} talking={homeTalking} tubeNote={homeNote} onTalk={talkAtHome} onReceiveTubeNote={receiveTubeNote}
            reply={homeTalking
              ? allDone ? "You’ve finished today’s opening guide. I’ll be here for the next open." : nextTask.purpose
              : allDone ? closing : completedCount ? "You're back. I kept your place." : wisdom}
            taskCard={(
              <button type="button" className="start atrium-start" onClick={startOrResume}>
                <span className="atrium-start__copy">
                  <small>Task {resumeIndex + 1} of {guideTasks.length}</small>
                  <strong>{nextTask.title}</strong>
                </span>
                <span className="atrium-start__action">{allDone ? "Review task" : "Open task"} <span aria-hidden="true">→</span></span>
              </button>
            )}>
            <div className="home-head">
              {completedCount > 0 && <small>Good morning, {displayName}</small>}
              <h1>{allDone ? "Morning guide complete." : completedCount ? "Keep it moving." : `Good morning, ${displayName}`}</h1>
              <div className="home-head__meta">
                {!showTill && <p>{allDone ? "You’ve finished today’s opening guide." : completedCount ? `${completedCount} tasks finished. Pick up where you left off.` : wisdom}</p>}
                <div className="progress-status" aria-label={`${percent}% complete`}>
                  <span>{completedCount}<small>/{guideTasks.length}</small></span>
                  <em>{percent}% done</em>
                </div>
              </div>
            </div>
          </HomeAtrium>
        )}

        {screen === "task" && (
          <TaskFocus task={task} index={index} total={guideTasks.length} done={completed.has(task.id)} mode={mode}
            decisionAnswer={decisionAnswer} canComplete={canComplete} onDecisionChange={chooseDecision}
            onDoneNext={doneAndNext} onBack={goBack} till={till} tillPaused={behindDialog}
            tillCue={tillEvent?.taskId === task.id ? tillEvent : null} />
        )}

        {screen === "complete" && (
          <section className="finish">
            <div className={`finish__card ${till.preference === "off" ? "no-till" : ""}`}>
              <div className="finish__copy"><small>Morning guide complete</small><h1>{displayName}, you survived the paperwork.</h1><p>{closing}</p><div className="finish__actions"><button type="button" className="primary" onClick={goHome}>Back home</button><button type="button" onClick={requestReset}>Reset today</button></div></div>
              <TillStage {...till} anchor="finish" cue={tillEvent} paused={behindDialog} />
            </div>
          </section>
        )}
      </main>

      {showProfile && (
        <Modal className="profile-overlay" label="Profile and settings" returnFocus={profileTriggerRef} onClose={() => setShowProfile(false)}>
          <NameCard
            initialName={displayName}
            onSave={saveName}
            onCancel={() => setShowProfile(false)}
            till={till}
            onTillPreferenceChange={(preference) => setProfile(current => ({ ...current, tillPreference: preference }))}
            onReset={(event) => {
              setShowProfile(false);
              requestReset(event);
            }}
          />
        </Modal>
      )}

      {showResetConfirm && (
        <Modal className="profile-overlay" labelledBy="reset-title" returnFocus={resetTriggerRef} onClose={() => setShowResetConfirm(false)}>
          <section className="reset-card" onClick={(event) => event.stopPropagation()}>
            <small>Reset today?</small>
            <h2 id="reset-title">Start over from task one?</h2>
            <p>This clears today’s answers and progress on this device. Your name and saved phone numbers stay put.</p>
            <div>
              <button type="button" onClick={() => setShowResetConfirm(false)} autoFocus>Keep my progress</button>
              <button type="button" className="primary" onClick={reset}>Reset today</button>
            </div>
          </section>
        </Modal>
      )}

      {installMessage && <div className="install-toast" role="status">{installMessage}</div>}
    </div>
  );
}
