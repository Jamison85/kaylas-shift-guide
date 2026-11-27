export const noteTube = { x: 848, hatchY: 507, exitY: -112, width: 116 };

export const tubeNotes = [
  "Testing. Is my side of the screen receiving snacks?",
  "I found a working pen. Employee of the Month.",
  "Small person. Full-size coffee.",
  "If it comes back full of glitter, I deny everything.",
];

// A cut across the top of the card, seen looking down into Till's room.
const ceilingSeam = [
  [227, 543, 0, 0], [276, 532, 25, 30], [325, 534, 54, 70],
  [380, 528, 86, 101], [443, 540, 138, 117], [515, 532, 126, 143],
  [577, 525, 124, 151], [634, 543, 115, 117], [698, 532, 88, 97],
  [742, 548, 52, 56], [773, 548, 0, 0],
];

export const ladderRungs = [
  { left: 537, right: 692, y: 628 },
  { left: 516, right: 671, y: 572 },
  { left: 485, right: 646, y: 513 },
  { left: 451, right: 618, y: 451 },
];

export function ladderPoint(index, side, inset = 11) {
  const step = ladderRungs[index];
  return [side === "R" ? step.left + inset : step.right - inset, step.y];
}

export function hatchHandTarget(side) {
  return side === "R" ? [381, 625] : [632, 654];
}

function paintTear(element, stage, tear) {
  const art = element.parentElement;
  if (!tear) {
    delete element.dataset.tillTear;
    delete art.dataset.tillBehindTear;
    delete art.dataset.tillThroughTear;
    return;
  }
  if (element.dataset.tillTear !== tear.phase) element.dataset.tillTear = tear.phase;
  art.toggleAttribute("data-till-behind-tear", Boolean(tear.behind));
  art.toggleAttribute("data-till-through-tear", Boolean(tear.through));
  const [left, top, width, height] = stage.viewBox;
  const polygon = points => `polygon(${points.map(([x, y]) =>
    `${((x - left) / width * 100).toFixed(2)}% ${((y - top) / height * 100).toFixed(2)}%`).join(", ")})`;
  const amount = tear.opening;
  const far = ceilingSeam.map(([x, y, depth]) => [x, y - depth * amount]);
  const near = ceilingSeam.map(([x, y, , depth]) => [x, y + depth * amount]);
  const fold = (path, direction, thickness) => path.map(([x, y], i) => {
    const taper = Math.sin(i / (path.length - 1) * Math.PI);
    return [x - direction * (i % 3) * taper * 4, y + direction * (thickness + i % 3 * 8) * taper * amount];
  });
  const open = amount < 0.012 ? "inset(50%)" : polygon([...far, ...[...near].reverse()]);
  art.style.setProperty("--tear-opening", open);
  art.style.setProperty("--tear-far-lip", polygon([...far, ...fold(far, -1, 25).reverse()]));
  art.style.setProperty("--tear-near-lip", polygon([...near.slice().reverse(), ...fold(near, 1, 15)]));
  art.style.setProperty("--tear-foreground", polygon([
    [left, top], [left + width, top], [left + width, stage.edgeY],
    ...near.slice().reverse(), [left, stage.edgeY],
  ]));
  art.style.setProperty("--tear-light", String(Math.min(1, amount * 5)));
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
