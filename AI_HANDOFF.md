# AI HANDOFF — Before the Rush

## Mission
Mobile-first working/training guide for any opening employee at **Casey's Store 2593**. It should feel personal and premium, not like a generic retail checklist.

## Non-negotiable product behavior
1. Keep the morning workflow sequential and easy to follow.
2. Prefer one important thing on one screen.
3. Do not turn Home into a long scrolling dashboard.
4. First-run setup asks for the employee's name; the Home greeting uses that saved name with dry/funny/helpful wisdom.
5. After setup, open the compact Home screen directly.
6. **Start here** dominates Home.
7. Health Department and Gas Inspection use Yes/No decisions revealing corresponding directions.
8. If Jamo or Loretta is clickable in an info area, each person's name appears only once in that bubble/panel.
9. Coworker character: tall, skinny, a little older, blond hair, blue eyes, red Casey's-style polo, expressive, and integrated into existing empty space.
10. Do not add a dedicated character row or make the character cover instructions, values, decisions, or navigation.
11. In Learn mode, the coworker can explain the task's purpose or deeper step context through the **Why?** dialog.
12. Avoid ambient motion that does not clearly fit the work. Character behavior should feel intentional, calm, and helpful.
13. Beginning/end wisdom is dry, relatable and useful, not motivational-poster sludge.
14. Red is reserved for genuine urgency/escalation.
15. Mobile-first, polished, premium and fast.
16. Do **not** reintroduce older Store Pilot features such as generic manager sign-in or short-staffed mode.
17. Do **not** reintroduce the old Recovery Photos workflow.
18. LTO reporting day is no longer a current task.
19. Keep the app installable as a PWA. Preserve the manifest, generated offline service worker, Android icons, and the unobtrusive header install control.
20. Fresh, uninstalled phone visitors see a Home-screen invitation before name setup. Desktop visitors and standalone launches skip it, and **Continue in browser** must always remain available so installation can never block the workflow.
21. The atrium clip plays once on the first Home visit of a session with full motion and a fresh shift. Home and its task button are available immediately. The atrium stays still offline and in reduced-motion or quiet mode.
22. The Tube note button starts with Till writing and sending the note from his workspace, follows the capsule into the phone and brings the live message to the app screen. It delivers the message immediately without motion or when the clip is skipped or fails to play. The next message in the 40-note rotation is saved on the device.
23. Ask Till plays a close-up greeting and explains the next task. It shares the bottom control panel with Tube note. The task card above the panel remains available during either clip.

## Character behavior philosophy
The coworker is not a sticker, mascot costume, or permanent header decoration. He should feel like a helpful coworker who lives inside the interface. Use him in existing negative space and in contextual explanation dialogs. The humor should happen around the work, never at the expense of the work.

## Protected operational facts
### Store Walk
- Start with the store walk.
- Check lottery box and note books that need adding.
- Opening cashier gets the first break as soon as Register 2 is ready for coverage.

### Health Department / Gas Inspection
- In the 2593 login.
- No visit/inspection: Not Applicable → initial → save.
- Visit/inspection occurred: complete applicable entry → initial → save → document needed follow-up.

### Price Server Editor
- Office computer → Start → Programs → StorePoint Office → Price Server Editor.
- Sign in with first/last name + register sign-in number.
- Approve item groups separately.
- Auto Post Batch.
- Zero item groups: close editor.

### End of Day
- Yesterday should show Pending.
- Prior days should show Closed.

### Paperwork
- Brown paper bag over desk holds receipts/paperwork.
- Deposit Report on front.
- Lottery Report under it.
- Waste/corrections stapled in front.
- Write yesterday's date.
- Note safe report corrections.
- Customer count from Back Office Print Preview page 3.
- Sign/initial.
- Finished packet goes in bin below office desk.

### Lottery audit
- Screen 3 of 2593 login → Lottery Audits → New.
- Enter prior-night/current-morning numbers.
- Book counts from locked black box above office desk, second page.
- Received/Returns only with matching invoice/return slip on lottery clipboard.
- Normal result: 0 tickets over/under, $0 variance.
- Delete/reset is allowed before finalizing to fix an entry.
- Jamison is first chain call for lottery-system issues.
- Larger concerns, especially more than a couple tickets or more than $20, go to Jamo/Loretta rather than being forced through.
- Finalize with initials.
- Regular lottery/lotto paid with purchase appears under Coupon tender.
- Separate paid-out lines are individual/few paid-out transactions.

### Safe / drawer
- Safe Report deposit number should match End of Day deposit tab.
- First mismatch check: Drawers / Full Till.
- Notify Jamo first, then Loretta; Richard only when district-level escalation is actually needed.
- Tender totals should match lottery and lotto sales reports.
- Then Drop → Deposit → finalize cashiers → End of Day.

### After bookwork
- Power Inventory 30-for-30.
- Backstock and on-floor counts on handheld.

## Architecture rule
`src/data/guide.js` is the operational source of truth. Visual redesign is welcome. Silent business-rule rewrites are not.

Character behavior is implemented separately from operational content. Keep it that way. Ambient visual behavior should not be encoded into `src/data/guide.js`.

## PWA behavior
- `public/manifest.webmanifest` defines the Android install experience.
- `npm run build` generates a revisioned `dist/sw.js` after Vite finishes.
- The service worker precaches the production build except for the optional Home clips. It replaces old app caches when a downloaded update activates after the previous version’s windows close.
- The install button only appears when the browser reports that installation is available. Do not leave a dead install button visible on unsupported or already-installed devices.
- The first-run Home-screen invitation may always be shown in browser mode because its primary action falls back to working manual instructions when the native prompt is unavailable. This is separate from the header install button.

## Provenance
This project is a reconstruction of the latest settled requirements because the ChatGPT Sites source tree could not be directly exported. Do not describe it as the original byte-for-byte Sites source.
