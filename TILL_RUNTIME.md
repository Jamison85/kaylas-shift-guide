# Till in Before the Rush

The approved 11461.png supplies the rig and still artwork. Till uses a single continuous view during app gestures. The runtime artwork and anchors are under `src/till/art`.

`director.js` picks task arrivals, help gestures, and occasional actions from the active screen, task category, progress, and reading activity. Critical screens stay quiet unless a user event calls for a brief response. `performances.js` handles movement and prop contact. `stages.js` places Till and his work surfaces using the same coordinates as the rig.

The scene loads its renderer when it first needs motion. The player only draws frames during a gesture and pauses when the scene leaves the viewport or the window is hidden. The approved still appears under the system reduced-motion preference or if the graphics context fails. Profile settings can quiet movement or hide Till. Help remains available in Learn and Quick.

Operational copy lives in `src/data/guide.js`. The service worker precaches the hashed rig, still, and textures alongside the app. Its existing update cycle lets open shifts finish on their current build.

The pre-overhaul production revision is on `backup/pre-till-animation-overhaul-2026-11-26`.
