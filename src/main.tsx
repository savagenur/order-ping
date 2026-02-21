import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import "./index.css";
import App from "./App.tsx";
import {
  getOrCreateUserId,
  injectUserIdIntoUrl,
  isStandalone,
} from "./lib/pwaUtils";
import {
  requestNotificationPermission,
  registerDeviceToken,
} from "./lib/notifications";

// ─── 1. User ID Bootstrap ────────────────────────────────────────────────────
// Resolve userId (URL → localStorage → new UUID). Only inject into URL on
// public/customer pages (queue, about) so the PWA start_url captures it.
const currentUserId = getOrCreateUserId();
const isQueuePage = window.location.pathname === "/queue";
if (isQueuePage) {
  injectUserIdIntoUrl(currentUserId);
}
console.log(
  "👤 [BOOTSTRAP] userId =",
  currentUserId,
  "isQueuePage =",
  isQueuePage,
);

// ─── 2. Service Worker Registration ─────────────────────────────────────────
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/messaging-sw.js")
    .then((registration) => {
      console.log(
        "Service Worker registered successfully:",
        registration.scope,
      );

      // Check if service worker is activated
      if (registration.active) {
        console.log("Service Worker is active");
      } else {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                console.log("Service Worker activated");
              }
            });
          }
        });
      }

      // ─── 3. PWA Auto Push Registration ──────────────────────────────────
      // When launched in standalone (PWA) mode, immediately register for push
      // notifications and map the fcmToken to this userId in /device_tokens.
      if (isStandalone()) {
        console.log(
          "👤 [BOOTSTRAP] Standalone PWA detected — auto-registering push",
        );
        requestNotificationPermission().then((result) => {
          if (result.success) {
            console.log(
              "👤 [BOOTSTRAP] Push permission granted, registering device token",
            );
            registerDeviceToken(currentUserId);
          } else {
            console.log(
              "👤 [BOOTSTRAP] Push permission not granted:",
              result.error,
            );
          }
        });
      }
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
      console.error(
        "This may prevent push notifications from working in production",
      );
    });
} else {
  console.warn("Service Workers are not supported in this browser");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
