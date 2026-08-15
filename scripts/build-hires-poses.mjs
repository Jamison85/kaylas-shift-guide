import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "src", "character-source");
const outputRoot = join(root, "public", "characters-hires");

const poses = [
  {
    output: "coworker-stand-v5.webp",
    sourceDir: "stand-v5",
    partCount: 5,
    expectedBytes: 11788,
    expectedSha256: "343457d634e5bcc70f0245818ab024d45458e357f916cd8edc1a5fbaa95885b8",
  },
  {
    output: "coworker-panic-v5.webp",
    sourceDir: "panic-v5",
    partCount: 5,
    expectedBytes: 11380,
    expectedSha256: "d5b795f6de71074ec089add4da429b04c126ed28883f20763a4741d8a67cacac",
  },
  {
    output: "coworker-tired-v5.webp",
    sourceDir: "tired-v5",
    partCount: 4,
    expectedBytes: 9758,
    expectedSha256: "9001734580dfe07088517d798f338f4a16ed14c4e70244d9737ed63671fc25cf",
  },
];

function buildPose(pose) {
  const base64 = Array.from({ length: pose.partCount }, (_, index) => {
    const part = String(index + 1).padStart(2, "0");
    return readFileSync(join(sourceRoot, pose.sourceDir, `part${part}.txt`), "utf8").trim();
  }).join("");

  const bytes = Buffer.from(base64, "base64");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const riff = bytes.subarray(0, 4).toString("ascii");
  const webp = bytes.subarray(8, 12).toString("ascii");

  if (bytes.length !== pose.expectedBytes) {
    throw new Error(`${pose.output}: expected ${pose.expectedBytes} bytes, got ${bytes.length}`);
  }
  if (sha256 !== pose.expectedSha256) {
    throw new Error(`${pose.output}: SHA256 mismatch ${sha256}`);
  }
  if (riff !== "RIFF" || webp !== "WEBP") {
    throw new Error(`${pose.output}: invalid WebP header (${riff}/${webp})`);
  }

  mkdirSync(outputRoot, { recursive: true });
  writeFileSync(join(outputRoot, pose.output), bytes);
  console.log(`Verified ${pose.output}: ${bytes.length} bytes, ${sha256}`);
}

poses.forEach(buildPose);
