# AI HANDOFF — Kayla's Shift Guide

## Mission
Mobile-first working/training guide for **Kayla** at **Casey's Store 2593**. It should feel like a premium internal app, not a generic retail checklist.

## Non-negotiable product behavior
1. Keep the morning workflow sequential and easy to follow.
2. Prefer one important thing on one screen.
3. Do not turn Home into a long scrolling dashboard.
4. Opening experience includes "Good morning, Kayla" + dry/funny/helpful wisdom.
5. Opening should visually transition into the compact working experience.
6. **Start here** dominates Home.
7. Health Department and Gas Inspection use Yes/No decisions revealing corresponding directions.
8. If Jamo or Loretta is clickable in an info area, each person's name appears only once in that bubble/panel.
9. Coworker character: tall, skinny, a little older, blond hair, blue eyes, red Casey's-style polo, highly expressive, integrated with screen/card edges, stronger reactions between tasks, random-feeling idle actions, never blocks critical text.
10. Beginning/end wisdom is dry, relatable and useful, not motivational-poster sludge.
11. Red is reserved for genuine urgency/escalation.
12. Mobile-first, polished, premium and fast.
13. Do **not** reintroduce older Store Pilot features such as generic manager sign-in or short-staffed mode.
14. Do **not** reintroduce the old Recovery Photos workflow.
15. LTO reporting day is no longer a current task.

## Protected operational facts
### Store Walk
- Start with the store walk.
- Check lottery box and note books that need adding.
- Opening cashier gets the first bathroom break as coverage allows.

### Health Department / Gas Inspection
- In the 2593 login.
- No visit/inspection: Not Applicable → initial → save.
- Visit/inspection occurred: complete applicable entry → initial → save → document needed follow-up.

### Price Server Editor
- Office computer → Programs → Back Office → Price Server Editor.
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

## Provenance
This project is a reconstruction of the latest settled requirements because the ChatGPT Sites source tree could not be directly exported. Do not describe it as the original byte-for-byte Sites source.
