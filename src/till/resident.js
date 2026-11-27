let actorModule;

export function createTillResident() {
  let canvas;
  let actor;
  let current;
  let previousStage;

  function clear() {
    actor?.stop();
    if (canvas) delete canvas.dataset.ready;
  }

  return {
    movedTo(stage) {
      return previousStage !== stage;
    },
    claim(slot, stage, callbacks) {
      clear();
      const claim = { callbacks, generation: 0 };
      current = claim;
      if (canvas) slot.prepend(canvas);
      return {
        async play(id, source) {
          const generation = ++claim.generation;
          actorModule ||= import("./actor.js").catch(error => {
            actorModule = null;
            throw error;
          });
          const { createActor } = await actorModule;
          if (current !== claim || generation !== claim.generation) return;
          if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.className = "till-stage__actor";
            slot.prepend(canvas);
          }
          actor ||= createActor(canvas, stage, {
            onFrame(progress, scenery) { current?.callbacks.onFrame(progress, scenery); },
            onFinish() { current?.callbacks.onFinish(); },
            onError() { current?.callbacks.onError(); },
          });
          actor.setStage(stage);
          const arriving = source === "arrival" && stage !== previousStage && stage.edgeY
            && id !== "rise_over_edge" && id !== "climb_through_rip";
          previousStage = stage;
          await actor.play(id, { arriving });
        },
        stop() {
          claim.generation += 1;
          if (current === claim) clear();
        },
        release() {
          if (current !== claim) return;
          clear();
          canvas?.remove();
          current = null;
        },
      };
    },
    dispose() {
      clear();
      actor?.dispose();
      canvas?.remove();
      actor = canvas = current = null;
      previousStage = null;
    },
  };
}
