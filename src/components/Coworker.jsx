import { useEffect, useMemo, useState } from "react";
import { coworkerAtlas } from "../characterAtlas.js";

const moods = ["ready", "thinking", "judge", "tired", "panic"];
const workActivities = ["clipboard", "coffee", "receipt", "box", "wipe", "keys", "walkby", "inspect"];

const moodPose = {
  ready: "stand",
  point: "stand",
  celebrate: "celebrate",
  thinking: "think",
  judge: "arms",
  tired: "arms",
  panic: "panic",
};

const activityPose = {
  clipboard: "think",
  coffee: "arms",
  receipt: "think",
  box: "stand",
  wipe: "stand",
  keys: "arms",
  walkby: "stand",
  inspect: "think",
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
        }, 3900 + Math.random() * 2300);
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

  return (
    <div
      className={`coworker coworker--${variant} coworker--pose-${pose} coworker--mood-${mood} coworker--activity-${activity || "idle"}`}
      aria-hidden="true"
    >
      <div className="coworker__shadow" />
      <div
        className="coworker__sprite"
        style={{ backgroundImage: `url("${coworkerAtlas}")` }}
      />

      {activity === "clipboard" && (
        <div className="coworker-prop coworker-prop--clipboard">
          <span className="coworker-prop__clip" />
          <i /><i /><i />
          <b />
        </div>
      )}

      {activity === "coffee" && (
        <div className="coworker-prop coworker-prop--coffee">
          <i /><i />
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
        <div className="coworker-confetti"><i /><i /><i /><i /><i /><i /></div>
      )}
    </div>
  );
}
