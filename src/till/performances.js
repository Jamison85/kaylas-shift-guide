import { Motion } from "./rig.js";
import { deskY } from "./stages.js";
import { noteTube } from "./scenery.js";

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

function gripEdge(pose, y, weight, rightWeight = 0) {
  pose.armFront = rightWeight > 0 ? ["left", "right"] : ["left"];
  pose.edgeHands = pose.armFront.filter(side => (side === "left" ? weight : rightWeight) > 0.56);
  pose.socketContacts = [handContact("L", [683, y], weight, 12, "ledge", "ledge")];
  if (rightWeight > 0) pose.socketContacts.push(handContact("R", [372, y - 1], rightWeight, -14, "ledge", "ledge"));
}

function riseOverEdge(t, { edgeY, restsOnEdge }) {
  const rise = between(t, 0.02, 0.63);
  const grip = pulse(t, 0.49, 0.65, 0.75, 0.99);
  const peek = pulse(t, 0.28, 0.46, 0.61, 0.96);
  const pose = { bones: {} };
  shift(pose.bones, "root", 18 * (1 - rise), (edgeY + 6) * (1 - rise));
  angle(pose.bones, "chest", -4.8 * peek);
  look(pose, 6.4 * peek, [-1.8 * peek, -1.1 * peek], {
    brow: 2.4 * peek, blink: blink(t, 0.69, 0.042, 0.072),
  });
  const rest = restsOnEdge ? between(t, 0.49, 0.67) : 0;
  gripEdge(pose, edgeY + 4, Math.max(grip, rest), grip);
  return pose;
}

const climbSeconds = 12.4;
const exitSeconds = 2.1;
const awaySeconds = 0.85;
const roundTripSeconds = exitSeconds + awaySeconds + climbSeconds;

const peepCenter = [505, 365];

function projectVisitor(x, y, depth, roll, reach, through, opacity) {
  // Depth is measured along the normal to the glass. 0 is the glass plane.
  const zoom = 620 / (620 + depth);
  return {
    x: peepCenter[0] + (x - peepCenter[0]) * zoom,
    y: peepCenter[1] + (y - peepCenter[1]) * zoom,
    width: 610 * zoom,
    parallax: Math.max(0.7, Math.min(8, depth / 180)),
    roll, reach, through, opacity,
  };
}

function risingPose(x, head, scale) {
  return { bones: { root: { scale: [scale, scale], offset: [x, head - 1434 * (1 - scale)] } } };
}

function palmPass(time, start, covered, hold, end) {
  return {
    opacity: pulse(time, start, covered, hold, end),
    x: knots(time, [[start, -24], [covered, 0], [hold, 0], [end, 31]]),
  };
}

function brushOff(time, pose, x, head, scale, edgeY) {
  const left = pulse(time, 9.55, 9.78, 10.28, 10.48);
  const right = pulse(time, 10.48, 10.73, 11.22, 11.48);
  const firstStroke = between(time, 9.90, 10.26);
  const secondStroke = between(time, 10.85, 11.20);
  if (left || right) {
    pose.armFront = ["left", "right"];
    arm(pose, "L", [525 + x - 34 + 146 * firstStroke, head + scale * (448 + 173 * firstStroke)],
      left, 13, "open_palm");
    arm(pose, "R", [525 + x + 15 - 143 * secondStroke, head + scale * (450 + 179 * secondStroke)],
      right, -13, "open_palm");
    const first = time < 10.48;
    const flick = first ? between(time, 10.03, 10.47) : between(time, 11.0, 11.50);
    if (flick > 0 && flick < 1) {
      pose.scenery.dust = {
        x: 525 + x + (first ? 1 : -1) * (100 + 94 * flick),
        y: head + 583 * scale - 24 * flick,
        light: Math.sin(Math.PI * flick),
      };
    }
  } else {
    gripEdge(pose, edgeY + 4, between(time, 11.44, 12.27));
  }
}

