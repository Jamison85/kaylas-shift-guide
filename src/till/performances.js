import { Motion } from "./rig.js";
import { deskY } from "./stages.js";

const { angle, arm, between, blink, knots, pulse, shift, stance, v } = Motion;

function look(pose, tilt, gaze, expression) {
  angle(pose.bones, "head", tilt);
  pose.face = { gaze, ...expression };
}

function gesture(pose, side, target, weight, angle, hand) {
  pose.armFront = [side === "R" ? "right" : "left"];
  return arm(pose, side, target, weight, angle, hand);
}

function greet(t, { direction }) {
  const reach = pulse(t, 0.08, 0.31, 0.72, 0.98);
  const handOff = between(t, 0.54, 0.75);
  const address = pulse(t, 0.54, 0.72, 0.82, 0.99);
  const wristSwing = knots(t, [[0.3, 0], [0.37, -13], [0.43, 12], [0.49, -9], [0.56, 0]]);
  const side = direction === "left" ? "R" : "L";
  const sign = side === "R" ? -1 : 1;
  const pose = stance({ x: -sign * 16 * reach, y: 7 * reach, lean: -sign * reach });
  angle(pose.bones, "chest", sign * (1.3 * reach + 1.7 * address));
  look(pose, -sign * 2.4 * reach + sign * 3.6 * address, [sign * 3.9 * address, 1.5 * address], {
    blink: blink(t, 0.14, 0.022, 0.039), brow: reach - 0.65 * address,
  });
  const target = v([525 + sign * 235, 362], [525 + sign * 254, 519], handOff);
  return gesture(pose, side, target, reach, sign * (-159 + handOff * 38) + wristSwing, "wave");
}

function orient(t, { emphasis = false, palm = false } = {}) {
  const see = pulse(t, 0.015, 0.22, 0.69, 0.97);
  const show = pulse(t, 0.15, 0.39, 0.73, 0.99);
  const pointY = emphasis ? 404 : 484;
  const pose = stance({ x: -12 * show, y: 7 * show, lean: -0.9 * show });
  angle(pose.bones, "chest", -2.8 * show);
  look(pose, -3.6 * see + 1.7 * between(t, 0.53, 0.68) * see, [-4 * see, 0.9 * see], {
    blink: blink(t, 0.65, 0.023, 0.049),
    brow: (emphasis ? 1.75 : 0.65) * show,
  });
  const lift = 23 * pulse(t, 0.43, 0.53, 0.57, 0.73);
  return gesture(pose, "R", [emphasis ? 300 : 272, pointY - lift], show,
    emphasis ? 153 : palm ? 119 : 106, palm ? "open_palm" : "point");
}

function scan(t) {
  const far = pulse(t, 0.02, 0.22, 0.37, 0.55);
  const near = pulse(t, 0.38, 0.59, 0.76, 0.99);
  const pose = stance({ x: 13 * far - 17 * near, y: 6 * near, lean: 1.6 * far - 1.5 * near });
  angle(pose.bones, "chest", 2.7 * far - 2.3 * near);
  look(pose, 4.2 * far - 3.8 * near, [4.4 * far - 4.3 * near, 1.8 * near], {
    blink: blink(t, 0.47, 0.024, 0.044), brow: 1.2 * far + 0.6 * near,
  });
  return gesture(pose, "R", [280, 520], 0.8 * near, 104, "open_palm");
}

function checkWatch(t) {
  const raise = pulse(t, 0.05, 0.38, 0.67, 0.99);
  const read = pulse(t, 0.15, 0.39, 0.61, 0.89);
  const acknowledge = pulse(t, 0.63, 0.76, 0.79, 0.96);
  const pose = stance({ x: -7 * raise, y: 6 * raise, lean: raise });
  angle(pose.bones, "chest", 1.6 * raise);
  look(pose, 4.6 * read + 4 * acknowledge, [2.7 * read, 3.7 * read], {
    mouth: "relaxed", mouthWeight: 0.54 * read, brow: 1.4 * acknowledge,
    blink: blink(t, 0.65, 0.021, 0.039),
  });
  pose.armFront = ["left"];
  return arm(pose, "L", [594, 566 - 11 * acknowledge], raise, 84 - 12 * acknowledge, "relaxed", 1);
}

