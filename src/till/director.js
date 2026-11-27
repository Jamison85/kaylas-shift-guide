const seconds = 1000;
const idle = [
  ["idle_breathe", 5], ["idle_blink", 7], ["idle_double_blink", 2],
  ["look_left", 4], ["look_right", 4], ["idle_shift", 4], ["idle_stretch", 2],
  ["adjust_glasses", 4], ["raise_eyebrow", 2],
];
const home = [
  ...idle, ["idle_scan", 5], ["check_watch", 4], ["quiet_laugh", 3],
  ["think_chin", 3], ["peek_from_counter", 3], ["take_a_seat", 3],
  ["walk_left", 3], ["walk_right", 3], ["sweep_floor", 2], ["carry_pizza", 2],
  ["face_surprised", 1],
];
const byWork = {
  walk: [["look_right", 5], ["point_left", 3], ["check_watch", 3]],
  register: [["lean_on_desk", 3], ["check_watch", 3], ["small_nod", 4]],
  paperwork: [["carry_paperwork", 4], ["sort_receipt", 5], ["write_on_clipboard", 5]],
  receipt: [["sort_receipt", 8], ["carry_paperwork", 4], ["skeptical_exam", 3], ["react_confused", 2], ["react_frustrated", 1]],
  computer: [["think_chin", 5], ["look_down", 4], ["small_nod", 4]],
  lottery: [["clipboard_hold_side", 6], ["write_on_clipboard", 5], ["think_chin", 3]],
  inventory: [["write_on_clipboard", 6], ["clipboard_carry_top", 4], ["point_left", 3]],
};
const arrivals = {
  walk: "look_left",
  register: "check_watch",
  paperwork: "carry_paperwork",
  receipt: "sort_receipt",
  computer: "think_chin",
  lottery: "clipboard_hold_side",
  inventory: "write_on_clipboard",
};
const cues = {
  acknowledgement: ["small_nod", "satisfied_smile", "approve_nod"],
  milestone: ["celebrate_thumbs", "fist_pump", "proud_stance"],
  concern: ["face_concerned", "think_chin"],
  finish: ["celebrate_shift", "celebrate_milestone"],
  help: ["explain", "present_open_palm", "one_important_detail", "reassure"],
  seriousHelp: ["small_nod", "face_focused"],
};

export function getTillPreference(value) {
  return value === "quiet" || value === "off" ? value : "full";
}

export function createTillSession() {
  return { visited: new Set(), recent: [], lastPlayed: new Map(), nextAmbient: 0 };
}

export function workContext(task) {
  if (task.decision || ["Cash / Safe", "Front End"].includes(task.category) || task.id === "finalize-eod") return "critical";
  if (task.id === "receipt-sort") return "receipt";
  return ({
    "Start Here": "walk",
    People: "register",
    "Set Up": "paperwork",
    Paperwork: "paperwork",
    Bookwork: "computer",
    Lottery: "lottery",
    "After Bookwork": "inventory",
  })[task.category] || "computer";
}

function weightedChoice(options, session, minGap, now, random) {
  const allowed = options.filter(([id]) =>
    !session.recent.includes(id) && now - (session.lastPlayed.get(id) ?? -Infinity) > minGap);
  if (!allowed.length) return;
  let ticket = random() * allowed.reduce((count, [, weight]) => count + weight, 0);
  for (const [id, weight] of allowed) {
    ticket -= weight;
    if (ticket < 0) return id;
  }
  return allowed.at(-1)[0];
}

export function directTill({ session, anchor, work, cue, preference, play, stop, now = () => performance.now(), random = Math.random }) {
  const critical = work === "critical";
  const ambient = preference === "full" && (anchor === "home" || (anchor === "task" && !critical));
  const minIdle = anchor === "home" ? 8 * seconds : 14 * seconds;
  const occurrence = cue?.key ?? (anchor === "task" ? `arrival-${work}` : `arrival-${anchor}`);
  const explicit = cues[cue?.kind];
  const entrance = preference === "full" && !critical && ({
    home: "wave_hello",
    onboarding: "wave_hello",
    task: arrivals[work],
  })[anchor];
  const options = explicit?.map(id => [id, 1]) || (entrance ? [[entrance, 1]] : []);
  let pending = !session.visited.has(occurrence) && options.length && (preference === "full" || explicit);
  let enabled = false;
  let active = null;
  let timer;
  let lastActivity = now();

  function begin(id, source) {
    active = { id, source, started: false };
    play(id, source);
  }

  function queue() {
    clearTimeout(timer);
    if (!enabled || active) return;
    if (pending) {
      timer = setTimeout(() => {
        if (!enabled) return;
        if (!explicit && now() - lastActivity < 360) {
          queue();
          return;
        }
        const motion = weightedChoice(options, session, explicit ? 1.1 * seconds : 8 * seconds, now(), random);
        pending = false;
        session.visited.add(occurrence);
        if (motion) begin(motion, explicit ? "event" : "arrival");
        else queue();
      }, explicit ? 170 : 480);
      return;
    }
    if (!ambient) return;
    const delay = Math.max(350, lastActivity + minIdle - now(), session.nextAmbient - now());
    timer = setTimeout(() => {
      if (!enabled) return;
      if (document.activeElement?.matches("input, textarea, select, [contenteditable=true]") || window.getSelection()?.type === "Range") {
        lastActivity = now();
        queue();
        return;
      }
      const pool = anchor === "home" ? home : [...idle, ...(byWork[work] || [])];
      const id = weightedChoice(pool, session, 90 * seconds, now(), random);
      if (id) begin(id, "ambient");
      else {
        session.nextAmbient = now() + 8 * seconds;
        queue();
      }
    }, delay);
  }

  return {
    setAvailable(available) {
      if (enabled === available) return;
      enabled = available;
      if (!enabled && active) {
        active = null;
        stop();
      }
      if (enabled) lastActivity = now();
      queue();
    },
    noteActivity() {
      lastActivity = now();
      // Scroll and interaction postpone background gestures. A short cue
      // already in progress gets to settle into its neutral pose.
      if (!active && !pending) queue();
    },
    started() {
      if (!active || active.started) return;
      active.started = true;
      session.lastPlayed.set(active.id, now());
      session.recent = [...session.recent.filter(id => id !== active.id), active.id].slice(-4);
      if (active.source === "ambient") session.nextAmbient = now() + (19 + random() * 19) * seconds;
    },
    finish() {
      active = null;
      queue();
    },
    dispose() {
      enabled = false;
      active = null;
      clearTimeout(timer);
      stop();
    },
  };
}
