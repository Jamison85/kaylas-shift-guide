import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { beats, home, ready } from "./story";
import { createSound } from "./audio";

function step(state, action) {
  switch (action.type) {
    case "start": return { index: 0, response: null, take: state.take + 1, paused: false };
    case "skip": return { ...state, index: beats.length, paused: false };
    case "pause": return { ...state, paused: !state.paused };
    case "choose": return beats[state.index]?.id === "choice"
      ? { ...state, response: action.response, index: state.index + 1, paused: false } : state;
    case "advance": return state.index === action.index && state.take === action.take
      ? { ...state, index: state.index + 1 } : state;
    default: return state;
  }
}

export default function useStory() {
  const [state, dispatch] = useReducer(step, { index: -1, response: null, take: 0, paused: false });
  const [muted, setMuted] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [sound] = useState(createSound);
  const beat = state.index < 0 ? ready : beats[state.index] || home;
  const paused = state.paused || hidden;
  const remaining = useRef(0);
  const played = useRef("");
  useEffect(() => {
    const changed = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", changed);
    return () => { document.removeEventListener("visibilitychange", changed); sound.dispose(); };
  }, [sound]);

  useEffect(() => { remaining.current = beat.ms; }, [beat, state.take]);
  useEffect(() => {
    if (paused || beat.ms === null) return;
    const start = performance.now();
    const timer = setTimeout(() => dispatch({type: "advance", index: state.index, take: state.take}), remaining.current);
    return () => { clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (performance.now()-start)); };
  }, [beat, state.index, state.take, paused]);

  useEffect(() => {
    const id = state.take + "/" + beat.id;
    if (paused || muted || played.current === id) return;
    played.current = id;
    const cue = ["echo", "answer"].includes(beat.id) ? beat.id + "_" + state.response : beat.sound || beat.id;
    sound.play(cue);
    return () => sound.stop();
  }, [beat, state.response, state.take, paused, muted, sound]);
  const act = useCallback((type, response) => {
    if (!muted && ["start", "choose", "pause"].includes(type)) sound.unlock();
    if (type === "skip" || type === "start") sound.stop();
    dispatch({type, response});
  }, [muted, sound]);
  function toggleMute() {
    if (muted) sound.unlock(); else sound.stop();
    setMuted(!muted);
  }
  return { beat, ...state, paused, muted, act, toggleMute };
}
