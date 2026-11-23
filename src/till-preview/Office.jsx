import { useLayoutEffect, useRef } from "react";
import TillActor from "./TillActor";
import { art, office } from "./assets";
import { beats } from "./story";

// Each peanut leaves the mouth of the open carton at a different time.
// travel and bounce are in peanut lengths so the paths scale with the office.
const peanuts = [
  [-4, 10.4, 210, 60], [-1.5, 12.2, -120, 30], [-6, 11.8, 260, 105], [2, 10.8, 175, 145],
  [-8, 12.3, -200, 190], [-3, 12.9, 90, 215], [3.4, 11, -145, 240], [-5, 13.2, 310, 285],
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
    const from = stage.current.getBoundingClientRect();
    const to = destination.getBoundingClientRect();
    const scale = Math.min(to.width/from.width, to.height/from.height);
    const dx = to.x + to.width/2 - from.x - from.width*scale/2;
    const dy = to.y + to.height/2 - from.y - from.height*scale/2;
    const animation = stage.current.animate([
      { transform: "translate(0,0) scale(1)", borderRadius: "0" },
      { transform: `translate(${dx}px,${dy}px) scale(${scale})`, borderRadius: "12%" },
    ], { duration: beat.ms, easing: "cubic-bezier(.4,0,.12,1)", fill: "forwards" });
    flight.current = animation;
    return () => { animation.cancel(); flight.current = null; };
  }, [revealing, destination, reduced, beat.ms]);
  useLayoutEffect(() => { if (flight.current) paused ? flight.current.pause() : flight.current.play(); }, [paused, revealing, destination]);
  const performanceBeat = beat.id === "answer" && response === "watching" ? { ...beat, pose: "badge" } : beat;
  const fallen = index >= beats.findIndex(b => b.id === "fall");
  return <div className="fc-office" ref={stage} role="img" aria-label={performanceBeat !== beat ? "Till glances nervously down at his messy desk." : descriptions[beat.pose]}
    data-beat={beat.id} data-branch={response} data-fallen={fallen} data-act={beat.act} data-paused={paused}>
    <div className="fc-camera"><div className="fc-world" style={{backgroundImage: `url("${office}")`}}>
      <div className="fc-lamp" />
      {["right", "left", "center", "open"].map(key =>
        <div key={key} className={`fc-box fc-box--${key}`}><img src={art[key]} alt="" /></div>)}
      {peanuts.map(([x,y,r,d], i) => <div key={i} className="fc-peanut" style={{
        "--travel": x*100+"%", "--drop": y*100+"%", "--roll": r+"deg", "--delay": (470+d)+"ms",
      }}><img src={art.peanut} alt="" /></div>)}
      <div className="fc-player"><TillActor beat={performanceBeat} response={response} images={images} reduced={reduced} paused={paused} /></div>
    </div></div>
    <div className="fc-overhead" />
  </div>;
}
