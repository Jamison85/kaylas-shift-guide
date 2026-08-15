import fs from "node:fs";
import path from "node:path";
import part01 from "../src/hero-source/part01.js";
import part02 from "../src/hero-source/part02.js";

const outputDir = path.resolve("public/characters-v4");
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, "coworker-hero.webp");
fs.writeFileSync(outputPath, Buffer.from(`${part01}${part02}`, "base64"));
console.log(`Built coworker hero: ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
