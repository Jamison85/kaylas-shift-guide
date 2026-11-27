import { expect, test } from "@playwright/test";
import { projectArm } from "../src/till/arms";

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const cosine = (shoulder, elbow, wrist) =>
  ((shoulder[0] - elbow[0]) * (wrist[0] - elbow[0]) + (shoulder[1] - elbow[1]) * (wrist[1] - elbow[1]))
  / (distance(shoulder, elbow) * distance(wrist, elbow));

test("Till's two arm silhouettes stay supported through close, crossed and raised reaches", () => {
  const reaches = [[-150, 130], [-55, -90], [45, 70], [180, 113], [-390, -40], [16, 19]];
  for (const side of [-1, 1]) {
    const shoulder = [525 + side * 133, 392];
    const neutralElbow = [shoulder[0] + side * 21, 571];
    const neutralWrist = [neutralElbow[0] + side * 18, 756];
    for (const [x, y] of reaches) {
      const target = [shoulder[0] - side * x, shoulder[1] + y];
      let previous = neutralElbow;
      for (let frame = 1; frame <= 40; frame++) {
        const move = projectArm(shoulder, neutralElbow, neutralWrist, target, frame / 40, side);
        expect(cosine(shoulder, move.elbow, move.wrist)).toBeLessThanOrEqual(Math.cos(40 * Math.PI / 180) + 0.002);
        expect(distance(move.elbow, previous)).toBeLessThan(51);
        expect(distance(shoulder, move.elbow)).toBeLessThan(distance(shoulder, neutralElbow) + 3);
        expect(distance(move.elbow, move.wrist)).toBeLessThan(distance(neutralElbow, neutralWrist) + 3);
        previous = move.elbow;
      }
    }
  }
});
