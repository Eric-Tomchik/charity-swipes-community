import { runTest } from "./auth";

runTest("Take screenshots", async (helper) => {
  const { page } = helper;

  // Landing page (logged out)  
  const browser = await (await import("playwright")).chromium.launch();
  const publicPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await publicPage.goto("https://cs-community-c5c79134.viktor.space/");
  await publicPage.waitForLoadState("networkidle");
  await publicPage.waitForTimeout(2000);
  await publicPage.screenshot({ path: "tmp/screenshot-landing.png", fullPage: false });
  await browser.close();

  // Dashboard (logged in)
  await helper.goto("/community");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tmp/screenshot-dashboard.png", fullPage: false });

  // Channel
  await helper.goto("/channel/announcements");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tmp/screenshot-channel.png", fullPage: false });

  // Charity
  await helper.goto("/charity");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tmp/screenshot-charity.png", fullPage: false });

  // Admin
  await helper.goto("/admin");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tmp/screenshot-admin.png", fullPage: false });

  console.log("All screenshots saved!");
}).catch(() => process.exit(1));
