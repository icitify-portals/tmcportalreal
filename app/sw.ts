import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
});

// Intercept fetch to exclude Server Actions from being handled by Serwist defaultCache if they fail
self.addEventListener("fetch", (event) => {
    if (event.request.method === "POST" && event.request.headers.has("next-action")) {
        return; // Let it fall through to network
    }
});

serwist.addEventListeners();
