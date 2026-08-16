import { useEffect, useMemo, useRef, useState } from "react";
import Coworker from "./Coworker";

const interactions = [
  { kind: "word-ladder", selector: '[data-coworker-safe="greeting"]', mood: "ready" },
  { kind: "sit-label", selector: '[data-coworker-safe="shift-note"]', mood: "tired" },
  { kind: "balance-chip", selector: '[data-coworker-safe="start-label"]', mood: "judge" },
  { kind: "hang-brand", selector: '[data-coworker-safe="brand"]', mood: "panic" },
  { kind: "peek-category", selector: '[data-coworker-safe="task-category"]', mood: "thinking" },
  { kind: "nav-walk", selector: ".bottom-nav", mood: "ready" },
  { kind: "card-push", selector: ".start", mood: "judge", targetClass: "coworker-target--nudge" },
  { kind: "task-edge", selector: ".task-card", mood: "thinking" },
  { kind: "edge-rappel", selector: null, mood: "panic" },
  { kind: "side-peek", selector: null, mood: "judge" },
  { kind: "paper-toss", selector: null, mood: "ready" },
];

const firstSceneByScreen = {
  home: ["nav-walk", "card-push", "edge-rappel"],
  task: ["task-edge", "paper-toss", "side-peek"],
};

function choose(items, previousKind) {
  const choices = items.filter((item) => item.kind !== previousKind);
  return choices[Math.floor(Math.random() * choices.length)] || items[0];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function CoworkerWorld({ screen }) {
  const [scene, setScene] = useState(null);
  const previousKind = useRef(null);
  const activeTarget = useRef(null);
  const sceneCount = useRef(0);
  const previousScreen = useRef(screen);

  useEffect(() => {
    if (previousScreen.current !== screen) {
      sceneCount.current = 0;
      previousScreen.current = screen;
    }

    if (screen === "splash" || screen === "complete") {
      setScene(null);
      document.body.classList.remove("till-is-roaming");
      return undefined;
    }

    let startTimer;
    let endTimer;
    let alive = true;

    const clearTarget = () => {
      if (activeTarget.current?.element && activeTarget.current?.className) {
        activeTarget.current.element.classList.remove(activeTarget.current.className);
      }
      activeTarget.current = null;
      document.body.classList.remove("till-is-roaming");
    };

    const pickScene = (available) => {
      const forcedKinds = firstSceneByScreen[screen] || [];
      if (sceneCount.current < forcedKinds.length) {
        const forced = available.find((item) => item.kind === forcedKinds[sceneCount.current]);
        if (forced) return forced;
      }
      return choose(available, previousKind.current);
    };

    const schedule = () => {
      const isOpeningScene = sceneCount.current === 0;
      const delay = isOpeningScene ? 1200 + Math.random() * 700 : 4200 + Math.random() * 3800;

      startTimer = window.setTimeout(() => {
        if (!alive) return;

        const available = interactions.filter((item) => !item.selector || document.querySelector(item.selector));
        if (!available.length) {
          schedule();
          return;
        }

        const picked = pickScene(available);
        const target = picked.selector ? document.querySelector(picked.selector) : null;
        previousKind.current = picked.kind;
        sceneCount.current += 1;
        clearTarget();
        document.body.classList.add("till-is-roaming");

        if (target && picked.targetClass) {
          target.classList.add(picked.targetClass);
          activeTarget.current = { element: target, className: picked.targetClass };
        }

        const rect = target?.getBoundingClientRect();
        setScene({
          ...picked,
          text: target?.textContent?.trim() || "",
          rect: rect ? {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          } : null,
        });

        endTimer = window.setTimeout(() => {
          if (!alive) return;
          setScene(null);
          clearTarget();
          schedule();
        }, 4800 + Math.random() * 900);
      }, delay);
    };

    schedule();
    return () => {
      alive = false;
      clearTarget();
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [screen]);

  useEffect(() => {
    if (!scene) return undefined;
    const cancel = () => {
      setScene(null);
      document.body.classList.remove("till-is-roaming");
    };
    window.addEventListener("resize", cancel);
    return () => window.removeEventListener("resize", cancel);
  }, [scene]);

  const placement = useMemo(() => {
    if (!scene) return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = scene.rect;

    if (scene.kind === "edge-rappel") return { left: clamp(vw * .64, 145, vw - 120), top: 48 };
    if (scene.kind === "side-peek") return { left: vw - 68, top: clamp(vh * .36, 150, vh - 250) };
    if (scene.kind === "paper-toss") return { left: 8, top: clamp(vh * .26, 112, vh - 250) };
    if (!r) return { left: 8, top: 100 };

    if (scene.kind === "nav-walk") return { left: clamp(r.left + 18, 8, vw - 112), top: clamp(r.top - 166, 80, vh - 198) };
    if (scene.kind === "card-push") return { left: clamp(r.right - 64, 8, vw - 112), top: clamp(r.top + r.height * .34, 80, vh - 190) };
    if (scene.kind === "task-edge") return { left: clamp(r.right - 55, 8, vw - 108), top: clamp(r.top + 92, 76, vh - 190) };
    if (scene.kind === "word-ladder") return { left: clamp(r.left - 14, 8, vw - 152), top: clamp(r.bottom + 4, 76, vh - 238) };
    if (scene.kind === "sit-label") return { left: clamp(r.right - 58, 8, vw - 110), top: clamp(r.top - 125, 74, vh - 175) };
    if (scene.kind === "balance-chip") return { left: clamp(r.right - 42, 8, vw - 112), top: clamp(r.top - 130, 74, vh - 175) };
    if (scene.kind === "hang-brand") return { left: clamp(r.right - 38, 8, vw - 106), top: clamp(r.bottom - 8, 68, vh - 170) };
    return { left: clamp(r.right - 32, 8, vw - 106), top: clamp(r.top - 62, 74, vh - 170) };
  }, [scene]);

  if (!scene || !placement) return null;
  const words = scene.text.split(/\s+/).filter(Boolean).slice(0, 5);

  return (
    <div className={`coworker-world coworker-world--${scene.kind}`} style={{ left: placement.left, top: placement.top }} aria-hidden="true">
      {scene.kind === "word-ladder" && <div className="coworker-word-ladder">{words.map((word, wordIndex) => <span key={`${word}-${wordIndex}`}>{word}</span>)}</div>}
      {scene.kind === "edge-rappel" && <div className="coworker-rope" />}
      {scene.kind === "paper-toss" && <div className="coworker-paper-plane">2593</div>}
      {scene.kind === "nav-walk" && <div className="coworker-step-dust"><i /><i /><i /></div>}
      <div className="coworker-world__person"><Coworker variant="world" mood={scene.mood} transitionKey={scene.kind} /></div>
    </div>
  );
}
