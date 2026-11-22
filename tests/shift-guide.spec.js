import { expect, test } from "@playwright/test";
import { guideTasks } from "../src/data/guide.js";

const profile = { name: "Kayla" };
const dayKey = "before-rush-2026-11-22";
const nextDayKey = "before-rush-2026-11-23";
const sample = { currentIndex: 1, completed: ["store-walk"], mode: "quick", answers: {} };

async function start(page, records = {}) {
  await page.clock.install({ time: new Date("2026-11-22T09:00:00Z") });
  await page.goto("./");
  await page.evaluate((entries) => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
  }, { "before-rush-profile": JSON.stringify(profile), ...records });
  await page.reload();
}

test("rollover loads the next local day without writing either shift on mount", async ({ page }) => {
  const tomorrow = { ...sample, completed: [], currentIndex: 0 };
  await start(page, { [dayKey]: JSON.stringify(sample), [nextDayKey]: JSON.stringify(tomorrow) });
  await expect(page.locator(".progress-status")).toContainText("1/21");
  await page.clock.fastForward("15:00:01");
  await expect(page.locator(".progress-status")).toContainText("0/21");
  await page.getByRole("button", { name: "Learn", exact: true }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), dayKey)).toEqual(sample);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), nextDayKey)).toEqual({
    ...tomorrow, mode: "learn",
  });
});

for (const raw of ["{", "null", '{"completed":9}', '{"currentIndex":"wrong"}']) {
  test(`damaged saved progress still opens and preserves the original record: ${raw}`, async ({ page }) => {
    await start(page, { [dayKey]: raw });
    await expect(page.locator(".start")).toContainText("Store Walk");
    expect(await page.evaluate(key => localStorage.getItem(key), dayKey)).toBe(raw);
  });
}

test("legacy contacts and progress survive resume, a second tab, and a confirmed reset", async ({ page, context }) => {
  const numbers = { jamo: "+1 (555) 555-0100" };
  await start(page, {
    "kayla-guide-2026-11-22": JSON.stringify(sample),
    "kayla-guide-contact-numbers": JSON.stringify(numbers),
  });
  const other = await context.newPage();
  await other.clock.install({ time: new Date("2026-11-22T09:00:00Z") });
  await other.goto("./");
  await page.locator(".start").click();
  await page.locator("summary").first().click();
  await expect(page.locator(".contact-call")).toHaveAttribute("href", "tel:+15555550100");
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.locator(".done-next").click();
  await expect(other.locator(".progress-status")).toContainText("2/21");
  await other.getByRole("button", { name: "Learn", exact: true }).click();
  await expect(page.getByRole("button", { name: "Learn", exact: true })).toHaveAttribute("aria-pressed", "true");
  await other.getByRole("button", { name: "Quick", exact: true }).click();
  await other.locator(".profile-button").click();
  await other.getByRole("button", { name: "Reset today’s progress" }).click();
  await expect(other.getByRole("button", { name: "Keep my progress" })).toBeFocused();
  await other.getByRole("button", { name: "Reset today", exact: true }).click();
  await expect(other.locator(".progress-status")).toContainText("0/21");
  await expect(other.getByRole("button", { name: "Quick", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await other.evaluate(() => JSON.parse(localStorage.getItem("kayla-guide-contact-numbers")))).toEqual(numbers);
  expect(await other.evaluate(() => JSON.parse(localStorage.getItem("before-rush-profile")))).toEqual(profile);
});

test("a failed write remains usable across screens and can be saved on the next edit", async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    window.originalWrite = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException("Quota exceeded", "QuotaExceededError"); };
  });
  await page.locator(".start").click();
  await page.locator(".done-next").click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.locator(".mini__brand").click();
  await expect(page.locator(".progress-status")).toContainText("1/21");
  await page.evaluate(() => { Storage.prototype.setItem = window.originalWrite; });
  await page.getByRole("button", { name: "Quick", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".progress-status")).toContainText("1/21");
});

test("short-screen profile and explanation dialogs keep and return focus", async ({ page }) => {
  await start(page);
  await page.setViewportSize({ width: 667, height: 320 });
  await page.locator(".profile-button").click();
  await page.getByRole("button", { name: "Reset today’s progress" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("What should I call you?")).toBeFocused();
  await page.getByRole("button", { name: "Reset today’s progress" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".profile-button")).toBeFocused();
  await page.locator(".start").click();
  await page.locator(".task-why-link").click();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Got it, Till" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".task-why-link")).toBeFocused();
});

test("the cached guide and fonts work offline through the final task", async ({ page, context }) => {
  await start(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => [...document.fonts].filter(font => font.status === "loaded").map(font => font.family))).toEqual(
    expect.arrayContaining(["DM Sans", "Fraunces"])
  );
  await page.locator(".start").click();
  for (const task of guideTasks) {
    await expect(page.locator(".task-intro__summary")).toHaveText(task.short);
    if (task.decision) {
      await expect(page.locator(".done-next")).toBeDisabled();
      await page.getByRole("button", { name: "No", exact: true }).click();
    }
    await page.locator(".done-next").click();
  }
  await page.getByRole("button", { name: "Back home" }).click();
  await expect(page.locator(".home h1")).toHaveText("Morning guide complete.");
  await expect(page.locator(".progress-status")).toContainText("21/21");
});

test("reselecting a saved mismatch answer preserves the completed drawer check", async ({ page }) => {
  const tenderIndex = guideTasks.findIndex(task => task.id === "tender-totals");
  const completed = guideTasks.slice(0, tenderIndex).map(task => task.id);
  await start(page, { [dayKey]: JSON.stringify({
    completed, currentIndex: tenderIndex, mode: "quick", answers: { "safe-deposit": "no" },
  }) });
  await page.locator(".start").click();
  await page.locator(".guided-back").click();
  await page.locator(".guided-back").click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.locator(".done-next").click();
  await expect(page.locator(".task-card h1")).toHaveText("Fix a Safe / EOD Mismatch");
  await expect(page.locator(".task-state--done")).toBeVisible();
});
