import { db } from "./mongo";
import { Collection } from "mongodb";

export const addStatisticRecord = async (
  hostname: string,
  browser: string,
  device: string,
  withInteraction: boolean, // with menu navigate action after navigation menu ready
  succeeded: boolean, // successfully finished
  tsEnvReady?: number, // ts evironment loaded (browser, context, etc)
  tsPageReady?: number, // ts page has loaded state (load event fired)
  tsNavLinksReady?: number, // ts navigation menu links ready
  tsScriptsActivated?: number, // ts scripts activity state
  tsFail?: number, // ts fail catched
  screenshotPath?: string // optional to save some screenshots
) => {
  if (!db) {
    return;
  }

  const insertedEntity = {
    hostname,
    browser,
    device,
    withInteraction,
    succeeded,
    tsEnvReady,
    ...(tsPageReady && tsEnvReady && { loadingPageDelay: tsPageReady - tsEnvReady }),
    ...(tsScriptsActivated && tsNavLinksReady && { untrackedTime: tsScriptsActivated - tsNavLinksReady }),
    ...(tsScriptsActivated && tsEnvReady && { scriptActivateDelay: tsScriptsActivated - tsEnvReady }),
    ...(tsFail && { tsFail }),
    ...(screenshotPath && { screenshotPath }),
  };

  try {
    const statistic: Collection = db.collection(hostname);
    await statistic.insertOne(insertedEntity);
  } catch (error) {
    console.log("Error in addStatisticRecord:");
    console.log(error);
  }
};
