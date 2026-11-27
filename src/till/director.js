const homeBreak = ["knock_on_edge", "glance_from_edge"];
const workMotions = {
  walk: ["check_surroundings", "guide_to_step"],
  register: ["check_watch", "rest_on_counter"],
  paperwork: ["straighten_reports", "jot_a_note"],
  receipt: ["compare_receipt", "straighten_reports"],
  computer: ["follow_line", "guide_to_step"],
  lottery: ["read_clipboard", "jot_a_note", "compare_receipt"],
  inventory: ["jot_a_note", "guide_to_step"],
};
const reactions = {
  return: ["rise_over_edge"],
  talk: ["lean_in"],
  detail: ["follow_detail"],
  acknowledgement: ["small_nod"],
  milestone: ["celebrate_thumbs"],
  concern: ["face_concerned"],
  finish: ["wrap_shift"],
  help: ["offer_help", "emphasize_detail"],
  seriousHelp: ["emphasize_detail", "offer_help"],
};

export function getTillPreference(value) {
  return value === "quiet" || value === "off" ? value : "full";
}

export function createTillSession() {
  return { visited: new Set(), choices: new Map(), recent: [], nextAmbient: 0 };
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

export function directTill({
  session, anchor, work, taskId, cue, preference, play, stop, now = () => performance.now(), random = Math.random,
}) {
  const full = preference === "full";
  const entrance = anchor === "task" ? workMotions[work]
    : anchor === "home" ? ["rise_over_edge"]
    : anchor === "onboarding" ? ["wave_hello"] : null;
  const group = cue?.kind ?? (anchor === "task" ? work : anchor);
  const occurrence = cue?.key ?? (taskId ? `task-${taskId}` : anchor);
  const options = cue ? reactions[cue.kind] : full && entrance;
  const ambient = full && (anchor === "home" ? homeBreak : anchor === "task" && workMotions[work]);
  const idleDelay = anchor === "home" ? 8200 : 16800;
  let pending = Boolean(options && !session.visited.has(occurrence));
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
        if (!cue && now() - lastActivity < 140) {
          queue();
          return;
        }
        const index = session.choices.get(group) ?? 0;
        begin(options[index % options.length], cue ? "event" : "arrival");
      }, cue ? 95 : 215);
      return;
    }
    if (!ambient) return;
    const delay = Math.max(300, lastActivity + idleDelay - now(), session.nextAmbient - now());
    timer = setTimeout(() => {
      if (document.activeElement?.matches("input, textarea, select, [contenteditable=true]") || window.getSelection()?.type === "Range") {
        lastActivity = now();
        queue();
        return;
      }
      const recent = session.recent.slice(-(ambient.length - 1));
      const choices = ambient.filter(id => !recent.includes(id));
      begin(choices[Math.floor(random() * choices.length)], "ambient");
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
      if (!active && !pending) queue();
    },
    started() {
      if (!active || active.started) return;
      active.started = true;
      session.recent = [...session.recent.filter(id => id !== active.id), active.id].slice(-3);
      if (active.source === "ambient") {
        session.nextAmbient = now() + 16500 + random() * 9500;
      } else {
        pending = false;
        session.visited.add(occurrence);
        session.choices.set(group, (session.choices.get(group) ?? 0) + 1);
      }
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
