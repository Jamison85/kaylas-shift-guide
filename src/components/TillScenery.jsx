import { noteTube } from "../till/scenery";
import { positionInStage } from "../till/stages";

function propSize(stage, width, height) {
  return { width: `${width / stage.viewBox[2] * 100}%`, height: `${height / stage.viewBox[3] * 100}%` };
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
            <i className="till-tear__depth" />
            <i className="till-tear__lip till-tear__lip--left" />
            <i className="till-tear__lip till-tear__lip--right" />
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
