import { useLayoutEffect, useRef } from "react";
import TillActor from "./TillActor";
import { art, office } from "./assets";
import { beats } from "./story";

// Each peanut leaves the mouth of the open carton at a different time.
// travel and bounce are in peanut lengths so the paths scale with the office.
const peanuts = [
  [-3.6, 13, 210, 60], [-1.3, 12.8, -120, 30], [-5.8, 15, 260, 105], [2.6, 10.5, 175, 145],
  [-7.4, 13.8, -200, 190], [-2.7, 16.4, 90, 215], [4, 16.2, -145, 240], [-4.8, 17.3, 310, 285],
];
const after = id => beats.findIndex(beat => beat.id === id);
const scatterAt = after("fall");
const dropAt = after("echo");
const descriptions = {
  working: "Till leans over the desk and writes on the clipboard resting on the worktop.",
  notices: "Till keeps his feet next to the desk and lifts his chin to look up at you.",
  shock: "Till recoils. His glasses slip, a pen catches in his hair, and his clipboard flies.",
  uneasy: "Till glances nervously down at his messy desk.",
  badge: "Till gets his bearings and points to his name badge.",
  explain: "Till looks up at you and gestures across his little office.",
  anticipation: "Till glances aside as the stack of taped cartons begins to wobble.",
  dodge: "Till ducks as the cartons topple and packing peanuts scatter across the tiled floor.",
  recovery: "Till brushes off the front of his polo and looks up sheepishly.",
  wave: "Till waves up at you.",
  cleanWave: "Till waves up at you.",
};
export default function Office({ story, images, reduced, destination }) {
  const { beat, index, response, paused } = story;
  const stage = useRef(null);
  const flight = useRef(null);
  const revealing = beat.id === "reveal";
  useLayoutEffect(() => {
    if (!revealing || reduced || !destination) return;
    // The landing target is the full-body cutout. Match its feet and scale, so
    // the last frame of the travelling puppet is its first frame in the Home card.
    const node = stage.current;
    const animation = node.animate([], {
      duration: beat.ms, fill: "forwards",
    });
    function aim() {
      // Measure the underlying layout, including after a phone rotation.
      // Replacing the keyframes preserves the playback time and paused state.
      animation.effect.setKeyframes([]);
      const from = node.getBoundingClientRect();
      const actor = node.querySelector(".fc-actor").getBoundingClientRect();
      const to = destination.getBoundingClientRect();
      if (!actor.width || !to.width) return;
      const scale = Math.min(to.width/actor.width, to.height/actor.height);
      const dx = to.x + to.width/2 - from.x - (actor.x + actor.width/2 - from.x)*scale;
      const dy = to.bottom - from.y - (actor.bottom - from.y)*scale;
      animation.effect.setKeyframes([
        { offset: 0, transform: "translate(0,0) scale(1)", easing: "ease-in" },
        { offset: .20, transform: `translate(${dx*.025}px,${dy*.025}px) scale(${1+(scale-1)*.025})`, easing: "cubic-bezier(.3,.1,.16,1)" },
        { offset: 1, transform: `translate(${dx}px,${dy}px) scale(${scale})` },
      ]);
    }
    aim();
    const resize = new ResizeObserver(aim);
    resize.observe(node);
    resize.observe(destination);
    flight.current = animation;
    return () => { resize.disconnect(); animation.cancel(); flight.current = null; };
  }, [revealing, destination, reduced, beat.ms]);
  useLayoutEffect(() => { if (flight.current) paused ? flight.current.pause() : flight.current.play(); }, [paused, revealing, destination]);
  let performanceBeat = beat;
  if (beat.id === "answer" && response === "watching") performanceBeat = { ...beat, pose: "uneasy" };
  if (beat.id === "home" && !response) performanceBeat = { ...beat, pose: "cleanWave" };
  const fallen = index >= scatterAt && beat.id !== "home";
  const dropped = index >= dropAt && beat.id !== "home";
  const roomPaint = { backgroundImage: `url("${office}")` };
  return <div className="fc-office" ref={stage} role="img" aria-label={descriptions[performanceBeat.pose]}
    data-beat={beat.id} data-pose={performanceBeat.pose} data-branch={response} data-fallen={fallen} data-act={beat.act} data-paused={paused}>
    <div className="fc-camera"><div className="fc-world">
      <div className="fc-scenery" style={roomPaint}>
        <div className="fc-lamp" />
        <div className="fc-stack-shadow" />
        {["right", "center", "left", "open"].map(key => (
          <div key={key} className={`fc-box fc-box--${key}`}>
            <img className="fc-closed" src={art.closed} alt="" />
            {fallen && key === "open" && <img className="fc-turning" src={art.open} alt="" />}
          </div>
        ))}
        {dropped && <img className="fc-clipboard" src={art.clipboard} alt="" />}
        {fallen && peanuts.map(([x,y,r,d], i) => <div key={i} className="fc-peanut" style={{
          "--travel": x*100+"%", "--drop": y*100+"%", "--roll": r+"deg", "--delay": (470+d)+"ms",
        }}><img src={art.peanut} alt="" /></div>)}
      </div>
      <div className="fc-foot-shadow" />
      <div className="fc-player"><TillActor beat={performanceBeat} response={response} images={images} reduced={reduced} paused={paused || beat.id === "home"} /></div>
      <div className="fc-foreground" style={roomPaint} />
    </div></div>
    <div className="fc-overhead" />
  </div>;
}
