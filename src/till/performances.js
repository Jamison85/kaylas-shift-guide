import { Motion } from "./rig.js";
import { deskY, floorY, seat } from "./stages.js";

const { arm, angle, between, clamp, hold, stance, TAU, profileStage, profileRoll } = Motion;
const left = "left";
const right = "right";

const socket = (side, target, weight, degrees, hand, point = "grip") => ({
  side, target, weight, angle: degrees, hand, socket: point,
  bend: side === "L" ? 1 : -1,
  range: 22,
});

function lookingDown(pose, weight, toward = 0) {
  angle(pose.bones, "head", 2.5 * weight);
  pose.face = {
    gaze: [toward * weight, 3.1 * weight],
    mouth: "relaxed",
    mouthWeight: 0.62 * weight,
    brow: -0.35 * weight,
  };
}

function watch(t) {
  const q = hold(t, 0.32, 0.28);
  const pose = stance({ x: -3 * q, y: 3 * q });
  lookingDown(pose, q, 2.3);
  angle(pose.bones, "chest", 1.9 * q);
  arm(pose, "L", [586, 542], q, 86, "relaxed", 1);
  if (q > 0.15) pose.armFront = ["left"];
  return pose;
}

function holdObject(t, name) {
  const q = hold(t, 0.33, 0.28);
  const pose = stance({ x: 6 * q, y: 6 * q, lean: 1.1 * q });
  const fidget = Math.sin(TAU * 2.05 * t) * q;
  lookingDown(pose, q, name === "pizza" ? -0.4 : 0.25);

  const origin = name === "receipt"
    ? [532 + fidget * 6, 828 - 305 * q + fidget * 9]
    : [525 - (name === "pizza" ? 118 : 82) * q, 859 - 270 * q - fidget * 5];
  pose.socketContacts = name === "receipt"
    ? [socket("L", [origin[0] + 49, origin[1] + 63], q, 74, "pinch")]
    : [
        socket("R", [origin[0] + 15, origin[1] + (name === "pizza" ? 57 : 82)], q, -88, "grip"),
        socket("L", [origin[0] + (name === "pizza" ? 218 : 158), origin[1] + 67], q, 79, "grip"),
      ];
  pose.armFront = name === "receipt" ? ["left"] : ["left", "right"];
  pose.workProp = { name, origin, opacity: between(q, 0.62, 0.92) };
  return pose;
}

function sweep(t) {
  const q = hold(t, 0.26, 0.26);
  const reach = Math.sin(TAU * 1.8 * (t - 0.19)) * q;
  const tilt = -10 - reach * 12;
  const pose = stance({ x: reach * 15, y: 8 * q, lean: 1.7 * q });
  lookingDown(pose, q, 1.1);

  const rad = tilt * Math.PI / 180;
  const scale = [0.76, 1.94];
  const rotate = (x, y) => {
    const a = x * scale[0];
    const b = y * scale[1];
    return [a * Math.cos(rad) - b * Math.sin(rad), a * Math.sin(rad) + b * Math.cos(rad)];
  };
  // The bristles follow the floor. Both grip sockets follow the same handle.
  const tip = rotate(40, 391);
  const origin = [741 + reach * 135 - tip[0], floorY - 2 - tip[1]];
  const at = (x, y) => rotate(x, y).map((value, axis) => value + origin[axis]);
  pose.workProp = { name: "broom", origin, angle: tilt, scale, opacity: between(q, 0.56, 0.92) };
  pose.socketContacts = [
    socket("L", at(40, 32), q, -15, "grip"),
    socket("R", at(40, 73), q, -95, "grip"),
  ];
  pose.armFront = ["right", "left"];
  return pose;
}

function leanOnDesk(t) {
  const q = hold(t, 0.34, 0.32);
  const pose = stance({ x: 23 * q, y: 12 * q, lean: 2.3 * q });
  angle(pose.bones, "head", -2.9 * q);
  angle(pose.bones, "chest", 3 * q);
  pose.face = { gaze: [-2.4 * q, 0.25 * q], brow: q * 0.7 };
  pose.socketContacts = [socket("L", [757, deskY - 4], q, -8, "open_palm")];
  pose.armFront = ["left"];
  return pose;
}

