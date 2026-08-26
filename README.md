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
- Personalized Good Morning splash with dry wisdom.
- Splash automatically transitions into the working home screen.
- Small home header plus a much larger **Start here** area.
- One-task-at-a-time morning guide.
- 21 operational tasks.
- Progress saved by date in browser local storage.
- Installable on Android as a Progressive Web App, with a compact in-app install button when supported.
- The full guide and its local visual assets are cached for offline use after the first visit.
- New published versions replace the offline cache automatically.
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