function handContact(side, target, weight, angle, hand, point = "grip") {
  return { side, target, weight, angle, hand, socket: point, range: 15, bend: side === "L" ? 1 : -1 };
}

function handlePaper(t, receipt) {
  const grip = pulse(t, 0.025, 0.21, 0.87, 0.99);
  const lift = pulse(t, 0.16, 0.38, 0.72, 0.9);
  const read = pulse(t, 0.14, 0.34, 0.69, 0.91);
  const secondLook = pulse(t, 0.49, 0.58, 0.65, 0.77);
  const pose = stance({ x: 5 * lift, y: 7 * lift, lean: lift });
  const tip = receipt ? -13 * lift + 20 * secondLook : 6 * lift - 8 * secondLook;
  const origin = receipt
    ? [612 - 76 * lift + 15 * secondLook, deskY + 22 - 207 * lift - 19 * secondLook]
    : [438 + 15 * secondLook, deskY + 21 - 190 * lift + 6 * secondLook];
  const radians = tip * Math.PI / 180;
  const attach = (x, y) => [
    origin[0] + x * Math.cos(radians) - y * Math.sin(radians),
    origin[1] + x * Math.sin(radians) + y * Math.cos(radians),
  ];
  look(pose, 3.1 * read - 4.8 * secondLook, [1.4 * read + 1.2 * secondLook, 3.8 * read], {
    mouth: "closed", mouthWeight: 0.59 * read,
    browByEye: { left: 1.8 * secondLook, right: -0.35 * read },
    blink: blink(t, 0.53, 0.02, 0.034),
  });
  pose.armFront = receipt ? ["left"] : ["left", "right"];
  pose.socketContacts = receipt
    ? [handContact("L", attach(55, 39), grip, 77, "pinch")]
    : [
        handContact("R", attach(16, 62), grip, -78, "grip"),
        handContact("L", attach(157, 55), grip, 81, "grip"),
      ];
  pose.workProp = { name: receipt ? "receipt" : "paperwork", origin, angle: tip, opacity: 1 };
  return pose;
}

function makeNote(t, context, writing) {
  const id = writing ? "write_on_clipboard" : "clipboard_hold_side";
  const lift = pulse(t, 0.16, 0.38, 0.72, 0.9);
  const grip = pulse(t, 0.025, 0.21, 0.87, 0.99);
  const origin = [464, deskY + 22 - 213 * lift];
  const pose = Motion.clips.get(id).sample(t, { ...context, boardOrigin: origin });
  pose.socketContacts[0].target[1] -= 28;
  pose.socketContacts[0].weight = grip;
  if (writing) pose.socketContacts[1].weight *= between(lift, 0.45, 0.85);
  const liftEyes = pulse(t, 0.64, 0.72, 0.81, 0.96);
  look(pose, 3 * (pose.board.opacity - liftEyes), [-0.65 * pose.board.opacity, 2.7 * pose.board.opacity - 2.4 * liftEyes], {
    mouth: pose.face.mouth, mouthWeight: pose.face.mouthWeight, brow: pose.face.brow,
    blink: blink(t, 0.67, 0.023, 0.04),
  });
  pose.board.opacity = 1;
  return pose;
}

function followLine(t) {
  const check = pulse(t, 0.03, 0.27, 0.78, 0.99);
  const trace = between(t, 0.33, 0.62);
  const pose = stance({ x: -13 * check, y: 10 * check, lean: -1.1 * check });
  angle(pose.bones, "chest", -3 * check);
  look(pose, (-3.5 + 2 * trace) * check, [(-4.6 + 3.1 * trace) * check, 3.1 * check], {
    mouth: "relaxed", mouthWeight: 0.6 * check, blink: blink(t, 0.76, 0.02, 0.043),
  });
  return gesture(pose, "R", [275 + 49 * trace, 477 + 42 * trace], check, 112 - 24 * trace, "point");
}

