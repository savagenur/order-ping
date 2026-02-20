import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import './index.css'
import App from './App.tsx'

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered successfully:', registration.scope);
      
      // Check if service worker is activated
      if (registration.active) {
        console.log('Service Worker is active');
      } else {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('Service Worker activated');
              }
            });
          }
        });
      }
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
      console.error('This may prevent push notifications from working in production');
    });
} else {
  console.warn('Service Workers are not supported in this browser');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
