import { expect, test } from "@playwright/test";
import { beats, finalLine, responses } from "../src/till-preview/story.js";

const url = "./?till-preview=1";
const screen = page => page.locator(".fc");
async function open(page) {
  await page.clock.install({ time: new Date("2026-11-22T09:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-22T09:00:01Z"));
  await page.goto(url);
  await expect(page.getByRole("button", {name:"Start introduction"})).toBeEnabled();
}

async function advance(page, from, to, branch = "hello") {
  for (let i=from; i<to; i++) {
    const beat = beats[i];
    await expect(screen(page)).toHaveAttribute("data-screen",beat.id);
    if (beat.id === "choice") await page.getByRole("button", {name:responses[branch],exact:true}).click();
    else await page.clock.fastForward(beat.ms);
    await expect(screen(page)).toHaveAttribute("data-screen",beats[i+1]?.id || "home");
  }
}
const at = id => beats.findIndex(b => b.id === id);

for (const branch of Object.keys(responses)) {
  test(`plays the ${branch} branch through Home and replays with fresh choices`, async ({page}) => {
    await open(page);
    await page.getByRole("button",{name:"Mute sound",exact:true}).click();
    await page.getByRole("button",{name:"Start introduction"}).click();
    await advance(page,0,at("choice"));
    await page.clock.fastForward(120000);
    await expect(page.getByRole("button",{name:responses.hello,exact:true})).toBeFocused();
    await page.getByRole("button",{name:responses[branch],exact:true}).click();
    await expect(page.locator(".fc-caption")).toHaveText(responses[branch]);
    await advance(page,at("echo"),at("answer"));
    await expect(page.locator(".fc-caption")).toContainText(branch === "hello" ? "GOOD GRAVY!" : "deeply unsettling");
    await advance(page,at("answer"),at("fall"));
    await expect(page.locator(".fc-box")).toHaveCount(4);
    await expect(page.locator(".fc-peanut")).toHaveCount(8);
    expect(await page.locator(".fc-player").evaluate(el =>
      [...el.parentNode.querySelectorAll(".fc-box,.fc-peanut")].every(p=>+getComputedStyle(p).zIndex < +getComputedStyle(el).zIndex)
    )).toBe(true);
    await advance(page,at("fall"),beats.length);
    await expect(page.locator(".fc-epilogue")).toContainText(finalLine);
    await expect(page.locator(".fc-home-anchor .fc-actor")).toHaveCount(1);
    await expect(page.getByRole("button",{name:"Replay introduction"})).toBeFocused();
    await page.getByRole("button",{name:"Replay introduction"}).click();
    await expect(page.getByRole("button",{name:"Unmute sound",exact:true})).toHaveAttribute("aria-pressed","true");
    await advance(page,0,at("choice"));
    await expect(page.getByRole("button",{name:responses.watching,exact:true})).toBeVisible();
    expect(await page.evaluate(()=>[localStorage.length,sessionStorage.length])).toEqual([0,0]);
  });
}
for (const phase of ["ready","odd","choice","echo","helper","fall","dust","reveal"]) {
  test(`Skip from ${phase} cancels the clock and lands on preview Home`,async ({page})=>{
    await open(page);
    if (phase !== "ready") {
      await page.getByRole("button",{name:"Start introduction"}).click();
      await advance(page,0,at(phase));
    }
    await page.getByRole("button",{name:"Skip",exact:true}).click();
    await page.clock.fastForward(120000);
    await expect(screen(page)).toHaveAttribute("data-screen","home");
    await expect(page.getByRole("button",{name:"Replay introduction"})).toBeVisible();
  });
}
test("captions survive unavailable audio; pause and tab visibility preserve the remaining beat", async ({page})=>{
  await page.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined;});
  await open(page);
  await page.getByRole("button",{name:"Start introduction"}).click();
  await advance(page,0,at("odd"));
  await page.clock.fastForward(1200);
  await page.getByRole("button",{name:"Pause",exact:true}).click();
  await page.clock.fastForward(20000);
  await expect(page.locator(".fc-caption")).toContainText("earthquake");
  await page.getByRole("button",{name:"Resume",exact:true}).click();
  await page.evaluate(()=>{
    Object.defineProperty(document,"hidden",{value:true,configurable:true});
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(screen(page)).toHaveAttribute("data-paused","true");
  await page.clock.fastForward(20000);
  await page.evaluate(()=>{delete document.hidden; document.dispatchEvent(new Event("visibilitychange"));});
  await expect(screen(page)).toHaveAttribute("data-paused","false");
  await page.clock.fastForward(2349);
  await expect(screen(page)).toHaveAttribute("data-screen","odd");
  await page.clock.fastForward(1);
  await expect(screen(page)).toHaveAttribute("data-screen","lookup");
});
for (const [width,height,scale] of [[360,800,1],[390,844,2],[412,915,1],[844,390,1],[1280,800,1]]) {
  test(`composition and touch targets at ${width}×${height}, text scale ${scale}`,async ({page})=>{
    await page.setViewportSize({width,height});
    await open(page);
    await page.evaluate(s=>document.documentElement.style.fontSize=16*s+"px",scale);
    await page.getByRole("button",{name:"Start introduction"}).click();
    await advance(page,0,at("choice"));
    await expect(page.locator(".fc-actor")).toHaveCount(1);
    const stage=await page.locator(".fc-office").boundingBox();
    const caption=await page.locator(".fc-caption").boundingBox();
    expect(stage.y+stage.height <= caption.y+1 || stage.x+stage.width <= caption.x+1).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const button of await page.locator(".fc-choices button").all()) expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
    expect(await page.locator(".fc-paint canvas").evaluate(el=>getComputedStyle(el).visibility)).toBe("hidden");
  });
}
test("missing artwork offers retry and an immediate exit",async ({page})=>{
  await page.route("**/02_notices_viewer.webp",r=>r.abort());
  await page.goto(url);
  await expect(page.getByRole("alert")).toContainText("couldn’t load");
  await page.getByRole("button",{name:"Skip",exact:true}).click();
  await expect(screen(page)).toHaveAttribute("data-screen","home");
});
test("normal mobile startup keeps install, setup, returning Home and its offline cache independent",async ({browser})=>{
  const context=await browser.newContext({userAgent:"Mozilla/5.0 (Linux; Android 14) Mobile",viewport:{width:390,height:844}});
  try {
    const page=await context.newPage();
    await page.goto("http://127.0.0.1:4174/kaylas-shift-guide/?till-preview=0");
    await page.getByRole("button",{name:"Continue in browser"}).click();
    await page.getByLabel("What should I call you?").fill("Sam");
    await page.getByRole("button",{name:"Make it mine"}).click();
    await page.reload();
    await expect(page.locator(".home-head")).toContainText("Good morning, Sam");
    await page.evaluate(()=>navigator.serviceWorker.ready);
    const urls=await page.evaluate(async()=>{const c=await caches.open((await caches.keys())[0]);return (await c.keys()).map(r=>r.url);});
    expect(urls.some(path=>path.includes("/till-preview/"))).toBe(false);
    const before=await page.evaluate(()=>({...localStorage,...sessionStorage}));
    await page.goto("http://127.0.0.1:4174/kaylas-shift-guide/?till-preview=1");
    await page.getByRole("button",{name:"Skip",exact:true}).click();
    expect(await page.evaluate(()=>({...localStorage,...sessionStorage}))).toEqual(before);
  } finally { await context.close(); }
});


