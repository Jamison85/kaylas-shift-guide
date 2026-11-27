# Till in Before the Rush

The approved 11461.png supplies the rig and still artwork. Till uses a single continuous view during app gestures. The runtime artwork and anchors are under `src/till/art`.

`director.js` picks arrivals, replies, and occasional gestures using the active screen and task. Critical screens stay quiet unless a user event calls for a response. `resident.js` moves one canvas and renderer between the Home card, guide, and help. `stages.js` aligns the visible boundary with the actual card edge. `performances.js` sets which hands may reach over that boundary.

The scene loads its renderer when it first needs motion. The player only draws frames during a gesture and pauses when the scene leaves the viewport or the window is hidden. The approved still appears under the system reduced-motion preference or if the graphics context fails. Profile settings can quiet movement or hide Till. Help remains available in Learn and Quick.

Tapping Till opens an inline reply from the current task or selected step. The longer Ask Till explanation continues to use the guide’s existing help dialog and decision context.

The Home tube can play during a pause or send a note on demand. A frame describes the position of each prop and the condition of the tube, so the sleeve, capsule, and hand follow the same motion. Coffee and paper airplanes also appear during quiet moments on noncritical Learn screens. Ambient performances yield to interaction.

Operational copy lives in `src/data/guide.js`. The service worker precaches the hashed rig, still, and textures alongside the app. Its existing update cycle lets open shifts finish on their current build.

The pre-overhaul production revision is on `backup/pre-till-animation-overhaul-2026-11-26`.
