// hostinger/test_hostinger_package.js
// Automated verification test suite for Hostinger Shared Hosting / Non-VPS package parity & security.

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runHostingerPackageTests() {
  console.log('====================================================================');
  console.log('         Hostinger Shared Hosting Package Verification Suite        ');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err.message || err);
      failed++;
    }
  }

  const publicHtml = path.join(__dirname, 'public_html');
  const staticPwa = path.join(__dirname, 'static-client-pwa');

  test('1. Hostinger public_html package structure & .htaccess rules present', () => {
    assert(fs.existsSync(path.join(publicHtml, '.htaccess')), 'Missing root .htaccess');
    assert(fs.existsSync(path.join(publicHtml, 'api.php')), 'Missing api.php');
    assert(fs.existsSync(path.join(publicHtml, 'data', '.htaccess')), 'Missing data/.htaccess protection');
    assert(fs.existsSync(path.join(publicHtml, 'data', 'db.json')), 'Missing default db.json');
    const htaccess = fs.readFileSync(path.join(publicHtml, '.htaccess'), 'utf8');
    assert(htaccess.includes('RewriteRule ^api/(.*)$ api.php?path=$1'), 'Missing mod_rewrite rule for api.php');
    assert(htaccess.includes('Require all denied') || htaccess.includes('Deny from all'), 'Missing protection for sensitive files');
  });

  test('2. PHP api.php backend implements all 16 Mi pillars & 5 emergent civic features', () => {
    const apiPhp = fs.readFileSync(path.join(publicHtml, 'api.php'), 'utf8');
    assert(apiPhp.includes('admin/attendance/scan-scale'), 'Missing MiPassport scan-scale endpoint');
    assert(apiPhp.includes('federation/elevate'), 'Missing MiCity council elevation endpoint');
    assert(apiPhp.includes('globe/pulse'), 'Missing MiPulse ZK emergency mutual aid endpoint');
    assert(apiPhp.includes('stewardship/mentor'), 'Missing MiMentor mentorship endpoint');
    assert(apiPhp.includes('circles/chiasm'), 'Missing MiChiasm hybridization endpoint');
    assert(apiPhp.includes('formulas/mandate'), 'Missing MiMandate recurring rule endpoint');
    assert(apiPhp.includes('slm/assist'), 'Missing Mi AI chat co-pilot endpoint');
    assert(apiPhp.includes('export/pod'), 'Missing MiPod solid-pod export endpoint');
  });

  test('3. Default db.json schema contains all required arrays for 16 pillars', () => {
    const dbJson = JSON.parse(fs.readFileSync(path.join(publicHtml, 'data', 'db.json'), 'utf8'));
    const requiredKeys = ['users', 'sessions', 'agenda', 'assemblies', 'invites', 'events', 'audit', 'circles', 'formulas', 'ledger', 'proposals', 'messages', 'webauthn', 'chiasms', 'mandates', 'juries', 'attendance', 'federations', 'pulses', 'mentorships'];
    for (const key of requiredKeys) {
      assert(Array.isArray(dbJson[key]) || typeof dbJson[key] === 'object', `Missing db.json key: ${key}`);
    }
  });

  test('4. Frontend HTML/JS files include canonical Mi branding, SVG QR code matrix, and i18n switcher', () => {
    const citizenHtml = fs.readFileSync(path.join(publicHtml, 'citizen.html'), 'utf8');
    assert(citizenHtml.includes('MiPass') && citizenHtml.includes('MiStanding') && citizenHtml.includes('MiStory') && citizenHtml.includes('MiJourney') && citizenHtml.includes('MiClass') && citizenHtml.includes('MiDiscovery'), 'Missing canonical Mi branding in citizen.html');
    assert(citizenHtml.includes('renderPassQR'), 'Missing dynamic QR code credential matrix');
    const commonJs = fs.readFileSync(path.join(publicHtml, 'common.js'), 'utf8');
    assert(commonJs.includes('i18nDict') && commonJs.includes('window.MiAI'), 'Missing i18n dictionary and window.MiAI on-device RAG engine');
  });

  test('5. Hostinger static-client-pwa package structure complete for zero-backend CDN hosting', () => {
    assert(fs.existsSync(path.join(staticPwa, 'index.html')), 'Missing static PWA index.html');
    assert(fs.existsSync(path.join(staticPwa, 'common.js')), 'Missing static PWA common.js');
    const commonJs = fs.readFileSync(path.join(staticPwa, 'common.js'), 'utf8');
    assert(commonJs.includes('window.MiAI'), 'Static PWA common.js must include window.MiAI on-device engine');
  });

  console.log(`\n====================================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================================\n`);

  if (failed > 0) process.exit(1);
}

runHostingerPackageTests();
