import { ladderRungs, noteTube } from "../till/scenery";
import { positionInStage } from "../till/stages";

function propSize(stage, width, height) {
  return { width: `${width / stage.viewBox[2] * 100}%`, height: `${height / stage.viewBox[3] * 100}%` };
}

function Ladder({ stage }) {
  const top = ladderRungs.at(-1);
  const bottom = ladderRungs[0];
  return (
    <span className="till-tear__ladder">
      {ladderRungs.map(({ left, right, y }) => (
        <span className="till-ladder__rung" key={y} style={positionInStage(stage, [left, y - 6, right - left, 12])} />
      ))}
      {["left", "right"].map(side => {
        const dx = bottom[side] - top[side];
        const dy = bottom.y - top.y;
        const lean = Math.atan2(dx, dy) * 180 / Math.PI;
        return (
          <span className="till-ladder__rail" key={side} style={{
            ...positionInStage(stage, [top[side] - 9, top.y - 13, 18, Math.hypot(dx, dy) + 33]),
            transform: `rotate(${-lean}deg)`,
          }} />
        );
      })}
    </span>
  );
}

export default function TillScenery({ stage, sceneryRef, hasTube }) {
  const { x, hatchY, width } = noteTube;
  const top = stage.viewBox[1];
  const hatchTop = hatchY - 67;
  return (
    <div ref={sceneryRef} className="till-scenery" data-till-prop="" data-tube-phase="idle">
      {hasTube && (
        <>
          <span className="till-tube__shaft" style={positionInStage(stage, [x - width / 2, top, width, hatchY - top - 50])} />
          <span className="till-tube__hatch" style={positionInStage(stage, [x - 68, hatchTop, 136, stage.edgeY - hatchTop - 8])}>
            <i />
          </span>
          <span className="till-tear">
            <i className="till-tear__surface" />
            <i className="till-tear__depth" />
            <Ladder stage={stage} />
            <i className="till-tear__lip till-tear__lip--far" />
            <i className="till-tear__lip till-tear__lip--near" />
          </span>
          <span className="till-dust" />
        </>
      )}
      <div className="till-scenery__props">
        {hasTube && <span className="till-prop till-prop--capsule" style={propSize(stage, 62, 106)}><i /></span>}
        <span className="till-prop till-prop--airplane" style={propSize(stage, 133, 63)}><i /></span>
        <span className="till-prop till-prop--mug" style={propSize(stage, 107, 105)}><i /></span>
      </div>
    </div>
  );
}
