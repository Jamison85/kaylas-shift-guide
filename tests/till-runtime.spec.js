import { expect, test } from "@playwright/test";

const actor = anchor => `[data-till-anchor="${anchor}"]`;
const viewport = { width: 390, height: 844 };

async function openGuide(page, { preference, mode, completed = [], answers = {} } = {}) {
  await page.addInitScript(settings => {
    const date = new Date();
    const day = [
      date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0"),
    ].join("-");
    if (!localStorage.getItem("before-rush-profile")) {
      localStorage.setItem("before-rush-profile", JSON.stringify({ name: "Kayla", tillPreference: settings.preference }));
    }
    if (!localStorage.getItem(`before-rush-${day}`)) {
      localStorage.setItem(`before-rush-${day}`, JSON.stringify({
        completed: settings.completed, currentIndex: settings.completed.length,
        mode: settings.mode || "learn", answers: settings.answers,
      }));
    }
  }, { preference, mode, completed, answers });
  await page.setViewportSize(viewport);
  await page.goto("./");
}

async function enableMotion(page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

test("reduced motion shows the approved still and keeps the launch control usable", async ({ page }) => {
  await openGuide(page);
  const home = page.locator(actor("home"));
  await expect(home).toHaveAttribute("data-till-motion", "still");
  await expect(home).toHaveCSS("pointer-events", "none");
  await expect(home.locator("img")).toBeVisible();
  await expect.poll(() => home.locator("img").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.locator(".start").click();
  await expect(page.getByRole("heading", { name: "Store Walk" })).toBeVisible();
});

test("Till greets the opener and performs distinct actions as the shift progresses", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page);
  const home = page.locator(actor("home"));
  await expect(home).toHaveAttribute("data-till-motion", "climb_through_rip");
  await expect(home.locator("canvas")).toHaveAttribute("data-ready", "true");
  await expect(home.locator(".till-scenery")).toHaveAttribute("data-till-tear", "tugging");
  await expect(home.locator(".till-tear__depth")).toHaveCSS("background-image", /till-back-office-/);
  await expect(home.locator(".till-scenery")).toHaveAttribute("data-till-tear", "slipping");
  await expect(home.locator(".till-scenery")).toHaveAttribute("data-till-tear", "bracing");
  await expect(home.locator(".till-scenery")).toHaveAttribute("data-till-tear", "climbing");
  await expect(home.locator("canvas")).toHaveAttribute("data-view", "left");
  await expect(home.locator(".till-scenery")).toHaveAttribute("data-till-tear", "standing");
  await expect(home.locator(".till-scenery")).toHaveAttribute("data-till-tear", "dusting");
  await expect(home.locator("canvas")).toHaveAttribute("data-view", "front");
  await expect(home).toHaveAttribute("data-till-motion", "rest", { timeout: 10000 });
  await expect(home.locator(".till-stage__art")).not.toHaveAttribute("data-till-behind-tear");

  await page.locator(".start").click();
  const task = page.locator(actor("task"));
  await expect(task).toHaveAttribute("data-till-motion", "check_surroundings");
  await page.locator(".done-next").click();
  await expect(page.getByRole("heading", { name: "Open and Fund Register 2" })).toBeVisible();
  await expect(task).toHaveAttribute("data-till-motion", "still");
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.locator(".done-next").click();
  await expect(task).toHaveAttribute("data-till-motion", "check_watch");
  await expect(task).toHaveAttribute("data-till-source", "arrival");
  await page.locator(".done-next").click();
  await expect(task).toHaveAttribute("data-till-motion", "straighten_reports");
  await expect(task.locator("canvas")).toHaveAttribute("data-ready", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(task).toHaveAttribute("data-till-motion", "still");
  await expect(task.locator("canvas")).not.toHaveAttribute("data-ready");
  await expect(page.locator(".done-next")).toBeEnabled();
});

test("quiet suppresses background gestures and off preserves task help through a reload", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page);
  await page.locator(".profile-button").click();
  const settings = page.getByLabel("Till’s movement");
  await settings.selectOption("quiet");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(actor("home"))).toHaveAttribute("data-till-motion", "still");
  await page.locator(".start").click();
  await page.getByRole("button", { name: "Quick", exact: true }).click();
  await page.locator(".task-why-link").click();
  const help = page.locator(actor("help"));
  await expect(help).toHaveAttribute("data-till-motion", "offer_help");
  await expect(help.locator("canvas")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("dialog")).toContainText("Before you move on");
  await page.getByRole("button", { name: "Got it, Till" }).click();
  await page.getByRole("button", { name: "Before the Rush home" }).click();
  await page.locator(".start").click();
  await page.locator(".task-why-link").click();
  await expect(help).toHaveAttribute("data-till-motion", "emphasize_detail");
  await page.getByRole("button", { name: "Got it, Till" }).click();

  await page.locator(".profile-button").click();
  await settings.selectOption("off");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.reload();
  await expect(page.locator("[data-till-anchor]")).toHaveCount(0);
  await page.locator(".start").click();
  await page.locator(".task-why-link").click();
  await expect(page.getByRole("dialog")).toContainText("Guest-facing store areas");
  await expect(page.locator("[data-till-anchor]")).toHaveCount(0);
});

