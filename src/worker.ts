import { chromium } from "playwright";
import { parentPort, workerData } from "worker_threads";

import { browsers } from "./envs/browsers";
import { consoleLine } from "./utils";
import { isDebugMode, measurements, measurementsWithInteraction } from "./envs/load-envs";
import { checkGTMScript } from "./scripts/checkScripst";
import { WorkerData } from "./index";

const launchOptions = isDebugMode
  ? {
      headless: false,
      slowMo: 100,
      devtools: true,
    }
  : undefined;

const RETRY_MAX = 3;

const createTestEnvironmentWorker = async ({
  threadId,
  browserName,
  browserContext,
  urls,
  deviceName = "Desktop",
  withScreenshots = false,
}: WorkerData) => {
  let browser;
  let exitCode = 0;

  consoleLine();
  console.log(threadId, ": THREAD STARTED");

  try {
    const browserModule = browsers.get(browserName) || chromium;

    browser = await browserModule.launch(launchOptions);

    let context = await browser.newContext(browserContext);
    let page = await context.newPage();

    // two series of tests on one environment, with interaction (click navigate link) and without
    for (const [withInteractions, counter] of [measurements, measurementsWithInteraction].entries()) {
      for (let i = 0; i < counter; i++) {
        for (const url of urls) {
          console.log(
            `${threadId} : Start checking ${url} with browser "${browserName}" and device "${deviceName}" in context...`
          );

          let retryCount = RETRY_MAX;
          let succeeded = false;

          while (retryCount-- && !succeeded) {
            if (!retryCount) {
              // last chance to retry, reopen browser
              await browser?.close().catch(() => {});
              browser = await browserModule.launch(launchOptions);
              context = await browser.newContext(browserContext);
              page = await context.newPage();
            }

            succeeded = await checkGTMScript(
              url,
              page,
              threadId,
              deviceName,
              browserName,
              !!withInteractions,
              withScreenshots
            );
            parentPort?.postMessage({ succeeded });
          }
        }
      }
    }
  } catch (error) {
    console.log(threadId, ": ERROR in createTestEnvironmentWorker: ", error);
    exitCode = 1;
  } finally {
    await browser?.close().catch(() => {});
    process.exit(exitCode);
  }
};

createTestEnvironmentWorker(workerData);
