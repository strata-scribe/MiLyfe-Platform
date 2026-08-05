const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, process.env.DB_FILE || (process.env.NODE_ENV === 'test' ? 'db_test.json' : 'db.json'));
const COOKIE = 'ml_session';
const SESSION_DAYS = 7;
const IS_PROD = process.env.NODE_ENV === 'production';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], sessions: [], agenda: [], assemblies: {}, invites: [], events: [], audit: [], circles: [], formulas: [], ledger: [], proposals: [], messages: [], webauthn: [] }, null, 2));
}

const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8' };
const rate = new Map();
const sseClients = new Set();
function broadcastSSE(event, payload){
  const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for(const client of sseClients){
    try { client.res.write(msg); } catch(e){ sseClients.delete(client); }
  }
}

function db(){
  const d = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  d.circles = d.circles || [];
  d.formulas = d.formulas || [];
  d.ledger = d.ledger || [];
  d.proposals = d.proposals || [];
  d.messages = d.messages || [];
  d.webauthn = d.webauthn || [];
  return d;
}
function save(d){ fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); }
function id(prefix='id'){ return prefix + '_' + crypto.randomBytes(10).toString('hex'); }
function now(){ return new Date().toISOString(); }
function normEmail(e){ return String(e || '').trim().toLowerCase(); }
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')){
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}
function checkPassword(password, salt, stored){
  const hash = crypto.scryptSync(String(password), salt, 64);
  const other = Buffer.from(stored, 'hex');
  return hash.length === other.length && crypto.timingSafeEqual(hash, other);
}
function parseCookies(req){
  const out = {}; String(req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if(i > -1) out[p.slice(0,i).trim()] = decodeURIComponent(p.slice(i+1)); });
  return out;
}
function cookieHeader(name, value, opts={}){
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (IS_PROD) parts.push('Secure');
  return parts.join('; ');
}
function send(res, status, body, headers={}){ res.writeHead(status, headers); res.end(body); }
function json(res, status, obj, headers={}){ send(res, status, JSON.stringify(obj), { 'Content-Type':'application/json; charset=utf-8', ...headers }); }
function redirect(res, to){ send(res, 302, '', { Location: to }); }
function notFound(res){ send(res, 404, 'Not found', { 'Content-Type':'text/plain; charset=utf-8' }); }
function bad(res, msg='Bad request', status=400){ json(res, status, { error: msg }); }
function body(req){
  return new Promise((resolve, reject) => {
    let data='';
    req.on('data', chunk => { data += chunk; if(data.length > 1_000_000){ req.destroy(); reject(new Error('too large')); } });
    req.on('end', () => { try{ resolve(data ? JSON.parse(data) : {}); } catch(e){ reject(e); } });
    req.on('error', reject);
  });
}
function limited(req, key){
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local';
  const k = `${ip}:${key}`; const t = Date.now(); const item = rate.get(k) || { n:0, reset:t+60_000 };
  if(t > item.reset){ item.n = 0; item.reset = t + 60_000; }
  item.n++; rate.set(k, item); return item.n > 20;
}
function sanitizeUser(u){
  if(!u) return null;
  const { passwordHash, salt, ...safe } = u;
  return safe;
}
function getSession(req){
  const d = db(); const sid = parseCookies(req)[COOKIE]; if(!sid) return { d };
  const session = d.sessions.find(s => s.id === sid && new Date(s.expiresAt) > new Date());
  if(!session) return { d };
  const user = d.users.find(u => u.id === session.userId);
  return { d, session, user };
}
function requireAuth(req, res, roles=null){
  const ctx = getSession(req);
  if(!ctx.user){ json(res, 401, { error:'Login required' }); return null; }
  if(roles && !roles.includes(ctx.user.role)){ json(res, 403, { error:'Not allowed' }); return null; }
  if(['POST','PUT','PATCH','DELETE'].includes(req.method) && !req.url.startsWith('/api/auth/')){
    const token = req.headers['x-csrf-token'];
    if(!token || token !== ctx.session.csrf){ json(res, 403, { error:'Security token missing' }); return null; }
  }
  return ctx;
}
function audit(d, userId, action, details={}){ d.audit.unshift({ id:id('audit'), userId, action, details, at: now() }); d.audit = d.audit.slice(0, 1000); }
function codeFor(seed){
  const h = crypto.createHash('sha256').update(String(seed).toLowerCase()).digest('hex').slice(0, 8);
  return 'ML-' + parseInt(h, 16).toString(36).toUpperCase().slice(0,6).padStart(6,'0');
}
function suggestRole(p={}){
  const skills = (p.skills || []).join(' ');
  if(p.path === 'Circle organizer' || /Organizing|Events/.test(skills)) return 'Circle Organizer';
  if(p.path === 'Builder' || /Technology|Media/.test(skills)) return 'Builder';
  if(p.path === 'Community partner' || p.circlePath === 'Bring a group') return 'Community Partner';
  if(/Legal|Business|Fundraising/.test(skills)) return 'Formation Support';
  return 'Founding Citizen';
}
function circleStatus(p={}){
  const loc = (p.location || 'your area').trim();
  if(p.circlePath === 'Start a Circle') return `Starter path opened for ${loc}`;
  if(p.circlePath === 'Bring a group') return `Group formation path opened for ${loc}`;
  if(['7-20','21-50','51+'].includes(p.groupSize)) return `Circle-ready group forming in ${loc}`;
  if(p.circlePath === 'Online first') return 'Online-first founding path opened';
  return `Matching you with people near ${loc}`;
}
function missionsFor(profile={}){
  const role = profile.suggestedRole || suggestRole(profile);
  const base = ['Share your invite with 3 people', 'Add one community need to your Values Agenda', 'Save your first assembly RSVP'];
  if(role === 'Circle Organizer') return ['Identify 3 people to invite','Choose a possible meeting place','Save your first assembly RSVP','Add one community need to your Values Agenda','Share your invite with 3 people'];
  if(role === 'Builder') return ['List what you can build or create','Share your invite with 3 people','Add one community need to your Values Agenda','Save your first assembly RSVP'];
  if(role === 'Community Partner') return ['Add your organization or group name','Invite your community contact','Save your first assembly RSVP','Add one community need to your Values Agenda'];
  if(role === 'Formation Support') return ['Choose your support lane','Add one community need to your Values Agenda','Share your invite with 3 people','Save your first assembly RSVP'];
  return base;
}
function enhanceProfile(input){
  const p = { ...input };
  p.priorities = Array.isArray(p.priorities) ? p.priorities : [];
  p.skills = Array.isArray(p.skills) ? p.skills : [];
  p.pledge = Array.isArray(p.pledge) ? p.pledge : [];
  p.code = p.code || codeFor(`${p.email}|${p.location}|${p.circlePath}`);
  p.suggestedRole = suggestRole(p);
  p.circleStatus = circleStatus(p);
  p.status = p.status || 'Onboarded';
  p.inviteLink = p.inviteLink || `/onboarding.html?invite=${encodeURIComponent(p.code)}`;
  return p;
}
function serveStatic(req, res, pathname){
  const routeMap = { '/':'index.html', '/login':'login.html', '/onboarding':'onboarding.html', '/citizen':'citizen.html', '/admin':'admin.html' };
  let file = routeMap[pathname] || pathname.replace(/^\//,'');
  const full = path.normalize(path.join(PUBLIC, file));
  if(!full.startsWith(PUBLIC)) return notFound(res);
  if((file === 'citizen.html')){ const ctx=getSession(req); if(!ctx.user) return redirect(res, '/login.html?next=/citizen'); }
  if((file === 'admin.html')){ const ctx=getSession(req); if(!ctx.user) return redirect(res, '/login.html?next=/admin'); if(!['admin','organizer'].includes(ctx.user.role)) return redirect(res, '/citizen'); }
  fs.readFile(full, (err, data) => {
    if(err) return notFound(res);
    const ext = path.extname(full).toLowerCase();
    send(res, 200, data, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600' });
  });
}

async function api(req, res, pathname){
  if(pathname === '/api/auth/register' && req.method === 'POST'){
    if(limited(req,'register')) return bad(res, 'Too many attempts', 429);
    const b = await body(req); const email = normEmail(b.email); const password = String(b.password || '');
    if(!email || !/^\S+@\S+\.\S+$/.test(email)) return bad(res, 'Valid email required');
    if(password.length < 10) return bad(res, 'Password must be at least 10 characters');
    if(!b.name || !b.location) return bad(res, 'Name and location are required');
    const d = db(); if(d.users.some(u => u.email === email)) return bad(res, 'Account already exists', 409);
    const hp = hashPassword(password); const profile = enhanceProfile({ ...b, email });
    const firstUserAdmin = process.env.FIRST_USER_ADMIN === 'true' && d.users.length === 0;
    const user = { id:id('user'), email, passwordHash:hp.hash, salt:hp.salt, role:firstUserAdmin?'admin':'citizen', verified:false, createdAt:now(), updatedAt:now(), profile, missionState:{} };
    d.users.push(user); audit(d, user.id, 'registered', { role:user.role });
    const csrf = crypto.randomBytes(24).toString('hex'); const sid = crypto.randomBytes(32).toString('hex');
    d.sessions.push({ id:sid, userId:user.id, csrf, createdAt:now(), expiresAt:new Date(Date.now()+SESSION_DAYS*864e5).toISOString() });
    save(d);
    return json(res, 201, { user:sanitizeUser(user), csrf }, { 'Set-Cookie': cookieHeader(COOKIE, sid, { maxAge: SESSION_DAYS*86400 }) });
  }
  if(pathname === '/api/auth/login' && req.method === 'POST'){
    if(limited(req,'login')) return bad(res, 'Too many attempts', 429);
    const b = await body(req); const email = normEmail(b.email); const d = db(); const user = d.users.find(u => u.email === email);
    if(!user || !checkPassword(String(b.password || ''), user.salt, user.passwordHash)) return bad(res, 'Invalid login', 401);
    const csrf = crypto.randomBytes(24).toString('hex'); const sid = crypto.randomBytes(32).toString('hex');
    d.sessions.push({ id:sid, userId:user.id, csrf, createdAt:now(), expiresAt:new Date(Date.now()+SESSION_DAYS*864e5).toISOString() });
    audit(d, user.id, 'login'); save(d);
    return json(res, 200, { user:sanitizeUser(user), csrf }, { 'Set-Cookie': cookieHeader(COOKIE, sid, { maxAge: SESSION_DAYS*86400 }) });
  }
  if(pathname === '/api/auth/logout' && req.method === 'POST'){
    const ctx = getSession(req); if(ctx.session){ ctx.d.sessions = ctx.d.sessions.filter(s => s.id !== ctx.session.id); save(ctx.d); }
    return json(res, 200, { ok:true }, { 'Set-Cookie': cookieHeader(COOKIE, '', { maxAge: 0 }) });
  }
  if(pathname === '/api/me' && req.method === 'GET'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    return json(res, 200, { user:sanitizeUser(ctx.user), csrf:ctx.session.csrf });
  }
  if(pathname === '/api/dashboard' && req.method === 'GET'){
    const ctx = requireAuth(req,res); if(!ctx) return; const userId = ctx.user.id;
    ctx.d.ledger = ctx.d.ledger || [];
    const userLedger = ctx.d.ledger.filter(tx => tx.userId === userId);
    let balanceMLY = 500; let standing = 50;
    for(const tx of userLedger){
      if(tx.asset === 'MLY' && (tx.action === 'ALLOCATE' || tx.action === 'TRANSFER')) balanceMLY -= tx.amount;
      else if(tx.asset === 'STANDING' && (tx.action === 'ALLOCATE' || tx.action === 'TRANSFER')) standing -= tx.amount;
    }
    return json(res, 200, { user:sanitizeUser(ctx.user), agenda:ctx.d.agenda.filter(a=>a.userId===userId), assembly:ctx.d.assemblies[userId] || {}, invites:ctx.d.invites.filter(i=>i.userId===userId), events:ctx.d.events, missions:missionsFor(ctx.user.profile), missionState:ctx.user.missionState || {}, balanceMLY, standing, ledger:userLedger, proposals: ctx.d.proposals || [] });
  }
  if(pathname === '/api/profile' && req.method === 'PUT'){
    const ctx = requireAuth(req,res); if(!ctx) return; const b = await body(req);
    ctx.user.profile = enhanceProfile({ ...ctx.user.profile, ...b, email:ctx.user.email }); ctx.user.updatedAt = now(); audit(ctx.d, ctx.user.id, 'profile.updated'); save(ctx.d);
    return json(res, 200, { user:sanitizeUser(ctx.user) });
  }
  if(pathname === '/api/agenda' && req.method === 'POST'){
    const ctx = requireAuth(req,res); if(!ctx) return; const b = await body(req); if(!b.text) return bad(res,'Agenda text required');
    const item = { id:id('agenda'), userId:ctx.user.id, priority:b.priority || 'General', text:String(b.text).slice(0,1000), createdAt:now() };
    ctx.d.agenda.unshift(item); audit(ctx.d, ctx.user.id, 'agenda.created', { id:item.id }); save(ctx.d); return json(res, 201, { item });
  }
  if(pathname.startsWith('/api/agenda/') && req.method === 'DELETE'){
    const ctx = requireAuth(req,res); if(!ctx) return; const itemId = pathname.split('/').pop();
    ctx.d.agenda = ctx.d.agenda.filter(a => !(a.id === itemId && a.userId === ctx.user.id)); audit(ctx.d, ctx.user.id, 'agenda.deleted', { id:itemId }); save(ctx.d); return json(res, 200, { ok:true });
  }
  if(pathname === '/api/assembly' && req.method === 'PUT'){
    const ctx = requireAuth(req,res); if(!ctx) return; const b = await body(req);
    ctx.d.assemblies[ctx.user.id] = { rsvp:b.rsvp || '', availability:b.availability || '', note:String(b.note || '').slice(0,1000), savedAt:now() };
    audit(ctx.d, ctx.user.id, 'assembly.saved'); save(ctx.d); return json(res, 200, { assembly:ctx.d.assemblies[ctx.user.id] });
  }
  if(pathname === '/api/missions' && req.method === 'PUT'){
    const ctx = requireAuth(req,res); if(!ctx) return; const b = await body(req);
    ctx.user.missionState = ctx.user.missionState || {}; ctx.user.missionState[String(b.mission)] = !!b.done; audit(ctx.d, ctx.user.id, 'mission.updated', { mission:b.mission, done:!!b.done }); save(ctx.d); return json(res, 200, { missionState:ctx.user.missionState });
  }
  if(pathname === '/api/invites' && req.method === 'POST'){
    const ctx = requireAuth(req,res); if(!ctx) return; const b = await body(req); if(!b.name) return bad(res,'Name required');
    const invite = { id:id('invite'), userId:ctx.user.id, name:String(b.name).slice(0,120), contact:String(b.contact||'').slice(0,180), sent:false, joined:false, createdAt:now() };
    ctx.d.invites.push(invite); audit(ctx.d, ctx.user.id, 'invite.created'); save(ctx.d); return json(res, 201, { invite });
  }
  if(pathname.startsWith('/api/invites/') && req.method === 'PUT'){
    const ctx = requireAuth(req,res); if(!ctx) return; const b = await body(req); const invite = ctx.d.invites.find(i=>i.id===pathname.split('/').pop() && i.userId===ctx.user.id); if(!invite) return notFound(res);
    if('sent' in b) invite.sent = !!b.sent; if('joined' in b) invite.joined = !!b.joined; invite.updatedAt = now(); audit(ctx.d, ctx.user.id, 'invite.updated'); save(ctx.d); return json(res, 200, { invite });
  }
  if(pathname.startsWith('/api/invites/') && req.method === 'DELETE'){
    const ctx = requireAuth(req,res); if(!ctx) return; const inviteId = pathname.split('/').pop(); ctx.d.invites = ctx.d.invites.filter(i => !(i.id===inviteId && i.userId===ctx.user.id)); audit(ctx.d, ctx.user.id, 'invite.deleted'); save(ctx.d); return json(res, 200, { ok:true });
  }
  if(pathname === '/api/admin/citizens' && req.method === 'GET'){
    const ctx = requireAuth(req,res,['admin','organizer']); if(!ctx) return;
    const citizens = ctx.d.users.map(u => sanitizeUser(u));
    const stats = { total:citizens.length, onboarded:citizens.filter(u=>u.profile?.status==='Onboarded').length, active:citizens.filter(u=>u.profile?.status==='Active citizen').length, organizers:citizens.filter(u=>/Organizer/.test(u.profile?.suggestedRole||'') || u.role==='organizer').length };
    return json(res, 200, { citizens, stats, events:ctx.d.events });
  }
  if(pathname.startsWith('/api/admin/citizens/') && req.method === 'PUT'){
    const ctx = requireAuth(req,res,['admin']); if(!ctx) return; const b = await body(req); const user = ctx.d.users.find(u=>u.id===pathname.split('/').pop()); if(!user) return notFound(res);
    user.profile = { ...user.profile, status:b.status || user.profile.status, assignedCircle:b.assignedCircle || user.profile.assignedCircle || '', circleStatus:b.circleStatus || user.profile.circleStatus };
    if(['citizen','organizer','admin'].includes(b.role)) user.role = b.role;
    user.updatedAt = now(); audit(ctx.d, ctx.user.id, 'admin.citizen.updated', { target:user.id }); save(ctx.d); return json(res, 200, { user:sanitizeUser(user) });
  }
  if(pathname === '/api/admin/events' && req.method === 'POST'){
    const ctx = requireAuth(req,res,['admin','organizer']); if(!ctx) return; const b = await body(req); if(!b.title) return bad(res,'Title required');
    const event = { id:id('event'), title:String(b.title).slice(0,160), date:String(b.date||''), location:String(b.location||''), notes:String(b.notes||''), createdBy:ctx.user.id, createdAt:now() };
    ctx.d.events.unshift(event); audit(ctx.d, ctx.user.id, 'event.created'); save(ctx.d);
    broadcastSSE('event_created', { event });
    return json(res, 201, { event });
  }
  if(pathname === '/api/stream' && req.method === 'GET'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ userId: ctx.user.id })}\n\n`);
    const client = { id: ctx.user.id, res };
    sseClients.add(client);
    req.on('close', () => sseClients.delete(client));
    return;
  }
  if(pathname === '/api/formulas/review' && req.method === 'POST'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    const b = await body(req);
    const text = String(b.text || '').trim();
    if(!text) return bad(res, 'Formula text required');

    let action = 'PROPOSE';
    const lower = text.toLowerCase();
    if(lower.includes('allocate') || lower.includes('spend') || lower.includes('fund')) action = 'ALLOCATE';
    else if(lower.includes('save') || lower.includes('set aside') || lower.includes('reserve')) action = 'SAVE';
    else if(lower.includes('transfer') || lower.includes('send') || lower.includes('pay')) action = 'TRANSFER';

    const amountMatch = text.match(/(?:\$|MLY\s*|Standing\s*)?(\d+(?:\.\d+)?)/i);
    const amount = amountMatch ? Number(amountMatch[1]) : 0;
    const asset = /standing/i.test(text) ? 'STANDING' : 'MLY';
    const toMatch = text.match(/(?:to|for)\s+([A-Za-z0-9_\-\s]+)(?:,|$)/i);
    const target = toMatch ? toMatch[1].trim() : 'Circle Treasury';

    const violations = [];
    if(amount <= 0 || isNaN(amount)) violations.push('invalid_amount');
    if((lower.includes('deprive') || lower.includes('deprivation')) && !lower.includes('no deprivation')) violations.push('violates_no_deprivation');

    const ast = {
      id: id('ast'),
      userId: ctx.user.id,
      rawText: text,
      action,
      amount,
      asset,
      target,
      charterCompliant: violations.length === 0,
      violations,
      reviewed: false,
      signature: null,
      createdAt: now()
    };

    ctx.d.formulas = ctx.d.formulas || [];
    ctx.d.formulas.push(ast);
    save(ctx.d);
    return json(res, 200, { ast });
  }
  if(pathname === '/api/formulas/approve' && req.method === 'POST'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    const b = await body(req);
    ctx.d.formulas = ctx.d.formulas || [];
    const ast = ctx.d.formulas.find(f => f.id === b.astId && f.userId === ctx.user.id);
    if(!ast) return notFound(res);
    if(!ast.charterCompliant) return bad(res, 'Cannot approve non-compliant formula', 400);

    const payload = `${ast.id}:${ast.action}:${ast.amount}:${ast.asset}:${ast.target}:${ctx.user.id}`;
    const signature = crypto.createHmac('sha256', ctx.user.salt || 'default_salt').update(payload).digest('hex');
    ast.reviewed = true;
    ast.signature = signature;
    ast.approvedAt = now();

    ctx.d.ledger = ctx.d.ledger || [];
    const tx = {
      id: id('tx'),
      astId: ast.id,
      userId: ctx.user.id,
      action: ast.action,
      amount: ast.amount,
      asset: ast.asset,
      target: ast.target,
      signature,
      timestamp: now()
    };
    ctx.d.ledger.unshift(tx);
    audit(ctx.d, ctx.user.id, 'formula.approved', { txId: tx.id });
    save(ctx.d);

    broadcastSSE('ledger_update', { userId: ctx.user.id, tx });
    return json(res, 200, { ast, tx });
  }
  if(pathname === '/api/ledger' && req.method === 'GET'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    ctx.d.ledger = ctx.d.ledger || [];
    const userLedger = ctx.d.ledger.filter(tx => tx.userId === ctx.user.id);
    let balanceMLY = 500;
    let standing = 50;
    for(const tx of userLedger){
      if(tx.asset === 'MLY' && (tx.action === 'ALLOCATE' || tx.action === 'TRANSFER')){
        balanceMLY -= tx.amount;
      } else if(tx.asset === 'STANDING' && (tx.action === 'ALLOCATE' || tx.action === 'TRANSFER')){
        standing -= tx.amount;
      }
    }
    return json(res, 200, { balanceMLY, standing, ledger: userLedger });
  }
  if(pathname === '/api/circles' && req.method === 'GET'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    ctx.d.circles = ctx.d.circles || [];
    return json(res, 200, { circles: ctx.d.circles });
  }
  if(pathname === '/api/circles/match' && req.method === 'POST'){
    const ctx = requireAuth(req,res,['admin','organizer']); if(!ctx) return;
    ctx.d.circles = ctx.d.circles || [];
    const citizens = ctx.d.users.filter(u => u.role === 'citizen');
    let matchCount = 0;
    const unassigned = citizens.filter(u => !u.profile?.assignedCircle);
    const circleSize = 7;
    for(let i=0; i < unassigned.length; i += circleSize){
      const group = unassigned.slice(i, i + circleSize);
      if(group.length >= 1){
        const circleName = `Circle_${group[0].profile?.location || 'Founding'}_${ctx.d.circles.length + 1}`;
        const circle = {
          id: id('circle'),
          name: circleName,
          members: group.map(u => u.id),
          focus: group[0].profile?.focus || 'Governance',
          createdAt: now()
        };
        ctx.d.circles.push(circle);
        for(const member of group){
          member.profile = member.profile || {};
          member.profile.assignedCircle = circleName;
          member.profile.circleStatus = 'Active Member';
          member.updatedAt = now();
        }
        matchCount++;
      }
    }
    audit(ctx.d, ctx.user.id, 'circle.match_run', { created: matchCount });
    save(ctx.d);
    broadcastSSE('circle_matched', { circlesCreated: matchCount });
    return json(res, 200, { circlesCreated: matchCount, circles: ctx.d.circles });
  }
  if(pathname === '/api/export/pod' && req.method === 'GET'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    ctx.d.ledger = ctx.d.ledger || [];
    ctx.d.formulas = ctx.d.formulas || [];
    const pod = {
      "@context": "https://milyfe.local/contexts/SolidPod_v1.jsonld",
      type: "CitizenPodExport",
      citizenId: ctx.user.id,
      email: ctx.user.email,
      role: ctx.user.role,
      profile: ctx.user.profile,
      missions: ctx.user.missionState || {},
      agenda: ctx.d.agenda.filter(a => a.userId === ctx.user.id),
      ledger: ctx.d.ledger.filter(tx => tx.userId === ctx.user.id),
      formulas: ctx.d.formulas.filter(f => f.userId === ctx.user.id),
      exportedAt: now(),
      signature: crypto.createHmac('sha256', ctx.user.salt || 'default_salt').update(`${ctx.user.id}:${now()}`).digest('hex')
    };
    return json(res, 200, { pod });
  }

  // Circle Hub MIP 21-Day Supermajority Voting
  if(pathname === '/api/circles/proposals' && req.method === 'POST'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    const b = await body(req);
    const title = String(b.title || '').trim();
    if(!title) return bad(res, 'Proposal title required');
    ctx.d.proposals = ctx.d.proposals || [];
    const proposal = {
      id: id('mip'),
      circleName: b.circleName || ctx.user.profile?.assignedCircle || 'Founding Circle',
      title: title.slice(0, 160),
      description: String(b.description || '').slice(0, 2000),
      createdBy: ctx.user.id,
      creatorName: ctx.user.profile?.name || ctx.user.email,
      votingEndsAt: new Date(Date.now() + 21 * 864e5).toISOString(),
      quorumRequired: 7,
      supermajorityRequired: 0.67,
      status: 'ACTIVE',
      votes: {},
      createdAt: now()
    };
    ctx.d.proposals.unshift(proposal);
    audit(ctx.d, ctx.user.id, 'mip.created', { mipId: proposal.id });
    save(ctx.d);
    broadcastSSE('mip_created', { proposal });
    return json(res, 201, { proposal });
  }

  if(pathname === '/api/circles/proposals/vote' && req.method === 'POST'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    const b = await body(req);
    ctx.d.proposals = ctx.d.proposals || [];
    const mip = ctx.d.proposals.find(p => p.id === b.proposalId);
    if(!mip) return notFound(res);
    const voteChoice = String(b.vote || 'YES').toUpperCase();
    if(!['YES', 'NO', 'ABSTAIN'].includes(voteChoice)) return bad(res, 'Invalid vote choice');

    const payload = `${mip.id}:${voteChoice}:${ctx.user.id}`;
    const signature = crypto.createHmac('sha256', ctx.user.salt || 'default_salt').update(payload).digest('hex');
    mip.votes[ctx.user.id] = {
      choice: voteChoice,
      voterName: ctx.user.profile?.name || ctx.user.email,
      signature,
      votedAt: now()
    };

    const allVotes = Object.values(mip.votes);
    const yesCount = allVotes.filter(v => v.choice === 'YES').length;
    const totalCount = allVotes.length;
    const supermajorityPct = totalCount > 0 ? yesCount / totalCount : 0;
    if(totalCount >= (mip.quorumRequired || 7) && supermajorityPct >= 0.67){
      mip.status = 'PASSED';
    } else if(totalCount >= (mip.quorumRequired || 7) && supermajorityPct < 0.67){
      mip.status = 'ACTIVE';
    }

    audit(ctx.d, ctx.user.id, 'mip.voted', { mipId: mip.id, choice: voteChoice });
    save(ctx.d);
    broadcastSSE('mip_voted', { proposalId: mip.id, yesCount, totalCount, status: mip.status });
    return json(res, 200, { proposal: mip, supermajorityPct });
  }

  if(pathname === '/api/circles/proposals' && req.method === 'GET'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    ctx.d.proposals = ctx.d.proposals || [];
    return json(res, 200, { proposals: ctx.d.proposals });
  }

  // SLM Ribosome Local AI Co-Pilot Assistant
  if(pathname === '/api/slm/assist' && req.method === 'POST'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    const b = await body(req);
    const action = b.action || 'explain_rules';
    const prompt = String(b.prompt || '').trim();

    if(action === 'draft_formula'){
      let act = 'ALLOCATE';
      const lower = prompt.toLowerCase();
      if(lower.includes('save')) act = 'SAVE';
      else if(lower.includes('transfer')) act = 'TRANSFER';
      const amtMatch = prompt.match(/(\d+(?:\.\d+)?)/);
      const amount = amtMatch ? Number(amtMatch[1]) : 100;
      const asset = /standing/i.test(prompt) ? 'STANDING' : 'MLY';
      const ast = {
        id: id('ast_slm'),
        userId: ctx.user.id,
        rawText: prompt,
        action: act,
        amount,
        asset,
        target: 'Circle Community Priority',
        charterCompliant: amount > 0,
        violations: amount <= 0 ? ['invalid_amount'] : [],
        reviewed: false,
        signature: null,
        createdAt: now()
      };
      return json(res, 200, {
        reply: `SLM Ribosome drafted an AST for ${amount} ${asset} (${act}). Verify math before signing.`,
        ast
      });
    }

    if(action === 'summarize_agenda'){
      const userAgenda = ctx.d.agenda.filter(a => a.userId === ctx.user.id);
      const items = userAgenda.map(a => `${a.priority}: ${a.text}`).join('; ');
      return json(res, 200, {
        reply: userAgenda.length ? `Your Values Agenda has ${userAgenda.length} priorities: ${items}. Ready for Circle assembly review.` : `Your Values Agenda is currently empty. Add a community need first.`
      });
    }

    if(action === 'miclass'){
      return json(res, 200, {
        reply: `MiClass (U.S. Constitution Bridge): 1. Ownership -> 4th & 5th Amendments (Protection against seizure). 2. Voice/Consent -> 1st Amendment (Freedom of speech & assembly). 3. Sovereignty -> 9th & 10th Amendments (Powers retained by people). 4. Transparent Inspection -> Art. I, Sec. 9 (Public statement of expenditures). 5. Dignity/Recycling -> 8th Amendment & Public Trust Doctrine.`
      });
    }

    if(action === 'mijourney'){
      return json(res, 200, {
        reply: `MiJourney (11-Stage Sovereign Journey Map): You are on Step 5 (Circle Quorum & Assembly). Next Action: RSVP to your first Circle assembly or sponsor a local MIP proposal to advance toward Stewardship (Step 8).`
      });
    }

    if(action === 'midiscovery'){
      return json(res, 200, {
        reply: `MiDiscovery (Academia R&D & Formal Proof): All Word-to-Math formulas are checked against Lean 4 formal mathematical proofs before execution to guarantee zero deprivation and strict Charter compliance.`
      });
    }

    if(action === 'mistanding'){
      return json(res, 200, {
        reply: `MiStanding (Reputation & Rewards): Standing is an untradable, soulbound civic reputation token earned through service, MIP voting, and assembly attendance. Current progression: Fibonacci Level 3 (50 Standing).`
      });
    }

    if(action === 'mistory'){
      return json(res, 200, {
        reply: `MiStory (Collective Chronicle): Weaves your personal civic journal into the Circle Tapestry. Your current exteroception privacy is set to Level 1 (Zero-Knowledge anonymized attestation).`
      });
    }

    if(action === 'chat'){
      const lower = prompt.toLowerCase();
      if(lower.includes('constitution') || lower.includes('law') || lower.includes('class')) {
        return json(res, 200, { reply: `MiClass (U.S. Constitution Bridge): 1. Ownership -> 4th/5th Amendments. 2. Voice -> 1st Amendment. 3. Sovereignty -> 9th/10th Amendments. 4. Transparent Inspection -> Art. I Sec. 9. 5. Dignity -> 8th Amendment.` });
      }
      if(lower.includes('journey') || lower.includes('step') || lower.includes('map')) {
        return json(res, 200, { reply: `MiJourney (11-Stage Sovereign Journey Map): You are on Step 5 (Circle Quorum & Assembly). Complete your RSVP and first MIP vote to unlock Step 8 (Stewardship).` });
      }
      if(lower.includes('research') || lower.includes('proof') || lower.includes('discovery') || lower.includes('academia')) {
        return json(res, 200, { reply: `MiDiscovery (Academia R&D): Lean 4 automated theorem provers formally verify formula ASTs before any $MLY is moved on the Sovereign Treasury ledger.` });
      }
      if(lower.includes('standing') || lower.includes('reputation') || lower.includes('level') || lower.includes('reward')) {
        return json(res, 200, { reply: `MiStanding: Non-extractive soulbound reputation. Earning Level 5 (80 Standing) unlocks proposal sponsorship and mentorship privileges.` });
      }
      if(lower.includes('story') || lower.includes('chronicle') || lower.includes('journal')) {
        return json(res, 200, { reply: `MiStory: Your personal interoception journal stays encrypted in your Vault. Collective achievements are shared with Zero-Knowledge (ZK) attribution.` });
      }
      return json(res, 200, {
        reply: `SLM Ribosome Co-Pilot [Tab: ${b.tab || 'General'}]: I am your on-device civic assistant. Ask me about MiClass, MiJourney, MiDiscovery, MiStanding, MiStory, or how to draft a Word-to-Math formula!`
      });
    }

    return json(res, 200, {
      reply: `The 5 Charter principles are: 1. Value/Ownership, 2. Voice/Consent, 3. Action/Sovereignty (No Deprivation), 4. Transparent Inspection, 5. Dignity/Recycling.`
    });
  }

  // Sovereign Key Management & Spore Seed Backup
  if(pathname === '/api/auth/spore-seed' && req.method === 'POST'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    const seedWords = ["sovereign", "circle", "citizen", "vault", "chiasm", "matrix", "mlyfe", "charter", "token", "ledger", "spore", "twin"];
    const phrase = seedWords.join(' ');
    const did = `did:milyfe:${crypto.createHash('sha256').update(ctx.user.id + phrase).digest('hex').slice(0,24)}`;
    ctx.user.did = did;
    ctx.user.sporeSeedBackedUp = true;
    save(ctx.d);
    return json(res, 200, { did, sporeSeed: phrase });
  }

  if(pathname === '/api/auth/webauthn-challenge' && req.method === 'POST'){
    const challenge = crypto.randomBytes(32).toString('hex');
    return json(res, 200, { challenge, rp: { name: 'MiLyfe Platform' } });
  }

  if(pathname === '/api/auth/webauthn-verify' && req.method === 'POST'){
    const ctx = requireAuth(req,res); if(!ctx) return;
    ctx.user.webauthnEnabled = true;
    save(ctx.d);
    return json(res, 200, { verified: true, webauthnEnabled: true });
  }

  // Organizer Command Center Diagnostics & Solvency Alerts
  if(pathname === '/api/admin/diagnostics' && req.method === 'GET'){
    const ctx = requireAuth(req,res,['admin','organizer']); if(!ctx) return;
    const citizens = ctx.d.users;
    const clusters = {};
    for(const u of citizens){
      const loc = u.profile?.location || 'Unspecified';
      clusters[loc] = (clusters[loc] || 0) + 1;
    }

    ctx.d.circles = ctx.d.circles || [];
    const solitudeAlerts = ctx.d.circles.filter(c => !c.members || c.members.length < 7).map(c => ({
      circleId: c.id,
      name: c.name,
      memberCount: c.members?.length || 0,
      alert: 'Solitude Alert: Circle is under founding quorum (< 7 members)'
    }));

    const solvencyAlerts = [];
    const totalMLY = ctx.d.ledger.filter(tx => tx.asset === 'MLY').reduce((acc, tx) => acc + tx.amount, 0);

    return json(res, 200, {
      clusters,
      solitudeAlerts,
      solvencyAlerts,
      metrics: {
        totalCitizens: citizens.length,
        totalCircles: ctx.d.circles.length,
        totalProposals: (ctx.d.proposals || []).length,
        totalLedgerTx: ctx.d.ledger.length,
        totalMLYVolume: totalMLY
      }
    });
  }

  // Organizer Complete Offline Spore Snapshot Backup & Instant Restore
  if(pathname === '/api/admin/spore-backup' && req.method === 'GET'){
    const ctx = requireAuth(req,res,['admin','organizer']); if(!ctx) return;
    audit(ctx.d, ctx.user.id, 'spore_archive.exported');
    save(ctx.d);
    const payload = JSON.stringify(ctx.d);
    const archiveHash = crypto.createHash('sha256').update(payload).digest('hex');
    const sporeArchive = {
      "@context": "https://milyfe.fun/contexts/MiLyfeSporeArchive_v1.jsonld",
      type: "MiLyfeSporeArchive_v1",
      exportedBy: ctx.user.id,
      exportedAt: now(),
      archiveHash,
      signature: crypto.createHmac('sha256', ctx.user.salt || 'default_salt').update(archiveHash).digest('hex'),
      data: ctx.d
    };
    return json(res, 200, { sporeArchive });
  }

  if(pathname === '/api/admin/spore-restore' && req.method === 'POST'){
    const ctx = requireAuth(req,res,['admin']); if(!ctx) return;
    const b = await body(req);
    const sporeArchive = b.sporeArchive;
    if(!sporeArchive || !sporeArchive.data || !sporeArchive.archiveHash){
      return bad(res, 'Invalid MiLyfeSporeArchive_v1 payload');
    }
    const computedHash = crypto.createHash('sha256').update(JSON.stringify(sporeArchive.data)).digest('hex');
    if(computedHash !== sporeArchive.archiveHash){
      return bad(res, 'Spore Archive SHA-256 integrity check failed. Archive may be corrupted or tampered.');
    }
    const restoredData = sporeArchive.data;
    save(restoredData);
    audit(restoredData, ctx.user.id, 'spore_archive.restored', { archiveHash: computedHash });
    save(restoredData);
    broadcastSSE('spore_restored', { restoredAt: now(), archiveHash: computedHash });
    return json(res, 200, { restored: true, archiveHash: computedHash, totalUsers: (restoredData.users||[]).length });
  }

  return notFound(res);
}

const server = http.createServer(async (req, res) => {
  try{
    const u = new URL(req.url, `http://${req.headers.host}`);
    if(u.pathname.startsWith('/api/')) return await api(req, res, u.pathname);
    return serveStatic(req, res, u.pathname);
  }catch(e){ console.error(e); json(res, 500, { error:'Server error' }); }
});
server.listen(PORT, () => console.log(`MiLyfe platform running at http://localhost:${PORT}`));