function climbThroughRip(t, { edgeY }) {
  const time = t * climbSeconds;
  const opening = knots(time, [[0, 0], [0.59, 0.13], [0.85, 0.08], [1.62, 1],
    [8.98, 1], [9.54, 0.48], [10.02, 0]]);
  const depth = knots(time, [[0, 1575], [1.65, 1510], [2.67, 1510], [3.24, 1120],
    [3.53, 1075], [4.26, 722], [4.56, 956], [4.86, 903], [5.62, 408],
    [6.00, 317], [6.63, 160], [6.99, 115], [7.65, 0], [8.24, -51], [8.94, -55]]);
  const x = knots(time, [[0, 662], [2.59, 662], [3.45, 719], [4.26, 624],
    [4.62, 721], [5.62, 572], [6.65, 544], [8.14, 496], [8.90, 522]]);
  const y = knots(time, [[0, 686], [2.64, 686], [3.54, 576], [4.26, 533], [4.62, 592],
    [5.62, 427], [6.63, 346], [7.57, 295], [8.49, 260], [9.15, 218]]);
  const slip = pulse(time, 4.21, 4.53, 4.68, 5.07);
  const rocking = knots(time, [[0, 0], [2.39, -1.8], [3.20, 5], [4.14, -4], [4.56, 14],
    [5.45, -5], [6.64, -4], [7.68, 3], [8.48, -1.5], [9.15, 0]]);
  const reach = time >= 2.97 ? 1 : 0;
  const through = between(time, 6.71, 8.51);
  const palmCover = palmPass(time, 8.79, 9.02, 9.12, 9.44);
  const portrait = time >= 9.06 ? 1 : 0;
  const settle = between(time, 9.06, 9.48);
  const visitor = projectVisitor(x, y, depth, rocking, reach, through,
    between(time, 0.93, 1.48) * (1 - portrait));
  const scale = knots(time, [[0, 0.82], [8.93, 0.84], [9.54, 0.93], [11.5, 0.95], [climbSeconds, 1]]);
  const head = knots(time, [[0, 96], [8.93, 96], [9.50, 42], [11.55, 26], [climbSeconds, 0]]);
  const restX = knots(time, [[0, -4], [9.20, -4], [climbSeconds, 0]]);
  const pose = risingPose(restX, head, scale);
  pose.scenery = {
    tear: { opening, visitor: portrait < 1 ? visitor : null, portrait, cover: palmCover,
      phase: time < 0.92 ? "opening" : time < 1.64 ? "tugging" : time < 2.80 ? "peeking"
        : time < 4.27 ? "ladder" : time < 4.75 ? "slipping" : time < 6.72 ? "bracing"
          : time < 8.9 ? "crossing" : time < 9.54 ? "standing" : time < 11.51 ? "dusting" : "closing",
    },
  };
  look(pose, -3.4 * (1 - settle), [-0.2, -1.8 * (1 - settle)], {
    mouth: "relaxed", mouthWeight: 0.66 * (1 - settle), blink: blink(time, 9.68, 0.035, 0.065),
  });
  if (time > 8.88 && time < 9.5) {
    const release = 1 - between(time, 9.04, 9.5);
    pose.armFront = ["right"];
    arm(pose, "R", [342 + 21 * settle, 458 + 160 * settle], release * 0.67, 112, "open_palm");
  } else if (time >= 9.5) {
    brushOff(time, pose, restX, head, scale, edgeY);
  }

  // The slide on the ladder sends him deeper again before he closes on the glass.
  visitor.parallax *= 1 + slip * 0.24;
  return pose;
}

