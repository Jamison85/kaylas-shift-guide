const poseFiles = {
  hold: "characters-approved/prop-hold.webp",
  wave: "characters-approved/prop-wave.webp",
  celebrate: "characters-approved/prop-celebrate.webp",
};

const actionFiles = {
  walk: "characters-approved/till-action-walk-v1.webp",
  register: "characters-approved/till-action-register-v1.webp",
  paperwork: "characters-approved/till-action-paperwork-v1.webp",
  computer: "characters-approved/till-action-computer-v1.webp",
  lottery: "characters-approved/till-action-lottery-v1.webp",
  reconcile: "characters-approved/till-action-reconcile-v1.webp",
  inventory: "characters-approved/till-action-inventory-v1.webp",
};

const introFiles = {
  aisleIntro: "characters-approved/till-action-aisle-intro-v2.webp",
};

const actionDurations = {
  walk: "3.2s",
  register: "3.6s",
  paperwork: "4.2s",
  computer: "3.8s",
  lottery: "4.1s",
  reconcile: "4.4s",
  inventory: "4s",
};

const spritePoses = {
  carry: "0% 0%",
  push: "33.333% 0%",
  point: "66.667% 0%",
  sit: "100% 0%",
  climb: "0% 100%",
  peek: "33.333% 100%",
  compare: "66.667% 100%",
};

export default function CharacterProp({ pose = "hold", className = "" }) {
  const base = import.meta.env.BASE_URL;
  const actionFile = actionFiles[pose];
  const introFile = introFiles[pose];
  const spritePosition = spritePoses[pose];

  if (introFile) {
    return (
      <div className={`character-prop character-prop--intro character-prop--${pose} ${className}`.trim()} aria-hidden="true">
        <span
          className="character-prop__intro"
          style={{ backgroundImage: `url("${base}${introFile}")` }}
        />
      </div>
    );
  }

  if (actionFile) {
    return (
      <div className={`character-prop character-prop--action character-prop--${pose} ${className}`.trim()} aria-hidden="true">
        <span
          className="character-prop__action"
          style={{
            backgroundImage: `url("${base}${actionFile}")`,
            "--till-action-duration": actionDurations[pose],
          }}
        />
      </div>
    );
  }

  if (spritePosition) {
    return (
      <div className={`character-prop character-prop--sprite character-prop--${pose} ${className}`.trim()} aria-hidden="true">
        <span
          className="character-prop__sprite"
          style={{
            backgroundImage: `url("${base}characters-approved/coworker-action-sprites-v1.webp")`,
            backgroundPosition: spritePosition,
          }}
        />
      </div>
    );
  }

  const file = poseFiles[pose] || poseFiles.hold;

  return (
    <div className={`character-prop character-prop--${pose} ${className}`.trim()} aria-hidden="true">
      <img src={`${base}${file}`} alt="" draggable="false" decoding="async" />
    </div>
  );
}
