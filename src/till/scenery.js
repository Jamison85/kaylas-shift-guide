export const noteTube = { x: 848, hatchY: 507, exitY: -112, width: 116 };

export const tubeNotes = [
  "Testing. Is my side of the screen receiving snacks?",
  "I found a working pen. Employee of the Month.",
  "Small person. Full-size coffee.",
  "If it comes back full of glitter, I deny everything.",
];

const tearSeam = [
  [36, 511, 0, 0], [99, 527, 63, 46], [169, 495, 140, 167],
  [235, 511, 193, 161], [304, 519, 175, 222], [369, 516, 216, 202],
  [435, 495, 181, 219], [502, 531, 187, 158], [566, 518, 159, 153],
  [625, 504, 129, 117], [659, 531, 78, 88], [680, 514, 0, 0],
];

function tearRow([y, center, left, right], opening) {
  return { y, left: center - (2 + left) * opening, right: center + (2 + right) * opening };
}

export function tearHandTarget(side, opening) {
  const row = tearRow(tearSeam[5], opening);
  return [row[side], row.y + 8];
}

function paintTear(element, stage, tear) {
  const art = element.parentElement;
  if (!tear) {
    delete element.dataset.tillTear;
    delete art.dataset.tillBehindTear;
    return;
  }
  if (element.dataset.tillTear !== tear.phase) element.dataset.tillTear = tear.phase;
  if (tear.behind) art.dataset.tillBehindTear = "";
  else delete art.dataset.tillBehindTear;
  const [left, top, width, height] = stage.viewBox;
  const rows = tearSeam.map(row => tearRow(row, tear.opening));
  const polygon = points => `polygon(${points.map(([x, y]) =>
    `${((x - left) / width * 100).toFixed(2)}% ${((y - top) / height * 100).toFixed(2)}%`).join(", ")})`;
  const outline = side => rows.map(row => [row[side], row.y]);
  const innerLeft = outline("left");
  const innerRight = outline("right");
  const fold = (side, direction) => rows.map((row, i) => [
    row[side] + direction * (Math.sin(i / (rows.length - 1) * Math.PI) * (24 + (i % 3) * 11) * tear.opening + 2),
    row.y + direction * ((i % 3) - 1) * 9 * tear.opening,
  ]);
  const opening = tear.opening < 0.012 ? "inset(50%)" : polygon([...innerLeft, ...[...innerRight].reverse()]);
  art.style.setProperty("--tear-opening", opening);
  art.style.setProperty("--tear-left-lip", polygon([...innerLeft, ...fold("left", -1).reverse()]));
  art.style.setProperty("--tear-right-lip", polygon([...innerRight, ...fold("right", 1).reverse()]));
  art.style.setProperty("--tear-light", String(Math.min(1, tear.opening * 4)));
}

export function paintScenery(element, stage, scene) {
  if (!element) return;
  if (scene?.tear || element.dataset.tillTear) paintTear(element, stage, scene?.tear);
  const prop = scene?.prop;
  const item = prop?.name ?? "";
  if (element.dataset.tillProp !== item) element.dataset.tillProp = item;
  const phase = scene?.tubePhase ?? "idle";
  if (element.dataset.tubePhase !== phase) element.dataset.tubePhase = phase;
  const [left, top, width, height] = stage.viewBox;
  const dust = scene?.dust;
  if (dust) {
    element.style.setProperty("--dust-x", `${(dust.x - left) / width * 100}%`);
    element.style.setProperty("--dust-y", `${(dust.y - top) / height * 100}%`);
    element.style.setProperty("--dust-light", String(dust.light));
  } else if (element.style.getPropertyValue("--dust-light")) {
    element.style.removeProperty("--dust-light");
  }
  if (!prop) return;
  element.style.setProperty("--prop-x", `${(prop.x - left) / width * 100}%`);
  element.style.setProperty("--prop-y", `${(prop.y - top) / height * 100}%`);
  element.style.setProperty("--prop-angle", `${prop.angle}deg`);
}
