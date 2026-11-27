export const noteTube = { x: 848, hatchY: 507, exitY: -112, width: 116 };

export const tubeNotes = [
  "Testing. Is my side of the screen receiving snacks?",
  "I found a working pen. Employee of the Month.",
  "Small person. Full-size coffee.",
  "If it comes back full of glitter, I deny everything.",
];

// The opening stays on the glass while the office and visitor move at different depths.
const rift = [
  [458, 95], [548, 118], [625, 89], [705, 143], [716, 224], [782, 259],
  [754, 344], [795, 415], [752, 469], [773, 549], [686, 561], [653, 640],
  [579, 617], [501, 677], [442, 610], [350, 647], [320, 570], [245, 543],
  [271, 470], [207, 414], [251, 341], [221, 254], [302, 230], [314, 147], [396, 162],
];
const glassCenter = [505, 380];

export const ladderRungs = [
  { left: 566, right: 661, y: 580 },
  { left: 567, right: 684, y: 523 },
  { left: 569, right: 706, y: 454 },
  { left: 572, right: 732, y: 378 },
];

function paintTear(element, stage, tear) {
  const art = element.parentElement;
  if (!tear) {
    delete element.dataset.tillTear;
    delete art.dataset.tillPeeping;
    art.style.removeProperty("--portrait-opacity");
    art.style.removeProperty("--peep-cover");
    return;
  }

  if (element.dataset.tillTear !== tear.phase) element.dataset.tillTear = tear.phase;
  art.toggleAttribute("data-till-peeping", Boolean(tear.visitor));
  art.style.setProperty("--portrait-opacity", tear.portrait ?? 0);
  art.style.setProperty("--peep-cover", tear.cover?.opacity ?? 0);
  art.style.setProperty("--peep-cover-shift", `${tear.cover?.x ?? 0}%`);
  const [left, top, width, height] = stage.viewBox;
  const polygon = points => `polygon(${points.map(([x, y]) =>
    `${((x - left) / width * 100).toFixed(2)}% ${((y - top) / height * 100).toFixed(2)}%`).join(", ")})`;
  const contour = (w, h) => rift.map(([x, y]) => [
    glassCenter[0] + (x - glassCenter[0]) * w,
    glassCenter[1] + (y - glassCenter[1]) * h,
  ]);
  const amount = tear.opening;
  const heightOpen = amount * (0.24 + 0.76 * amount);
  art.style.setProperty("--tear-opening", amount < 0.01 ? "inset(50%)" : polygon(contour(amount, heightOpen)));
  art.style.setProperty("--tear-rim", polygon(contour(amount * 1.055, heightOpen * 1.045)));
  art.style.setProperty("--tear-light", String(Math.min(1, amount * 5)));

  const visitor = tear.visitor;
  if (!visitor) return;
  const palms = Math.min(1, visitor.through / 0.4);
  const shoulders = Math.max(0, (visitor.through - 0.4) / 0.6);
  const properties = {
    "--visitor-x": `${(visitor.x - left) / width * 100}%`,
    "--visitor-y": `${(visitor.y - top) / height * 100}%`,
    "--visitor-width": `${visitor.width / width * 100}%`,
    "--visitor-distance": visitor.parallax,
    "--visitor-roll": `${visitor.roll}deg`,
    "--visitor-opacity": visitor.opacity,
    "--visitor-work": 1 - visitor.reach,
    "--visitor-reach": visitor.reach,
    "--visitor-cross-x": `${42 * palms + 58 * shoulders}%`,
    "--visitor-cross-y": `${52 * palms + 48 * shoulders}%`,
  };
  for (const [name, value] of Object.entries(properties)) art.style.setProperty(name, value);
}

export function watchPeepDirection(art) {
  let reference;
  let x = 0;
  let y = 0;
  const delta = (value, origin) => ((value - origin + 540) % 360) - 180;
  const limit = value => Math.max(-1, Math.min(1, value));

  function tilt({ beta, gamma }) {
    if (!art.hasAttribute("data-till-peeping") || !Number.isFinite(beta) || !Number.isFinite(gamma)) return;
    const rotation = (window.screen.orientation?.angle ?? 0) * Math.PI / 180;
    if (!reference || reference.rotation !== rotation) reference = { beta, gamma, rotation };
    const roll = delta(gamma, reference.gamma);
    const pitch = delta(beta, reference.beta);
    const horizontal = roll * Math.cos(rotation) + pitch * Math.sin(rotation);
    const vertical = pitch * Math.cos(rotation) - roll * Math.sin(rotation);
    x += (limit(horizontal / 20) - x) * 0.27;
    y += (limit(vertical / 23) - y) * 0.27;
    art.style.setProperty("--peep-x", x.toFixed(3));
    art.style.setProperty("--peep-y", y.toFixed(3));
  }

  window.addEventListener("deviceorientation", tilt, { passive: true });
  return () => {
    window.removeEventListener("deviceorientation", tilt);
    art.style.removeProperty("--peep-x");
    art.style.removeProperty("--peep-y");
  };
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
