import { useEffect, useRef } from "react";
import poster from "../till/art/poster.webp";
import TillScenery from "./TillScenery";
import { directTill } from "../till/director.js";
import { paintScenery, watchPeepDirection } from "../till/scenery.js";
import { positionInStage, posterPosition, stageLayout, stages, taskStages } from "../till/stages.js";

const activityEvents = ["pointerdown", "keydown", "scroll", "focusin"];
const listenerOptions = { capture: true, passive: true };
export default function TillStage({
  anchor, resident, session, preference, work, taskId, cue, spot = "right", paused = false, leaving = false,
  onTalk, talking, replyId, onSendTube, onReceiveNote,
}) {
  const stageRef = useRef(null);
  const artRef = useRef(null);
  const sceneryRef = useRef(null);
  const stage = anchor === "task" ? taskStages[spot] : stages[anchor];
  const cueKind = cue?.kind;
  const cueKey = cue?.key;
  const waitingAtHome = anchor === "home" && (!cueKind || cueKind === "return")
    && !session.visited.has(cueKey ?? anchor);
  const waitingAtTask = anchor === "task" && !cueKind && work !== "critical"
    && !session.visited.has(`task-${taskId}`) && resident.movedTo(stage);
  const waiting = preference === "full" && (waitingAtHome || waitingAtTask);

  useEffect(() => {
    const host = stageRef.current;
    const art = artRef.current;
    if (!host || !art || paused || leaving || preference === "off") return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = typeof IntersectionObserver === "undefined";
    let available = false;
    let failed = false;
    let disposed = false;
    let request = 0;
    let sending = false;
    const scenery = sceneryRef.current;
    const stopPeeping = anchor === "home" ? watchPeepDirection(art) : null;

    function deliverNote() {
      if (!sending) return;
      sending = false;
      onReceiveNote?.();
    }

    const player = resident.claim(art, stage, {
      onFrame(progress, frame) {
        paintScenery(scenery, stage, frame);
        if (frame?.tubePhase === "address") deliverNote();
        if (progress <= 0) return;
        delete host.dataset.tillWaiting;
        director.started();
      },
      onFinish() {
        deliverNote();
        host.dataset.tillMotion = "rest";
        delete host.dataset.tillSource;
        director.finish();
      },
      onError: usePoster,
    });

    const stop = () => {
      request += 1;
      sending = false;
      paintScenery(scenery, stage);
      player.stop();
      host.dataset.tillMotion = "still";
      delete host.dataset.tillSource;
    };

    const director = directTill({
      session, anchor, work, taskId, cue: cueKind ? { kind: cueKind, key: cueKey } : null, preference, stop,
      async play(id, source) {
        const token = ++request;
        try {
          if (!available) return;
          host.dataset.tillMotion = id;
          host.dataset.tillSource = source;
          sending = id === "send_tube_note";
          await player.play(id, source);
        } catch {
          if (token === request && !disposed) usePoster();
        }
      },
    });

    function usePoster() {
      if (cueKind === "tube") deliverNote();
      failed = true;
      delete host.dataset.tillWaiting;
      sync();
    }

    function sync() {
      if (motion.matches && cueKind === "tube") deliverNote();
      available = inView && document.visibilityState !== "hidden" && !motion.matches && !failed;
      host.dataset.tillVisible = String(available);
      director.setAvailable(available);
      if (!available) {
        player.stop();
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
      player.release();
      stopPeeping?.();
      host.dataset.tillVisible = "false";
    };
  }, [anchor, resident, session, preference, work, taskId, cueKey, cueKind, paused, leaving, stage, onReceiveNote]);

  if (preference === "off") return null;
  return (
    <div ref={stageRef} className={`till-stage till-stage--${anchor}`}
      data-till-anchor={anchor} data-till-motion="still"
      data-till-spot={anchor === "task" ? spot : undefined}
      data-till-waiting={waiting || undefined} data-till-away={paused || undefined}
      data-till-leaving={leaving || undefined} data-till-tube={Boolean(onSendTube) || undefined} style={stageLayout(stage)}>
      <div ref={artRef} className="till-stage__art" aria-hidden="true">
        {stage.floor && <span className="till-stage__floor" style={positionInStage(stage, stage.floor)} />}
        <div className="till-stage__still">
          <img className="till-stage__poster" src={poster} alt="" draggable="false" style={posterPosition(stage)} />
        </div>
        {(onSendTube || anchor === "task") && <TillScenery stage={stage} sceneryRef={sceneryRef} hasTube={Boolean(onSendTube)} />}
      </div>
      {onTalk && <button type="button" className="till-stage__talk" onClick={onTalk}
        disabled={paused || leaving} aria-label="Talk to Till" aria-expanded={talking} aria-controls={replyId}>
        <span aria-hidden="true">···</span>
      </button>}
      {onSendTube && <button type="button" className="till-tube-trigger" disabled={paused || leaving}
        aria-label="Send a tube note" aria-controls={replyId} onClick={() => {
          const { tillMotion, tillVisible } = stageRef.current.dataset;
          if (tillMotion !== "send_tube_note") onSendTube(tillVisible === "true");
        }}>
        <span aria-hidden="true">↑</span>
      </button>}
    </div>
  );
}
