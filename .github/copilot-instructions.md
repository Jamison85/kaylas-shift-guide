# Copilot instructions for Kayla's Shift Guide

This repository is a mobile-first working/training guide for Kayla at Casey's Store 2593.

Before changing anything substantial, read:
- `AI_HANDOFF.md`
- `src/data/guide.js`

## Protected operational source
`src/data/guide.js` is the operational source of truth. Do not silently change Casey's procedures, escalation order, lottery variance thresholds, deposit/tender reconciliation rules, End of Day steps, Health Department/Gas Inspection behavior, or Power Inventory order.

## Product direction
- One primary task at a time.
- Home should stay compact and avoid becoming a long dashboard.
- Keep the large Good Morning Kayla opening and strong Start Here area.
- Premium, polished, mobile-first visual language.
- Tall skinny older blond/blue-eyed coworker in a red Casey's-style polo should feel like he lives inside the UI.
- Character animation must never cover critical instructions.
- Dry, funny, useful copy is preferred over generic motivational language.
- Red is reserved for genuine urgency.
- Do not reintroduce old Store Pilot features, short-staffed mode, old Recovery Photos workflow, or obsolete LTO reporting day.

## Coworker behavior is a core feature
The coworker is not a static mascot or decorative sticker. He should feel like an actual odd little coworker who lives inside the app.

He should occasionally, unpredictably:
- check or scribble on a clipboard,
- sip coffee,
- inspect or fight with a receipt,
- carry a small stock box,
- wipe/polish a harmless UI surface,
- jingle or fuss with his keys,
- peek around panels,
- sit, hang, lean, or balance on harmless UI edges,
- use harmless words or decorative labels as physical objects, including climbing words like ladder rungs.

These ambient actions should be brief, random-feeling, and not constant. Task-transition reactions can be more noticeable than idle behavior.

### Hard safety rule for UI mischief
Only elements explicitly marked as coworker-safe should be used as props or play surfaces. Never obscure, move, distort, or play with:
- important numbers or percentages,
- money, variance, deposit, ticket, count, or reconciliation values,
- task instructions,
- Yes/No decision controls,
- completion/Next/Back controls,
- urgent/escalation information,
- anything whose readability affects real work.

The humor must happen around the work, never at the expense of the work.

When making visual changes, preserve business logic unless the user explicitly requests an operational change.