function leaveAndReturn(t, context) {
  const elapsed = t * roundTripSeconds;
  const returnAt = exitSeconds + awaySeconds;
  if (elapsed < exitSeconds) {
    const progress = elapsed / exitSeconds;
    const retreat = between(progress, 0.22, 0.93);
    const pose = risingPose(0, 25 * retreat, 1 - 0.08 * retreat);
    gripEdge(pose, context.edgeY + 4, 1 - between(progress, 0.04, 0.31));
    const transfer = progress >= 0.30 ? 1 : 0;
    pose.scenery = { tear: {
      opening: pulse(progress, 0, 0.24, 0.67, 0.99),
      visitor: projectVisitor(508 + 173 * retreat, 221 + 464 * retreat, -38 + 1397 * retreat,
        -7 * retreat, 1, 1 - between(progress, 0.40, 0.67), transfer * (1 - between(progress, 0.76, 0.99))),
      portrait: 1 - transfer,
      cover: palmPass(progress, 0.13, 0.27, 0.36, 0.53),
      phase: "exiting",
    } };
    return pose;
  }
  if (elapsed >= returnAt) return climbThroughRip((elapsed - returnAt) / climbSeconds, context);
  const pose = risingPose(0, 0, 1);
  pose.scenery = { tear: { opening: 0, portrait: 0, phase: "away" } };
  return pose;
}

function leanIn(t, { edgeY, restsOnEdge }, detail = false) {
  const listen = pulse(t, 0.025, 0.29, 0.68, 0.995);
  const nod = pulse(t, 0.47, 0.55, 0.58, 0.71);
  const pose = stance({ x: -18 * listen, y: 13 * listen, lean: -1.1 * listen });
  angle(pose.bones, "chest", -4.3 * listen);
  shift(pose.bones, "neck", -9 * listen, 8 * listen);
  look(pose, -2.3 * listen + 5.5 * nod, [detail ? -3.2 * listen : -0.7 * listen, detail ? 3.6 * listen : 1.5 * nod], {
    mouth: "subtle_smile", mouthWeight: 0.48 * listen, brow: 1.43 * listen,
    blink: blink(t, 0.33, 0.027, 0.051),
  });
  gripEdge(pose, edgeY + 4, restsOnEdge ? 1 : listen);
  return pose;
}

function knock(t, { edgeY }) {
  const reach = pulse(t, 0.03, 0.32, 0.72, 0.99);
  const tap = pulse(t, 0.33, 0.4, 0.43, 0.47) + pulse(t, 0.49, 0.56, 0.59, 0.65);
  const pose = stance({ x: 9 * reach, y: 6 * reach });
  look(pose, 4.5 * reach - 3 * tap, [1.5 * reach, 2.8 * reach], {
    brow: 0.92 * reach, blink: blink(t, 0.5, 0.02, 0.038),
  });
  gripEdge(pose, edgeY + 4 - 19 * (reach - tap), 1);
  return pose;
}

function glanceFromEdge(t, { edgeY }) {
  const turn = pulse(t, 0.12, 0.32, 0.58, 0.95);
  const pose = { bones: {} };
  look(pose, -3.3 * turn, [-3.2 * turn, 1.7 * turn], {
    blink: blink(t, 0.68, 0.035, 0.071), brow: 1 * turn,
  });
  gripEdge(pose, edgeY + 4, 1);
  return pose;
}

