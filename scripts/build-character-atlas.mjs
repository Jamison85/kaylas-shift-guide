import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import part01 from "../src/character-atlas/part01.js";
import part02 from "../src/character-atlas/part02.js";
import part03 from "../src/character-atlas/part03.js";
import part04 from "../src/character-atlas/part04.js";
import part05 from "../src/character-atlas/part05.js";
import part06 from "../src/character-atlas/part06.js";
import part07 from "../src/character-atlas/part07.js";
import part08 from "../src/character-atlas/part08.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "characters-v3");
const outFile = path.join(outDir, "coworker-atlas.webp");
const base64 = `${part01}${part02}${part03}${part04}${part05}${part06}${part07}${part08}`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, Buffer.from(base64, "base64"));
console.log(`Built character atlas: ${outFile} (${fs.statSync(outFile).size} bytes)`);
