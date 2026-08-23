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
const precacheUrls = [
  basePath,
  ...files.map((file) => `${basePath}${relative(outputDirectory, file).split(sep).join("/")}`),
];

const worker = `const CACHE_NAME = ${JSON.stringify(cacheName)};
const CACHE_PREFIX = "before-rush-";
const BASE_PATH = ${JSON.stringify(basePath)};
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};
const FONT_HOSTS = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
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

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true }))
      || (await cache.match(BASE_PATH))
      || (await cache.match(BASE_PATH + "index.html"));
  }
}

async function cachedWithRefresh(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  const refreshed = fetch(request).then(async (response) => {
    if (response.ok || response.type === "opaque") await cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || refreshed || Response.error();
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isAppRequest = url.origin === self.location.origin && url.pathname.startsWith(BASE_PATH);
  const isFontRequest = FONT_HOSTS.has(url.hostname);
  if (!isAppRequest && !isFontRequest) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith(cachedWithRefresh(event.request));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
`;

await writeFile(join(outputDirectory, "sw.js"), worker);
console.log(`Generated ${cacheName} with ${precacheUrls.length} offline files.`);