function restOnCounter(t) {
  const reach = pulse(t, 0.04, 0.30, 0.73, 0.99);
  const weight = pulse(t, 0.23, 0.42, 0.70, 0.92);
  const pose = stance({ x: 26 * weight, y: 15 * weight, lean: 2.9 * weight });
  angle(pose.bones, "chest", 3.4 * weight);
  look(pose, -5.1 * weight, [-2.3 * weight, 0], {
    blink: blink(t, 0.47, 0.025, 0.06), brow: 1.02 * weight,
  });
  pose.armFront = ["left"];
  pose.socketContacts = [handContact("L", [756, deskY + 2], reach, -10, "open_palm")];
  return pose;
}

function stepAside(t, from, distance) {
  const travel = between(t, 0.05, 0.95);
  const load = Math.sin(Math.PI * travel);
  const pose = stance({ y: 13 * load, lean: 2.1 * Math.sign(distance) * load });
  shift(pose.bones, "root", from + distance * travel, 0);
  const lead = distance > 0 ? "L" : "R";
  for (const side of ["R", "L"]) {
    const first = side === lead;
    const phase = between(t, first ? 0.01 : 0.48, first ? 0.51 : 0.98);
    const foot = pose.ik["foot" + side];
    foot.target[0] += from + distance * phase;
    foot.target[1] -= 42 * Math.sin(Math.PI * phase);
    angle(pose.bones, "upperArm" + side, (first ? -1 : 1) * load * 5);
  }
  return pose;
}

function peek(t) {
  const distance = 132;
  if (t < 0.29) return stepAside(t / 0.29, 0, distance);
  if (t > 0.68) return stepAside((t - 0.68) / 0.32, distance, -distance);
  const lean = pulse(t, 0.29, 0.44, 0.57, 0.68);
  const pose = stepAside(1, 0, distance);
  angle(pose.bones, "chest", -11.6 * lean);
  look(pose, 7.1 * lean, [-4.4 * lean, 0.25 * lean], {
    blink: blink(t, 0.51, 0.02, 0.045), browByEye: { right: 1.7 * lean, left: 0.65 * lean },
  });
  return pose;
}

function settleShift(t, context) {
  const pause = pulse(t, 0, 0.17, 0.25, 0.49);
  const pose = Motion.thumbs(t, context);
  shift(pose.bones, "chest", 0, 7 * pause);
  look(pose, -4.8 * pause + 2.1 * pulse(t, 0.48, 0.59, 0.62, 0.77), [0, -1.4 * pause], {
    ...pose.face, blink: blink(t, 0.24, 0.035, 0.076), brow: 1.4 * pause,
  });
  return pose;
}

const performances = {
  wave_hello: { duration: 2.75, sample: greet },
  guide_to_step: { duration: 2.15, sample: t => orient(t) },
  check_surroundings: { duration: 2.55, sample: scan },
  check_watch: { duration: 2.2, sample: checkWatch },
  straighten_reports: { duration: 2.9, sample: t => handlePaper(t, false) },
  compare_receipt: { duration: 3.12, sample: t => handlePaper(t, true) },
  read_clipboard: { duration: 2.64, sample: (t, context) => makeNote(t, context, false) },
  jot_a_note: { duration: 3.18, sample: (t, context) => makeNote(t, context, true) },
  follow_line: { duration: 2.65, sample: followLine },
  rest_on_counter: { duration: 3.05, sample: restOnCounter },
  peek_from_counter: { duration: 4.05, sample: peek },
  offer_help: { duration: 2.35, sample: t => orient(t, { palm: true }) },
  emphasize_detail: { duration: 2.05, sample: t => orient(t, { emphasis: true }) },
  wrap_shift: { duration: 2.85, sample: settleShift },
};

export function getPerformance(id) {
  const clip = performances[id] || Motion.clips.get(id);
  if (!clip || (clip.view && clip.view !== "front")) throw new Error(`Unknown Till movement: ${id}`);
  return clip;
}

export function samplePerformance(clip, time, context) {
  return time > 0 && time < 1 ? clip.sample(time, context) : {};
}
