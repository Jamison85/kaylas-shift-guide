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

test("reduced motion shows the atrium still and keeps the launch control usable", async ({ page }) => {
  await openGuide(page);
  await expect(page.locator(".atrium-window")).toHaveAttribute("data-welcome", "still");
  const atrium = page.locator(".atrium-media__still");
  await expect(atrium).toBeVisible();
  await expect.poll(() => atrium.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator(".atrium-media video")).toHaveCount(0);
  await page.locator(".start").click();
  await expect(page.getByRole("heading", { name: "Store Walk" })).toBeVisible();
});

test("the welcome plays muted once and fades back to the atrium", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page);
  const atrium = page.locator(".atrium-window");
  const video = atrium.locator("video");
  await expect(atrium).toHaveAttribute("data-welcome", "playing");
  expect(await video.evaluate(media => media.muted && media.playsInline && !media.loop)).toBe(true);
  await expect(page.getByRole("button", { name: /Open task/ })).toBeInViewport({ ratio: 1 });
  await video.evaluate(media => { media.currentTime = media.duration - 0.15; });
  await expect(atrium).toHaveAttribute("data-welcome", "fading");
  await expect(atrium).toHaveAttribute("data-welcome", "still");
  await expect(video).toHaveCount(0);
  await page.reload();
  await expect(atrium).toHaveAttribute("data-welcome", "still");
  await expect(video).toHaveCount(0);
});

test("the opener can leave mid-clip and Till performs distinct actions during the shift", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page);
  await expect(page.locator(".atrium-window")).toHaveAttribute("data-welcome", "playing");
  await page.getByRole("button", { name: /Open task/ }).click();
  await expect(page.locator(".atrium-media video")).toHaveCount(0);
  const task = page.locator(actor("task"));
  await expect(task).toHaveAttribute("data-till-motion", "check_surroundings");
  await page.locator(".done-next").click();
  await expect(page.getByRole("heading", { name: "Open and Fund Register 2" })).toBeVisible();
  await expect(task).toHaveAttribute("data-till-motion", "still");
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.locator(".done-next").click();
  await expect(task).toHaveAttribute("data-till-motion", "check_watch");
  await expect(task).toHaveAttribute("data-till-spot", "left");
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
  await expect(page.locator(".atrium-window")).toHaveAttribute("data-welcome", "still");
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
  await expect(page.locator(".atrium-media")).toHaveCount(0);
  await expect(page.locator("[data-till-anchor]")).toHaveCount(0);
  await page.locator(".start").click();
  await page.locator(".task-why-link").click();
  await expect(page.getByRole("dialog")).toContainText("Guest-facing store areas");
  await expect(page.locator("[data-till-anchor]")).toHaveCount(0);
});

test("Till answers from the atrium and follows the step the opener selects", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page);
  await page.getByRole("button", { name: "Skip video" }).click();
  const ask = page.getByRole("button", { name: "Ask Till" });
  await ask.click();
  const atrium = page.locator(".atrium-window");
  await expect(atrium).toHaveAttribute("data-clip", "ask");
  await expect(atrium).toHaveAttribute("data-clip-phase", "playing");
  await expect(page.locator("#home-till-reply")).toContainText("Checking what’s next");
  await expect(page.locator("#home-till-reply")).toContainText("Catch anything urgent");
  await expect(ask).toHaveAttribute("aria-pressed", "true");
  await expect(atrium).toHaveAttribute("data-clip-phase", "still");
  await ask.click();
  await expect(ask).toHaveAttribute("aria-pressed", "false");
  await expect(atrium.locator("video")).toHaveCount(0);
  await page.locator(".start").click();
  const task = page.locator(actor("task"));
  await expect(task.locator("canvas")).toHaveAttribute("data-ready", "true");
  await task.locator("canvas").evaluate(canvas => { window.tillCanvas = canvas; });
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

test("Till sends the capsule directly to the phone readout and skipping delivers the next note", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page, { completed: ["store-walk"] });
  const atrium = page.locator(".atrium-window");
  const trigger = page.getByRole("button", { name: "Tube note" });
  const reply = page.locator("#home-till-reply");
  await trigger.press("Enter");
  await expect(atrium).toHaveAttribute("data-clip", "tube");
  await expect(atrium).toHaveAttribute("data-clip-phase", "playing");
  await expect(trigger).toBeDisabled();
  await expect(reply).toContainText("Sending your note");
  await expect(page.getByRole("button", { name: /Open task/ })).toBeInViewport({ ratio: 1 });
  await expect(atrium.locator(".atrium-delivery")).not.toHaveAttribute("data-open");
  await expect(atrium.locator(".atrium-delivery__readout")).toContainText("receiving snacks");
  await expect(atrium).toHaveAttribute("data-clip-phase", "still");
  await expect(atrium.locator(".atrium-delivery")).toHaveAttribute("data-open", "true");
  await expect(atrium.locator(".atrium-delivery__screen")).toHaveCSS("opacity", "1");
  await expect(reply).toContainText("receiving snacks");
  await trigger.click();
  await page.getByRole("button", { name: "Skip video" }).click();
  await expect(atrium.locator(".atrium-delivery__readout")).toContainText("a working pen");
  await expect(atrium).toHaveAttribute("data-clip-phase", "still");
});

