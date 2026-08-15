import { useEffect, useMemo, useRef, useState } from "react";
import Coworker from "./Coworker";

const interactions = [
  { kind: "word-ladder", selector: '[data-coworker-safe="greeting"]', mood: "ready" },
  { kind: "sit-label", selector: '[data-coworker-safe="energy"]', mood: "tired" },
  { kind: "balance-chip", selector: '[data-coworker-safe="start-label"]', mood: "judge" },
  { kind: "hang-brand", selector: '[data-coworker-safe="brand"]', mood: "panic" },
  { kind: "peek-category", selector: '[data-coworker-safe="task-category"]', mood: "thinking" },
];

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

  useEffect(() => {
    if (screen === "splash" || screen === "complete") {
      setScene(null);
      return undefined;
    }

    let startTimer;
    let endTimer;
    let alive = true;

    const schedule = () => {
      const delay = 12000 + Math.random() * 15000;
      startTimer = window.setTimeout(() => {
        if (!alive) return;

        const available = interactions.filter((item) => document.querySelector(item.selector));
        if (!available.length) {
          schedule();
          return;
        }

        const picked = choose(available, previousKind.current);
        const target = document.querySelector(picked.selector);
        if (!target) {
          schedule();
          return;
        }

        const rect = target.getBoundingClientRect();
        previousKind.current = picked.kind;
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

        endTimer = window.setTimeout(() => {
          if (!alive) return;
          setScene(null);
          schedule();
        }, 3600 + Math.random() * 1800);
      }, delay);
    };

    schedule();
    return () => {
      alive = false;
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [screen]);

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
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (scene.kind === "word-ladder") {
      return {
        left: clamp(scene.rect.left - 12, 10, viewportWidth - 142),
        top: clamp(scene.rect.bottom + 3, 78, viewportHeight - 218),
      };
    }
    if (scene.kind === "sit-label") {
      return {
        left: clamp(scene.rect.right - 50, 10, viewportWidth - 102),
        top: clamp(scene.rect.top - 108, 78, viewportHeight - 160),
      };
    }
    if (scene.kind === "balance-chip") {
      return {
        left: clamp(scene.rect.right - 30, 10, viewportWidth - 105),
        top: clamp(scene.rect.top - 112, 78, viewportHeight - 160),
      };
    }
    if (scene.kind === "hang-brand") {
      return {
        left: clamp(scene.rect.right - 30, 10, viewportWidth - 92),
        top: clamp(scene.rect.bottom - 3, 70, viewportHeight - 152),
      };
    }
    return {
      left: clamp(scene.rect.right - 28, 10, viewportWidth - 92),
      top: clamp(scene.rect.top - 48, 76, viewportHeight - 152),
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
          {words.map((word, wordIndex) => <span key={`${word}-${wordIndex}`}>{word}</span>)}
        </div>
      )}
      <div className="coworker-world__person">
        <Coworker variant="world" mood={scene.mood} transitionKey={scene.kind} />
      </div>
    </div>
  );
}
