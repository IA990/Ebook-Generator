const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.resolve(__dirname, '../reports/lighthouse/initial-audit.report.json');
const MANIFEST_PATH = path.resolve(__dirname, '../src/assets/manifest.json');
const SERVICE_WORKER_PATH = path.resolve(__dirname, '../service-worker.js');
const VITE_CONFIG_PATH = path.resolve(__dirname, '../vite.config.js');

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated file: ${filePath}`);
}

function analyzeReport(report) {
  const issues = [];

  // Check manifest presence and completeness
  const manifestAudit = report.audits['webapp-manifest'];
  if (manifestAudit.score < 1) {
    issues.push('Manifest missing or incomplete');
  }

  // Check service worker
  const swAudit = report.audits['service-worker'];
  if (swAudit.score < 1) {
    issues.push('Service worker misconfigured or missing');
  }

  // Check caching
  const cachingAudit = report.audits['uses-long-cache-ttl'];
  if (cachingAudit.score < 1) {
    issues.push('Static resources not cached properly');
  }

  return issues;
}

function fixManifest() {
  const manifest = {
    name: 'Ebook Generator',
    short_name: 'EbookGen',
    start_url: '.',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    description: 'Generate ebooks easily with AI-powered content and illustrations.',
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
  };
  saveFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function fixServiceWorker() {
  const swContent = `
// Workbox service worker configuration
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  workbox.routing.registerRoute(
    ({request}) => request.destination === 'script' || request.destination === 'style' || request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'assets-cache',
    })
  );

  workbox.routing.registerRoute(
    /\\/api\\//,
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
    })
  );

  workbox.routing.setCatchHandler(async ({event}) => {
    if (event.request.destination === 'document') {
      return caches.match('/offline.html');
    }
    return Response.error();
  });

  workbox.core.skipWaiting();
  workbox.core.clientsClaim();
} else {
  console.log('Workbox not loaded');
}
`;
  saveFile(SERVICE_WORKER_PATH, swContent);
}

function fixViteConfig() {
  let viteConfig = fs.readFileSync(VITE_CONFIG_PATH, 'utf-8');
  if (!viteConfig.includes('VitePWA')) {
    viteConfig = viteConfig.replace(
      /plugins:\s*\[/,
      `plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: require('./src/assets/manifest.json'),
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\\/api\\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
            },
          },
        ],
        navigateFallback: '/offline.html',
        cleanupOutdatedCaches: true,
      },
    }),`
    );
    saveFile(VITE_CONFIG_PATH, viteConfig);
  }
}

function generateReport(issues, fixesApplied) {
  const report = {
    timestamp: new Date().toISOString(),
    issuesFound: issues,
    fixesApplied,
    recommendations: [
      'Test changes locally and rerun Lighthouse audit.',
      'Automate Lighthouse audits in CI pipeline.',
      'Monitor PWA metrics regularly.'
    ]
  };
  const reportPath = path.resolve(__dirname, '../reports/pwa-optimizer-report.json');
  saveFile(reportPath, JSON.stringify(report, null, 2));
  console.log('Generated PWA optimizer report at', reportPath);
}

function main() {
  const report = loadJSON(REPORT_PATH);
  const issues = analyzeReport(report);
  const fixesApplied = [];

  if (issues.includes('Manifest missing or incomplete')) {
    fixManifest();
    fixesApplied.push('Manifest injected/updated');
  }
  if (issues.includes('Service worker misconfigured or missing')) {
    fixServiceWorker();
    fixesApplied.push('Service worker configured');
  }
  if (issues.includes('Static resources not cached properly')) {
    fixViteConfig();
    fixesApplied.push('Vite config updated for Workbox caching');
  }

  generateReport(issues, fixesApplied);

  console.log('\nManual improvements to consider:');
  console.log('- Optimize images and fonts further.');
  console.log('- Implement advanced caching strategies for dynamic content.');
  console.log('- Monitor real user metrics for performance tuning.');
}

main();
