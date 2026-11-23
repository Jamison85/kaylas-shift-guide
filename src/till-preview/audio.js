// Optional local recordings, relative to the app base. Keys match story beat IDs.
// Use echo_hello, echo_watching, answer_hello and answer_watching for branch lines.
// Supply pre-mixed overhead voice files for echo_*; there is no generated voice.
export const recordings = {
  notification: null,
  crash: null,
  echo_hello: null,
  echo_watching: null,
  answer_hello: null,
  answer_watching: null,
};

export function createSound() {
  let context;
  let media;
  let nodes = [];
  function stop() {
    if (media) { media.pause(); media.removeAttribute("src"); media.load(); media = null; }
    for (const node of nodes) {
      try { node.stop(); } catch { /* already ended */ }
      node.disconnect();
    }
    nodes = [];
  }
  return {
    unlock() {
      try {
        const AudioAPI = window.AudioContext || window.webkitAudioContext;
        if (AudioAPI) { context ??= new AudioAPI(); context.resume().catch(() => {}); }
      } catch { /* Captions work without Web Audio. */ }
    },
    play(key) {
      stop();
      if (recordings[key]) {
        media = new Audio(import.meta.env.BASE_URL + recordings[key]);
        media.play().catch(() => {});
        return;
      }
      if (context?.state !== "running" || !["notification", "crash"].includes(key)) return;
      const now = context.currentTime;
      const ping = key === "notification";
      const parts = ping ? [[0, 785, .1], [.11, 1046, .18]] : [[0, 140, .15], [.075, 98, .18], [.20, 170, .09]];
      for (const [delay, hz, duration] of parts) {
        const source = context.createOscillator();
        const gain = context.createGain();
        const start = now + delay;
        source.type = ping ? "sine" : "triangle";
        source.frequency.setValueAtTime(hz, start);
        if (!ping) source.frequency.exponentialRampToValueAtTime(42, start + duration);
        gain.gain.setValueAtTime(.001, start);
        gain.gain.exponentialRampToValueAtTime(ping ? .075 : .13, start + .008);
        gain.gain.exponentialRampToValueAtTime(.001, start + duration);
        source.connect(gain).connect(context.destination);
        nodes.push(source);
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        source.start(start); source.stop(start + duration);
      }
    },
    stop,
    dispose() { stop(); context?.close().catch(() => {}); context = null; },
  };
}
