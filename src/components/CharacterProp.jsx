const poseFiles = {
  hold: "characters-approved/prop-hold.webp",
  wave: "characters-approved/prop-wave.webp",
  celebrate: "characters-approved/prop-celebrate.webp",
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
  const spritePosition = spritePoses[pose];

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
