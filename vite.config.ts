import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      tailwindcss(),
      // Custom plugin to process service worker
      {
        name: 'service-worker-env',
        writeBundle() {
          const swPath = path.resolve(__dirname, 'dist/messaging-sw.js')
          if (fs.existsSync(swPath)) {
            let content = fs.readFileSync(swPath, 'utf-8')
            
            // Replace environment variable placeholders
            content = content.replace(/__VITE_FIREBASE_API_KEY__/g, env.VITE_FIREBASE_API_KEY || '')
            content = content.replace(/__VITE_FIREBASE_AUTH_DOMAIN__/g, env.VITE_FIREBASE_AUTH_DOMAIN || '')
            content = content.replace(/__VITE_FIREBASE_PROJECT_ID__/g, env.VITE_FIREBASE_PROJECT_ID || '')
            content = content.replace(/__VITE_FIREBASE_STORAGE_BUCKET__/g, env.VITE_FIREBASE_STORAGE_BUCKET || '')
            content = content.replace(/__VITE_FIREBASE_MESSAGING_SENDER_ID__/g, env.VITE_FIREBASE_MESSAGING_SENDER_ID || '')
            content = content.replace(/__VITE_FIREBASE_APP_ID__/g, env.VITE_FIREBASE_APP_ID || '')
            
            fs.writeFileSync(swPath, content)
            console.log('✅ Service worker environment variables injected successfully')
          }
        }
      }
    ]
  }
})
