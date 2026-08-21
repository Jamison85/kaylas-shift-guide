import { useEffect, useState } from "react";

const peekFrames = Array.from({ length: 6 }, (_, index) => `characters-approved/peek-${index}.webp`);
const peekTimeline = [
  { at: 0, frame: 0 },
  { at: 280, frame: 1 },
  { at: 650, frame: 2 },
  { at: 1040, frame: 3 },
  { at: 1900, frame: 4 },
  { at: 2290, frame: 3 },
  { at: 2740, frame: 4 },
  { at: 3130, frame: 5 },
  { at: 3520, frame: 1 },
  { at: 3910, frame: 0 },
];

function PeekSequence() {
  const [frame, setFrame] = useState(0);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const timers = peekTimeline.map(({ at, frame: nextFrame }) => (
      window.setTimeout(() => setFrame(nextFrame), at)
    ));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return (
    <div className="approved-peek" aria-hidden="true">
      {peekFrames.map((src, index) => (
        <img
          key={src}
          className={`approved-peek__frame${frame === index ? " is-active" : ""}`}
          src={`${base}${src}`}
          alt=""
          draggable="false"
          decoding="async"
        />
      ))}
    </div>
  );
}

export default function CoworkerWorld({ screen }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    if (screen !== "home") return undefined;

    let startTimer;
    let endTimer;
    let active = true;

    const schedule = (opening = false) => {
      const delay = opening ? 1200 : 9000 + Math.random() * 6000;
      startTimer = window.setTimeout(() => {
        if (!active) return;
        setIsVisible(true);
        endTimer = window.setTimeout(() => {
          if (!active) return;
          setIsVisible(false);
          schedule();
        }, 5000);
      }, delay);
    };

    schedule(true);
    return () => {
      active = false;
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [screen]);

  if (!isVisible) return null;

  return (
    <div className="coworker-world--approved-peek" aria-hidden="true">
      <PeekSequence />
    </div>
  );
}
