import { Page } from "playwright";

import { addStatisticRecord } from "../db/saveStatistic";
import { convertStrToValidName } from "../utils";
import { timeout } from "../envs/load-envs";

export const checkGTMScript = async (
  href: string,
  page: Page,
  thread: string,
  deviceName: string = "Desktop",
  browserName: string = "unknown",
  withInteraction = false,
  withScreenshots = false
): Promise<boolean> => {
  let tsPageReady;
  let tsNavLinksReady;
  let tsScriptsActivated;
  let tsFail;
  let screenshotPath;
  let succeeded = false;

  const tsEnvReady = Date.now();

  try {
    await page.goto(href);

    tsPageReady = Date.now();
    console.log(thread, ": page ready (ms):\t\t", tsPageReady - tsEnvReady);

    // make page ready screenshot
    // screenshotStartPath = convertStrToFilename(`screenshots/${hostname}-${browserName}-${deviceName}-${tsEnvReady}-start`);
    // await page.screenshot({ path: screenshotStartPath });
    // console.log(`screenshot created`);

    /// wait until blocked scripts will found on the page
    await page.waitForSelector('script[src*="oapit.min.js"][type="javascript/blocked"]', {
      timeout,
      state: "attached",
    });

    /// wait until menu navigation is available
    await page.waitForSelector('a[href="/help/about-us/"]', { timeout });
    tsNavLinksReady = Date.now();

    // make navigation ready screenshot
    // screenshotPath = convertStrToFilename(
    //   `screenshots/${href}-${browserName}-${deviceName}-${tsEnvReady}${
    //     withInteraction ? "-navigate" : ""
    //   }-nav-links-ready`
    // );
    // await page.screenshot({ path: screenshotPath });

    if (withInteraction) {
      console.log(thread, ": with interaction");
      await page.click('a[href="/help/about-us/"]', { timeout });
    }

    /// check that both gtm and analytics scripts loaded and worked (gtm.load event)
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
    console.log(thread, ": SCRIPTS ACTIVATED (ms): \t", tsScriptsActivated - tsEnvReady);

    console.log(thread, ": NON TRACKING TIME (ms): \t", tsScriptsActivated - tsNavLinksReady);

    if (withScreenshots) {
      screenshotPath = convertStrToValidName(
        `screenshots/${href}-${browserName}-${deviceName}-${tsEnvReady}${withInteraction ? "-navigate" : ""}`
      );
      await page.screenshot({ path: screenshotPath });
    }

    console.log(thread, ": finished successfully");
    succeeded = true;
  } catch (error) {
    console.log(thread, ": Error in checkGTMScript: ", error);

    tsFail = Date.now();
  } finally {
    await addStatisticRecord(
      href,
      browserName,
      deviceName,
      withInteraction,
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
