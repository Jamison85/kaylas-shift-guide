// Camera bounds in the approved master image's coordinate system.
// DOM surfaces and the rig use the same bounds to keep contact aligned on resize.
export const floorY = 1435;
export const seat = [618, 1022];
export const deskY = 793;

export const stages = {
  home: {
    viewBox: [-90, -57, 1230, 1530],
    context: { direction: "right" },
    floor: floorY,
    bench: { x: 575, y: seat[1], width: 302, height: floorY - seat[1] },
    counterEdge: [894, 177, 246, 1258],
  },
  task: {
    viewBox: [-75, -45, 1200, 875],
    context: { direction: "left", target: [98, 466] },
    desk: deskY,
  },
  help: {
    viewBox: [-115, -48, 1280, 881],
    context: { direction: "left", target: [96, 420] },
    desk: deskY,
  },
  finish: {
    viewBox: [-145, -68, 1340, 1545],
    context: { direction: "left" },
    floor: floorY,
  },
  onboarding: {
    viewBox: [-70, -56, 1195, 1525],
    context: { direction: "left" },
    floor: floorY,
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
