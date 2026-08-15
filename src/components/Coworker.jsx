import { useEffect, useState } from "react";

const moods = ["ready", "point", "thinking", "celebrate", "tired", "panic"];
const workActivities = ["clipboard", "coffee", "receipt", "box", "wipe", "keys"];

function nextRandom(items, previous) {
  const choices = items.filter((item) => item !== previous);
  return choices[Math.floor(Math.random() * choices.length)] || items[0];
}

export default function Coworker({ transitionKey = 0, variant = "full", mood: forcedMood, ambient = false }) {
  const [moodIndex, setMoodIndex] = useState(0);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    if (!forcedMood) setMoodIndex((value) => (value + 1) % moods.length);
  }, [transitionKey, forcedMood]);

  useEffect(() => {
    if (forcedMood) return undefined;
    const id = setInterval(() => {
      setMoodIndex((value) => (value + 1) % moods.length);
    }, 16000);
    return () => clearInterval(id);
  }, [forcedMood]);

  useEffect(() => {
    if (!ambient) {
      setActivity(null);
      return undefined;
    }

    let startTimer;
    let endTimer;
    let alive = true;

    const schedule = () => {
      const wait = 7000 + Math.random() * 13000;
      startTimer = window.setTimeout(() => {
        if (!alive) return;
        setActivity((previous) => nextRandom(workActivities, previous));
        const duration = 2600 + Math.random() * 2200;
        endTimer = window.setTimeout(() => {
          if (!alive) return;
          setActivity(null);
          schedule();
        }, duration);
      }, wait);
    };

    schedule();
    return () => {
      alive = false;
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [ambient]);

  const mood = forcedMood || moods[moodIndex];

  return (
    <div className={`coworker coworker--${variant} coworker--${mood} coworker--activity-${activity || "idle"}`} aria-hidden="true">
      <svg viewBox="0 0 260 460" role="presentation">
        <defs>
          <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f2c29f" />
            <stop offset="1" stopColor="#d7956f" />
          </linearGradient>
          <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e33d40" />
            <stop offset="1" stopColor="#a91725" />
          </linearGradient>
          <linearGradient id="pants" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#293241" />
            <stop offset="1" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b49358" />
            <stop offset=".48" stopColor="#7f6846" />
            <stop offset="1" stopColor="#4e4132" />
          </linearGradient>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#000" floodOpacity=".23" />
          </filter>
        </defs>

        <ellipse className="cw-shadow" cx="132" cy="438" rx="70" ry="13" fill="rgba(0,0,0,.18)" />

        <g className="cw-character" filter="url(#softShadow)">
          <g className="cw-legs">
            <path d="M96 285 C94 330 91 367 82 414 L112 418 C123 374 128 333 130 286 Z" fill="url(#pants)" />
            <path d="M132 286 C137 333 142 374 148 417 L179 414 C172 368 170 328 166 285 Z" fill="url(#pants)" />
            <path d="M73 414 C79 408 94 407 112 414 L110 437 L61 437 C61 427 65 420 73 414 Z" fill="#141a23" />
            <path d="M148 414 C161 407 174 408 182 414 C192 421 196 429 195 437 L149 437 Z" fill="#141a23" />
            <path d="M88 417 L111 417" stroke="#394150" strokeWidth="3" />
            <path d="M151 417 L178 417" stroke="#394150" strokeWidth="3" />
          </g>

          <g className="cw-torso">
            <path d="M86 154 C103 143 152 143 173 155 C184 179 184 242 172 292 C145 303 110 301 86 291 C77 244 76 184 86 154 Z" fill="url(#shirt)" />
            <path d="M112 151 L129 174 L144 151" fill="#222a34" />
            <path d="M129 174 L129 211" stroke="#73202a" strokeWidth="3" />
            <path d="M89 158 C80 170 78 187 79 203" stroke="#222a34" strokeWidth="7" strokeLinecap="round" />
            <path d="M170 158 C181 171 183 188 182 204" stroke="#222a34" strokeWidth="7" strokeLinecap="round" />
            <rect x="91" y="286" width="80" height="12" rx="5" fill="#1c2430" />
            <rect x="124" y="283" width="24" height="18" rx="3" fill="#99917e" stroke="#303846" strokeWidth="3" />
            <text x="139" y="206" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle" transform="rotate(-3 139 206)">CASEY'S</text>

            <g className="cw-lanyard">
              <path d="M119 162 C117 199 116 220 124 247 M139 162 C142 201 142 223 134 247" fill="none" stroke="#202733" strokeWidth="3" />
              <rect x="117" y="241" width="25" height="32" rx="3" fill="#f5f5ef" stroke="#202733" strokeWidth="3" />
              <text x="129.5" y="261" fill="#202733" fontSize="9" fontWeight="900" textAnchor="middle">2593</text>
            </g>

            <g className="cw-keys">
              <path d="M92 291 C86 312 86 322 94 331" fill="none" stroke="#949dad" strokeWidth="3" />
              <circle cx="94" cy="335" r="6" fill="none" stroke="#aab2bf" strokeWidth="3" />
              <rect x="97" y="330" width="7" height="17" rx="2" fill="#464f5e" />
              <rect x="87" y="334" width="7" height="15" rx="2" fill="#c66f2e" />
            </g>
          </g>

          <g className="cw-arm cw-arm--left">
            <path d="M88 170 C66 190 59 222 62 259 C64 281 74 295 88 298 C99 300 104 288 100 278 C90 254 88 223 104 193 Z" fill="url(#skin)" />
            <circle cx="88" cy="298" r="12" fill="url(#skin)" />
          </g>

          <g className="cw-arm cw-arm--right">
            <path d="M171 170 C192 189 201 218 202 248 C203 267 198 282 188 292 C179 301 169 296 168 286 C171 261 170 227 155 193 Z" fill="url(#skin)" />
            <g className="cw-hand--right">
              <circle cx="188" cy="293" r="12" fill="url(#skin)" />
              <path d="M196 291 C211 287 221 280 229 270" fill="none" stroke="url(#skin)" strokeWidth="8" strokeLinecap="round" />
              <path d="M197 293 C210 297 220 299 232 298" fill="none" stroke="url(#skin)" strokeWidth="7" strokeLinecap="round" />
            </g>
          </g>

          <g className="cw-neck">
            <path d="M114 140 L114 162 C119 171 140 172 146 162 L146 138 Z" fill="url(#skin)" />
          </g>

          <g className="cw-head">
            <ellipse cx="130" cy="96" rx="60" ry="62" fill="url(#skin)" />
            <ellipse cx="72" cy="102" rx="12" ry="18" fill="#dda17d" />
            <ellipse cx="188" cy="102" rx="12" ry="18" fill="#dda17d" />

            <g className="cw-hair">
              <path d="M77 74 C74 49 93 26 116 30 C112 17 139 17 143 32 C156 19 176 37 171 52 C191 49 194 72 181 83 C160 62 101 60 77 74 Z" fill="url(#hair)" />
              <path d="M91 52 C104 30 119 26 126 40 C134 18 150 25 151 43 C165 28 179 42 172 58" fill="none" stroke="#c1a06a" strokeWidth="9" strokeLinecap="round" opacity=".65" />
            </g>

            <g className="cw-face">
              <path className="cw-brow cw-brow--left" d="M93 80 C103 74 111 75 117 80" fill="none" stroke="#5c4632" strokeWidth="7" strokeLinecap="round" />
              <path className="cw-brow cw-brow--right" d="M143 80 C151 74 160 75 168 82" fill="none" stroke="#5c4632" strokeWidth="7" strokeLinecap="round" />
              <ellipse cx="106" cy="96" rx="14" ry="17" fill="#fff" />
              <ellipse cx="154" cy="96" rx="14" ry="17" fill="#fff" />
              <circle className="cw-pupil cw-pupil--left" cx="108" cy="98" r="7" fill="#66a4d7" stroke="#2a4057" strokeWidth="3" />
              <circle className="cw-pupil cw-pupil--right" cx="152" cy="98" r="7" fill="#66a4d7" stroke="#2a4057" strokeWidth="3" />
              <circle cx="110" cy="95" r="2" fill="#fff" />
              <circle cx="154" cy="95" r="2" fill="#fff" />
              <path d="M130 96 C127 107 125 116 131 119 C137 119 140 116 141 112" fill="none" stroke="#bd795b" strokeWidth="3" strokeLinecap="round" />
              <path className="cw-mouth" d="M108 130 C119 141 144 142 154 129" fill="none" stroke="#744638" strokeWidth="5" strokeLinecap="round" />
            </g>
          </g>

          <g className="cw-prop cw-prop--clipboard">
            <rect x="72" y="218" width="92" height="105" rx="10" fill="#f8f4e8" stroke="#315d91" strokeWidth="5" />
            <rect x="99" y="208" width="38" height="18" rx="6" fill="#315d91" />
            <path d="M88 246 H148 M88 264 H142 M88 282 H147 M88 300 H128" stroke="#8091a5" strokeWidth="5" strokeLinecap="round" />
            <path className="cw-pencil" d="M163 268 L194 247" stroke="#f2a13a" strokeWidth="7" strokeLinecap="round" />
          </g>

          <g className="cw-prop cw-prop--coffee">
            <rect x="165" y="246" width="48" height="58" rx="8" fill="#f5f0e7" stroke="#1f2937" strokeWidth="4" />
            <path d="M213 260 C235 258 237 286 214 287" fill="none" stroke="#1f2937" strokeWidth="5" />
            <path className="cw-steam cw-steam--1" d="M176 238 C168 225 185 219 177 205" fill="none" stroke="#dbe7f4" strokeWidth="4" strokeLinecap="round" />
            <path className="cw-steam cw-steam--2" d="M193 238 C185 225 203 217 194 202" fill="none" stroke="#dbe7f4" strokeWidth="4" strokeLinecap="round" />
          </g>

          <g className="cw-prop cw-prop--receipt">
            <path d="M67 215 L118 218 L114 337 L105 330 L97 338 L89 330 L80 338 L72 329 L64 337 Z" fill="#fbfbf7" stroke="#9aa6b2" strokeWidth="3" />
            <path d="M77 239 H106 M77 253 H101 M77 267 H107 M77 288 H103 M77 302 H106" stroke="#8d99a7" strokeWidth="3" strokeLinecap="round" />
            <text x="91" y="228" fill="#344054" fontSize="8" fontWeight="900" textAnchor="middle">RECEIPT</text>
          </g>

          <g className="cw-prop cw-prop--box">
            <path d="M59 268 L169 264 L192 292 L79 299 Z" fill="#d9ad70" stroke="#7e5b36" strokeWidth="4" />
            <path d="M79 299 L192 292 L187 362 L76 371 Z" fill="#c98f4d" stroke="#7e5b36" strokeWidth="4" />
            <path d="M59 268 L79 299 L76 371 L55 341 Z" fill="#b97d3e" stroke="#7e5b36" strokeWidth="4" />
            <rect x="116" y="312" width="46" height="25" rx="4" fill="#f3ead8" />
            <text x="139" y="329" fill="#7e5b36" fontSize="9" fontWeight="900" textAnchor="middle">STOCK</text>
          </g>

          <g className="cw-prop cw-prop--wipe">
            <path d="M175 265 C198 251 220 256 229 276 C208 289 190 289 169 280 Z" fill="#62b6c7" opacity=".95" />
            <path className="cw-spark cw-spark--1" d="M221 235 v15 M213 243 h16" stroke="#f7d45d" strokeWidth="4" strokeLinecap="round" />
            <path className="cw-spark cw-spark--2" d="M239 255 v11 M234 260 h11" stroke="#f7d45d" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </div>
  );
}