test("Till follows the guide from Home and talks about the step the opener selects", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page);
  const home = page.locator(actor("home"));
  await expect(home.locator("canvas")).toHaveAttribute("data-ready", "true");
  await home.locator("canvas").evaluate(canvas => { window.tillCanvas = canvas; });
  await home.getByRole("button", { name: "Talk to Till" }).click();
  await expect(page.locator("#home-till-reply")).toContainText("Catch anything urgent");
  await expect(home).toHaveAttribute("data-till-motion", "lean_in");
  await page.locator(".start").click();
  const task = page.locator(actor("task"));
  await expect(task.locator("canvas")).toHaveAttribute("data-ready", "true");
  expect(await task.locator("canvas").evaluate(canvas => canvas === window.tillCanvas)).toBe(true);
  await page.getByRole("button", { name: /Separate urgent from cosmetic/ }).click();
  await expect(task).toHaveAttribute("data-till-motion", "follow_detail");
  await task.getByRole("button", { name: "Talk to Till" }).click();
  await expect(page.locator("#task-till-reply")).toContainText("Handle real safety");
  await task.getByRole("button", { name: "Talk to Till" }).click();
  await expect(page.locator("#task-till-reply")).toBeEmpty();
  await page.locator(".task-why-link").click();
  const help = page.locator(actor("help"));
  await expect(help.locator("canvas")).toHaveAttribute("data-ready", "true");
  expect(await help.locator("canvas").evaluate(canvas => canvas === window.tillCanvas)).toBe(true);
  await expect(task.locator("canvas")).toHaveCount(0);
});

test("the tube delivers a note with touch or keyboard and works with reduced motion", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page, { preference: "quiet" });
  const home = page.locator(actor("home"));
  const trigger = home.getByRole("button", { name: "Send a tube note" });
  const scenery = home.locator(".till-scenery");
  await trigger.press("Enter");
  await expect(home).toHaveAttribute("data-till-motion", "send_tube_note");
  await expect(scenery).toHaveAttribute("data-till-prop", "capsule");
  await expect(scenery).toHaveAttribute("data-tube-phase", "firing");
  await expect(home.locator("canvas")).toHaveAttribute("data-view", "right");
  await expect(page.locator("#home-till-reply")).not.toContainText("receiving snacks");
  await expect(page.locator("#home-till-reply")).toContainText("receiving snacks");
  await expect(home.locator("canvas")).toHaveAttribute("data-view", "front");
  await expect(scenery).toHaveAttribute("data-till-prop", "");
  await page.setViewportSize({ width: 320, height: 610 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await trigger.click();
  await expect(page.locator("#home-till-reply")).toContainText("a working pen");
  await expect(home).toHaveAttribute("data-till-motion", "still");
  const launch = await page.locator(".start-meta b").boundingBox();
  const nav = await page.locator(".bottom-nav").boundingBox();
  expect(launch.y + launch.height).toBeLessThan(nav.y);
  await page.locator(".start").click();
  await expect(page.getByRole("heading", { name: "Store Walk" })).toBeVisible();
});

