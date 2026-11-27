// Camera bounds in the approved master image's coordinate system.
// DOM surfaces and the rig use the same bounds to keep contact aligned on resize.
export const deskY = 759;
const floorShadow = [275, 1401, 510, 54];

export const stages = {
  home: {
    viewBox: [29, -45, 936, 1520],
    context: { direction: "left" },
    floor: floorShadow,
  },
  task: {
    viewBox: [100, -34, 823, 850],
    context: { direction: "left" },
    desk: [162, deskY, 731, 57],
  },
  help: {
    viewBox: [100, -41, 825, 857],
    context: { direction: "left" },
    desk: [158, deskY, 739, 57],
  },
  finish: {
    viewBox: [65, -52, 920, 1522],
    context: { direction: "left" },
    floor: floorShadow,
  },
  onboarding: {
    viewBox: [65, -52, 920, 1522],
    context: { direction: "left" },
    floor: floorShadow,
  },
};

const posterBounds = [272, 0, 535, 1448];

export function positionInStage(stage, bounds) {
  const [x, y, w, h] = stage.viewBox;
  const [left, top, width, height] = bounds;
  return {
    left: `${(left - x) / w * 100}%`,
    top: `${(top - y) / h * 100}%`,
    width: `${width / w * 100}%`,
    height: `${height / h * 100}%`,
  };
}

export function posterPosition(stage) {
  return positionInStage(stage, posterBounds);
}
