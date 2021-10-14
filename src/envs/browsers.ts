import { chromium, firefox, webkit, BrowserType } from "playwright";

export type BrowserEngine = "chromium" | "firefox" | "webkit";

export const browsers = new Map<BrowserEngine, BrowserType>([
  ["chromium", chromium],
  ["firefox", firefox],
  ["webkit", webkit],
]);
