import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:4174/kaylas-shift-guide/",
    reducedMotion: "reduce",
    timezoneId: "UTC",
    viewport: { width: 390, height: 844 },
    launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH },
  },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174/kaylas-shift-guide/",
  },
});
