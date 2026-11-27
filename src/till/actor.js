import frontUrl from "./art/front.webp";
import quarterUrl from "./art/turn.webp";
import rightUrl from "./art/right.webp";
import leftUrl from "./art/left.webp";
import { RigPlayer } from "./rig.js";
import { getPerformance, samplePerformance } from "./performances.js";

const viewAssets = {
  front: [frontUrl, () => import("./art/front.json").then(module => module.default)],
  quarter: [quarterUrl, () => import("./art/turn.json").then(module => module.default.right)],
  quarterLeft: [quarterUrl, () => import("./art/turn.json").then(module => module.default.left)],
  right: [rightUrl, () => import("./art/right.json").then(module => module.default)],
  left: [leftUrl, () => import("./art/left.json").then(module => module.default)],
};
const artwork = new Map();

function loadArtwork(view) {
  if (!artwork.has(view)) {
    const [url, loadRig] = viewAssets[view];
    const image = new Image();
    image.src = url;
    const loading = Promise.all([loadRig(), image.decode()]).then(([data]) => ({ ...data, image }));
    loading.catch(() => { artwork.delete(view); });
    artwork.set(view, loading);
  }
  return artwork.get(view);
}

class CharacterPlayer extends RigPlayer {
  layers() {
    const layers = super.layers();
    const prop = this.pose.workProp;
    if (prop?.opacity > 0.01) {
      const key = "prop_" + prop.name;
      const rad = (prop.angle || 0) * Math.PI / 180;
      const [sx, sy] = prop.scale || [1, 1];
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      const transform = [c * sx, s * sx, -s * sy, c * sy, ...prop.origin];
      const index = layers.findIndex(layer => layer.key.startsWith("hand_"));
      layers.splice(index === -1 ? layers.length : index, 0, { key, opacity: prop.opacity, transform });
    }
    if (this.edgeY) {
      for (const layer of layers) {
        const handOnEdge = layer.key.startsWith("hand_") && this.pose.edgeHands?.includes(layer.key.split("_")[1]);
        if (!handOnEdge) layer.maxY = this.edgeY;
      }
    }
    return layers;
  }
}

const frameMs = 1000 / 30;
const maxFrameAdvance = 100;

export function createActor(canvas, stage, { onFrame, onFinish, onError }) {
  const players = new Map();
  let player;
  let frame = 0;
  let generation = 0;
  let action;
  let disposed = false;
  const resize = new ResizeObserver(() => player?.resize());
  resize.observe(canvas);

  function draw(pose) {
    const view = pose.view ?? "front";
    player = players.get(view);
    player.setPose(pose);
    if (canvas.dataset.view !== view) canvas.dataset.view = view;
    canvas.dataset.ready = "true";
  }

  function placeScenery(scenery) {
    const prop = scenery?.prop;
    if (!prop) return scenery;
    if (prop.held) {
      const grip = player.getAnchor(prop.held.anchor);
      action.propOffset = grip.map((value, i) => value + prop.held.offset[i] - (i === 0 ? prop.x : prop.y));
    }
    if (!action.propOffset || !prop.releaseBlend) return scenery;
    const [x, y] = action.propOffset;
    return { ...scenery, prop: {
      ...prop, x: prop.x + x * prop.releaseBlend, y: prop.y + y * prop.releaseBlend,
    } };
  }

  function stop() {
    generation += 1;
    cancelAnimationFrame(frame);
    action = null;
  }

  function loseContext() {
    generation += 1;
    cancelAnimationFrame(frame);
    action = null;
    delete canvas.dataset.ready;
    onError();
  }

  function tick(now) {
    if (!action) return;
    try {
      // Keep the movement legible through a graphics stall during the first draw.
      const delta = now - (action.lastFrame ?? now);
      action.elapsed += Math.min(delta, maxFrameAdvance);
      action.lastFrame = now;
      const elapsed = action.elapsed;
      const arriving = elapsed < action.arrivalMs;
      const sampleTime = Math.max(0, Math.min(1, (elapsed - action.arrivalMs) / action.duration));
      if (elapsed >= action.nextFrame - 1 || sampleTime === 1) {
        const clip = arriving ? getPerformance("rise_over_edge") : action.clip;
        const poseTime = arriving ? elapsed / action.arrivalMs : sampleTime;
        const pose = samplePerformance(clip, poseTime, stage.context);
        draw(pose);
        action.nextFrame = (Math.floor((elapsed + 1) / frameMs) + 1) * frameMs;
        onFrame(poseTime, placeScenery(pose.scenery));
      }
      if (sampleTime >= 1) {
        action = null;
        onFinish();
      } else frame = requestAnimationFrame(tick);
    } catch {
      loseContext();
    }
  }

  async function play(id, { arriving = false } = {}) {
    const request = ++generation;
    try {
      const clip = getPerformance(id);
      const views = ["front", ...(clip.views ?? [])];
      const assets = await Promise.all(views.map(loadArtwork));
      if (request !== generation || disposed) return;
      views.forEach((view, index) => {
        if (players.has(view)) return;
        const rig = new CharacterPlayer(canvas, {
          ...assets[index], viewBox: stage.viewBox, dprCap: 2, observeResize: false,
        });
        rig.edgeY = stage.edgeY;
        players.set(view, rig);
      });
      action = { clip, duration: clip.duration * 1000, arrivalMs: arriving ? 460 : 0, elapsed: 0, nextFrame: 0 };
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    } catch {
      if (!disposed && request === generation) loseContext();
    }
  }

  canvas.addEventListener("webglcontextlost", loseContext);
  return {
    play,
    stop,
    setStage(next) {
      if (stage === next) return;
      stage = next;
      for (const rig of players.values()) {
        rig.edgeY = stage.edgeY;
        rig.setViewBox(stage.viewBox);
      }
      player?.resize();
    },
    dispose() {
      disposed = true;
      stop();
      resize.disconnect();
      canvas.removeEventListener("webglcontextlost", loseContext);
      for (const rig of players.values()) rig.dispose();
      players.clear();
    },
  };
}
