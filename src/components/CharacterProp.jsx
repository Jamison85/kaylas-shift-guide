import { useEffect, useRef, useState } from "react";

// Rendered from the V2 weighted Till rig; no canvas or GPU requirement.
// Each intentional gesture plays once, then settles into quiet breathing/blinking.
const durations = { wave: 2646, point: 2646, explain: 4235, nod: 1300, thumbs: 2332, celebrate: 3294, clipboard: 3780 };
const workPoses = new Set(["walk","register","paperwork","computer","lottery","reconcile","inventory"]);
const clipboardPoses = new Set(["paperwork","lottery","reconcile","inventory"]);

function selectClip(pose, moment) {
  if (moment === "explaining") return "explain";
  if (moment === "working") return clipboardPoses.has(pose) ? "clipboard" : "nod";
  if (pose === "celebrate") return "celebrate";
  if (pose === "wave" || pose === "aisleIntro") return "wave";
  if (pose === "point" || pose === "push") return "point";
  if (pose === "thumbs") return "thumbs";
  if (clipboardPoses.has(pose)) return "clipboard";
  return "idle";
}

export default function CharacterProp({ pose = "hold", className = "", motion = "loop", moment = null }) {
  const host = useRef(null);
  const timer = useRef(null);
  const played = useRef(false);
  const ambientTimer = useRef(null);
  const selection = selectClip(pose, moment);
  const [active, setActive] = useState(false);
  const [clip, setClip] = useState("still");
  const [unavailable, setUnavailable] = useState(false);
  const base = import.meta.env.BASE_URL + "characters-approved/till-runtime-v2/";

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = typeof IntersectionObserver === "undefined";
    const update = () => setActive(visible && !document.hidden && !media.matches && motion !== "none");
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    if (host.current) observer?.observe(host.current);
    document.addEventListener("visibilitychange", update);
    media.addEventListener("change", update);
    update();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
      media.removeEventListener("change", update);
    };
  }, [motion]);

  useEffect(() => {
    played.current = false;
    setUnavailable(false);
  }, [selection]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!active || unavailable) setClip("still");
    else if (!played.current) {
      played.current = true;
      setClip(selection);
    } else setClip(motion === "once" ? "still" : "idle");
    return () => clearTimeout(timer.current);
  }, [active, selection, motion, unavailable]);

  // Quiet, occasional work gestures, never an endless performance.
  useEffect(() => {
    if (!active || unavailable || motion !== "loop" || clip !== "idle" || moment === "explaining") return;
    const choices = clipboardPoses.has(pose) ? ["clipboard", "nod"] : ["nod", "thumbs"];
    ambientTimer.current = setTimeout(() => {
      setClip(choices[Math.floor(Math.random() * choices.length)]);
    }, 28000 + Math.random() * 32000);
    return () => clearTimeout(ambientTimer.current);
  }, [active, unavailable, motion, clip, moment, pose]);

  function onLoad() {
    clearTimeout(timer.current);
    if (active && durations[clip]) {
      timer.current = setTimeout(() => setClip(motion === "once" ? "still" : "idle"), durations[clip] + 50);
    }
  }

  const action = workPoses.has(pose) || !!moment;
  return (
    <div ref={host}
      className={`character-prop character-prop--runtime ${action ? "character-prop--action" : ""} character-prop--${pose} ${className}`.trim()}
      data-till-runtime="v2" data-till-clip={clip} aria-hidden="true"
      style={{ aspectRatio: action ? "1" : "3 / 4", overflow: "hidden", pointerEvents: "none" }}>
      <img key={clip} src={base + clip + ".webp"} alt="" draggable="false" decoding="async"
        onLoad={onLoad} onError={() => { clearTimeout(timer.current); setUnavailable(true); setClip("still"); }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", objectPosition: "center bottom", filter: "none" }} />
    </div>
  );
}
