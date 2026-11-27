# Till in Before the Rush

The approved 11461.png supplies the front rig and still artwork. The side rigs use the corrected leg textures from the Step 4.5 package. The runtime artwork and anchors are under `src/till/art`.

`director.js` makes decisions from the active screen, task category, progress, and reading activity. It runs finite gestures with cooldowns and keeps recent gestures in memory for the current shift. Critical screens stay quiet unless a user event calls for a brief response. `performances.js` handles movement and prop contact. `stages.js` defines the spaces reserved for Till, including the floor, seat, and desk used by the animation. Keep the actor inside these spaces when adding a new performance.

The scene loads its renderer when it first needs motion. The player only draws frames during a gesture and pauses when the scene leaves the viewport or the window is hidden. The approved still appears under the system reduced-motion preference or if the graphics context fails. Profile settings can quiet movement or hide Till. Help remains available in Learn and Quick.

Operational copy lives in `src/data/guide.js`. The service worker precaches the hashed rig, still, and textures alongside the app. Its existing update cycle lets open shifts finish on their current build.

The pre-overhaul production revision is on `backup/pre-till-animation-overhaul-2026-11-26`.