function stepBehindCounter(t, from, distance) {
  const load = Math.sin(Math.PI * t);
  const lead = distance > 0 ? "L" : "R";
  const pose = stance({ y: 16 * load, lean: 2.2 * Math.sign(distance) * load });
  pose.bones.root = { offset: [from + distance * between(t, 0.06, 0.95), 0] };
  for (const side of ["R", "L"]) {
    const first = side === lead;
    const phase = between(t, first ? 0.03 : 0.48, first ? 0.51 : 0.97);
    const foot = pose.ik["foot" + side];
    foot.target[0] += from + distance * phase;
    foot.target[1] -= (first ? 43 : 34) * Math.sin(Math.PI * phase);
    angle(pose.bones, "upperArm" + side, (first ? -1 : 1) * 7 * load);
  }
  return pose;
}

function peek(t) {
  const distance = 305;
  if (t < 0.30) return stepBehindCounter(t / 0.30, 0, distance);
  if (t > 0.68) return stepBehindCounter((t - 0.68) / 0.32, distance, -distance);
  const q = hold((t - 0.30) / 0.38, 0.31, 0.3);
  const pose = stepBehindCounter(1, 0, distance);
  angle(pose.bones, "chest", -11 * q);
  angle(pose.bones, "neck", -1.8 * q);
  angle(pose.bones, "head", 6.7 * q);
  pose.face = { gaze: [-3.2 * q, -0.2 * q], brow: 0.7 * q };
  return pose;
}

function frontFinish(pose, progress) {
  // Every frontal gesture enters and leaves the same relaxed stance.
  const gain = between(progress, 0, 0.095) * (1 - between(progress, 0.89, 1));
  if (gain === 1) return pose;
  if (gain < 0.005) return {};
  for (const value of Object.values(pose.bones || {})) {
    value.angle = (value.angle || 0) * gain;
    if (value.offset) value.offset = value.offset.map(n => n * gain);
    if (value.scale) value.scale = value.scale.map(n => 1 + (n - 1) * gain);
  }
  for (const value of Object.values(pose.ik || {})) value.weight = (value.weight ?? 1) * gain;
  return pose;
}

function profilePose(context, offset = 0) {
  const stage = profileStage(context);
  return Motion.clips.get("profile_neutral").sample(0, { ...context, distance: offset * stage.d });
}

function turn(t, context, offset = 0, reverse = false) {
  const direction = context.direction === left ? -1 : 1;
  const yaw = reverse ? 1 - t : t;
  if (yaw >= 0.73) {
    const pose = profilePose(context, offset);
    pose.bones.root.scale = [1 + 0.04 * (1 - between(yaw, 0.73, 1)), 1];
    pose.bones.head = { angle: -1.25 * Math.sin(Math.PI * yaw) };
    return pose;
  }
  if (yaw >= 0.33) {
    const plane = between(yaw, 0.33, 0.73);
    return {
      view: direction > 0 ? "quarterRight" : "quarterLeft",
      bones: { root: { offset: [offset + direction * 8 * Math.sin(Math.PI * plane), 0], scale: [1.03 - 0.12 * plane, 1] } },
    };
  }
  const q = between(yaw, 0, 0.33);
  const pose = stance({ x: direction * 13 * q, y: 14 * Math.sin(Math.PI * q), spread: -32 * q });
  pose.bones.root = { offset: [offset, 0], scale: [1 - 0.17 * q, 1] };
  pose.ik.footR.target[0] += offset;
  pose.ik.footL.target[0] += offset;
  pose.ik.footR.weight = 0.35 * q;
  pose.ik.footL.weight = 0.32 * q;
  angle(pose.bones, "chest", direction * 2.7 * q);
  angle(pose.bones, "head", direction * 3.4 * q);
  pose.bones.head.scale = [1 - 0.04 * q, 1];
  pose.face = { gaze: [direction * 4.2 * q, 0] };
  return pose;
}

