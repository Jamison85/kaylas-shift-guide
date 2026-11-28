export const noteTube = { x: 848, hatchY: 507, exitY: -112, width: 116 };

export const tubeNotes = [
  "A goose keeps hitting Close Door in the elevator. Corporate asked if he can train the new leads.",
  "The printer jammed again. It’s the only thing here taking its break on time.",
  "Someone asked if the coffee was fresh while I was pouring it. I said, ‘It’s still being born.’",
  "I sent a note through the tube and got a crumb back. Finally, a two-way relationship.",
  "The goose has a lanyard now. Mine still says VISITOR and I live in here.",
  "I wiped the counter. The next guest set down a leaking cup. These things used to take a minute.",
  "I asked the safe to open up. It said that sounded like a second-date question.",
  "A customer asked if I worked here while I was wearing my name tag. I said, ‘They’re trying me out.’",
  "The goose called a staff meeting and ate the agenda. Best meeting we’ve had.",
  "I found a pen that works. I put it back down. I miss who I was thirty seconds ago.",
  "There’s a sock behind your battery. Before you ask, yes, it has a tiny name tag.",
  "Your low-battery alert sounds like a warning. Down here, the lights actually flicker.",
  "I put one box on a shelf and the whole stack came toward me. Nice to feel wanted.",
  "The goose walked past a wet-floor sign with real confidence. A man who can swim fears nothing.",
  "The cooler fogged my glasses. For ten seconds I was stocking soda by instinct and ancestry.",
  "The label printer printed 37 blank stickers and one that says ‘OK.’ We’re apparently both done.",
  "At five in the morning, ‘quick question’ is how a ten-minute story introduces itself.",
  "The tube fired my receipt back at me. I’ve never been corrected by plumbing before.",
  "The goose put ‘fluent in Microsoft Honk’ on his résumé. The interview’s at nine.",
  "I found a soda with the old label. It asked how the remodel went.",
  "Thanks for charging your phone overnight. I was doing bookwork by the light of your icons.",
  "Somebody said ‘We’re all caught up.’ The truck backed in so fast I heard the beeping in stereo.",
  "A box of paper cups rolled out of the back room one cup at a time. We have a parade now.",
  "The goose got promoted. He asked me to circle back. I drew him a pond.",
  "I wore my headset into the bathroom. Someone asked for a price check. We both learned a lesson.",
  "After the third reheat, I’m pretty sure the microwave and my coffee are dating.",
  "A guest said ‘keep the penny’ like he was about to change my life. I thanked him with both hands.",
  "I told the computer to remember me. It forgot before I made it back to the chair.",
  "The goose tried to lead a huddle. Six people showed up with crackers. Strong turnout.",
  "If you swipe my desk away again, please give me a second to pick up my coffee.",
  "I pulled a receipt out of my pocket so long it made eye contact with the floor.",
  "The printer finally printed my page. It was yesterday’s. I felt like I should send it a birthday card.",
  "The goose filed a grievance. It’s a wet footprint on a sticky note. I’m forwarding it.",
  "I found a note on the clipboard that said ‘see other clipboard.’ We have a sequel.",
  "I practiced saying ‘good morning’ in the back office. The microwave beeped me offstage.",
  "The office clock says six. The register says five fifty-eight. I got two minutes of my life back.",
  "The goose quit. He left a note that says HONK HONK. Pretty generous notice.",
  "I said the word ‘quiet.’ Two customers walked in and the printer woke up.",
  "I sent my coffee through the tube as a field test. If your screen smells like hazelnut, call me.",
  "The elevator doors opened. Two geese. I’ll be in my office if anyone asks.",
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