test("full motion paints one Till, scatters each prop and reframes the office into the Home card", async ({page}) => {
  await page.emulateMedia({reducedMotion:"no-preference"});
  await open(page);
  await page.getByRole("button",{name:"Start introduction"}).click();
  await advance(page,0,at("fall"));
  const layers = await page.locator(".fc-paint").evaluate(el => ({
    bitmap: getComputedStyle(el).backgroundImage !== "none",
    canvas: getComputedStyle(el.querySelector("canvas")).visibility === "visible",
  }));
  expect(Number(layers.bitmap) + Number(layers.canvas)).toBe(1);
  for (const selector of [".fc-box",".fc-peanut"]) {
    const paths = await page.locator(selector).evaluateAll(nodes => nodes.map(node => {
      const animation = node.getAnimations()[0];
      animation.pause();
      animation.currentTime = 2000;
      return getComputedStyle(node).transform;
    }));
    expect(new Set(paths).size).toBe(paths.length);
  }
  await advance(page,at("fall"),at("reveal"));
  const sizes = await page.locator(".fc-office").evaluate(el => {
    const flight = el.getAnimations()[0];
    flight.pause();
    return [0,650,1700].map(ms => {
      flight.currentTime = ms;
      return el.getBoundingClientRect().width;
    });
  });
  expect(sizes[0]).toBeGreaterThan(sizes[1]);
  expect(sizes[1]).toBeGreaterThan(sizes[2]);
  expect(sizes[2]).toBeCloseTo((await page.locator(".fc-home-anchor").boundingBox()).width,0);
  await page.clock.fastForward(beats[at("reveal")].ms);
  await expect(page.locator(".fc-actor")).toHaveCount(1);
});
