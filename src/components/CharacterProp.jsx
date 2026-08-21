const poseFiles = {
  hold: "characters-approved/prop-hold.webp",
  wave: "characters-approved/prop-wave.webp",
  celebrate: "characters-approved/prop-celebrate.webp",
};

export default function CharacterProp({ pose = "hold", className = "" }) {
  const base = import.meta.env.BASE_URL;
  const file = poseFiles[pose] || poseFiles.hold;

  return (
    <div className={`character-prop character-prop--${pose} ${className}`.trim()} aria-hidden="true">
      <img src={`${base}${file}`} alt="" draggable="false" decoding="async" />
    </div>
  );
}
