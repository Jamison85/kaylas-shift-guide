export const noteTube = { x: 848, hatchY: 507, exitY: -112, width: 116 };

export const tubeNotes = [
  "Testing. Is my side of the screen receiving snacks?",
  "I found a working pen. Employee of the Month.",
  "Small person. Full-size coffee.",
  "If it comes back full of glitter, I deny everything.",
  "I timed the elevator. The stairs are filing an appeal.",
  "The office plant just asked for a title change.",
  "The clipboard has a clipboard. Things are escalating.",
  "I stapled the paperwork on the first try. Witnesses welcome.",
  "I gave the squeaky chair its own key to the office.",
  "The break-room microwave thinks every lunch takes five minutes.",
  "The tube got here before my coffee. I have mixed feelings.",
  "I caught the receipt that flew off the desk. Great shift so far.",
  "The cooler light is the brightest thing about this hour.",
  "I asked the printer for one page. It had a few ideas of its own.",
  "I tried a swivel-chair commute. The hallway has corners.",
  "The desk drawer with the good pens has developed a waitlist.",
  "I brought a coffee the size of my head. The day felt ambitious.",
  "Someone cleaned the break-room clock. Time finally looks good.",
  "I made a checklist for the checklist. We’re calling that progress.",
  "The calculator is doing great. I’m prepared to take credit.",
  "The pen on my desk has a leash now. It’s been a long week.",
  "I pressed the elevator button twice. It considered my feedback.",
  "There’s a receipt in my pocket from a shift I barely remember.",
  "I found a crumb in the capsule. The snack route is officially open.",
  "The office clock and the register clock are seeing other people.",
  "The best sound in this building is a drawer that closes on the first try.",
  "I passed somebody in the hall carrying a box labeled ‘misc.’ Bold.",
  "I just got out of a meeting that could have fit in this tube.",
  "The pen cap clicked into place. One thing went exactly to plan.",
  "I set my coffee beside the paperwork. Workplace supervision.",
  "That little red light is the tube’s way of saying it wants attention.",
  "The filing cabinet has four drawers and a very territorial attitude.",
  "I started the office playlist. Track one is the air conditioner.",
  "I know who took the good pen. I’m waiting for it to come home.",
  "Somebody held the elevator for me. I’ve been promoted to passenger.",
  "The stapler and I have reached a temporary understanding.",
  "I set my keys down somewhere sensible. That narrows it to everywhere.",
  "The sun’s up. The office lamp insists on finishing its shift.",
  "My coffee went cold while I looked for my coffee.",
  "I labeled both ends of the capsule. The tube remains unimpressed.",
];

// The opening stays on the glass while the office and visitor move at different depths.
const rift = [
  [451, 108], [493, 124], [544, 120], [605, 105], [663, 142], [674, 183],
  [729, 206], [756, 246], [747, 286], [787, 323], [779, 390], [797, 450],
  [751, 475], [763, 524], [725, 549], [658, 564], [621, 631], [556, 614],
  [505, 654], [469, 631], [391, 648], [369, 618], [315, 597], [302, 545],
  [251, 532], [234, 475], [215, 431], [241, 400], [236, 337], [260, 319],
  [253, 263], [281, 219], [327, 209], [334, 161], [395, 157],
];
const glassCenter = [505, 380];

export const glassFractures = [
  { joint: 0, tips: [[-24, -22], [-20, -48], [-51, -78]] },
  { joint: 6, tips: [[28, -26], [56, -27], [79, -63]] },
  { joint: 11, tips: [[38, 11], [54, 38], [119, 50]] },
  { joint: 16, tips: [[36, 28], [40, 48], [66, 64]] },
  { joint: 24, tips: [[-35, 9], [-59, 35], [-97, 39]] },
  { joint: 30, tips: [[-27, -17], [-61, -17], [-112, -43]] },
];

export const ladderRungs = [
  { left: 566, right: 661, y: 580 },
  { left: 567, right: 684, y: 523 },
  { left: 569, right: 706, y: 454 },
  { left: 572, right: 732, y: 378 },
];

export const glassFlakes = [
  { joint: 5, spread: [39, -32] },
  { joint: 15, spread: [58, 11] },
  { joint: 24, spread: [-46, 22] },
  { joint: 32, spread: [-19, -43] },
];

const lastOpening = new WeakMap();

function paintGlass(art, stage, amount) {
  if (lastOpening.get(art) === amount) return;
  lastOpening.set(art, amount);
  const [left, top, width, height] = stage.viewBox;
  const polygon = points => `polygon(${points.map(([x, y]) =>
    `${((x - left) / width * 100).toFixed(2)}% ${((y - top) / height * 100).toFixed(2)}%`).join(", ")})`;
  const widthOpen = Math.min(1, amount * 1.4);
  const contour = (bevel = 0) => rift.map(([x, y], i) => {
    const drift = 0.07 + 0.28 * (x - 215) / 582 + 0.10 * (y < glassCenter[1] ? 1 : 0);
    const vertical = Math.max(0, (amount - drift) / (1 - drift));
    return [
      glassCenter[0] + (x - glassCenter[0]) * (widthOpen + bevel * (0.58 + (i % 5) * 0.15)),
      glassCenter[1] + (y - glassCenter[1]) * (vertical + bevel * (0.73 + (i % 4) * 0.19)),
    ];
  });
  const inner = contour();
  art.style.setProperty("--tear-opening", amount < 0.01 ? "inset(50%)" : polygon(inner));
  art.style.setProperty("--tear-rim", polygon(contour(amount * 0.058)));
  art.style.setProperty("--tear-edge", polygon(contour(amount * 0.023)));
  art.style.setProperty("--tear-light", String(Math.min(1, amount * 5)));
  art.style.setProperty("--fracture-light", String(Math.min(0.8, amount * 2.4)));
  glassFractures.forEach(({ joint, tips }, index) => {
    const [x, y] = inner[joint];
    const reach = Math.min(1, amount * 2.2);
    const points = [[x, y], ...tips.map(([dx, dy]) => [x + dx * reach, y + dy * reach])];
    const taper = points.map(([px, py], i) => [px + (3 - i) * 0.6, py + (3 - i) * 1.4]);
    art.style.setProperty(`--glass-fracture-${index}`, polygon([...points, ...taper.reverse()]));
  });
  glassFlakes.forEach(({ joint, spread: [dx, dy] }, index) => {
    const [ax, ay] = inner[joint];
    const [bx, by] = inner[joint + 1];
    const reach = amount * amount;
    art.style.setProperty(`--glass-flake-${index}`, polygon([
      [ax, ay], [(ax + bx) / 2 + dx * reach, (ay + by) / 2 + dy * reach], [bx, by],
    ]));
  });
}

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
  paintGlass(art, stage, tear.opening);
  const [left, top, width, height] = stage.viewBox;

  const visitor = tear.visitor;
  if (!visitor) return;
  const palms = Math.min(1, visitor.through / 0.4);
  const shoulders = Math.max(0, (visitor.through - 0.4) / 0.6);
  const properties = {
    "--visitor-x": `${(visitor.x - left) / width * 100}%`,
    "--visitor-y": `${(visitor.y - top) / height * 100}%`,
    "--visitor-scale": visitor.scale,
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
