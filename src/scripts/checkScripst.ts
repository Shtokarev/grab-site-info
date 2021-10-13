import { BrowserType, chromium, BrowserContextOptions } from "playwright";
import { URL } from "url";

import { addStatisticRecord } from "../db/saveStatistic";
import { isDebugMode, timeout, convertStrToFilename, consoleLine } from "../utils";

const launchOptions = isDebugMode
  ? {
      headless: false,
      slowMo: 100,
      devtools: true,
    }
  : undefined;

export const checkGTMScript = async (
  url: URL,
  browserModule: BrowserType = chromium,
  browserContext: BrowserContextOptions | undefined = undefined,
  deviceName: string = "Desktop",
  withInteraction = false,
  withScreenshots = false
): Promise<boolean> => {
  const tsStart = Date.now();
  const browserName = browserModule.name();

  let succeeded = false;
  let tsEnvReady;
  let tsPageReady;
  let tsNavLinksReady;
  let tsScriptsActivated;
  let tsFail;
  let screenshotPath;

  try {
    const { hostname } = url;

    consoleLine();
    console.log(`Start checking ${hostname} with browser "${browserName}" and device "${deviceName}" in context...`);

    const browser = await browserModule.launch(launchOptions);
    const context = await browser.newContext(browserContext);
    const page = await context.newPage();

    tsEnvReady = Date.now();
    console.log("browser loaded (ms): ", tsEnvReady - tsStart);

    await page.goto(url.href);

    tsPageReady = Date.now();
    console.log("page ready (ms): ", tsPageReady - tsEnvReady);

    // make page ready screenshot
    // screenshotStartPath = convertStrToFilename(`screenshots/${hostname}-${browserName}-${deviceName}-${tsStart}-start`);
    // await page.screenshot({ path: screenshotStartPath });
    // console.log(`screenshot created`);

    /// wait until blocked scripts will found on the page
    await page.$('script[type="javascript/blocked"]');

    /// wait until menu navigation is available
    await page.waitForSelector('a[href="/help/about-us/"]');
    tsNavLinksReady = Date.now();

    // make navigation ready screenshot
    // screenshotPath = convertStrToFilename(
    //   `screenshots/${hostname}-${browserName}-${deviceName}-${tsStart}${
    //     withInteraction ? "-navigate" : ""
    //   }-nav-links-ready`
    // );
    // await page.screenshot({ path: screenshotPath });

    if (withInteraction) {
      console.log("with interaction!");
      await page.click('a[href="/help/about-us/"]');
    }

    /// check that all gtm and analytics scripts loaded and worked (gtm.load)
    await page.waitForSelector('script[src*="analytics.js"][type="text/javascript"]', {
      state: "attached",
      timeout,
    });

    await page.waitForSelector('script[src*="gtm.js"][type="application/javascript"]', {
      state: "attached",
      timeout,
    });

    const dataLayer = await page.$eval("body", () => (window as any).dataLayer);

    if (!(dataLayer?.length && dataLayer.some((item: { event: string }) => item.event === "gtm.load"))) {
      throw new Error("GTM SCRIPT NOT WORKING, DATALAYER NOT CREATED OR 'GTM.LOAD' EVENT NOT FOUND!");
    }

    tsScriptsActivated = Date.now();
    console.log("scripts activated (ms): ", tsScriptsActivated - tsEnvReady);

    console.log("NON TRACKING TIME (ms): ", tsScriptsActivated - tsNavLinksReady);

    if (withScreenshots) {
      screenshotPath = convertStrToFilename(
        `screenshots/${hostname}-${browserName}-${deviceName}-${tsStart}${withInteraction ? "-navigate" : ""}`
      );
      await page.screenshot({ path: screenshotPath });
    }

    await browser.close();

    console.log(`finished successfully`);
    succeeded = true;
  } catch (error) {
    console.log("Error occur:");
    console.log(error);

    tsFail = Date.now();
  } finally {
    await addStatisticRecord(
      url,
      browserName,
      deviceName,
      withInteraction,
      tsStart,
      succeeded,
      tsEnvReady,
      tsPageReady,
      tsNavLinksReady,
      tsScriptsActivated,
      tsFail,
      screenshotPath
    );

    return succeeded;
  }
};
