const APP_CACHE_PREFIXES = ["workbox-precache-", "workbox-runtime-"];

export async function clearAppCache(): Promise<number> {
  if (!("caches" in window)) {
    throw new Error("This browser does not support clearing the app cache.");
  }

  const cacheNames = (await window.caches.keys()).filter((name) =>
    APP_CACHE_PREFIXES.some((prefix) => name.startsWith(prefix)),
  );
  const results = await Promise.all(cacheNames.map((name) => window.caches.delete(name)));

  if (results.some((deleted) => !deleted)) {
    throw new Error("Some app cache files could not be cleared. Please try again.");
  }

  return results.length;
}
