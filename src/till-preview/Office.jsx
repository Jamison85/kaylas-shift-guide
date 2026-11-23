import { useLayoutEffect, useRef } from "react";
import TillActor from "./TillActor";
import { art, office } from "./assets";
import { beats } from "./story";

// Each peanut leaves the mouth of the open carton at a different time.
// travel and bounce are in peanut lengths so the paths scale with the office.
const peanuts = [
  [-4, 6.9, 210, 60], [-1.5, 8.7, -120, 30], [-6, 8.3, 260, 105], [2, 7.3, 175, 145],
  [-8, 8.8, -200, 190], [-3, 9.4, 90, 215], [3.4, 7.5, -145, 240], [-5, 9.7, 310, 285],
];
const descriptions = {
  working: "Till works on his clipboard behind the office desk.",
  notices: "Till tips his face up toward you, high above his desk.",
  shock: "Till recoils. His pen, papers and clipboard fly up.",
  badge: "Hair ruffled and glasses crooked, Till points to his name badge.",
  explain: "Till looks up at you and gestures across his little office.",
  dodge: "Till ducks as the stack of cartons topples and packing peanuts scatter behind him.",
  recovery: "Dusty, Till brushes his hair back and gives you a sheepish thumbs-up.",
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
  const performanceBeat = beat.id === "answer" && response === "watching" ? { ...beat, pose: "badge" } : beat;
  const fallen = index >= beats.findIndex(b => b.id === "fall");
  return <div className="fc-office" ref={stage} role="img" aria-label={performanceBeat !== beat ? "Till glances nervously down at his messy desk." : descriptions[beat.pose]}
    data-beat={beat.id} data-branch={response} data-fallen={fallen} data-act={beat.act} data-paused={paused}>
    <div className="fc-camera"><div className="fc-world">
      <div className="fc-scenery" style={{backgroundImage: `url("${office}")`}}>
        <div className="fc-lamp" />
        {["right", "center", "left", "open"].map(key => (
          <div key={key} className={`fc-box fc-box--${key}`}>
            <img className="fc-closed" src={art[key === "open" || key === "left" ? "left" : "upright"]} alt="" />
            {fallen && key !== "left" && <img className="fc-turning" src={art[key]} alt="" />}
          </div>
        ))}
        {fallen && peanuts.map(([x,y,r,d], i) => <div key={i} className="fc-peanut" style={{
          "--travel": x*100+"%", "--drop": y*100+"%", "--roll": r+"deg", "--delay": (470+d)+"ms",
        }}><img src={art.peanut} alt="" /></div>)}
      </div>
      <div className="fc-player"><TillActor beat={performanceBeat} response={response} images={images} reduced={reduced} paused={paused || beat.id === "home"} /></div>
    </div></div>
    <div className="fc-overhead" />
  </div>;
}