function sendTubeNote(t, { edgeY }) {
  const tube = noteTube;
  const reach = pulse(t, 0.20, 0.35, 0.50, 0.65);
  const lean = pulse(t, 0.13, 0.39, 0.54, 0.81);
  const flight = Math.max(0, Math.min(1, (t - 0.59) / 0.18));
  const x = knots(t, [[0.16, 644], [0.31, 713], [0.42, 761], [0.49, tube.x]]);
  const y = flight > 0
    ? tube.hatchY + (tube.exitY - tube.hatchY) * flight ** 1.65
    : knots(t, [[0.16, edgeY + 67], [0.33, 583], [0.41, 526], [0.49, tube.hatchY]]);
  const profile = t >= 0.22 && t < 0.79;
  const quarter = !profile && t >= 0.14 && t < 0.87;
  const pose = { bones: {} };
  if (profile) {
    pose.view = "right";
    shift(pose.bones, "root", -16 + 43 * lean, -9 + 7 * lean);
    angle(pose.bones, "chest", 4.2 * lean);
    angle(pose.bones, "head", 10 * reach - 13 * flight);
    arm(pose, "R", [x - 34, y + 31], reach, knots(t, [[0.22, -29], [0.42, -58], [0.54, -46]]));
  } else if (quarter) {
    pose.view = "quarter";
    shift(pose.bones, "root", 16 * lean, -9 * lean);
    angle(pose.bones, "root", 0.9 * lean);
  } else {
    const glance = pulse(t, 0.01, 0.11, 0.15, 0.20);
    const nod = pulse(t, 0.88, 0.92, 0.94, 0.99);
    look(pose, 5 * glance + 4 * nod, [4.6 * glance, 0.7 * nod], {
      mouth: "relaxed", mouthWeight: 0.68 * nod, brow: 1.15 * nod, blink: blink(t, 0.96, 0.012, 0.026),
    });
    gripEdge(pose, edgeY + 4, 1 - glance * 0.85);
  }
  const tubePhase = t < 0.36 ? "idle" : t < 0.51 ? "loading" : t < 0.59 ? "sealed"
    : t < 0.77 ? "firing" : t < 0.91 ? "idle" : "address";
  pose.scenery = { tubePhase };
  if (t >= 0.20 && t < 0.77) {
    pose.scenery.prop = {
      name: "capsule", x, y, angle: 36 * (1 - between(t, 0.33, 0.49)),
      held: profile && t < 0.49 ? { anchor: "wristR", offset: [31, -25] } : null,
      releaseBlend: between(t, 0.24, 0.32) * (1 - between(t, 0.42, 0.49)),
    };
  }
  return pose;
}

function coffeeBreak(t, { edgeY, restsOnEdge }) {
  const holdCup = pulse(t, 0.035, 0.2, 0.84, 0.995);
  const toast = pulse(t, 0.21, 0.44, 0.65, 0.92);
  const x = knots(t, [[0, 383], [0.2, 407], [0.45, 414], [0.64, 418], [0.85, 404], [1, 383]]);
  const y = knots(t, [[0, edgeY + 67], [0.2, 562], [0.45, 444], [0.58, 449], [0.85, 571], [1, edgeY + 67]]);
  const pose = stance({ x: -13 * toast, y: 6 * toast, lean: -1.2 * toast });
  look(pose, -5.1 * toast, [-2.1 * holdCup, 1.6 * holdCup], {
    mouth: "subtle_smile", mouthWeight: 0.45 * toast, blink: blink(t, 0.52, 0.045, 0.075),
    brow: 1.85 * toast,
  });
  if (restsOnEdge) gripEdge(pose, edgeY + 4, 1);
  pose.armFront = [...(pose.armFront || []), "right"];
  pose.socketContacts = [...(pose.socketContacts || []), handContact("R", [x - 37, y + 18], holdCup, -92, "grip")];
  pose.scenery = { prop: { name: "mug", x, y, angle: -8 * toast } };
  return pose;
}

