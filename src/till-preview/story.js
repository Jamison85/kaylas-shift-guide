export const acts = ["Routine", "Discovery", "Meet Till", "Chaos", "Sign-off"];
export const responses = {
  hello: "Hello, Till!",
  watching: "I've been watching you.",
};
export const finalLine = "Try not to break anything. Apparently that's my department.";
const guideLeadIn = "Anyway, this Shift Guide will help you keep track of your tasks, stay organized, and avoid any unnecessary...";

// One clock, one active beat. A null duration waits indefinitely for input.
export const beats = [
  { id: "routine", act: 0, pose: "working", ms: 1700 },
  { id: "signal", act: 0, pose: "working", ms: 760, sound: "notification" },
  { id: "odd", act: 0, pose: "working", ms: 3550, line: "That's odd. I don't remember ordering an earthquake." },
  { id: "lookup", act: 1, pose: "notices", ms: 2000, line: "Hello? Is somebody up there?" },
  { id: "choice", act: 1, pose: "notices", ms: null, line: "Hello? Is somebody up there?" },
  { id: "echo", act: 1, pose: "shock", ms: 1500 },
  { id: "answer", act: 1, pose: "shock", ms: 4850 },
  { id: "badge", act: 2, pose: "badge", ms: 4050, line: "Right. Well, since we're apparently talking now... I'm Till." },
  { id: "helper", act: 2, pose: "explain", ms: 6950, line: "I live around here. Keep an eye on things. Help with the shift. Occasionally prevent disasters. Occasionally cause smaller ones." },
  { id: "rent", act: 2, pose: "explain", ms: 4050, line: "This is my place. Not much to look at, but the rent's fantastic." },
  { id: "lean", act: 3, pose: "explain", ms: 4750, line: guideLeadIn },
  { id: "poise", act: 3, pose: "anticipation", ms: 1500, line: guideLeadIn },
  { id: "fall", act: 3, pose: "dodge", ms: 970 },
  { id: "impact", act: 3, pose: "dodge", ms: 850, sound: "crash" },
  { id: "surprises", act: 3, pose: "dodge", ms: 2000, line: "...surprises." },
  { id: "moving", act: 3, pose: "recovery", ms: 1600, line: "Moving on." },
  { id: "dust", act: 4, pose: "recovery", ms: 5300, line: "You'll see me around. I'll pop in when you need a hand. Sometimes when you don't." },
  { id: "engineer", act: 4, pose: "recovery", ms: 5300, line: "Now, you've got a shift to run, and I've got a structural engineer to call." },
  { id: "wave", act: 4, pose: "wave", ms: 1450 },
  { id: "reveal", act: 4, pose: "wave", ms: 1700 },
];
export const ready = { id: "ready", act: 0, pose: "working", ms: null };
export const home = { id: "home", act: 4, pose: "wave", ms: null };

export function caption(beat, response) {
  if (beat.id === "echo") return responses[response];
  if (beat.id === "answer") return response === "hello"
    ? "GOOD GRAVY! Could you turn yourself down a little?!"
    : "Well, that's deeply unsettling. In my defense, I was going to clean that.";
  return beat.line || "";
}
