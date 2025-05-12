import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import viteImagemin from 'vite-plugin-imagemin';

export default {
  root: '.',
  base: '/Ebook-Generator/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'apple-touch-icon.png',
        'src/assets/icons/icon-192.png',
        'src/assets/icons/icon-512.png',
        'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
        'https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap'
      ],
      manifest: {
        name: 'Ebook Generator',
        short_name: 'EbookGen',
        description: 'Generate ebooks easily with AI-powered content and illustrations.',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: 'src/assets/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'src/assets/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        navigateFallback: '/offline.html',
        cleanupOutdatedCaches: true
      }
    }),
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 20,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
          },
          {
            name: 'removeEmptyAttrs',
            active: false,
          }
        ]
      },
      webp: {
        quality: 75
      },
      avif: {
        quality: 50
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true
  }
};
