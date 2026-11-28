import { useCallback, useEffect, useRef, useState } from "react";
import atriumStill from "../till/art/till-atrium.webp";
import askClip from "../till/art/till-ask.mp4";
import tubeClip from "../till/art/till-tube-note.mp4";
import noteArrival from "../till/art/till-note-arrival.webp";
import welcomeClip from "../till/art/till-welcome.mp4";

const welcomeKey = "before-rush-atrium-welcome";
const reduceMotion = "(prefers-reduced-motion: reduce)";
const scenes = {
  welcome: { src: welcomeClip },
  ask: { src: askClip, replyTime: 1.05 },
  tube: { src: tubeClip },
};
let welcomedInPage = false;

function canPlayClip() {
  return !document.hidden && navigator.onLine && !window.matchMedia(reduceMotion).matches;
}

function canPlayWelcome() {
  if (welcomedInPage || !canPlayClip()) return false;
  try { return sessionStorage.getItem(welcomeKey) !== "seen"; }
  catch { return true; }
}

function AtriumKey({ engaged, children, ...props }) {
  const [pressing, setPressing] = useState(false);
  const releaseTimer = useRef(null);
  useEffect(() => () => window.clearTimeout(releaseTimer.current), []);

  const release = () => {
    window.clearTimeout(releaseTimer.current);
    releaseTimer.current = window.setTimeout(() => setPressing(false), 85);
  };
  const cancel = () => {
    window.clearTimeout(releaseTimer.current);
    setPressing(false);
  };

  return (
    <button type="button" className="atrium-key" aria-controls="home-till-reply"
      data-pressing={pressing || undefined} data-engaged={engaged || undefined}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        window.clearTimeout(releaseTimer.current);
        setPressing(true);
      }} onPointerUp={release} onPointerCancel={cancel}
      onPointerLeave={event => { if (event.pointerType === "mouse") cancel(); }} {...props}>
      <span className="atrium-key__face">{children}</span>
    </button>
  );
}

export default function HomeAtrium({ showTill, animate, welcome, paused, reply, talking, tubeNote, onTalk, onReceiveTubeNote, taskCard, children }) {
  const [phase, setPhase] = useState(() => animate && welcome && !paused && canPlayWelcome() ? "loading" : "still");
  const [clip, setClip] = useState("welcome");
  const [waiting, setWaiting] = useState(false);
  const [animateArrival, setAnimateArrival] = useState(false);
  const videoRef = useRef(null);
  const pendingReply = useRef(null);
  const active = phase === "loading" || phase === "playing";
  const busy = clip !== "welcome" && phase !== "still";
  const { src, replyTime } = scenes[clip];

  const deliverReply = useCallback((arriving = false) => {
    const request = pendingReply.current;
    if (!request) return;
    pendingReply.current = null;
    setWaiting(false);
    if (request === "ask") onTalk();
    else {
      setAnimateArrival(arriving);
      onReceiveTubeNote();
    }
  }, [onTalk, onReceiveTubeNote]);

  const finishClip = useCallback((arriving = false) => {
    videoRef.current?.pause();
    deliverReply(arriving);
    setPhase(current => current === "playing" ? "fading" : current === "loading" ? "still" : current);
  }, [deliverReply]);

  const interact = (request) => {
    if (busy || pendingReply.current) return;
    if ((request === "ask" && talking) || !animate || paused || !canPlayClip()) {
      if (request === "ask") onTalk();
      else {
        setAnimateArrival(false);
        onReceiveTubeNote();
      }
      return;
    }
    videoRef.current?.pause();
    pendingReply.current = request;
    setWaiting(true);
    setClip(request);
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
    <section className={`home ${showTill ? "home--atrium" : "home--plain"}`}>
      <div className="atrium-window" data-welcome={clip === "welcome" ? phase : "still"}
        data-clip={phase !== "still" ? clip : undefined} data-clip-phase={phase}>
        {showTill && (
          <div className="atrium-media">
            <img className="atrium-media__still" src={atriumStill} width="720" height="1280" alt="" fetchPriority="high" />
            <div className="atrium-delivery" data-open={Boolean(tubeNote) || undefined}
              data-arriving={animateArrival && !waiting || undefined}>
              <div className="atrium-delivery__frame">
                <img src={noteArrival} width="720" height="1280" alt="" decoding="async" />
                <span className="atrium-delivery__signal" aria-hidden="true" />
              </div>
              {tubeNote && (
                <div className="atrium-delivery__screen" key={tubeNote}>
                  {!waiting && (
                    <div className="atrium-delivery__readout" id="home-till-reply" role="status">
                      <span>Till</span>
                      <p>{tubeNote}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {phase !== "still" && (
              <video key={clip} ref={videoRef} src={src} aria-hidden="true" autoPlay muted playsInline disablePictureInPicture
                onPlaying={() => setPhase(current => current === "loading" ? "playing" : current)}
                onTimeUpdate={replyTime ? event => {
                  if (event.currentTarget.currentTime >= replyTime) deliverReply();
                } : undefined}
                onEnded={() => finishClip(clip === "tube")} onError={() => finishClip()} />
            )}
          </div>
        )}
        {children}
        {showTill && (!tubeNote || waiting) && (
          <aside className={`atrium-till${talking && !waiting ? " atrium-till--answer" : ""}`} aria-label="Till">
            <div className="atrium-till__reply" id="home-till-reply" role="status">
              <span>Till</span>
              <p>{waiting ? (clip === "tube" ? "Sending your note…" : "Checking what’s next…") : reply}</p>
            </div>
          </aside>
        )}
        {phase === "playing" && <button type="button" className="atrium-skip" onClick={() => finishClip()}>Skip video</button>}
      </div>
      {taskCard}
      {showTill && (
        <div className="atrium-controls" role="group" aria-label="Till controls">
          <AtriumKey onClick={() => interact("ask")} aria-pressed={talking} disabled={busy}
            engaged={talking || (busy && clip === "ask")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
              <path d="M8 9h8m-8 4h5" />
            </svg>
            Ask Till
          </AtriumKey>
          <AtriumKey onClick={() => interact("tube")} disabled={busy} engaged={busy && clip === "tube"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <rect x="5" y="8" width="14" height="8" rx="4" transform="rotate(-35 12 12)" />
              <path d="m9 9 4.6 6.5M4 8l3-2m10 13 3-2" />
            </svg>
            Tube note
          </AtriumKey>
        </div>
      )}
    </section>
  );
}