function flyPaperAirplane(t, { edgeY, restsOnEdge }) {
  const release = 0.46;
  const holdPlane = pulse(t, 0.025, 0.15, release, 0.65);
  const aim = pulse(t, 0.18, 0.31, 0.77, 0.98);
  const wrist = [
    knots(t, [[0, 350], [0.23, 302], [0.36, 300], [release, 274], [0.53, 263], [0.7, 343]]),
    knots(t, [[0, edgeY + 95], [0.23, 575], [0.36, 528], [release, 501], [0.53, 523], [0.7, 669]]),
  ];
  const x = knots(t, [[0, 333], [0.23, 268], [0.36, 266], [release, 232], [0.59, 150], [0.72, 178], [0.86, 245], [1, 293]]);
  const y = knots(t, [[0, edgeY + 70], [0.23, 550], [0.36, 501], [release, 472], [0.59, 361], [0.72, 438], [0.86, 564], [1, edgeY + 72]]);
  const pose = stance({ x: -12 * aim, y: 6 * aim, lean: -1.4 * aim });
  look(pose, -4.4 * aim, [-4.2 * aim, (y - 450) / 95 * aim], {
    browByEye: { right: 1.9 * aim, left: 0.85 * aim }, blink: blink(t, 0.83, 0.018, 0.04),
  });
  if (restsOnEdge) gripEdge(pose, edgeY + 4, 1);
  pose.armFront = [...(pose.armFront || []), "right"];
  arm(pose, "R", wrist, holdPlane, 110, t < release ? "grip" : "open_palm");
  const angle = knots(t, [[0, -3], [release, 10], [0.58, 22], [0.74, -33], [0.93, -84]]);
  const held = t < release ? { anchor: "gripR", offset: [-16, -19] } : null;
  pose.scenery = { prop: {
    name: "airplane", x, y, angle, held,
    releaseBlend: 1 - between(t, release, 0.61),
  } };
  return pose;
}

function handlePaper(t, receipt) {
  const grip = pulse(t, 0.025, 0.21, 0.87, 0.99);
  const lift = pulse(t, 0.16, 0.38, 0.72, 0.9);
  const read = pulse(t, 0.14, 0.34, 0.69, 0.91);
  const secondLook = pulse(t, 0.49, 0.58, 0.65, 0.77);
  const pose = stance({ x: 5 * lift, y: 7 * lift, lean: lift });
  const scale = receipt ? 1 : 1.3;
  const tip = receipt ? -13 * lift + 20 * secondLook : 4 * lift - 6 * secondLook;
  const origin = receipt
    ? [612 - 76 * lift + 15 * secondLook, deskY + 22 - 207 * lift - 19 * secondLook]
    : [414 + 11 * secondLook, deskY + 12 - 148 * lift + 6 * secondLook];
  const radians = tip * Math.PI / 180;
  const attach = (x, y) => [
    origin[0] + scale * (x * Math.cos(radians) - y * Math.sin(radians)),
    origin[1] + scale * (x * Math.sin(radians) + y * Math.cos(radians)),
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
        handContact("R", attach(12, 56), grip, -62, "grip"),
        handContact("L", attach(165, 55), grip, 64, "grip"),
      ];
  pose.workProp = { name: receipt ? "receipt" : "paperwork", origin, angle: tip, scale: [scale, scale], opacity: 1 };
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
  pose.edgeHands = ["left"];
  pose.socketContacts = [handContact("L", [756, deskY + 2], reach, -10, "open_palm")];
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
  rise_over_edge: { duration: 1.21, fromBehindEdge: true, sample: riseOverEdge },
  climb_through_rip: { duration: climbSeconds, fromBehindEdge: true, sample: climbThroughRip },
  leave_and_return: { duration: roundTripSeconds, sample: leaveAndReturn },
  lean_in: { duration: 1.62, sample: leanIn },
  follow_detail: { duration: 1.2, sample: (t, context) => leanIn(t, context, true) },
  knock_on_edge: { duration: 1.8, sample: knock },
  glance_from_edge: { duration: 2.1, sample: glanceFromEdge },
  send_tube_note: { duration: 4.35, views: ["quarter", "right"], sample: sendTubeNote },
  coffee_break: { duration: 3.48, sample: coffeeBreak },
  fly_paper_airplane: { duration: 3.2, sample: flyPaperAirplane },
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
  if (time < 1 && (time > 0 || clip.fromBehindEdge)) return clip.sample(time, context);
  const pose = {};
  if (context.restsOnEdge) gripEdge(pose, context.edgeY + 4, 1);
  return pose;
}
