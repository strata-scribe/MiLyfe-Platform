// test.js — Comprehensive Automated Test Suite for MiLyfe Platform API & Engine.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3344;
process.env.PORT = PORT;
process.env.FIRST_USER_ADMIN = 'true';
process.env.NODE_ENV = 'test';
process.env.DB_FILE = 'db_test.json';

// Use a temporary test database file
const DATA_DIR = path.join(__dirname, 'data');
const TEST_DB = path.join(DATA_DIR, 'db_test.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Override DB file path before requiring server
fs.writeFileSync(TEST_DB, JSON.stringify({
  users: [], sessions: [], agenda: [], assemblies: {}, invites: [], events: [], audit: [], circles: [], formulas: [], ledger: []
}, null, 2));

// Monkeypatch fs.readFileSync/writeFileSync in server test run by setting env or overriding
const serverModule = require('./server.js');

function req(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: { ...headers }
    };
    if (body && !opts.headers['Content-Type']) {
      opts.headers['Content-Type'] = 'application/json';
    }
    const r = http.request(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });
    r.on('error', reject);
    if (body) r.write(typeof body === 'string' ? body : JSON.stringify(body));
    r.end();
  });
}

async function runTests() {
  console.log('====================================================================');
  console.log('            MiLyfe Platform API — AUTOMATED TEST SUITE             ');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
  }

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err.message || err);
      failed++;
    }
  }

  // Wait a moment for server to start
  await new Promise(r => setTimeout(r, 500));

  let cookie = '';
  let csrf = '';
  let astId = '';

  await test('1. User Registration (Founding Citizen / Admin)', async () => {
    const res = await req('POST', '/api/auth/register', {
      name: 'Founding Citizen One',
      email: 'founder@milyfe.fun',
      password: 'SuperSecretPassword123!',
      location: 'Jacksonville, FL',
      focus: 'Governance'
    });
    assert(res.status === 201, `Expected status 201, got ${res.status}: ${res.data}`);
    assert(res.json.user.email === 'founder@milyfe.fun', 'Email mismatch');
    assert(res.json.user.role === 'admin', 'First user should be admin when FIRST_USER_ADMIN=true');
    cookie = (res.headers['set-cookie'] || [])[0].split(';')[0];
    csrf = res.json.csrf;
    assert(cookie && csrf, 'Missing cookie or CSRF token');
  });

  await test('2. Citizen Dashboard Load with Cookie Auth', async () => {
    const res = await req('GET', '/api/dashboard', null, { Cookie: cookie });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.json.user.email === 'founder@milyfe.fun', 'Failed to fetch user in dashboard');
  });

  await test('3. Natural Language Word-to-Math Formula Review Engine', async () => {
    const res = await req('POST', '/api/formulas/review', {
      text: 'Allocate 150 MLY for Circle community garden'
    }, {
      Cookie: cookie,
      'x-csrf-token': csrf
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}: ${res.data}`);
    assert(res.json.ast.action === 'ALLOCATE', `Expected action ALLOCATE, got ${res.json.ast.action}`);
    assert(res.json.ast.amount === 150, `Expected amount 150, got ${res.json.ast.amount}`);
    assert(res.json.ast.charterCompliant === true, 'Formula should be charter compliant');
    astId = res.json.ast.id;
  });

  await test('4. Approve & Sign Formula + Log to $MLY Ledger', async () => {
    const res = await req('POST', '/api/formulas/approve', {
      astId
    }, {
      Cookie: cookie,
      'x-csrf-token': csrf
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}: ${res.data}`);
    assert(res.json.tx.amount === 150, 'Ledger tx amount mismatch');
    assert(res.json.tx.signature, 'Missing cryptographic signature on transaction');
  });

  await test('5. Fetch Ledger History & Updated Balance', async () => {
    const res = await req('GET', '/api/ledger', null, { Cookie: cookie });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    // Initial balance is 500, after allocating 150 MLY it should be 350
    assert(res.json.balanceMLY === 350, `Expected balance 350, got ${res.json.balanceMLY}`);
    assert(res.json.ledger.length === 1, 'Expected 1 ledger entry');
  });

  await test('6. Circle Formation Auto-Matching', async () => {
    const res = await req('POST', '/api/circles/match', {}, {
      Cookie: cookie,
      'x-csrf-token': csrf
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}: ${res.data}`);
    assert(typeof res.json.circlesCreated === 'number', 'Missing circlesCreated count');
  });

  await test('7. Solid-Pod Data Sovereignty Export', async () => {
    const res = await req('GET', '/api/export/pod', null, { Cookie: cookie });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.json.pod.type === 'CitizenPodExport', 'Pod export type mismatch');
    assert(res.json.pod.email === 'founder@milyfe.fun', 'Pod export email mismatch');
    assert(res.json.pod.signature, 'Pod export must be signed');
  });

  await test('8. Real-time Server-Sent Events (SSE) Stream Connection', async () => {
    const r = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/stream',
      method: 'GET',
      headers: { Cookie: cookie }
    });
    const connected = await new Promise((resolve, reject) => {
      r.on('response', res => {
        if (res.statusCode === 200 && res.headers['content-type'] === 'text/event-stream') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      r.on('error', reject);
      r.end();
    });
    assert(connected, 'Failed to establish SSE stream connection');
  });

  console.log(`\n====================================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================================\n`);

  // Cleanup test DB
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
