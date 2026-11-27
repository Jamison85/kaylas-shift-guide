import { useEffect, useRef } from "react";
import poster from "../till/art/poster.webp";
import { directTill } from "../till/director.js";
import { positionInStage, posterPosition, stages } from "../till/stages.js";

const activityEvents = ["pointerdown", "keydown", "scroll", "focusin"];
const listenerOptions = { capture: true, passive: true };
let actorModule;

export default function TillStage({ anchor, session, preference, work, cue, paused = false }) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const stage = stages[anchor];
  const cueKind = cue?.kind;
  const cueKey = cue?.key;

  useEffect(() => {
    const host = stageRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || paused || preference === "off") return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = typeof IntersectionObserver === "undefined";
    let available = false;
    let failed = false;
    let disposed = false;
    let actor;
    let request = 0;

    const stop = () => {
      request += 1;
      actor?.stop();
      host.dataset.tillMotion = "still";
      delete host.dataset.tillSource;
    };

    const director = directTill({
      session, anchor, work, cue: cueKind ? { kind: cueKind, key: cueKey } : null, preference, stop,
      async play(id, source) {
        const token = ++request;
        try {
          actorModule ||= import("../till/actor.js").catch(error => {
            actorModule = null;
            throw error;
          });
          const { createActor } = await actorModule;
          if (disposed || token !== request || !available) return;
          actor ||= createActor(canvas, stage, {
            onFrame() { director.started(); },
            onFinish() {
              host.dataset.tillMotion = "rest";
              delete host.dataset.tillSource;
              director.finish();
            },
            onError: usePoster,
          });
          host.dataset.tillMotion = id;
          host.dataset.tillSource = source;
          await actor.play(id);
        } catch {
          if (token === request && !disposed) usePoster();
        }
      },
    });

    function usePoster() {
      failed = true;
      delete canvas.dataset.ready;
      sync();
    }

    function sync() {
      available = inView && document.visibilityState !== "hidden" && !motion.matches && !failed;
      host.dataset.tillVisible = String(available);
      director.setAvailable(available);
      if (!available) {
        delete canvas.dataset.ready;
        host.dataset.tillMotion = "still";
      }
    }

    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      inView = entry.intersectionRatio >= 0.62;
      sync();
    }, { threshold: [0, 0.62], rootMargin: anchor === "task" ? "-50px 0px -48px" : "0px" });
    observer?.observe(host);
    const activity = () => director.noteActivity();
    for (const event of activityEvents) window.addEventListener(event, activity, listenerOptions);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    sync();
    return () => {
      disposed = true;
      observer?.disconnect();
      for (const event of activityEvents) window.removeEventListener(event, activity, listenerOptions);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      director.dispose();
      actor?.dispose();
      delete canvas.dataset.ready;
    };
  }, [anchor, session, preference, work, cueKey, cueKind, paused, stage]);

  if (preference === "off") return null;
  const [x, , width] = stage.viewBox;
  const floorPosition = stage.floor && positionInStage(stage, [x, stage.floor, width, 35]);
  const deskPosition = stage.desk && positionInStage(stage, [x + 138, stage.desk, width - 276, 66]);
  const bench = stage.bench;
  return (
    <div ref={stageRef} className={`till-stage till-stage--${anchor}`} aria-hidden="true"
      data-till-anchor={anchor} data-till-motion="still"
      style={{ aspectRatio: `${stage.viewBox[2]} / ${stage.viewBox[3]}` }}>
      {floorPosition && <span className="till-stage__floor" style={floorPosition} />}
      {bench && <span className="till-stage__bench" style={positionInStage(stage, [bench.x, bench.y, bench.width, bench.height])} />}
      <canvas ref={canvasRef} className="till-stage__actor" />
      <img className="till-stage__poster" src={poster} alt="" draggable="false" style={posterPosition(stage)} />
      {deskPosition && <span className="till-stage__desk" style={deskPosition} />}
      {stage.counterEdge && <span className="till-stage__edge" style={positionInStage(stage, stage.counterEdge)} />}
    </div>
  );
}
