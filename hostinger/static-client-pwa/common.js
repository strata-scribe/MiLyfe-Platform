// hostinger/static-client-pwa/common.js
// Local-First Standalone PWA Adapter for Static Web Hosting (Hostinger Non-VPS / CDN)
// Intercepts fetch('/api/...') and stores all Citizen Vault, Word-to-Math, Ledger, and Circle data in browser localStorage.

const STORAGE_KEY = 'milyfe_local_vault_db_v1';
function getLocalDB(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try { return JSON.parse(raw); } catch(e){}
  }
  const defaultDB = {
    users: [], sessions: [], agenda: [], assemblies: {}, invites: [], events: [], audit: [], circles: [], formulas: [], ledger: []
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDB));
  return defaultDB;
}
function saveLocalDB(db){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
function id(prefix='id'){
  return prefix + '_' + Math.random().toString(36).slice(2,11);
}
function nowISO(){
  return new Date().toISOString();
}

// Override api fetch helper for standalone local-first execution
window.api = async function(path, opts={}){
  const db = getLocalDB();
  const method = (opts.method || 'GET').toUpperCase();
  const body = opts.body ? (typeof opts.body === 'string' ? JSON.parse(opts.body) : opts.body) : {};
  const currentUserId = localStorage.getItem('ml_current_user_id');
  const currentUser = db.users.find(u => u.id === currentUserId);

  // Register
  if(path === '/api/auth/register' && method === 'POST'){
    const email = String(body.email || '').trim().toLowerCase();
    if(db.users.some(u => u.email === email)) throw new Error('Account already exists');
    const firstAdmin = db.users.length === 0;
    const user = {
      id: id('user'),
      email,
      role: firstAdmin ? 'admin' : 'citizen',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      profile: {
        name: body.name || 'Citizen',
        email,
        location: body.location || '',
        suggestedRole: 'Founding Citizen',
        code: 'ML-' + Math.random().toString(36).slice(2,8).toUpperCase(),
        status: 'Onboarded',
        circleStatus: 'Matching you with people near ' + (body.location || 'your community'),
        priorities: body.priorities || [],
        skills: body.skills || [],
        pledge: body.pledge || [],
        signature: body.signature || body.name || ''
      },
      missionState: {}
    };
    db.users.push(user);
    saveLocalDB(db);
    localStorage.setItem('ml_current_user_id', user.id);
    return { user, csrf: 'local_csrf' };
  }

  // Login
  if(path === '/api/auth/login' && method === 'POST'){
    const email = String(body.email || '').trim().toLowerCase();
    const user = db.users.find(u => u.email === email);
    if(!user) throw new Error('Invalid login');
    localStorage.setItem('ml_current_user_id', user.id);
    return { user, csrf: 'local_csrf' };
  }

  // Logout
  if(path === '/api/auth/logout' && method === 'POST'){
    localStorage.removeItem('ml_current_user_id');
    return { ok: true };
  }

  // Me
  if(path === '/api/me' && method === 'GET'){
    if(!currentUser) throw new Error('Login required');
    return { user: currentUser, csrf: 'local_csrf' };
  }

  // Dashboard
  if(path === '/api/dashboard' && method === 'GET'){
    if(!currentUser) throw new Error('Login required');
    const userLedger = db.ledger.filter(tx => tx.userId === currentUser.id);
    let balanceMLY = 500; let standing = 50;
    for(const tx of userLedger){
      if(tx.asset === 'MLY' && ['ALLOCATE','TRANSFER'].includes(tx.action)) balanceMLY -= tx.amount;
      else if(tx.asset === 'STANDING' && ['ALLOCATE','TRANSFER'].includes(tx.action)) standing -= tx.amount;
    }
    return {
      user: currentUser,
      agenda: db.agenda.filter(a => a.userId === currentUser.id),
      assembly: db.assemblies[currentUser.id] || {},
      invites: db.invites.filter(i => i.userId === currentUser.id),
      events: db.events,
      missions: ['Share your invite with 3 people','Add one community need to your Values Agenda','Save your first assembly RSVP'],
      missionState: currentUser.missionState || {},
      balanceMLY,
      standing,
      ledger: userLedger
    };
  }

  // Word-to-Math Formula Review
  if(path === '/api/formulas/review' && method === 'POST'){
    if(!currentUser) throw new Error('Login required');
    const text = String(body.text || '').trim();
    let action = 'PROPOSE';
    const lower = text.toLowerCase();
    if(lower.includes('allocate') || lower.includes('spend')) action = 'ALLOCATE';
    else if(lower.includes('save')) action = 'SAVE';
    else if(lower.includes('transfer')) action = 'TRANSFER';
    const amtMatch = text.match(/(\d+(?:\.\d+)?)/);
    const amount = amtMatch ? Number(amtMatch[1]) : 0;
    const asset = /standing/i.test(text) ? 'STANDING' : 'MLY';
    const ast = {
      id: id('ast'),
      userId: currentUser.id,
      rawText: text,
      action,
      amount,
      asset,
      target: 'Circle Treasury',
      charterCompliant: amount > 0,
      violations: amount <= 0 ? ['invalid_amount'] : [],
      reviewed: false,
      signature: null,
      createdAt: nowISO()
    };
    db.formulas.push(ast);
    saveLocalDB(db);
    return { ast };
  }

  // Approve Formula & Ledger
  if(path === '/api/formulas/approve' && method === 'POST'){
    if(!currentUser) throw new Error('Login required');
    const ast = db.formulas.find(f => f.id === body.astId && f.userId === currentUser.id);
    if(!ast) throw new Error('Formula AST not found');
    ast.reviewed = true;
    ast.signature = 'local_sig_' + Math.random().toString(36).slice(2,10);
    const tx = {
      id: id('tx'),
      astId: ast.id,
      userId: currentUser.id,
      action: ast.action,
      amount: ast.amount,
      asset: ast.asset,
      target: ast.target,
      signature: ast.signature,
      timestamp: nowISO()
    };
    db.ledger.unshift(tx);
    saveLocalDB(db);
    return { ast, tx };
  }

  // Solid-Pod Export
  if(path === '/api/export/pod' && method === 'GET'){
    if(!currentUser) throw new Error('Login required');
    return {
      pod: {
        "@context": "https://milyfe.fun/contexts/SolidPod_v1.jsonld",
        type: "CitizenPodExport",
        citizenId: currentUser.id,
        email: currentUser.email,
        profile: currentUser.profile,
        exportedAt: nowISO()
      }
    };
  }

  throw new Error('Local PWA adapter route not implemented: ' + path);
};
