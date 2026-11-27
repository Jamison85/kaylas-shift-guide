import { useCallback, useEffect, useRef, useState } from "react";
import atriumStill from "../till/art/till-atrium.webp";
import welcomeClip from "../till/art/till-welcome.mp4";

const welcomeKey = "before-rush-atrium-welcome";
const reduceMotion = "(prefers-reduced-motion: reduce)";
let welcomedInPage = false;

function canPlayWelcome() {
  if (welcomedInPage || document.hidden || !navigator.onLine || window.matchMedia(reduceMotion).matches) return false;
  try { return sessionStorage.getItem(welcomeKey) !== "seen"; }
  catch { return true; }
}

export default function HomeAtrium({ showTill, animate, paused, children }) {
  const [phase, setPhase] = useState(() => animate && !paused && canPlayWelcome() ? "loading" : "still");
  const videoRef = useRef(null);
  const active = phase === "loading" || phase === "playing";

  const finishWelcome = useCallback(() => {
    videoRef.current?.pause();
    setPhase(current => current === "playing" ? "fading" : current === "loading" ? "still" : current);
  }, []);

  useEffect(() => {
    if (!active) return;
    welcomedInPage = true;
    try { sessionStorage.setItem(welcomeKey, "seen"); } catch { /* Keep the in-page fallback. */ }
    const motion = window.matchMedia(reduceMotion);
    const checkVisibility = () => {
      if (document.hidden || motion.matches || paused || !animate) finishWelcome();
    };
    checkVisibility();
    motion.addEventListener("change", checkVisibility);
    document.addEventListener("visibilitychange", checkVisibility);
    return () => {
      motion.removeEventListener("change", checkVisibility);
      document.removeEventListener("visibilitychange", checkVisibility);
    };
  }, [active, animate, paused, finishWelcome]);

  useEffect(() => {
    if (phase === "loading") {
      const timeout = window.setTimeout(finishWelcome, 4500);
      return () => window.clearTimeout(timeout);
    }
    if (phase === "fading") {
      const timeout = window.setTimeout(() => setPhase("still"), 440);
      return () => window.clearTimeout(timeout);
    }
  }, [phase, finishWelcome]);

  return (
    <div className="atrium-window" data-welcome={phase}>
      {showTill && (
        <div className="atrium-media" aria-hidden="true">
          <img src={atriumStill} width="720" height="1280" alt="" fetchPriority="high" />
          {phase !== "still" && (
            <video ref={videoRef} src={welcomeClip} autoPlay muted playsInline disablePictureInPicture
              onPlaying={() => setPhase(current => current === "loading" ? "playing" : current)}
              onEnded={finishWelcome} onError={finishWelcome} />
          )}
        </div>
      )}
      {children}
      {phase === "playing" && <button type="button" className="atrium-skip" onClick={finishWelcome}>Skip video</button>}
    </div>
  );
}
