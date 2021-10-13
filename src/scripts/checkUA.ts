import { browsers } from "../utils/browsers";

export const runScriptCheckUA = async () => {
  for (const [browserName, browserModule] of browsers) {
    try {
      console.log(`Get UA screenshot, proceed with ${browserName}...`);

      const browser = await browserModule.launch();
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto("http://whatsmyuseragent.org/");
      await page.screenshot({ path: `screenshots/UA-${browserName}.png` });

      await browser.close();
      console.log(`screenshot saved successfully`);
    } catch (error) {
      console.log("Error occur:");
      console.log(error);
    }
  }
};
