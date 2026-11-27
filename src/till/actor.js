import frontUrl from "./art/front.webp";
import leftUrl from "./art/left.webp";
import rightUrl from "./art/right.webp";
import turnUrl from "./art/turn.webp";
import { RigPlayer } from "./rig.js";
import { getPerformance, samplePerformance } from "./performances.js";

const sources = {
  front: [frontUrl, () => import("./art/front.json")],
  left: [leftUrl, () => import("./art/left.json")],
  right: [rightUrl, () => import("./art/right.json")],
  quarterLeft: [turnUrl, () => import("./art/turn.json"), "left"],
  quarterRight: [turnUrl, () => import("./art/turn.json"), "right"],
};

const loadPromises = new Map();
function loadView(name) {
  if (!loadPromises.has(name)) {
    const [url, load, view] = sources[name];
    const image = new Image();
    image.src = url;
    const pending = Promise.all([load(), image.decode()]).then(([data]) => ({
      ...(view ? data.default[view] : data.default), image,
    }));
    loadPromises.set(name, pending);
    pending.catch(() => loadPromises.delete(name));
  }
  return loadPromises.get(name);
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
    return layers;
  }
}

const frameMs = 1000 / 24;

export function createActor(canvas, anchor, { onFrame, onFinish, onError }) {
  let view;
  let player;
  let frame = 0;
  let generation = 0;
  let action;
  let loaded = {};
  let disposed = false;
  const players = new Map();
  const resize = new ResizeObserver(() => player?.resize());
  resize.observe(canvas);

  function draw(pose) {
    const nextView = pose.view || "front";
    if (view !== nextView) {
      if (!players.has(nextView)) {
        players.set(nextView, new CharacterPlayer(canvas, {
          ...loaded[nextView], viewBox: anchor.viewBox, dprCap: 2, observeResize: false,
        }));
      }
      player = players.get(nextView);
      view = nextView;
    }
    player.setPose(pose);
    canvas.dataset.ready = "true";
    canvas.dataset.tillView = nextView;
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
      const sampleTime = Math.min(1, elapsed / action.duration);
      if (elapsed >= action.nextFrame - 1 || sampleTime === 1) {
        draw(samplePerformance(action.clip, sampleTime, action.context));
        action.nextFrame = (Math.floor((elapsed + 1) / frameMs) + 1) * frameMs;
        onFrame(sampleTime);
      }
      if (sampleTime >= 1) {
        action = null;
        onFinish();
      } else frame = requestAnimationFrame(tick);
    } catch {
      loseContext();
    }
  }

  async function play(id, timing = {}) {
    const request = ++generation;
    try {
      const clip = getPerformance(id);
      const entries = clip.profiles ? Object.keys(sources) : ["front"];
      const views = await Promise.all(entries.map(loadView));
      if (request !== generation || disposed) return;
      loaded = { ...loaded, ...Object.fromEntries(entries.map((name, index) => [name, views[index]])) };
      action = {
        clip, duration: (timing.duration ?? clip.duration) * 1000, nextFrame: 0,
        context: { ...anchor.context, views: loaded },
      };
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
    dispose() {
      disposed = true;
      stop();
      resize.disconnect();
      canvas.removeEventListener("webglcontextlost", loseContext);
      for (const instance of players.values()) instance.dispose();
      players.clear();
      loaded = {};
    },
  };
}
