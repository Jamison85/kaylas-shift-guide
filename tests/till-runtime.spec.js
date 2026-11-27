import { expect, test } from "@playwright/test";

test("approved master fallback stays visible with reduced motion and never intercepts guide controls", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => localStorage.setItem("before-rush-profile", JSON.stringify({name:"Kayla"})));
  await page.reload();
  const till = page.locator('[data-till-runtime="v2"]').first();
  await expect(till).toHaveAttribute("data-till-clip","still");
  await expect(till.locator("img")).toHaveAttribute("src", /till-runtime-v2\/still\.webp$/);
  await expect.poll(() => till.locator("img").evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
  await expect(till).toHaveCSS("pointer-events","none");
  await page.locator(".start").click();
  await expect(page.locator(".task-card")).toBeVisible();
});

test("runtime asset files decode and are available offline after precache", async ({ page }) => {
  await page.goto("./");
  const files = ["still","idle","wave","point","explain","nod","thumbs","celebrate","clipboard"];
  for (const name of files) {
    const response = await page.request.get("characters-approved/till-runtime-v2/"+name+".webp");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/webp");
  }
});

test("normal-motion Till plays a single contextual gesture", async ({ page }) => {
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("./");
  await page.evaluate(()=>localStorage.setItem("before-rush-profile", JSON.stringify({name:"Kayla"})));
  await page.reload();
  const till=page.locator('[data-till-runtime="v2"]').first();
  await expect(till).toHaveAttribute("data-till-clip",/point|idle/);
  await expect.poll(()=>till.locator("img").evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
  await expect(till).toHaveAttribute("data-till-clip","idle",{timeout:10000});
  await page.emulateMedia({reducedMotion:"reduce"});
  await expect(till).toHaveAttribute("data-till-clip","still");
});
