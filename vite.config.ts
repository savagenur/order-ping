import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      tailwindcss(),
      {
        name: 'service-worker-env',
        writeBundle() {
          const swPath = path.resolve(__dirname, 'dist/messaging-sw.js')
          if (fs.existsSync(swPath)) {
            let content = fs.readFileSync(swPath, 'utf-8')
            
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
    ],
    build: {
      target: 'es2020',
      minify: isProduction ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'firebase';
              }
              if (id.includes('framer-motion') || id.includes('@headlessui') || 
                  id.includes('@heroicons') || id.includes('lucide-react')) {
                return 'ui';
              }
              if (id.includes('recharts')) {
                return 'charts';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              if (id.includes('@tanstack/react-query') || id.includes('zustand')) {
                return 'state';
              }
              if (id.includes('date-fns')) {
                return 'utils';
              }
              return 'vendor';
            }
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        }
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: !isProduction,
      reportCompressedSize: isProduction,
    },
    server: {
      port: 5173,
      strictPort: false,
      open: false,
    },
    preview: {
      port: 4173,
      strictPort: false,
    },
  }
})
