// Camera bounds in the approved master image's coordinate system.
// DOM surfaces and the rig use the same bounds to keep contact aligned on resize.
export const deskY = 759;
const cardTop = 690;
const floorShadow = [275, 1401, 510, 54];

export const stages = {
  home: {
    viewBox: [75, -38, 875, 786],
    edgeY: cardTop,
    context: { direction: "left", edgeY: cardTop, restsOnEdge: true },
  },
  task: {
    viewBox: [100, -34, 823, 850],
    edgeY: deskY,
    context: { direction: "left", edgeY: deskY },
  },
  help: {
    viewBox: [100, -41, 825, 857],
    edgeY: deskY,
    context: { direction: "left", edgeY: deskY },
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

export const taskStages = {
  right: stages.task,
  left: { ...stages.task, context: { ...stages.task.context, direction: "right" } },
  check: {
    viewBox: [116, -25, 790, 841],
    edgeY: deskY,
    context: { direction: "left", edgeY: deskY, restsOnEdge: true },
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

export function stageLayout(stage) {
  const [, y, width, height] = stage.viewBox;
  const surfaceHeight = stage.edgeY ? stage.edgeY - y : height;
  return {
    aspectRatio: `${width} / ${surfaceHeight}`,
    "--till-art-height": `${height / surfaceHeight * 100}%`,
    "--till-overhang": `${(height - surfaceHeight) / height * 100}%`,
  };
}
