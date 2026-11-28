import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const basePath = "/kaylas-shift-guide/";
const outputDirectory = fileURLToPath(new URL("../dist/", import.meta.url));

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  }));
  return nested.flat();
}

const files = (await listFiles(outputDirectory))
  .filter((file) => !file.endsWith(`${sep}sw.js`))
  .sort();

const revision = createHash("sha256");
for (const file of files) {
  revision.update(relative(outputDirectory, file));
  revision.update(await readFile(file));
}

const cacheName = `before-rush-${revision.digest("hex").slice(0, 12)}`;
const optionalHomeClip = /\/till-(?:welcome|tube-note)-[^/]+\.mp4$/;
const precacheUrls = [
  basePath,
  ...files.map((file) => `${basePath}${relative(outputDirectory, file).split(sep).join("/")}`)
    .filter((url) => !optionalHomeClip.test(url)),
];

const worker = `const CACHE_NAME = ${JSON.stringify(cacheName)};
const CACHE_PREFIX = "before-rush-";
const BASE_PATH = ${JSON.stringify(basePath)};
const OPTIONAL_HOME_CLIP = ${optionalHomeClip};
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};
self.addEventListener("install", (event) => {
  const requests = PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" }));
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(requests)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names
        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE_PATH)) return;
  // The atrium still is available offline. The optional clips stream with native byte ranges.
  if (OPTIONAL_HOME_CLIP.test(url.pathname)) return;

  // Keep the shell and its hashed assets on the same release for this shift.
  const path = event.request.mode === "navigate" ? BASE_PATH : url.pathname;
  event.respondWith(caches.open(CACHE_NAME).then(async (cache) =>
    (await cache.match(path)) || fetch(event.request)
  ));
});
`;

await writeFile(join(outputDirectory, "sw.js"), worker);
console.log(`Generated ${cacheName} with ${precacheUrls.length} offline files.`);