test("decision help uses the saved branch and keeps critical actions outside the actor's space", async ({ page }) => {
  await openGuide(page, { completed: ["store-walk"], answers: { "register-two": "no" } });
  await page.setViewportSize({ width: 320, height: 610 });
  await page.locator(".start").click();
  const box = await page.locator(actor("task")).boundingBox();
  const link = await page.locator(".task-why-link").boundingBox();
  const decisionButtons = await page.locator(".decision-buttons").boundingBox();
  expect(link.x + link.width).toBeLessThan(box.x);
  expect(box.y + box.height).toBeLessThan(decisionButtons.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  const decision = await page.locator(".bubble").locator("b").innerText();
  await page.locator(".task-why-link").click();
  await expect(page.getByRole("dialog").getByText(decision, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Got it, Till" }).click();
  await expect(page.locator(".task-why-link")).toBeFocused();
});

test("phone task titles stay together and the next task opens at the top of its card", async ({ page }) => {
  await openGuide(page, { completed: ["store-walk"], answers: { "register-two": "no" } });
  await page.setViewportSize({ width: 390, height: 676 });
  await page.locator(".start").click();
  const card = page.locator(".task-card");
  const title = card.locator("h1");
  await expect(title).toHaveText("Open and Fund Register 2");
  await page.evaluate(() => document.fonts.ready);
  expect(await title.evaluate(heading => {
    const label = heading.firstChild;
    const range = document.createRange();
    range.setStart(label, label.textContent.indexOf("Register"));
    range.setEnd(label, label.length);
    return range.getClientRects().length;
  })).toBe(1);

  const top = await page.locator(".mini").boundingBox();
  const bottom = await page.locator(".guided-footer").boundingBox();
  const sheet = await card.boundingBox();
  expect(sheet.y).toBeGreaterThan(top.y + top.height);
  expect(sheet.y + sheet.height).toBeLessThan(bottom.y);
  expect(bottom.y + bottom.height).toBeLessThanOrEqual(676);

  await card.evaluate(element => { element.scrollTop = element.scrollHeight; });
  expect(await card.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await page.locator(".done-next").click();
  await expect(title).toHaveText("Relieve the Opening Cashier");
  await expect(title).toBeFocused();
  expect(await card.evaluate(element => element.scrollTop)).toBe(0);
  await page.locator(".done-next").click();
  await expect(title).toHaveText("Collect Yesterday’s Bookwork Sources");
  expect(await card.evaluate(element => element.scrollTop)).toBe(0);
  await page.getByRole("button", { name: "Talk to Till" }).click();
  await expect(card.locator("#task-till-reply")).toContainText("printed source paperwork");
});

test("the cached app can play Till and open help while offline", async ({ page, context }) => {
  await enableMotion(page);
  await openGuide(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const cacheUrls = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async key =>
    (await (await caches.open(key)).keys()).map(request => new URL(request.url).pathname)))).flat());
  for (const asset of ["/poster-", "/front-", "/actor-"]) {
    expect(cacheUrls.some(path => path.includes(asset))).toBe(true);
  }
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(actor("home")).locator("canvas")).toHaveAttribute("data-ready", "true");
  await page.locator(".start").click();
  await page.locator(".task-why-link").click();
  await expect(page.locator(actor("help")).locator("canvas")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("dialog")).toContainText("Catch anything urgent");
});

test("WebGL failure leaves the approved still and working guidance", async ({ page }) => {
  await enableMotion(page);
  await page.addInitScript(() => {
    const openContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, options) {
      return kind === "webgl" ? null : openContext.call(this, kind, options);
    };
  });
  await openGuide(page);
  const home = page.locator(actor("home"));
  await expect(home).toHaveAttribute("data-till-visible", "false");
  await expect(home.locator("img")).toBeVisible();
  await page.locator(".start").click();
  await page.locator(".task-why-link").click();
  await expect(page.getByRole("dialog")).toContainText("Where");
  await expect(page.locator(actor("help")).locator("img")).toBeVisible();
});

test("visibility changes cancel movement and keep the task available", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page);
  const home = page.locator(actor("home"));
  await expect(home.locator("canvas")).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(home).toHaveAttribute("data-till-motion", "still");
  await expect(home.locator("canvas")).not.toHaveAttribute("data-ready");
  await page.evaluate(() => {
    delete document.visibilityState;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.locator(".start").click();
  const task = page.locator(actor("task"));
  await expect(task.locator("canvas")).toHaveAttribute("data-ready", "true");
  await page.setViewportSize({ width: 390, height: 460 });
  await page.locator(".task-card").evaluate(card => { card.scrollTop = card.scrollHeight; });
  await expect(task).toHaveAttribute("data-till-visible", "false");
  await expect(task.locator("canvas")).not.toHaveAttribute("data-ready");
  await expect(page.locator(".done-next")).toBeVisible();
});

test("mobile first run offers installation and standalone opens directly into setup", async ({ browser }) => {
  const device = {
    viewport,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",
  };
  const context = await browser.newContext({ ...device, baseURL: "http://127.0.0.1:4174/kaylas-shift-guide/" });
  try {
    const page = await context.newPage();
    const response = await page.goto("./");
    const manifest = await page.request.get(new URL("manifest.webmanifest", response.url()).href);
    expect(await manifest.json()).toMatchObject({ display: "standalone" });
    await expect(page.getByRole("button", { name: "Continue in browser" })).toBeVisible();
    await page.getByRole("button", { name: "Continue in browser" }).click();
    await expect(page.getByRole("heading", { name: "Who’s opening today?" })).toBeVisible();
  } finally {
    await context.close();
  }

  const installed = await browser.newContext({ ...device, baseURL: "http://127.0.0.1:4174/kaylas-shift-guide/" });
  try {
    await installed.addInitScript(() => {
      const matchMedia = window.matchMedia.bind(window);
      window.matchMedia = query => query === "(display-mode: standalone)" ? { matches: true } : matchMedia(query);
    });
    const page = await installed.newPage();
    await page.goto("./");
    await expect(page.getByRole("heading", { name: "Who’s opening today?" })).toBeVisible();
    await page.getByLabel("What should I call you?").fill("Kayla");
    await page.getByRole("button", { name: "Make it mine" }).click();
    await expect(page.locator(".home-head")).toContainText("Good morning, Kayla");
  } finally {
    await installed.close();
  }
});
