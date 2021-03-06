/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.conf > pwa > workboxPluginMode is set to "InjectManifest"
 */

/*
    dependencies
*/
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkFirst,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { Queue } from "workbox-background-sync";

/**
    config
*/
// disable workbox logs
self.__WB_DISABLE_DEV_LOGS = true;
// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST);
// check if background sync is supported
const backgroundSyncSupported = "sync" in self.registration ? true : false;

/*
    queue - fetch posts
*/
let createPostsQueue = null;
if (backgroundSyncSupported) {
  createPostsQueue = new Queue("createPostsQueue", {
    onSync: async ({ queue }) => {
      let entry;
      while ((entry = await queue.shiftRequest())) {
        try {
          await fetch(entry.request);
          console.log("Replay successful for request", entry.request);
          const channel = new BroadcastChannel("sw-messages");
          channel.postMessage({ msg: "offline-post-uploaded" });
        } catch (error) {
          console.error("Replay failed for request", entry.request, error);

          await queue.unshiftRequest(entry);
          throw error;
        }
      }
      console.log("Replay complete!");
    },
  });
}

/*
    caching strategies
*/
registerRoute(
  ({ url }) => url.host.startsWith("fonts.g"),
  new CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith("/posts"),
  new NetworkFirst()
);

// fallback
registerRoute(
  ({ url }) => url.href.startsWith("http"),
  new StaleWhileRevalidate()
);

/*
    events - fetch
*/
if (backgroundSyncSupported) {
  self.addEventListener("fetch", (event) => {
    if (event.request.url.endsWith("/createPost")) {
      if (!self.navigator.onLine) {
        const promiseChain = fetch(event.request.clone()).catch((err) => {
          return createPostsQueue.pushRequest({ request: event.request });
        });
        event.waitUntil(promiseChain);
      }
    }
  });
}

/**
    events - push
 */
self.addEventListener("push", (event) => {
  console.log("Push message received:", event);
  if (event.data) {
    let data = JSON.parse(event.data.text());
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "icons/icon-128x128.png",
        badge: "icons/icon-128x128.png",
        image: data.imageUrl,
        data: {
          openUrl: data.openUrl,
        },
      })
    );
  }
});

/**
    events - notifications
 */
self.addEventListener("notificationclick", (event) => {
  let notification = event.notification;
  let action = event.action;

  console.log("action: ", action);
  if (action == "hello") {
    console.log("Hello button was clicked");
  } else if (action == "goodbye") {
    console.log("Goodbye button was clicked");
  } else {
    event.waitUntil(
      clients.matchAll().then((clis) => {
        let clientUsingApp = clis.find((cli) => {
          return cli.visibilityState === "visible";
        });

        if (clientUsingApp) {
          clientUsingApp.navigate(notification.data.openUrl);
          clientUsingApp.focus();
        } else {
          clients.openWindow(notification.data.openUrl);
        }
      })
    );
  }
  notification.close();
});
self.addEventListener("notificationclose", (event) => {
  console.log("Notification was closed", event);
});
