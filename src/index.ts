import path from "path";
import { Worker } from "worker_threads";
import { devices, BrowserContextOptions } from "playwright";

import { consoleLine } from "./utils";
import { browsers, BrowserEngine } from "./envs/browsers";
import {
  urlsToCheck,
  measurements,
  measurementsWithInteraction,
  threadNumber,
  testedDevices,
  defaultContext,
} from "./envs/load-envs";

export type WorkerData = {
  threadId: string;
  browserName: BrowserEngine;
  browserContext: BrowserContextOptions | undefined;
  urls: string[];
  deviceName?: string;
  withScreenshots?: boolean;
};

const run = async () => {
  const threads = new Set();
  const urls = urlsToCheck.map((url) => url.href);
  const tsStartMeasurement = Date.now();

  const totalMeasurements =
    browsers.size * urls.length * testedDevices.length * (measurements + measurementsWithInteraction);

  let successCounter = 0;
  let errorCounter = 0;
  let isAllWorkerLaunched = false;

  consoleLine();
  console.log("DOMAINS TO TEST:");
  console.log(urls);

  consoleLine();
  console.log("BROWSER ENGINES TO TEST:");
  console.log(Array.from(browsers.keys()));

  consoleLine();
  console.log("DEVICE TO TEST:");
  console.log(testedDevices.map((device) => device || "Desktop"));

  consoleLine();
  console.log("NUMBER OF MEASUREMENTS:");
  console.log("SIMPLE: ", measurements);
  console.log("WITH INTERACTIONS: ", measurementsWithInteraction);

  consoleLine();
  console.log("TOTAL MEASUREMENTS: ", totalMeasurements);

  consoleLine();
  console.log("TESTING STARTED");
  consoleLine();
  console.log(new Date());
  consoleLine();

  console.log(`RUNNING WITH ${threadNumber} THREADS...`);

  for (const [browserName] of browsers) {
    for (const deviceName of testedDevices) {
      // whait if there are not free workers
      while (threads.size === threadNumber) {
        await new Promise((res) => setTimeout(res, 500));
      }

      const threadId = Math.random().toFixed(4).slice(2);

      const workerData: WorkerData = {
        threadId,
        browserName,
        browserContext: {
          ...defaultContext,
          ...(deviceName && devices[deviceName]),
          ...(deviceName && browserName === "firefox" && { isMobile: undefined }), // isMobile is not supported in Firefox
        },
        urls,
        deviceName,
        withScreenshots: false,
      };

      consoleLine();
      console.log(`INSERTING NEW THREAD ${threadId}, NUMBER NOW: ${threads.size + 1}`);

      const worker = new Worker(path.join(__dirname, "worker.js"), { workerData });

      worker.on("message", ({ succeeded }) => {
        succeeded ? successCounter++ : errorCounter++;

        consoleLine();
        console.log(
          `PROGRESS: DONE:${
            successCounter + errorCounter
          } TOTAL:${totalMeasurements} SUCCESS:${successCounter} ERRORS:${errorCounter}`
        );
        consoleLine();
      });

      worker.on("error", (error) => {
        console.log("ERROR IN WORKER: ", error);
      });

      worker.on("exit", () => {
        threads.delete(worker);
        console.log(`THREAD EXITING, ${threads.size} RUNNING...`);

        // check if everything finished
        if (isAllWorkerLaunched && !threads.size) {
          consoleLine();
          console.log("WORK FINISHED");
          consoleLine();
          const totalTime = Math.ceil((Date.now() - tsStartMeasurement) / 1000);
          console.log(`TOTAL TIME: ${totalTime} sec (${(totalMeasurements / totalTime).toFixed(3)} request/sec)`);
          consoleLine();

          process.exit(0);
        }
      });

      threads.add(worker);
    }
  }

  isAllWorkerLaunched = true;
};

run();
