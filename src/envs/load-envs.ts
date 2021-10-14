import "dotenv/config";
import { URL } from "url";

const {
  PRODUCTION_URLS,
  DEBUG,
  TIMEOUT,
  MONGODB_CONNECTION_STRING,
  MONGO_DBNAME,
  MEASUREMENTS,
  MEASUREMENTS_WITH_INTERACTION,
  THREAD_NUMBER,
} = process.env;

export const urlsToCheck = PRODUCTION_URLS?.split(",").map((url) => new URL(url)) || [];
export const isDebugMode = DEBUG === "true";
export const timeout = parseInt(TIMEOUT || "30000", 10);
export const mongoDbConnectionString = MONGODB_CONNECTION_STRING || "";
export const mongoDbName = MONGO_DBNAME || "opentag";
export const measurements = parseInt(MEASUREMENTS || "5", 10);
export const measurementsWithInteraction = parseInt(MEASUREMENTS_WITH_INTERACTION || "5", 10);
export const threadNumber = parseInt(THREAD_NUMBER || "3", 10);

export const testedDevices = [
  undefined, // desktop
  "Nexus 10",
  "Galaxy S8",
  "iPhone SE",
  "iPhone 11 Pro",
  "iPhone 12",
];

export const defaultContext = {
  locale: "en-US",
  geolocation: { longitude: 12.492507, latitude: 41.889938 },
  permissions: ["geolocation"],
};