test("the tube delivers immediately in quiet and reduced-motion modes", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page, { preference: "quiet" });
  const trigger = page.getByRole("button", { name: "Tube note" });
  await trigger.press("Enter");
  await expect(page.locator("#home-till-reply")).toContainText("receiving snacks");
  await expect(page.locator(".atrium-media video")).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 610 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".profile-button").click();
  await page.getByLabel("Till’s movement").selectOption("full");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await trigger.click();
  await expect(page.locator("#home-till-reply")).toContainText("a working pen");
  await expect(page.locator(".atrium-media video")).toHaveCount(0);
  await expect(page.locator(".atrium-window")).toHaveAttribute("data-welcome", "still");
  const launch = await page.locator(".atrium-start__action").boundingBox();
  const controls = page.getByRole("group", { name: "Till controls" });
  await expect(controls.getByRole("button")).toHaveCount(2);
  await expect(controls.getByRole("button", { name: "Ask Till" })).toBeInViewport({ ratio: 1 });
  await expect(trigger).toBeInViewport({ ratio: 1 });
  const dock = await controls.boundingBox();
  expect(launch.y + launch.height).toBeLessThan(dock.y);
  await page.reload();
  await trigger.click();
  await expect(page.locator("#home-till-reply")).toContainText("Full-size coffee");
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

test("the atrium still and Till’s task help work offline", async ({ page, context }) => {
  await enableMotion(page);
  await openGuide(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const cacheUrls = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async key =>
    (await (await caches.open(key)).keys()).map(request => new URL(request.url).pathname)))).flat());
  for (const asset of ["/till-atrium-", "/till-note-arrival-", "/poster-", "/front-", "/actor-"]) {
    expect(cacheUrls.some(path => path.includes(asset))).toBe(true);
  }
  expect(cacheUrls.some(path => /\/till-(welcome|tube-note|ask)-/.test(path))).toBe(false);
  await page.evaluate(() => sessionStorage.removeItem("before-rush-atrium-welcome"));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".atrium-window")).toHaveAttribute("data-welcome", "still");
  await expect.poll(() => page.locator(".atrium-media__still").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Tube note" }).click();
  await expect(page.locator("#home-till-reply")).toContainText("receiving snacks");
  await expect(page.locator(".atrium-media video")).toHaveCount(0);
  await page.locator(".start").click();
  await page.locator(".task-why-link").click();
  await expect(page.locator(actor("help")).locator("canvas")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("dialog")).toContainText("Catch anything urgent");
});

test("Till moves to the review section for paperwork", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page, { completed: [
    "store-walk", "register-two", "cashier-break", "yesterday-sources", "lottery-refill", "health-dept", "gas-inspection",
  ] });
  await page.setViewportSize({ width: 360, height: 660 });
  await page.locator(".start").click();
  await expect(page.locator(".task-card h1")).toHaveText("Sort Yesterday’s Receipt Bags");
  await expect(page.locator(".task-intro").locator(actor("task"))).toHaveCount(0);
  const review = page.locator(".move-on-check");
  const till = review.locator(actor("task"));
  await expect(till).toHaveAttribute("data-till-spot", "check");
  await review.scrollIntoViewIfNeeded();
  await expect(till).toHaveAttribute("data-till-motion", "compare_receipt");
  const canvas = till.locator("canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".done-next")).toBeVisible();
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
  await page.locator(".start").click();
  await page.locator(".task-why-link").click();
  await expect(page.getByRole("dialog")).toContainText("Where");
  await expect(page.locator(actor("help")).locator("img")).toBeVisible();
});

test("visibility changes cancel movement and keep the task available", async ({ page }) => {
  await enableMotion(page);
  await openGuide(page);
  await expect(page.locator(".atrium-window")).toHaveAttribute("data-welcome", "playing");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".atrium-window")).toHaveAttribute("data-welcome", "still");
  await expect(page.locator(".atrium-media video")).toHaveCount(0);
  await page.evaluate(() => {
    delete document.hidden;
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
