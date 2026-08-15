import { useEffect, useMemo, useState } from "react";

const moods = ["ready", "thinking", "judge", "tired", "panic"];
const workActivities = ["clipboard", "coffee", "receipt", "box", "wipe", "keys", "walkby", "inspect"];

const moodPose = {
  ready: "stand",
  point: "stand",
  celebrate: "stand",
  thinking: "think",
  judge: "arms",
  tired: "tired",
  panic: "panic",
};

const activityPose = {
  clipboard: "think",
  coffee: "tired",
  receipt: "think",
  box: "stand",
  wipe: "stand",
  keys: "arms",
  walkby: "stand",
  inspect: "think",
};

const poseFiles = {
  stand: "characters-hires/coworker-stand-v5.webp",
  arms: "characters-hires/coworker-arms-v4.webp",
  think: "characters-hires/coworker-think-v4.webp",
  panic: "characters-hires/coworker-panic-v5.webp",
  tired: "characters-hires/coworker-tired-v5.webp",
};

function pickDifferent(items, previous) {
  const choices = items.filter((item) => item !== previous);
  return choices[Math.floor(Math.random() * choices.length)] || items[0];
}

export default function Coworker({
  transitionKey = 0,
  variant = "full",
  mood: forcedMood,
  ambient = false,
}) {
  const [mood, setMood] = useState(forcedMood || "ready");
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    if (forcedMood) {
      setMood(forcedMood);
      return;
    }
    setMood((previous) => pickDifferent(moods, previous));
  }, [transitionKey, forcedMood]);

  useEffect(() => {
    if (forcedMood || ambient) return undefined;
    const id = window.setInterval(() => {
      setMood((previous) => pickDifferent(moods, previous));
    }, 18000);
    return () => window.clearInterval(id);
  }, [forcedMood, ambient]);

  useEffect(() => {
    if (!ambient) {
      setActivity(null);
      return undefined;
    }

    let startTimer;
    let endTimer;
    let alive = true;

    const schedule = () => {
      startTimer = window.setTimeout(() => {
        if (!alive) return;
        setActivity((previous) => pickDifferent(workActivities, previous));
        endTimer = window.setTimeout(() => {
          if (!alive) return;
          setActivity(null);
          schedule();
        }, 4200 + Math.random() * 2200);
      }, 5200 + Math.random() * 7800);
    };

    schedule();
    return () => {
      alive = false;
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [ambient]);

  const requestedPose = useMemo(
    () => activityPose[activity] || moodPose[mood] || "stand",
    [activity, mood],
  );

  // App-world stunts need a complete body. Mood still drives the scene animation,
  // but the figure stays physically coherent while climbing, hanging, and balancing.
  const visualPose = variant === "world" ? "stand" : requestedPose;
  const base = import.meta.env.BASE_URL;
  const imageUrl = `${base}${poseFiles[visualPose] || poseFiles.stand}`;
  const fallbackUrl = `${base}characters/coworker-stand.webp`;

  return (
    <div
      className={`coworker coworker--${variant} coworker--pose-${visualPose} coworker--mood-${mood} coworker--activity-${activity || "idle"}`}
      aria-hidden="true"
    >
      <div className="coworker__shadow" />
      <img
        className="coworker__sprite coworker__image"
        src={imageUrl}
        alt=""
        draggable="false"
        loading="eager"
        decoding="async"
        onError={(event) => {
          if (!event.currentTarget.dataset.fallbackApplied) {
            event.currentTarget.dataset.fallbackApplied = "true";
            event.currentTarget.src = fallbackUrl;
          }
        }}
      />

      {activity === "clipboard" && (
        <div className="coworker-prop coworker-prop--clipboard">
          <span className="coworker-prop__clip" />
          <i /><i /><i />
          <b />
        </div>
      )}

      {activity === "coffee" && (
        <div className="coworker-prop coworker-prop--coffee"><i /><i /></div>
      )}

      {activity === "receipt" && (
        <div className="coworker-prop coworker-prop--receipt"><i /><i /><i /><i /></div>
      )}

      {activity === "box" && (
        <div className="coworker-prop coworker-prop--box"><span>STOCK</span></div>
      )}

      {activity === "wipe" && (
        <>
          <div className="coworker-prop coworker-prop--cloth" />
          <div className="coworker-spark coworker-spark--one">✦</div>
          <div className="coworker-spark coworker-spark--two">✦</div>
        </>
      )}

      {activity === "keys" && (
        <div className="coworker-prop coworker-prop--keys"><i /><i /><i /></div>
      )}

      {mood === "celebrate" && (
        <div className="coworker-confetti"><i /><i /><i /><i /><i /><i /></div>
      )}
    </div>
  );
}
