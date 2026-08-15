import { useEffect, useMemo, useState } from "react";
import Coworker from "./Coworker";

const interactions = [
  { kind: "word-ladder", selector: '[data-coworker-safe="greeting"]', mood: "point" },
  { kind: "sit-label", selector: '[data-coworker-safe="energy"]', mood: "tired" },
  { kind: "balance-chip", selector: '[data-coworker-safe="start-label"]', mood: "ready" },
  { kind: "hang-brand", selector: '[data-coworker-safe="brand"]', mood: "panic" },
  { kind: "peek-category", selector: '[data-coworker-safe="task-category"]', mood: "thinking" },
];

function choose(items, previousKind) {
  const options = items.filter((item) => item.kind !== previousKind);
  return options[Math.floor(Math.random() * options.length)] || items[0];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function CoworkerWorld({ screen }) {
  const [scene, setScene] = useState(null);
  const [previousKind, setPreviousKind] = useState(null);

  useEffect(() => {
    if (screen === "splash" || screen === "complete") {
      setScene(null);
      return undefined;
    }

    let startTimer;
    let endTimer;
    let alive = true;

    const schedule = () => {
      const delay = 18000 + Math.random() * 22000;
      startTimer = window.setTimeout(() => {
        if (!alive) return;
        const available = interactions.filter((item) => document.querySelector(item.selector));
        if (!available.length) {
          schedule();
          return;
        }

        const picked = choose(available, previousKind);
        const target = document.querySelector(picked.selector);
        if (!target) {
          schedule();
          return;
        }

        const rect = target.getBoundingClientRect();
        setPreviousKind(picked.kind);
        setScene({
          ...picked,
          text: target.textContent?.trim() || "",
          rect: {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          },
        });

        const duration = 3000 + Math.random() * 2300;
        endTimer = window.setTimeout(() => {
          if (!alive) return;
          setScene(null);
          schedule();
        }, duration);
      }, delay);
    };

    schedule();
    return () => {
      alive = false;
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [screen, previousKind]);

  useEffect(() => {
    if (!scene) return undefined;
    const cancel = () => setScene(null);
    window.addEventListener("scroll", cancel, { passive: true });
    window.addEventListener("resize", cancel);
    return () => {
      window.removeEventListener("scroll", cancel);
      window.removeEventListener("resize", cancel);
    };
  }, [scene]);

  const placement = useMemo(() => {
    if (!scene) return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (scene.kind === "word-ladder") {
      return {
        left: clamp(scene.rect.left - 8, 8, vw - 135),
        top: clamp(scene.rect.bottom + 4, 86, vh - 210),
      };
    }
    if (scene.kind === "sit-label") {
      return {
        left: clamp(scene.rect.right - 48, 8, vw - 92),
        top: clamp(scene.rect.top - 105, 74, vh - 150),
      };
    }
    if (scene.kind === "balance-chip") {
      return {
        left: clamp(scene.rect.right - 18, 8, vw - 92),
        top: clamp(scene.rect.top - 113, 74, vh - 150),
      };
    }
    if (scene.kind === "hang-brand") {
      return {
        left: clamp(scene.rect.right - 22, 8, vw - 82),
        top: clamp(scene.rect.bottom - 8, 72, vh - 145),
      };
    }
    return {
      left: clamp(scene.rect.right + 4, 8, vw - 82),
      top: clamp(scene.rect.top - 44, 74, vh - 145),
    };
  }, [scene]);

  if (!scene || !placement) return null;

  const words = scene.text.split(/\s+/).filter(Boolean).slice(0, 5);

  return (
    <div
      className={`coworker-world coworker-world--${scene.kind}`}
      style={{ left: placement.left, top: placement.top }}
      aria-hidden="true"
    >
      {scene.kind === "word-ladder" && (
        <div className="coworker-word-ladder">
          {words.map((word, index) => (
            <span key={`${word}-${index}`}>{word}</span>
          ))}
        </div>
      )}
      <div className="coworker-world__person">
        <Coworker variant="world" mood={scene.mood} transitionKey={scene.kind} />
      </div>
    </div>
  );
}
