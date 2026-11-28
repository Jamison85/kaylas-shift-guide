import { useCallback, useEffect, useRef, useState } from "react";
import atriumStill from "../till/art/till-atrium.webp";
import tubeClip from "../till/art/till-tube-note.mp4";
import welcomeClip from "../till/art/till-welcome.mp4";

const welcomeKey = "before-rush-atrium-welcome";
const reduceMotion = "(prefers-reduced-motion: reduce)";
const tubeLaunchTime = 3.25;
let welcomedInPage = false;

function canPlayClip() {
  return !document.hidden && navigator.onLine && !window.matchMedia(reduceMotion).matches;
}

function canPlayWelcome() {
  if (welcomedInPage || !canPlayClip()) return false;
  try { return sessionStorage.getItem(welcomeKey) !== "seen"; }
  catch { return true; }
}

export default function HomeAtrium({ showTill, animate, welcome, paused, reply, talking, onTalk, onReceiveTubeNote, children }) {
  const [phase, setPhase] = useState(() => animate && welcome && !paused && canPlayWelcome() ? "loading" : "still");
  const [clip, setClip] = useState("welcome");
  const [sending, setSending] = useState(false);
  const videoRef = useRef(null);
  const pendingNote = useRef(false);
  const active = phase === "loading" || phase === "playing";
  const tubeBusy = clip === "tube" && phase !== "still";

  const deliverNote = useCallback(() => {
    if (!pendingNote.current) return;
    pendingNote.current = false;
    setSending(false);
    onReceiveTubeNote();
  }, [onReceiveTubeNote]);

  const finishClip = useCallback(() => {
    videoRef.current?.pause();
    deliverNote();
    setPhase(current => current === "playing" ? "fading" : current === "loading" ? "still" : current);
  }, [deliverNote]);

  const sendTubeNote = () => {
    if (tubeBusy || pendingNote.current) return;
    if (!animate || paused || !canPlayClip()) {
      onReceiveTubeNote();
      return;
    }
    videoRef.current?.pause();
    pendingNote.current = true;
    setSending(true);
    setClip("tube");
    setPhase("loading");
  };

  useEffect(() => {
    if (!active) return;
    if (clip === "welcome") {
      welcomedInPage = true;
      try { sessionStorage.setItem(welcomeKey, "seen"); } catch { /* Keep the in-page fallback. */ }
    }
    const motion = window.matchMedia(reduceMotion);
    const checkVisibility = () => {
      if (document.hidden || motion.matches || paused || !animate) finishClip();
    };
    checkVisibility();
    motion.addEventListener("change", checkVisibility);
    document.addEventListener("visibilitychange", checkVisibility);
    return () => {
      motion.removeEventListener("change", checkVisibility);
      document.removeEventListener("visibilitychange", checkVisibility);
    };
  }, [active, animate, clip, paused, finishClip]);

  useEffect(() => {
    if (phase === "loading") {
      const timeout = window.setTimeout(finishClip, 4500);
      return () => window.clearTimeout(timeout);
    }
    if (phase === "fading") {
      const timeout = window.setTimeout(() => setPhase("still"), 440);
      return () => window.clearTimeout(timeout);
    }
  }, [clip, phase, finishClip]);

  return (
    <div className="atrium-window" data-welcome={clip === "welcome" ? phase : "still"}
      data-clip={phase !== "still" ? clip : undefined} data-clip-phase={phase}>
      {showTill && (
        <div className="atrium-media" aria-hidden="true">
          <img src={atriumStill} width="720" height="1280" alt="" fetchPriority="high" />
          {phase !== "still" && (
            <video key={clip} ref={videoRef} src={clip === "tube" ? tubeClip : welcomeClip} autoPlay muted playsInline disablePictureInPicture
              onPlaying={() => setPhase(current => current === "loading" ? "playing" : current)}
              onTimeUpdate={clip === "tube" ? event => {
                if (event.currentTarget.currentTime >= tubeLaunchTime) deliverNote();
              } : undefined}
              onEnded={finishClip} onError={finishClip} />
          )}
        </div>
      )}
      {children}
      {showTill && (
        <aside className="atrium-till" aria-label="Till">
          <div className="atrium-till__reply" id="home-till-reply" role="status">
            <span>{sending ? "Till" : reply.from}</span>
            <p>{sending ? "Sending your note…" : reply.text}</p>
          </div>
          <div className="atrium-till__actions">
            <button type="button" onClick={onTalk} aria-label="Talk to Till" aria-controls="home-till-reply"
              aria-pressed={talking} disabled={sending}>Ask Till</button>
            <button type="button" onClick={sendTubeNote} aria-label="Send a tube note" aria-controls="home-till-reply"
              disabled={tubeBusy}>Tube note</button>
          </div>
        </aside>
      )}
      {phase === "playing" && <button type="button" className="atrium-skip" onClick={finishClip}>Skip video</button>}
    </div>
  );
}
