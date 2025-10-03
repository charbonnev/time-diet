import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Time Diet',
        short_name: 'TimeDiet',
        description: 'A progressive web app for managing structured weekday routines with time blocks and ADHD-friendly features',
        theme_color: '#1f2937',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5000,
    // Disable HTTPS for easier proxy setup
    // https: fs.existsSync('cert.pem') && fs.existsSync('key.pem') ? {
    //   key: fs.readFileSync('key.pem'),
    //   cert: fs.readFileSync('cert.pem'),
    // } : undefined,
    host: true,
  },
  preview: {
    host: true,
    // Also disable HTTPS for preview server
    allowedHosts: ['efc8ff4ece29.ngrok-free.app']
  },
})
