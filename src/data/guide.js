export const contacts = {
  jamo:{name:"Jamo",role:"Center Store Manager · lottery support",text:"First contact for normal bookwork questions, small variances, and lottery-system or chain issues."},
  loretta:{name:"Loretta",role:"General Manager",text:"Escalate when the issue is larger, unresolved, or needs GM review."},
  richard:{name:"Richard",role:"District Manager",text:"Use when district-level support is actually needed."}
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
      {title:"Check front-end coverage",detail:"Make sure the opening cashier can step away for their first break as soon as Register 2 is ready."},
      {title:"Know what you are walking into",detail:"Before starting bookwork, make a mental note of anything you will need to come back to after the urgent morning work is stable."}
    ],
    check:"You know the store’s immediate problems, the lottery box has been checked, and nothing urgent is being ignored.",
    tip:"This is a scan, not a remodeling project.", contacts:[], completeLabel:"Store walk done"
  },
  {
    id:"register-two", title:"Open and Fund Register 2", short:"Put money in it before covering the opener’s break.", category:"Front End",
    purpose:"Have Register 2 open and ready before the opening cashier steps away so Kayla can use it to ring customers during the break.",
    location:"Register 2 + Smart Safe.",
    steps:[
      {title:"Open Register 2",detail:"Get Register 2 open before the opening cashier goes on break."},
      {title:"Check the money already inside",detail:"Decide whether Register 2 needs funding before Kayla uses it to ring customers.",more:"Register 2 will usually need money because no one has used it yet. Check first anyway; adding cash it does not need only creates more reconciliation work later."},
      {title:"Choose Yes or No below",detail:"If it needs money, follow the Smart Safe and Paid In directions. If it already has enough, keep it open and ready for break coverage."}
    ],
    decision:{
      question:"Does Register 2 need money?",
      noTitle:"Register 2 already has enough money",
      noText:"Do not remove extra money from the safe and do not enter a Paid In.",
      noSteps:["Leave the existing cash alone.","Keep Register 2 open and ready to ring customers during the break."],
      yesTitle:"Fund Register 2",
      yesText:"Use the Smart Safe menu option, then record the exact same amount as a Paid In on Register 2.",
      yesSteps:["Decide the bill mix needed, usually tens, fives, and ones.","Add coins only if the register actually needs change.","Use the Smart Safe menu option to get the money.","Count the total amount received from the safe.","Put that money into Register 2.","Enter a Paid In on Register 2 for that exact total.","Confirm the physical cash added and the Paid In amount match exactly.","Keep Register 2 open and ready to ring customers during the break."]
    },
    check:"Register 2 is open and ready for break coverage; if money was added, the Smart Safe amount, physical cash, and Register 2 Paid In all match.",
    contacts:["jamo"], completeLabel:"Register 2 ready"
  },
  {
    id:"cashier-break", title:"Relieve the Opening Cashier", short:"Use Register 2 to cover the opener’s first break.", category:"People",
    purpose:"Give the opening cashier their break while Kayla stays at the front and rings customers from the newly opened Register 2.",
    location:"Register 2 / front end.",
    steps:[
      {title:"Confirm Register 2 is ready",detail:"Make sure Register 2 is open and has enough money before the opening cashier leaves the front."},
      {title:"Tell the opener you have the front",detail:"Let the opening cashier know they can take their break now."},
      {title:"Ring customers on Register 2",detail:"Use Register 2 for customer transactions while the opening cashier is away."},
      {title:"Stay at the front",detail:"Do not start an office task or leave the register area until the opening cashier returns."},
      {title:"Hand the front back cleanly",detail:"When they return, quickly pass along anything that happened during the break, then continue the guide."}
    ],
    check:"The opening cashier has returned from break, and Kayla covered the front by ringing customers on Register 2.",
    tip:"Human first, spreadsheet second. A revolutionary retail concept.", contacts:[], completeLabel:"Opening cashier relieved"
  },
  {
    id:"yesterday-sources", title:"Collect Yesterday’s Bookwork Sources", short:"Get the Safe Report up front, then locate the lottery pages.", category:"Set Up",
    purpose:"Collect yesterday’s printed source paperwork before starting office work so the later lottery audit and Safe Report reconciliation use the actual records.",
    location:"Front end first, then the office.",
    steps:[
      {title:"Confirm yesterday’s business date",detail:"Make sure every report or number you collect belongs to the previous business day, not today."},
      {title:"Look for yesterday’s Safe Report up front",detail:"The report prints at closing and is usually on top of the Smart Safe or sitting on one of the registers."},
      {title:"Ask the opening employee if needed",detail:"If the Safe Report is not in either usual spot, ask the opening employee to help locate it before assuming it is missing."},
      {title:"Reprint it only if it is actually missing",detail:"If no one can locate the printed report, open the Reports section of the Smart Safe and reprint the Safe Report for yesterday.",more:"Choose the previous business date before printing. The report will later be compared with that same day’s End of Day batch, so today’s Safe Report is not a substitute."},
      {title:"Check for yesterday’s lottery pages up front",detail:"If the lottery pages are up front, grab them now. It does not matter whether you pick them up immediately before or after the Safe Report."},
      {title:"Head to the office",detail:"Once the Safe Report and any lottery pages that were up front are collected, take them with you to the office."},
      {title:"Find the lottery pages if they were not up front",detail:"Check the usual lottery-paperwork spot and the prior-day paperwork pouches on the office desk until you find yesterday’s pages.",more:"The lottery pages are often tucked into the pouch holding paperwork for whoever closed the night before, but they are not always in the same place. Check both likely locations instead of assuming they are missing."},
      {title:"Use yesterday’s beginning and ending numbers",detail:"Keep the beginning and ending lottery numbers with the Safe Report for today’s lottery audit and later reconciliation."}
    ],
    check:"You are in the office with yesterday’s Safe Report and yesterday’s lottery beginning and ending numbers, all for the correct business date.",
    contacts:["jamo"], completeLabel:"Yesterday’s sources collected"
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
    id:"lottery-audit-start", title:"Start the Lottery Audit", short:"Open a new audit and enter yesterday’s beginning/ending numbers.", category:"Lottery",
    purpose:"Start today’s lottery audit using the correct screen and the beginning and ending lottery numbers collected from yesterday.", location:"Screen 3 of the 2593 login.",
    steps:[
      {title:"Go to screen 3",detail:"In the 2593 login, move to screen 3."},
      {title:"Open Lottery Audits",detail:"Choose Lottery Audits from screen 3."},
      {title:"Start a new audit",detail:"Select New. Do not open an old audit and start changing it.",more:"New creates today’s working audit. Opening an older audit risks changing a record that belongs to a different business day."},
      {title:"Use yesterday’s beginning numbers",detail:"Enter the lottery beginning numbers you collected from yesterday into the matching beginning fields."},
      {title:"Use yesterday’s ending numbers",detail:"Enter yesterday’s matching lottery ending numbers into the ending fields."},
      {title:"Check each beginning/ending pair",detail:"Make sure every beginning number is paired with the correct ending number before moving to the next page."}
    ],
    check:"A new lottery audit is open and yesterday’s beginning and ending lottery numbers are entered in the correct matching fields.", contacts:["jamo","loretta"], completeLabel:"Lottery audit started"
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
    check:"The page-2 book counts match what is physically in the locked black lottery box.", contacts:["jamo"], completeLabel:"Book counts entered"
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
    check:"Received and Returns contain only entries supported by matching paperwork.", contacts:["jamo"], completeLabel:"Received/Returns checked"
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
      noSteps:["Re-check yesterday’s beginning and ending numbers.","Re-check the page-2 counts against the locked black box.","Use delete/reset if an entry is wrong, then correct it.","Call Jamo first for a lottery-system or chain issue.","If it is still more than a couple tickets or more than $20, stop and contact Jamo or Loretta before finalizing."]
    },
    check:"The audit is at 0 tickets and $0 variance, or any exception has been understood/escalated before finalizing.", contacts:["jamo","loretta"], completeLabel:"Lottery audit finalized"
  },
  {
    id:"safe-deposit", title:"Reconcile Safe Report to End of Day", short:"Match Kayla’s Paid Ins and the deposit across both.", category:"Cash / Safe",
    purpose:"Compare the Safe Report with the actual End of Day fields instead of treating the deposit as the only number that matters.", location:"Safe Report beside you + StorePoint Back Office → End Of Day Dialog → correct Pending day.",
    steps:[
      {title:"Keep the Safe Report beside the screen",detail:"You will compare the report against End of Day one field at a time."},
      {title:"Open the Cashiers tab",detail:"In the correct Pending End of Day batch, start on Cashiers."},
      {title:"Find every Kayla row",detail:"Kayla may appear on more than one row because each terminal can have its own cashier line.",more:"The photographed Cashiers table shows separate columns for Cashier, Status, Terminal, Variance, Sales, Drop, Open Bank, Pay In, Pay Out, PrePay, and Adjustments. Use Kayla’s name and terminal number to make sure you have all of her rows."},
      {title:"Compare Kayla’s Paid Ins",detail:"Add Kayla’s Pay In amounts across all of her rows, then compare that total with her Paid Ins on the Safe Report.",more:"Do not compare only the first Kayla row if she used both terminals. Read each Pay In amount carefully and make sure the combined End of Day total equals the Safe Report total."},
      {title:"Compare any matching Paid Outs",detail:"If the Safe Report shows Paid Outs for Kayla, compare them with the Pay Out amounts on her End of Day rows.",more:"Keep the signs intact. An amount shown in parentheses is negative; do not accidentally treat it as a positive amount while comparing reports."},
      {title:"Open Drop Safe, then the Deposit area",detail:"Use the Drop Safe tab in End of Day and go to the deposit information used for the business day."},
      {title:"Match the deposit on both reports",detail:"The deposit on the Safe Report must match the deposit shown in End of Day.",more:"Compare the actual deposit on the Safe Report with the End of Day Drop Safe / Deposit figure. Do not substitute the Cashiers-tab Sales, Drop, Variance, or tender total for the deposit comparison."},
      {title:"Choose Yes or No below",detail:"Everything compared must agree. If any Paid In, applicable Paid Out, or deposit figure does not match, use the mismatch path."}
    ],
    decision:{
      question:"Do Kayla’s Paid Ins, applicable Paid Outs, and the deposit agree on both sides?",
      yesTitle:"The reports reconcile",
      yesText:"Good. Skip Drawers / Full Till and continue to the tender totals.",
      yesSteps:["Leave the matching entries alone.","Continue to Verify Tender Totals."],
      yesSkip:["drawer-mismatch"],
      noTitle:"Something does not match",
      noText:"Do not finalize anything yet. Identify the failed comparison, then check Drawers / Full Till.",
      noSteps:["Note whether the mismatch is Paid In, Paid Out, or deposit.","Leave the Safe Report and End of Day available for comparison.","Check Kayla’s other terminal row before assuming money is missing.","Open Drawers / Full Till next.","Look for an unfinalized drawer or an incorrect till entry before escalating."]
    },
    check:"Kayla’s Paid Ins, any applicable Paid Outs, and the deposit agree between the Safe Report and End of Day, or the mismatch has been identified for the next check.", contacts:["jamo","loretta"], completeLabel:"Reports reconciled"
  },
  {
    id:"drawer-mismatch", title:"Fix a Safe / EOD Mismatch", short:"Check the failed comparison before escalating.", category:"Cash / Safe",
    purpose:"Find the specific drawer or till issue behind a Paid In, Paid Out, or deposit mismatch.", location:"End of Day → Cashiers and Drawers / Full Till, with the Safe Report beside you.",
    steps:[
      {title:"Name the mismatch first",detail:"Be clear whether Paid In, Paid Out, or the deposit failed to match before changing anything."},
      {title:"Re-check all of Kayla’s terminal rows",detail:"Make sure a second Kayla row is not holding the amount that seemed to be missing."},
      {title:"Open Drawers / Full Till",detail:"This is the first place to look for an unfinalized or incorrect drawer/till entry."},
      {title:"Look for an unfinalized drawer",detail:"Check whether a cashier drawer or till is still open, Pending, or not fully finalized."},
      {title:"Look for the specific incorrect entry",detail:"Compare the related Paid In, Paid Out, and deposit information with the Safe Report."},
      {title:"Correct only the problem you can identify",detail:"If you find the cause, use the normal store process to correct that specific issue.",more:"A physically completed Paid In that was never recorded is different from a made-up adjustment. Correct only a real, explainable transaction. Do not change an unrelated drawer, till, or deposit amount just to force a balance."},
      {title:"Run the same comparison again",detail:"After a correction, re-check Kayla’s Paid Ins, any applicable Paid Outs, and the deposit on both sides."},
      {title:"Escalate if you still cannot explain it",detail:"Notify Jamo first, then Loretta. Richard is for district-level escalation when it is actually needed."}
    ],
    check:"The failed comparison now agrees on both sides, or the unexplained mismatch has been escalated instead of guessed at.", contacts:["jamo","loretta","richard"], completeLabel:"Mismatch checked"
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
    id:"finalize-eod", title:"Finalize Deposit and End of Day", short:"Drop Safe → Deposit → cashiers → End of Day.", category:"Bookwork",
    purpose:"Close the business day only after the supporting numbers have been checked and reconciled.", location:"End of Day.",
    steps:[
      {title:"Open the Drop Safe tab",detail:"Go to Drop Safe inside End of Day."},
      {title:"Go to the Deposit area",detail:"Open the deposit information from there."},
      {title:"Final-check the deposit",detail:"Make sure the deposit you are about to finalize still matches the Safe Report."},
      {title:"Return to Cashiers",detail:"Go back to the Cashiers tab for the correct business-day batch."},
      {title:"Finalize the required cashier rows",detail:"Finalize the cashier drawers/tills only after their reconciliation is complete.",more:"The photographed Cashiers screen uses the Status column along with the Finalize control. Work through the required cashier rows and confirm that the expected rows no longer remain Pending; do not finalize an unresolved mismatch simply to change the status."},
      {title:"Read the warning list",detail:"Check for a real unresolved warning before closing the business day. Do not ignore a warning just because this software looks old enough to rent a car."},
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
