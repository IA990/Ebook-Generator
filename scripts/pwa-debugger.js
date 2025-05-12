const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.resolve(__dirname, '../reports/lighthouse/initial-audit.report.json');

function loadReport() {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error('Lighthouse report JSON not found at', REPORT_PATH);
    process.exit(1);
  }
  const raw = fs.readFileSync(REPORT_PATH, 'utf-8');
  return JSON.parse(raw);
}

function findTopOpportunities(audits) {
  const opportunities = Object.values(audits).filter(audit => audit.details && audit.details.type === 'opportunity');
  opportunities.sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0));
  return opportunities.slice(0, 3);
}

function generateFixes(opportunities) {
  const fixes = [];

  opportunities.forEach(opp => {
    switch (opp.id) {
      case 'webapp-manifest':
        fixes.push({
          issue: 'Manifest missing or incomplete',
          fix: 'Add or update manifest.json with required fields: name, short_name, start_url, display, icons, theme_color, background_color.'
        });
        break;
      case 'service-worker':
        fixes.push({
          issue: 'Service Worker misconfigured',
          fix: 'Ensure service worker precaches critical assets, handles offline fallback, and updates automatically.'
        });
        break;
      case 'uses-http2':
      case 'uses-long-cache-ttl':
      case 'uses-responsive-images':
      case 'uses-text-compression':
        fixes.push({
          issue: 'Resources not properly cached or compressed',
          fix: 'Configure server to use Brotli compression and set long cache TTLs for static assets.'
        });
        break;
      default:
        fixes.push({
          issue: `Opportunity: ${opp.title}`,
          fix: 'Review audit details and apply recommended optimizations.'
        });
    }
  });

  return fixes;
}

function generateActionPlan(fixes) {
  const plan = [
    '1. Review and update manifest.json as per PWA requirements.',
    '2. Audit and enhance service worker configuration for caching and offline support.',
    '3. Configure server-side compression (Brotli) and caching headers for static assets.',
    '4. Test changes locally and rerun Lighthouse audit to verify improvements.',
    '5. Automate Lighthouse audits in CI for continuous monitoring.'
  ];
  return plan;
}

function main() {
  const report = loadReport();
  const audits = report.audits;

  const topOpportunities = findTopOpportunities(audits);
  console.log('Top 3 Lighthouse Opportunities:');
  topOpportunities.forEach((opp, i) => {
    console.log(`${i + 1}. ${opp.title} - Estimated Savings: ${opp.details.overallSavingsMs || 'N/A'} ms`);
  });

  const fixes = generateFixes(topOpportunities);
  console.log('\nSuggested Fixes:');
  fixes.forEach((fix, i) => {
    console.log(`${i + 1}. Issue: ${fix.issue}`);
    console.log(`   Fix: ${fix.fix}`);
  });

  const actionPlan = generateActionPlan(fixes);
  console.log('\nAction Plan:');
  actionPlan.forEach(step => console.log(step));
}

main();