function steps(t, context, offset, length) {
  const stage = profileStage(context);
  const distance = length * stage.d;
  const tempo = between(t, 0.08, 0.94);
  const load = Math.sin(Math.PI * t);
  const leading = stage.d > 0 ? "R" : "L";
  const pose = {
    view: stage.view,
    bones: {
      root: { offset: [offset + distance * tempo, 0] },
      pelvis: { offset: [0, 25 * load], angle: stage.d * 1.45 * Math.sin(TAU * t) },
      chest: { angle: stage.d * (2.7 * load - 2.4 * Math.sin(TAU * t)) },
      head: { angle: -stage.d * 1.3 * Math.sin(TAU * t) },
    },
    ik: {},
    contacts: {},
  };
  for (const side of ["L", "R"]) {
    const first = side === leading;
    const localTime = clamp((t - (first ? 0.035 : 0.475)) / (first ? 0.48 : 0.485));
    const lift = Math.pow(Math.sin(Math.PI * localTime), 1.5);
    const advance = offset + distance * between(localTime, 0, 1);
    const pitch = stage.d * 11 * Math.sin(TAU * localTime);
    pose.ik["foot" + side] = profileRoll(side, stage, "sole", advance, -52 * lift, pitch);
    if (lift < 0.001) {
      const [x, y] = stage.ref("sole" + side);
      pose.contacts["sole" + side] = [x + advance, y];
    }
    const swing = Math.sin(TAU * t) * load * (first ? -1 : 1);
    angle(pose.bones, "upperArm" + side, stage.d * 17 * swing);
    angle(pose.bones, "forearm" + side, -stage.d * (5 * load + 7 * swing));
  }
  return pose;
}

function walkOutAndBack(t, context) {
  const direction = context.direction === left ? -1 : 1;
  const back = { ...context, direction: direction > 0 ? left : right };
  const length = 255;
  const offset = direction * length;
  if (t < 0.11) return turn(t / 0.11, context);
  if (t < 0.37) return steps((t - 0.11) / 0.26, context, 0, length);
  if (t < 0.50) return turn((t - 0.37) / 0.13, context, offset, true);
  if (t < 0.63) return turn((t - 0.50) / 0.13, back, offset);
  if (t < 0.89) return steps((t - 0.63) / 0.26, back, offset, length);
  return turn((t - 0.89) / 0.11, back, 0, true);
}

function sitAndRest(t, context) {
  const side = { ...context, direction: left, seat };
  if (t < 0.11) return turn(t / 0.11, side);
  if (t < 0.35) return Motion.clips.get("sit_down").sample((t - 0.11) / 0.24, side);
  if (t < 0.64) {
    const local = (t - 0.35) / 0.29;
    const pose = Motion.clips.get("seated_hold").sample(0, side);
    const stage = profileStage(side);
    pose.seatMount = { target: seat, clearance: 20 };
    for (const [leg, phase] of [["L", 0], ["R", Math.PI]]) {
      const w = hold(local, 0.22, 0.24);
      const swing = Math.sin(TAU * local + phase) * w;
      const advance = (leg === "L" ? 132 : 102) + 22 * swing;
      pose.ik["foot" + leg] = profileRoll(leg, stage, "sole", -advance, -66 * w - 15 * Math.abs(swing), -7 * swing);
      delete pose.contacts["sole" + leg];
    }
    return pose;
  }
  if (t < 0.89) return Motion.clips.get("stand_up").sample((t - 0.64) / 0.25, side);
  return turn((t - 0.89) / 0.11, side, 0, true);
}

const custom = {
  check_watch: { duration: 2.35, sample: watch },
  sort_receipt: { duration: 3.8, sample: (t) => holdObject(t, "receipt") },
  carry_paperwork: { duration: 3.25, sample: (t) => holdObject(t, "paperwork") },
  carry_pizza: { duration: 3.5, sample: (t) => holdObject(t, "pizza") },
  sweep_floor: { duration: 4.05, sample: sweep },
  lean_on_desk: { duration: 3.45, sample: leanOnDesk },
  peek_from_counter: { duration: 4.2, sample: peek },
  walk_left: { duration: 4.65, sample: walkOutAndBack, direction: left, profiles: true },
  walk_right: { duration: 4.65, sample: walkOutAndBack, direction: right, profiles: true },
  take_a_seat: { duration: 5.8, sample: sitAndRest, profiles: true },
};

export function getPerformance(id) {
  const clip = custom[id] || Motion.clips.get(id);
  if (!clip) throw new Error(`Unknown Till movement: ${id}`);
  return clip;
}

export function samplePerformance(clip, time, context) {
  if (time >= 1) return {};
  const pose = clip.sample(time, { ...context, direction: clip.direction || context.direction });
  if (clip.profiles || clip === custom.peek_from_counter) return pose;
  if (clip.id === "idle_breathe") {
    const q = 0.5 - 0.5 * Math.cos(TAU * time);
    return { bones: { chest: { scale: [1 + 0.011 * q, 1 + 0.005 * q], offset: [0, -3 * q] } } };
  }
  return frontFinish(pose, time);
}
