import { useEffect, useMemo, useState } from "react";

const moods = ["ready", "thinking", "judge", "tired", "panic"];
const workActivities = ["clipboard", "coffee", "receipt", "box", "wipe", "keys"];

const moodPose = {
  ready: "stand",
  point: "stand",
  celebrate: "stand",
  thinking: "think",
  judge: "arms",
  tired: "coffee",
  panic: "panic",
};

const activityPose = {
  clipboard: "stand",
  coffee: "coffee",
  receipt: "think",
  box: "stand",
  wipe: "stand",
  keys: "arms",
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
        }, 2800 + Math.random() * 2400);
      }, 6500 + Math.random() * 10500);
    };

    schedule();
    return () => {
      alive = false;
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [ambient]);

  const pose = useMemo(
    () => activityPose[activity] || moodPose[mood] || "stand",
    [activity, mood],
  );

  const src = `${import.meta.env.BASE_URL}characters/coworker-${pose}.webp`;

  return (
    <div
      className={`coworker coworker--${variant} coworker--mood-${mood} coworker--activity-${activity || "idle"}`}
      aria-hidden="true"
    >
      <div className="coworker__aura" />
      <img className="coworker__image" src={src} alt="" draggable="false" />

      {activity === "clipboard" && (
        <div className="coworker-prop coworker-prop--clipboard">
          <i /><i /><i />
        </div>
      )}
      {activity === "receipt" && (
        <div className="coworker-prop coworker-prop--receipt">
          <i /><i /><i /><i />
        </div>
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
        <div className="coworker-confetti"><i /><i /><i /><i /><i /></div>
      )}
    </div>
  );
}
