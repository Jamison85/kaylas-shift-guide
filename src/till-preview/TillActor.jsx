import { useLayoutEffect, useRef } from "react";
import { art } from "./assets";

import { renderer } from "./puppet";

export default function TillActor({ beat, response, images, paused, reduced }) {
  const canvas = useRef(null);
  const current = useRef();
  useLayoutEffect(() => { current.current = { beat, response, paused }; });
  useLayoutEffect(() => {
    if (!images || reduced) return;
    const surface = canvas.current;
    const mesh = renderer(surface);
    if (!mesh) return;
    let frame, last = 0, elapsed = 0, cueStart = 0, previousBeat;
    function draw(now) {
      const { beat: active, response: answer, paused: stopped } = current.current;
      if ((!stopped && !document.hidden && now-last >= 32) || previousBeat !== active.id) {
        if (last && !stopped) elapsed += Math.min(now - last, 60) / 1000;
        if (previousBeat !== active.id) cueStart = elapsed;
        mesh.draw(images[active.pose], active.pose, active.id, active.id === "answer" && answer === "watching", elapsed, elapsed - cueStart);
        surface.parentElement.dataset.painted = "true";
        previousBeat = active.id;
        last = now;
      }
      frame = requestAnimationFrame(draw);
    }
    function lost(event) {
      event.preventDefault();
      cancelAnimationFrame(frame);
      delete surface.parentElement.dataset.painted;
    }
    surface.addEventListener("webglcontextlost", lost);
    draw(performance.now());
    return () => {
      cancelAnimationFrame(frame);
      surface.removeEventListener("webglcontextlost", lost);
      delete surface.parentElement.dataset.painted;
      mesh.dispose();
    };
  }, [images, reduced]);
  return <div className="fc-actor" data-pose={beat.pose}>
    <div className="fc-paint" style={{backgroundImage: `url("${art[beat.pose]}")`}}>
      <canvas ref={canvas} />
    </div>
  </div>;
}
