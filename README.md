# Before the Rush

Portable React/Vite version of the opening workflow guide for Casey's Store 2593.

## Important provenance note

The active app had been developed through ChatGPT Sites. The original Sites source tree was not directly exportable from the current conversation, so this project is a **portable reconstruction of the latest agreed workflow and design decisions**, not a byte-for-byte export.

That distinction matters. Do not let another AI claim this is the inaccessible original source.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## What is intentionally separated

- `src/data/guide.js` = operational content and workflow.
- `src/components/*` = interface behavior.
- `src/styles.css` = visual design and coworker character.
- `src/hooks/useLocalStorage.js` = on-device persistence.

This separation is deliberate. A different AI can redesign the UI without silently changing the bookwork instructions.

## Current app behavior

- First-run Home-screen invitation, followed by name setup. Installed launches skip the invitation automatically, and a browser fallback is always available.
- Personalized Home greeting with dry opening wisdom. Setup leads directly to the first task card.
- Small home header plus a much larger **Start here** area.
- One-task-at-a-time morning guide.
- 21 operational tasks.
- Progress saved by date in browser local storage.
- Installable on Android as a Progressive Web App, with a compact in-app install button when supported.
- The full guide and its local visual assets are cached for offline use after the first visit.
- Published updates activate after all windows using the previous version close. An update can download during a shift without interrupting an open form.
- Learn mode uses one expanded instruction at a time to reduce scrolling.
- Quick mode keeps the same workflow as a compact list.
- Character-led **Why?** explanations use the existing context instead of adding permanent page rows.
- Yes/No pop-up instruction bubble for Health Department and Gas Inspection.
- Contact help chips that do not duplicate a person's name within the same bubble.
- Tall skinny blond/blue-eyed coworker in a red 2593 polo, using approved local image assets.
- Coworker uses available panel space and never blocks critical instruction areas.
- Dry opening and closing wisdom.
- Bottom navigation.
- Serious red is used sparingly.

## Next-AI guardrail

Before changing any workflow text, review `AI_HANDOFF.md` and `src/data/guide.js`.

A redesign should not change:
- escalation order,
- lottery variance thresholds,
- deposit/tender reconciliation logic,
- Health Department/Gas Inspection behavior,
- Price Server procedure,
- End of Day procedure,
- Power Inventory 30-for-30 order.

Visual experimentation is welcome. Operational improvisation is not.

## Phone installation

On a fresh phone, the app asks to be added to the Home screen before name setup. Android browsers use the native install sheet when available; otherwise, use the browser menu and choose **Install app** or **Add to Home screen**. On iPhone or iPad, use the browser's **Share** menu and choose **Add to Home Screen**.

The invitation always includes **Continue in browser**, so an unsupported browser cannot block the opening workflow. The compact install button remains available in the app header whenever the browser later reports that native installation is ready.

The installed app opens in its own window. Names, daily progress, and saved contact numbers remain on that device. They are not synced to another phone.

## Browser regression tests

Run `npx playwright install chromium` once, then `npm test`. The tests build and serve the production app locally and use isolated browser storage. Set `CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium installation.

## Till’s First Connection preview

**Hello? Is Somebody Up There?** is a standalone interactive short on the `till-first-connection-assets` branch. The timed sequence runs for about 55 seconds. Discovery waits for your reply.

Download and extract [the portable preview](review/hello-till.zip), then open `Hello-Till.html` in a browser. The file includes its artwork, fonts, player and sound cues. The [phone recording](review/hello-till.mp4) shows a complete playthrough of “Hello, Till!” at normal speed.

For the React version, run the following on this branch.

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173/kaylas-shift-guide/?till-preview=1`. On a phone on the same Wi-Fi, use the computer’s LAN IP in place of `localhost`.

Choose **Start introduction**, answer Till, and watch the stack on his right. Use **Replay** to try “I've been watching you.” **Pause** holds a beat for inspection. **Skip** goes directly to a read-only Home preview using the sample name “Opener.” The normal app URL retains the install invitation, setup and saved shift workflow.

### Artwork, sound and motion

- All five scenes use the same elevated three-quarter composition from the [perspective proof](review/till-perspective/README.md). The room plate, ten Till poses, clipboard, closed carton, open carton, and loose peanut are based on that proof and the original design references. The browser uses local WebP assets in `public/till-preview/art`.
- Till’s cutouts share one registration point on the tiled floor. A contact shadow sits beneath his boots, and a separate desk edge provides foreground occlusion. The camera gently reframes the locked view. The clipboard flies on the reply, while the stacked cartons stay closed until the fall. Eight independently timed peanuts spill out and settle.
- The sequence, captions and beat lengths live in `src/till-preview/story.js`. A texture mesh moves Till’s head, writing hand and waving arm. Pose exchanges register his eyes and name badge. Reduced motion holds the camera steady and shows settled props. Browsers without WebGL use a 2D pose transition with the same eye anchors. The introductory shot uses layered artwork, so camera travel and articulation are limited.
- There are no recorded lines or finished effects in the package. The player synthesizes a short notification and carton impact after a user gesture. Overhead replies use the chosen words, lighting and recoil. The review video is silent. The interactive player has the sound controls.
- To add recordings, place local clips in `public/till-preview/audio/` and map their paths (relative to the Vite app base) in `src/till-preview/audio.js`. Supply pre-mixed overhead recordings for `echo_hello` and `echo_watching`, and Till’s reactions for `answer_hello` and `answer_watching`. Other spoken lines use their beat IDs. Use `notification` and `crash` for replacement effects. Adjust beat lengths to the final performances.
- Home uses a read-only capture of the existing layout and stylesheet. The room fades around Till as he moves to the card. The same character surface stays in the companion slot. Preview playback operates in memory. The normal service worker excludes the experimental bundle and artwork.
