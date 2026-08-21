export const contacts = {
  jamo:{name:"Jamo",role:"Center Store Manager",text:"First manager contact for normal bookwork questions and small variances."},
  loretta:{name:"Loretta",role:"General Manager",text:"Escalate when the issue is larger, unresolved, or needs GM review."},
  richard:{name:"Richard",role:"District Manager",text:"Use when district-level support is actually needed."},
  jamison:{name:"Jamison",role:"Lottery chain support",text:"First chain call for lottery-system issues."}
};

export const wisdomLines = [
  "The store has already chosen violence. You do not have to participate.",
  "One screen. One task. Retail has enough plot twists without adding your own.",
  "Do the money stuff carefully. The chips can survive without emotional support for twelve minutes.",
  "If the computer says something weird, verify it before developing a personal feud with the computer.",
  "Today’s goal is competent, not cinematic."
];

export const closingLines = [
  "You did the bookwork. Civilization continues for another shift.",
  "The paperwork is filed, the numbers are checked, and nobody had to summon corporate. Strong finish.",
  "Done is beautiful. Especially when it reconciles.",
  "You have officially defeated the morning. It will be back tomorrow, because retail is deeply committed to sequels."
];

export const guideTasks = [
  {
    id:"store-walk", title:"Start with the Store Walk", short:"Get a fast read on the store before office bookwork.", category:"Start Here",
    purpose:"Catch anything urgent before you settle into the office, and make sure the morning starts from what is actually happening in the store.",
    location:"Guest-facing store areas first, then the lottery box above the office desk.",
    steps:[
      {title:"Do a quick guest-area pass",detail:"Walk the guest-facing areas and look for anything urgent, unsafe, empty, messy, or obviously wrong. This is a scan, not a deep recovery project."},
      {title:"Separate urgent from cosmetic",detail:"Handle real safety, guest, spill, access, or operational problems now. Notice cosmetic problems, but do not let them steal the whole morning."},
      {title:"Check the lottery box",detail:"At the office, look in the locked black lottery box above the desk and note any scratcher books that need to be added."},
      {title:"Check front-end coverage",detail:"Make sure the opening cashier is covered well enough to step away for the first bathroom break as soon as possible."},
      {title:"Know what you are walking into",detail:"Before starting bookwork, make a mental note of anything you will need to come back to after the urgent morning work is stable."}
    ],
    check:"You know the store’s immediate problems, the lottery box has been checked, and nothing urgent is being ignored.",
    tip:"This is a scan, not a remodeling project.", contacts:[], completeLabel:"Store walk done"
  },
  {
    id:"cashier-break", title:"Relieve the Opening Cashier", short:"Get the opener their first bathroom break.", category:"People",
    purpose:"The opening cashier has already been holding the front alone for a while. Get them a break before office work turns into a black hole.",
    location:"Front register / front end.",
    steps:[
      {title:"Make sure the front is stable",detail:"Check that there is no immediate guest issue or register problem that would make stepping in unsafe or confusing."},
      {title:"Tell the opener you have the front",detail:"Be clear that they can go take their bathroom break now, not ‘sometime after one more thing.’"},
      {title:"Cover the register area",detail:"Stay available at the front while they are away so they are not being called back mid-break."},
      {title:"Let them actually finish the break",detail:"Do not start an office task that leaves the front uncovered before they return."},
      {title:"Hand the front back cleanly",detail:"Once they are back, quickly pass along anything that happened while they were away and then continue the guide."}
    ],
    check:"The opening cashier has actually had the first bathroom break and the front is covered again.",
    tip:"Human first, spreadsheet second. A revolutionary retail concept.", contacts:[], completeLabel:"Opening cashier relieved"
  },
  {
    id:"health-dept", title:"Health Department Check", short:"Record whether there was a Health Department visit.", category:"2593 Login",
    purpose:"Complete the daily Health Department entry correctly instead of leaving an inspection question hanging around for later.",
    location:"2593 login.",
    steps:[
      {title:"Open the 2593 login",detail:"Get into the store’s 2593 login before doing anything with the inspection entry."},
      {title:"Open Health Department",detail:"Find and open the Health Department check."},
      {title:"Read the visit question",detail:"Confirm whether the question is asking if there was an actual Health Department visit."},
      {title:"Choose No or Yes below",detail:"Use the decision buttons in this guide, then follow the matching directions before you mark this task complete."}
    ],
    decision:{question:"Was there a Health Department visit?",noTitle:"No visit",noText:"Select Not Applicable in the 2593 entry, enter your initials, then save.",noSteps:["Select Not Applicable.","Initial the entry.","Save it before leaving the screen."],yesTitle:"Yes, there was a visit",yesText:"Complete the applicable Health Department visit entry, initial it, save it, and note anything that needs management follow-up.",yesSteps:["Complete the visit information that applies.","Initial the entry.","Save it.","Document or escalate anything that needs follow-up."]},
    check:"The Health Department entry is saved with either Not Applicable or the actual visit information, and it has been initialed.",
    contacts:["jamo","loretta"], completeLabel:"Health check saved"
  },
  {
    id:"gas-inspection", title:"Gas Inspection Check", short:"Record whether there was a gas inspection.", category:"2593 Login",
    purpose:"Complete the daily Gas Inspection entry while you are already in the 2593 login.", location:"2593 login.",
    steps:[
      {title:"Stay in the 2593 login",detail:"Do not close out of the system after the Health Department check."},
      {title:"Open Gas Inspection",detail:"Find and open the Gas Inspection check."},
      {title:"Read the inspection question",detail:"Confirm whether there was an actual gas inspection to report."},
      {title:"Choose No or Yes below",detail:"Use the matching directions before moving on."}
    ],
    decision:{question:"Was there a gas inspection?",noTitle:"No inspection",noText:"Select Not Applicable, enter your initials, and save the Gas Inspection entry.",noSteps:["Select Not Applicable.","Initial the entry.","Save it before leaving the screen."],yesTitle:"Yes, there was an inspection",yesText:"Complete the applicable gas-inspection entry, initial it, save it, and document anything needing management follow-up.",yesSteps:["Complete the inspection information that applies.","Initial the entry.","Save it.","Document or escalate anything that needs follow-up."]},
    check:"The Gas Inspection entry is saved and initialed, with Not Applicable used only when there was no visit.", contacts:["jamo","loretta"], completeLabel:"Gas check saved"
  },
  {
    id:"price-server", title:"Price Server Editor", short:"Approve each item group, then auto-post the batch.", category:"Bookwork",
    purpose:"Clear Price Server Editor correctly before you move deeper into End of Day.", location:"Office computer → Programs → Back Office → Price Server Editor.",
    steps:[
      {title:"Go to the office computer",detail:"From Windows, open Programs, then Back Office."},
      {title:"Open Price Server Editor",detail:"Choose Price Server Editor from the Back Office area."},
      {title:"Sign in",detail:"Use your first and last name plus your register sign-in number."},
      {title:"Look for item groups",detail:"Check how many item groups are waiting. If there are zero groups, you do not have anything to approve."},
      {title:"Open the first item group",detail:"Review the group that is waiting for approval instead of trying to approve everything blindly at once."},
      {title:"Approve that group",detail:"Approve the current item group, then return to the group list."},
      {title:"Repeat for every remaining group",detail:"Each item group is approved separately. Keep going until no groups remain waiting."},
      {title:"Run Auto Post Batch",detail:"After the item groups are approved, choose Auto Post Batch."},
      {title:"Close Price Server Editor",detail:"If there were zero groups, or after the approvals and Auto Post Batch are complete, close the editor and continue."}
    ],
    check:"There are no unapproved item groups left, and Auto Post Batch has been run when groups were present.",
    tip:"Approve each group separately. Clicking enthusiastically is not a substitute for reading.", contacts:["jamo"], completeLabel:"Price Server complete"
  },
  {
    id:"eod-status", title:"Check End of Day Status", short:"Yesterday should be Pending; older days should be Closed.", category:"Bookwork",
    purpose:"Make sure you are working the correct business day before you finalize anything.", location:"Office computer, same Windows / Back Office area.",
    steps:[
      {title:"Open End of Day",detail:"From the same Windows area you used for Price Server Editor, open End of Day."},
      {title:"Find yesterday",detail:"Look at the business-day list and locate yesterday’s date."},
      {title:"Confirm yesterday says Pending",detail:"Yesterday is the day you are preparing to close, so its status should be Pending."},
      {title:"Check the days before yesterday",detail:"Older business days should show Closed."},
      {title:"Stop if the pattern is wrong",detail:"If yesterday is not Pending, or an older day is unexpectedly open, do not force anything closed just to get past the screen."}
    ],
    check:"Yesterday shows Pending and the prior days show Closed.", contacts:["jamo","loretta"], completeLabel:"EOD status verified"
  },
  {
    id:"paperwork-packet", title:"Build the Paperwork Packet", short:"Put yesterday’s reports and receipts in the correct order.", category:"Paperwork",
    purpose:"Build one clean packet before you start adding the final verification details.", location:"Office desk. Receipts / paperwork are in the brown paper bag over the desk.",
    steps:[
      {title:"Get yesterday’s paperwork together",detail:"Use the brown paper bag over the desk to gather the receipts and paperwork for the day you are closing."},
      {title:"Put the Deposit Report on the front",detail:"The Deposit Report should be the front report in the packet."},
      {title:"Place the Lottery Report under it",detail:"The Lottery Report goes directly underneath the Deposit Report."},
      {title:"Add waste and corrections",detail:"Place the waste/correction paperwork with the packet and staple it in front as required."},
      {title:"Straighten the packet before writing on it",detail:"Make sure you have the day’s paperwork together and in order before adding the final date, correction notes, customer count, and initials."},
      {title:"Know where the finished packet goes",detail:"After all details are complete, the finished packet goes in the bin below the office desk."}
    ],
    check:"Deposit Report is on front, Lottery Report is directly under it, waste/corrections are attached, and the packet is ready for final details.",
    tip:"Paperwork has an order because apparently even paper needs management.", contacts:[], completeLabel:"Packet assembled"
  },
  {
    id:"paperwork-details", title:"Finish the Deposit Report Details", short:"Add the date, corrections, customer count, and initials.", category:"Paperwork",
    purpose:"Finish the information that makes yesterday’s packet complete and identifiable.", location:"Office desk plus Back Office Print Preview.",
    steps:[
      {title:"Write yesterday’s date",detail:"Use the date for the business day you are closing, not today’s date."},
      {title:"Check the Safe Report for corrections",detail:"If there are safe-report corrections that need to be noted on the paperwork, write them where required."},
      {title:"Open Back Office Print Preview",detail:"Go to the Back Office Print Preview so you can get the customer count."},
      {title:"Go to page 3",detail:"The customer count you need is on page 3."},
      {title:"Add the customer count",detail:"Write the customer count onto the paperwork where it belongs."},
      {title:"Sign or initial",detail:"Add your signature or initials anywhere the packet requires them."},
      {title:"File the finished packet",detail:"Once the paperwork is complete, place the finished packet in the bin below the office desk."}
    ],
    check:"Yesterday’s date, any required safe corrections, the page-3 customer count, and initials/signature are on the packet, and the packet is filed below the desk.", contacts:["jamo"], completeLabel:"Paperwork details complete"
  },
  {
    id:"lottery-audit-start", title:"Start the Lottery Audit", short:"Open a new audit and enter the morning lottery numbers.", category:"Lottery",
    purpose:"Start the morning lottery audit using the correct screen and the actual prior-night/current-morning numbers.", location:"Screen 3 of the 2593 login.",
    steps:[
      {title:"Go to screen 3",detail:"In the 2593 login, move to screen 3."},
      {title:"Open Lottery Audits",detail:"Choose Lottery Audits from screen 3."},
      {title:"Start a new audit",detail:"Select New. Do not open an old audit and start changing it.",more:"New creates today’s working audit. Opening an older audit risks changing a record that belongs to a different business day."},
      {title:"Identify the prior-night numbers",detail:"Use the numbers from the prior night for the fields that ask for the previous reading."},
      {title:"Identify the current-morning numbers",detail:"Use the current morning readings for the fields that ask for the current reading."},
      {title:"Enter the numbers in the matching fields",detail:"Take your time and make sure each number is being entered in the field it belongs to before moving to the next page."}
    ],
    check:"A new lottery audit is open and the prior-night/current-morning numbers are entered in the correct fields.", contacts:["jamison","jamo","loretta"], completeLabel:"Lottery audit started"
  },
  {
    id:"lottery-books", title:"Enter Lottery Book Counts", short:"Use the locked black box counts on page two.", category:"Lottery",
    purpose:"Match the audit to the physical scratcher books instead of relying on memory or whatever number makes the screen look nicer.", location:"Locked black lottery box above the office desk + page 2 of the lottery audit.",
    steps:[
      {title:"Open the locked black box",detail:"Use the lottery box above the office desk where the physical book counts are kept."},
      {title:"Go to page 2 of the audit",detail:"Move to the second page of the lottery audit where the book counts are entered."},
      {title:"Take one count at a time",detail:"Read the physical count for a book, then enter that count into the matching field."},
      {title:"Compare the screen to the physical box",detail:"Before moving on, scan the entered values against what is physically in the box."},
      {title:"Correct anything that was mistyped",detail:"If a count is wrong, fix the entry now. Do not carry a known bad count into the variance review."}
    ],
    check:"The page-2 book counts match what is physically in the locked black lottery box.", contacts:["jamison","jamo"], completeLabel:"Book counts entered"
  },
  {
    id:"lottery-received-returns", title:"Received / Returns", short:"Only enter books when matching paperwork exists.", category:"Lottery",
    purpose:"Keep received and returned lottery books tied to actual invoices and return slips.", location:"Lottery clipboard + Received / Returns sections of the audit.",
    steps:[
      {title:"Check the lottery clipboard",detail:"Look for an invoice or a return slip before touching either section.",more:"Received and Returns are paperwork-driven fields. An odd-looking count by itself is not permission to enter a received or returned book."},
      {title:"Look for a received-book invoice",detail:"If there is a matching invoice for received books, use it to enter the Received information."},
      {title:"Leave Received alone without an invoice",detail:"No matching invoice means do not invent a received entry."},
      {title:"Look for a return slip",detail:"If there is a matching return slip, use it to enter the Returns information."},
      {title:"Leave Returns alone without a slip",detail:"No matching return slip means do not enter a return just because something looks odd."},
      {title:"Keep the paperwork with the audit process",detail:"Make sure the invoice/return information you entered can be traced back to the paperwork on the lottery clipboard."}
    ],
    check:"Received and Returns contain only entries supported by matching paperwork.", contacts:["jamison","jamo"], completeLabel:"Received/Returns checked"
  },
  {
    id:"lottery-variance", title:"Review the Lottery Variance", short:"Normal is 0 tickets over/under and $0 variance.", category:"Lottery",
    purpose:"Make sure the lottery audit actually reconciles before you put your initials on it.", location:"Final review / variance area of the lottery audit.",
    steps:[
      {title:"Check ticket over/under",detail:"The normal result is 0 tickets over or under."},
      {title:"Check the dollar variance",detail:"The normal dollar result is $0 variance."},
      {title:"Choose Yes or No below",detail:"Use the variance shown on the audit. The app will give you the correct normal or correction path."}
    ],
    decision:{
      question:"Does it show 0 tickets over/under and $0 variance?",
      yesTitle:"The audit reconciles",
      yesText:"Finalize the lottery audit with your initials, then continue.",
      yesSteps:["Make one last scan of the entered numbers.","Finalize the audit.","Enter your initials."],
      noTitle:"Do not finalize it yet",
      noText:"Treat this as an entry check first, then an escalation if the numbers still do not make sense.",
      noSteps:["Re-check the prior-night and current-morning numbers.","Re-check the page-2 counts against the locked black box.","Use delete/reset if an entry is wrong, then correct it.","Call Jamison first for a lottery-system or chain issue.","If it is still more than a couple tickets or more than $20, stop and contact Jamo or Loretta before finalizing."]
    },
    check:"The audit is at 0 tickets and $0 variance, or any exception has been understood/escalated before finalizing.", contacts:["jamison","jamo","loretta"], completeLabel:"Lottery audit finalized"
  },
  {
    id:"safe-deposit", title:"Match the Safe Report Deposit", short:"Safe Report deposit should match the End of Day deposit tab.", category:"Cash / Safe",
    purpose:"Verify the same deposit number appears in both places before you continue through End of Day.", location:"Safe Report + End of Day → Deposit tab.",
    steps:[
      {title:"Find the deposit on the Safe Report",detail:"Locate the deposit number shown on the Safe Report."},
      {title:"Open the End of Day deposit tab",detail:"Go to the Deposit area inside End of Day."},
      {title:"Find the deposit there",detail:"Locate the deposit number End of Day is showing."},
      {title:"Compare the two numbers",detail:"Read them digit by digit. They should match.",more:"Compare the exact deposit number shown on the Safe Report with the exact deposit number in the End of Day Deposit tab. Do not compare it to a drawer total or a tender total by mistake."},
      {title:"Choose Yes or No below",detail:"If they match, Drawers / Full Till is skipped. If they do not, that becomes the next troubleshooting step."}
    ],
    decision:{
      question:"Do the two deposit numbers match?",
      yesTitle:"They match",
      yesText:"Good. Skip Drawers / Full Till and continue to the tender totals.",
      yesSteps:["Leave the matching deposit numbers alone.","Continue to Verify Tender Totals."],
      yesSkip:["drawer-mismatch"],
      noTitle:"They do not match",
      noText:"Do not finalize the deposit. Check Drawers / Full Till next.",
      noSteps:["Leave the mismatched numbers visible if possible.","Open Drawers / Full Till next.","Look for an unfinalized drawer or an incorrect till entry before escalating."]
    },
    check:"The Safe Report deposit and End of Day deposit match, or you have identified that a mismatch needs the Drawers / Full Till check.", contacts:["jamo","loretta"], completeLabel:"Deposit matched"
  },
  {
    id:"drawer-mismatch", title:"Check Drawers / Full Till", short:"This is the first place to check when the deposit is off.", category:"Cash / Safe",
    purpose:"Check the most likely drawer/till issue before escalating a safe or deposit mismatch.", location:"End of Day → Drawers / Full Till.",
    steps:[
      {title:"Open Drawers / Full Till",detail:"When the safe/deposit numbers do not match, this is the first place to look."},
      {title:"Look for an unfinalized drawer",detail:"Check whether a cashier drawer or till is still open or not fully finalized."},
      {title:"Look for an incorrect till entry",detail:"Check for an entry that does not match what should be there."},
      {title:"Correct only the problem you can identify",detail:"If you find the cause, use the normal store process to correct that specific issue.",more:"Do not change an unrelated drawer, till, or deposit amount simply to make the total balance. A correction should have a specific cause you can explain."},
      {title:"Re-check the deposit",detail:"After a correction, compare the Safe Report deposit and End of Day deposit again."},
      {title:"Escalate if you still cannot explain it",detail:"Notify Jamo first, then Loretta. Richard is for district-level escalation when it is actually needed."}
    ],
    check:"The mismatch is corrected and the deposit now agrees, or the unexplained issue has been escalated instead of guessed at.", contacts:["jamo","loretta","richard"], completeLabel:"Drawers checked"
  },
  {
    id:"tender-totals", title:"Verify Tender Totals", short:"Lottery and lotto sales reports should reconcile to tender totals.", category:"Cash / Safe",
    purpose:"Make sure the tender side agrees with the lottery and lotto sales before End of Day is finalized.", location:"Tender totals + lottery sales report + lotto sales report.",
    steps:[
      {title:"Pull up the tender totals",detail:"Have the tender totals available so you can compare them against the lottery reports."},
      {title:"Compare lottery sales",detail:"Compare the lottery sales report to the corresponding tender totals."},
      {title:"Compare lotto sales",detail:"Compare the lotto sales report to the corresponding tender totals."},
      {title:"Account for Coupon tender",detail:"Regular lottery/lotto purchased together with other items may appear under Coupon tender.",more:"Coupon tender is where regular lottery or lotto paid as part of a purchase can appear. This belongs in the tender comparison, not in the scratcher audit variance."},
      {title:"Read paid-out lines separately",detail:"Separate paid-out lines usually represent one or a small number of individual paid-out transactions."},
      {title:"Investigate before finalizing",detail:"If the numbers do not agree, do not finalize End of Day until you understand the mismatch or have escalated it."}
    ],
    check:"Lottery and lotto sales make sense against tender totals, including any normal Coupon-tender activity.", contacts:["jamo","loretta"], completeLabel:"Tender totals verified"
  },
  {
    id:"finalize-eod", title:"Finalize Deposit and End of Day", short:"Drop → Deposit → finalize cashiers → End of Day.", category:"Bookwork",
    purpose:"Close the business day only after the supporting numbers have been checked and reconciled.", location:"End of Day.",
    steps:[
      {title:"Open the Drop tab",detail:"Go to Drop inside End of Day."},
      {title:"Go to Deposit",detail:"Open the Deposit section from there."},
      {title:"Final-check the deposit",detail:"Make sure the deposit you are about to finalize still matches the Safe Report."},
      {title:"Finalize the cashiers",detail:"Finalize the cashier drawers/tills that are required for the business day."},
      {title:"Complete End of Day",detail:"Once the cashiers and deposit are correct, complete End of Day."},
      {title:"Do one last sanity check",detail:"Before leaving the screen, make sure you closed the correct business day and nothing obvious is still showing unresolved."}
    ],
    check:"The correct business day is closed, required cashiers are finalized, and the deposit/tenders were reconciled before completion.", contacts:["jamo","loretta"], completeLabel:"End of Day finalized"
  },
  {
    id:"power-inventory", title:"Power Inventory 30-for-30", short:"Count backstock and the matching on-floor inventory.", category:"After Bookwork",
    purpose:"Move out of office bookwork and into the first center-store inventory task with the handheld.", location:"Handheld → Power Inventory.",
    steps:[
      {title:"Take the handheld",detail:"Once morning bookwork is complete, grab the handheld you use for Power Inventory."},
      {title:"Open Power Inventory",detail:"Go into the Power Inventory function on the handheld."},
      {title:"Start the 30-for-30 work",detail:"Open the 30-for-30 inventory/counting task."},
      {title:"Count the backstock",detail:"Enter the actual backstock quantity for each item you are working."},
      {title:"Count the on-floor product",detail:"Enter the matching sales-floor quantity for the same item."},
      {title:"Compare before submitting",detail:"If a count looks obviously wrong, physically re-check it instead of submitting the typo."},
      {title:"Finish the assigned counts",detail:"Complete the backstock and on-floor counts required for the 30-for-30."}
    ],
    check:"The 30-for-30 backstock and corresponding on-floor counts are entered and obvious count mistakes have been corrected.",
    tip:"Bookwork is done. Congratulations, the store has released you back into the wild.", contacts:["jamo"], completeLabel:"30-for-30 complete"
  }
];
