# Till mobile runtime V2

Uses transparent, pre-rendered articulated frames from the V2 rig and the definitive 11461.png still. There is no WebGL requirement, extra route, or new interactive overlay. Existing Guide tasks, copy and navigation remain unchanged.

Release subset: idle breathing/blink, wave, pointing, explanation, nod, thumbs-up, shift celebration and clipboard hold. 276 × 453 px, ~18 fps; one-shot gestures settle to idle. Reduced motion, hidden tabs and offscreen actors use the still. The existing app service worker precaches build output.

Deliberately deferred: directional turns, climbing/hanging, complex object contacts and advanced locomotion. V2 lab is not shipped. CPU-rendered frame samples were visually inspected; no physical phone performance claims. See manifest.json for frame counts and durations.

Rollback: backup/pre-till-runtime-2026-11-26.
