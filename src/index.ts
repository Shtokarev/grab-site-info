import { devices } from "playwright";
// import { runScriptCheckUA } from "./checkUA";
import { urlsToCheck, measurements, measurementsWithInteraction, consoleLine } from "./utils";
import { checkGTMScript } from "./scripts/checkScripst";
import { browsers } from "./utils/browsers";

consoleLine();
console.log("DOMAINS TO TEST:");
console.log(urlsToCheck.map((url) => url.href));

const testedDevices = [
  undefined, // desktop
  "Nexus 10",
  "Galaxy S8",
  "iPhone SE",
  "iPhone 11 Pro",
  // "iPhone 12",
];

consoleLine();
console.log("DEVICE TO TEST:");
console.log(testedDevices.map((device) => device || "Desktop"));

consoleLine();
console.log("BROWSERS TO TEST:");
console.log(Array.from(browsers.keys()));

consoleLine();
console.log(`MEASUREMENTS: ${measurements}`);
console.log(`MEASUREMENTS WITH INTERACTIONS: ${measurementsWithInteraction}`);

const context = {
  locale: "en-US",
  geolocation: { longitude: 12.492507, latitude: 41.889938 },
  permissions: ["geolocation"],
};

(async () => {
  const totalMeasurements =
    browsers.size * urlsToCheck.length * testedDevices.length * (measurements + measurementsWithInteraction);

  let successCounter = 0;
  let errorCounter = 0;

  consoleLine();
  console.log(`TOTAL MEASUREMENTS: ${totalMeasurements}`);

  consoleLine();
  console.log("TESTING STARTED");
  consoleLine();
  console.log(new Date());
  consoleLine();
  const tsStartMeasurement = Date.now();

  try {
    // await runScriptCheckUA();

    for (const [withInteractions, counter] of [measurements, measurementsWithInteraction].entries()) {
      for (const [browserName, browser] of browsers) {
        for (const url of urlsToCheck) {
          for (const testedDevice of testedDevices) {
            for (let i = 0; i < counter; i++) {
              const succeeded = await checkGTMScript(
                url,
                browser,
                {
                  ...context,
                  ...(testedDevice && devices[testedDevice]),
                  ...(testedDevice && browserName === "firefox" && { isMobile: undefined }), // isMobile is not supported in Firefox
                },
                testedDevice,
                !!withInteractions
              );

              succeeded ? successCounter++ : errorCounter++;
              consoleLine();
              console.log(
                `PROGRESS: DONE:${
                  successCounter + errorCounter
                } TOTAL:${totalMeasurements} SUCCESS:${successCounter} ERRORS:${errorCounter}`
              );
            }
          }
        }
      }
    }

    consoleLine();
    console.log("WORK FINISHED");
    consoleLine();
    const totalTime = Math.ceil((new Date().getTime() - tsStartMeasurement) / 1000);
    console.log(`TOTAL TIME: ${totalTime} sec (${(totalMeasurements / totalTime).toFixed(3)} request/sec)`);
    consoleLine();
    process.exit(0);
  } catch (error) {
    console.log("Error in main function:");
    console.log(error);
  }
})();
