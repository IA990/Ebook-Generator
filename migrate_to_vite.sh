#!/bin/bash

# Create directories
mkdir -p src/components
mkdir -p src/utils
mkdir -p src/assets

# Move JS files to src/utils
mv frontend/stateManager.js src/utils/
mv frontend/stateManager.test.js src/utils/
mv frontend/i18n.js src/utils/
mv frontend/securityUtils.js src/utils/
mv frontend/pdfGeneration.test.js src/utils/
mv frontend/apiMocks.test.js src/utils/

# Move locales to src/assets/locales
mkdir -p src/assets/locales
mv frontend/locales/en.json src/assets/locales/
mv frontend/locales/fr.json src/assets/locales/

# Move manifest.json to src/assets
mv frontend/manifest.json src/assets/

# Move pdfWorker.js to src/utils
mv pdfWorker.js src/utils/

# Move index.html to root (if not already)
# Assuming index.html is already in root, else uncomment below
# mv frontend/index.html .

# Remove empty frontend directory
rmdir frontend

# Create vite.config.js
cat > vite.config.js <<EOL
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: '.',
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ebook Generator',
        short_name: 'EbookGen',
        description: 'Generate ebooks easily with AI-powered content and illustrations.',
        theme_color: '#4f46e5',
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
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
EOL

echo "Migration to Vite project structure completed."
echo "Run 'npm install vite vite-plugin-pwa' to install dependencies."
