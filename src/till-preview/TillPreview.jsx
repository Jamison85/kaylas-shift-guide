import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { acts, ready, home, caption, finalLine, responses } from "./story";
import { loadArt } from "./assets";
import useStory from "./useStory";
import Office from "./Office";
import homeMarkup from "./home.html?raw";
import "./preview.css";

function Icon({ name }) {
  const paths = {
    sound: <><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
    mute: <><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="m16 9 6 6m0-6-6 6"/></>,
    skip: <><path d="m5 5 10 7-10 7z"/><path d="M19 5v14"/></>,
    play: <path fill="currentColor" stroke="none" d="M6 3.5 20 12 6 20.5z"/>,
    pause: <path d="M8 5v14m8-14v14"/>,
    replay: <><path d="M4 9a8 8 0 1 1-.1 6M4 4v5h5"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const homeSnapshot = { __html: homeMarkup };
export default function TillPreview() {
  const story = useStory();
  const { beat, act, muted, toggleMute } = story;
  const [images, setImages] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [anchor, setAnchor] = useState(null);
  const snapshot = useRef(null);
  const firstResponse = useRef(null);
  const replay = useRef(null);
  const isReady = beat === ready;
  const finished = beat === home;
  const landing = finished || beat.id === "reveal";
  useEffect(() => {
    let active = true;
    loadArt().then(result => { if (active) setImages(result); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useLayoutEffect(() => {
    if (landing) setAnchor(snapshot.current.querySelector(".fc-home-anchor"));
    else setAnchor(null);
  }, [landing]);
  useEffect(() => {
    if (beat.id === "choice") firstResponse.current?.focus({preventScroll:true});
    if (finished) replay.current?.focus({preventScroll:true});
  }, [beat, finished]);
  const line = caption(beat, story.response);
  const playing = !isReady && !finished;
  const start = () => { window.scrollTo(0,0); act("start"); };
  const office = <Office key={story.take} story={story} reduced={reduced || finished} images={images} destination={anchor}/>;
  return <div className="fc" data-screen={beat.id} data-paused={story.paused}>
    {landing && <section className="fc-landing" aria-label="Home preview">
      <div ref={snapshot} inert="" aria-hidden="true" dangerouslySetInnerHTML={homeSnapshot} />
      {finished && <div className="fc-epilogue">
        <small className="fc-label">Till · Home preview</small>
        <p>“{finalLine}”</p>
        <button type="button" className="fc-primary" ref={replay} onClick={images ? start : () => location.reload()}><Icon name="replay" />Replay introduction</button>
      </div>}
    </section>}
    {!finished && <div className="fc-shell">
      <header className="fc-header">
        <div className="fc-brand"><i aria-hidden="true"/><span>Before the Rush<small>Store 2593</small></span></div>
        <div className="fc-controls">
          <button aria-pressed={muted} aria-label={muted ? "Unmute sound" : "Mute sound"} onClick={toggleMute}><Icon name={muted ? "mute" : "sound"}/><span>Sound {muted ? "off" : "on"}</span></button>
          <button onClick={() => act("skip")}>Skip<Icon name="skip"/></button>
        </div>
      </header>
      <main className="fc-feature">
        <div className="fc-stage-slot">{office}</div>
        <section className="fc-script" aria-label={isReady ? "Introduction" : "Dialogue"}>
          {isReady ? <>
            <small className="fc-label">Till’s first connection</small>
            <h1>Hello? <br/><em>Is Somebody <br/>Up There?</em></h1>
            <div className="fc-launch">
              {failed ? <><p role="alert">The office artwork couldn’t load.</p><button className="fc-primary" onClick={() => {setFailed(false); setAttempt(attempt+1);}}>Retry artwork</button></>
                : <button className="fc-primary" disabled={!images} onClick={start}><Icon name="play"/>{images ? "Start introduction" : "Loading artwork…"}</button>}
              <span className="fc-duration">Interactive short <i/> ~1 min</span>
            </div>
          </> : <>
            <div className="fc-label">{beat.id === "echo" ? "You · From above" : line ? "Till" : "Till’s office"}</div>
            <div className="fc-caption" aria-live="polite" aria-atomic="true">
              <p key={line} className={line ? "" : "fc-sound-caption"}>{line || ({
                routine: "Pencil scratches on a clipboard.", signal: "A chime. The desk trembles.", fall: "The boxes tip…",
                impact: "A crash. Packing peanuts everywhere.", wave: "Till waves up at you.", reveal: "Back to the opening guide.",
              }[beat.id])}</p>
            </div>
            {beat.id === "choice" && <div className="fc-choices" aria-label="Your response">
              {Object.entries(responses).map(([key,text],i) => <button key={key} ref={i === 0 ? firstResponse : null} onClick={() => act("choose",key)}>{text}<svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M3 13 13 3M4 3h9v9"/></svg></button>)}
            </div>}
          </>}
        </section>
      </main>
      <footer className="fc-footer">
        <ol className="fc-chapters" aria-label="Story progress">{acts.map((name, i) => <li key={name} aria-current={beat.act === i ? "step" : undefined} data-played={playing && i <= beat.act}><i/><span>{name}</span></li>)}</ol>
        {playing && <div className="fc-controls fc-transport">
          {beat.id !== "choice" && <button onClick={() => act("pause")}><Icon name={story.paused ? "play" : "pause"}/>{story.paused ? "Resume" : "Pause"}</button>}
          <button onClick={start}><Icon name="replay"/>Replay</button>
        </div>}
      </footer>
    </div>}
    {finished && anchor && createPortal(office,anchor)}
  </div>;
}
