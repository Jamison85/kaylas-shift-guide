const length = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const betweenPoints = (a, b, weight) => a.map((value, i) => value + (b[i] - value) * weight);
const minimumBend = Math.cos(40 * Math.PI / 180);

function elbowCosine(shoulder, elbow, wrist) {
  const upperLength = length(shoulder, elbow);
  const lowerLength = length(wrist, elbow);
  return ((shoulder[0] - elbow[0]) * (wrist[0] - elbow[0])
    + (shoulder[1] - elbow[1]) * (wrist[1] - elbow[1])) / Math.max(0.0001, upperLength * lowerLength);
}

export function projectArm(shoulder, restElbow, restWrist, target, weight, outward) {
  const upperLength = length(shoulder, restElbow);
  const lowerLength = length(restElbow, restWrist);
  const maxReach = (upperLength + lowerLength) * 0.999;
  const wanted = betweenPoints(restWrist, target, weight);
  const reach = Math.min(maxReach, length(shoulder, wanted));
  const wrist = betweenPoints(shoulder, wanted, reach / Math.max(0.0001, length(shoulder, wanted)));

  // A wrist close to the chest comes forward in depth. The elbow stays down
  // and outward while both segments shorten naturally in the front projection.
  const depth = (maxReach - reach) * 0.59;
  const distance = Math.hypot(reach, depth);
  const direction = [(wrist[0] - shoulder[0]) / distance, (wrist[1] - shoulder[1]) / distance, depth / distance];
  const pole = [outward * 0.18, 0.93, -0.62];
  const parallel = direction.reduce((sum, component, i) => sum + component * pole[i], 0);
  const perpendicular = pole.map((component, i) => component - direction[i] * parallel);
  const along = (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance);
  const radius = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2));
  const offset = radius / Math.max(0.0001, Math.hypot(...perpendicular));
  const projected = shoulder.map((coordinate, i) => coordinate + direction[i] * along + perpendicular[i] * offset);
  let elbow = betweenPoints(restElbow, projected, Math.min(1, weight / 0.3));

  // Keep the visible fold open enough to preserve the outline at the joint.
  if (elbowCosine(shoulder, elbow, wrist) > minimumBend) {
    const midpoint = betweenPoints(shoulder, wrist, 0.5);
    let low = 0;
    let high = 1;
    for (let i = 0; i < 7; i++) {
      const middle = (low + high) / 2;
      const sample = betweenPoints(midpoint, elbow, middle);
      if (elbowCosine(shoulder, sample, wrist) <= minimumBend) low = middle;
      else high = middle;
    }
    elbow = betweenPoints(midpoint, elbow, low);
  }
  return { elbow, wrist };
}
