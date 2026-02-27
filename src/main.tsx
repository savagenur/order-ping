import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";
import App from "./App.tsx";
import {
  getOrCreateUserId,
  injectUserIdIntoUrl,
  isStandalone,
} from "./lib/pwaUtils";
import { setupTokenRefreshListener } from "./lib/notifications";

// ─── 1. User ID Bootstrap ────────────────────────────────────────────────────
// Resolve userId (URL → localStorage → new UUID). Only inject into URL on
// public/customer pages (queue, about) so the PWA start_url captures it.
const currentUserId = getOrCreateUserId();
const isQueuePage = window.location.pathname === "/queue";
if (isQueuePage) {
  injectUserIdIntoUrl(currentUserId);
}

// ─── 2. Service Worker Registration ─────────────────────────────────────────
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/messaging-sw.js")
    .then((registration) => {

      // Check if service worker is activated
      if (registration.active) {
        // Service worker is already active
      } else {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                // Service worker activated
              }
            });
          }
        });
      }

      // ─── 3. PWA Auto Push Registration ──────────────────────────────────
      // When launched in standalone (PWA) mode, immediately register for push
      // Setup token refresh listener for PWA - handles automatic token updates
      if (isStandalone()) {
        setupTokenRefreshListener(currentUserId);
      }
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
} else {
  console.error("Service Workers are not supported in this browser");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
