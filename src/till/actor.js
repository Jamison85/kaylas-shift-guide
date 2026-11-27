import frontUrl from "./art/front.webp";
import { RigPlayer } from "./rig.js";
import { getPerformance, samplePerformance } from "./performances.js";

let artwork;
function loadArtwork() {
  if (!artwork) {
    const image = new Image();
    image.src = frontUrl;
    artwork = Promise.all([import("./art/front.json"), image.decode()])
      .then(([data]) => ({ ...data.default, image }));
    artwork.catch(() => { artwork = null; });
  }
  return artwork;
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

export function createActor(canvas, stage, { onFrame, onFinish, onError }) {
  let player;
  let frame = 0;
  let generation = 0;
  let action;
  let disposed = false;
  const resize = new ResizeObserver(() => player?.resize());
  resize.observe(canvas);

  function draw(pose) {
    player.setPose(pose);
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
      action.start ??= now;
      const elapsed = now - action.start;
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
      const data = await loadArtwork();
      if (request !== generation || disposed) return;
      player ||= new CharacterPlayer(canvas, {
        ...data, viewBox: stage.viewBox, dprCap: 2, observeResize: false,
      });
      player.edgeY = stage.edgeY;
      action = { clip, duration: clip.duration * 1000, arrivalMs: arriving ? 460 : 0, nextFrame: 0 };
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
      if (!player) return;
      player.edgeY = stage.edgeY;
      player.setViewBox(stage.viewBox);
      player.resize();
    },
    dispose() {
      disposed = true;
      stop();
      resize.disconnect();
      canvas.removeEventListener("webglcontextlost", loseContext);
      player?.dispose();
    },
  };
}
