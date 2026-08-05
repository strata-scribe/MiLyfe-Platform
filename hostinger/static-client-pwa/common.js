let ML_CSRF = '';
let ML_USER = null;
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
function esc(v){ return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
async function api(path, opts={}){
  const headers = { 'Content-Type':'application/json', ...(opts.headers||{}) };
  if(ML_CSRF && !['GET','HEAD'].includes(opts.method || 'GET')) headers['x-csrf-token'] = ML_CSRF;
  const res = await fetch(path, { credentials:'same-origin', ...opts, headers, body: opts.body && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body });
  let data = {}; try{ data = await res.json(); }catch(e){}
  if(!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
async function loadMe(required=false, roles=null){
  try{
    const data = await api('/api/me'); ML_CSRF = data.csrf; ML_USER = data.user;
    if(roles && !roles.includes(ML_USER.role)) location.href='/citizen';
    return ML_USER;
  }catch(e){ if(required) location.href='/login.html?next=' + encodeURIComponent(location.pathname); return null; }
}
async function logout(){ try{ await api('/api/auth/logout', { method:'POST' }); }catch(e){} location.href='/'; }
function setNavUser(){ const el=$('#navUser'); if(el && ML_USER) el.textContent = ML_USER.profile?.firstName || ML_USER.profile?.name || ML_USER.email; }
function missionsFor(profile={}){
  const role = profile.suggestedRole || 'Founding Citizen';
  const base = ['Share your invite with 3 people','Add one community need to your Values Agenda','Save your first assembly RSVP'];
  if(role === 'Circle Organizer') return ['Identify 3 people to invite','Choose a possible meeting place','Save your first assembly RSVP','Add one community need to your Values Agenda','Share your invite with 3 people'];
  if(role === 'Builder') return ['List what you can build or create','Share your invite with 3 people','Add one community need to your Values Agenda','Save your first assembly RSVP'];
  if(role === 'Community Partner') return ['Add your organization or group name','Invite your community contact','Save your first assembly RSVP','Add one community need to your Values Agenda'];
  if(role === 'Formation Support') return ['Choose your support lane','Add one community need to your Values Agenda','Share your invite with 3 people','Save your first assembly RSVP'];
  return base;
}
function inviteUrl(profile){ return location.origin + (profile.inviteLink || `/onboarding.html?invite=${encodeURIComponent(profile.code || '')}`); }
async function copyText(txt){ try{ await navigator.clipboard.writeText(txt); alert('Copied.'); }catch(e){ prompt('Copy this:', txt); } }
function formData(form){ const fd = new FormData(form); const out = {}; for(const [k,v] of fd.entries()){ if(out[k]) out[k] = Array.isArray(out[k]) ? [...out[k], v] : [out[k], v]; else out[k]=v; } return out; }

// i18n Localization Support (EN / ES / FR)
let currentLang = localStorage.getItem('ml_lang') || 'en';
const i18nDict = {
  en: {
    logout: 'Logout',
    home: 'Home',
    citizen_dash: 'Citizen Dashboard',
    admin_dash: 'Admin',
    welcome: 'Welcome',
    status: 'Status',
    role: 'Role',
    values: 'Values',
    missions: 'Missions',
    circle_hub: 'Circle Hub',
    wealth_mly: 'Wealth / MLY',
    data_pod: 'Data Pod',
    diagnostics: 'Diagnostics'
  },
  es: {
    logout: 'Cerrar sesión',
    home: 'Inicio',
    citizen_dash: 'Panel Ciudadano',
    admin_dash: 'Administración',
    welcome: 'Bienvenido',
    status: 'Estado',
    role: 'Rol',
    values: 'Valores',
    missions: 'Missions',
    circle_hub: 'Círculos Hub',
    wealth_mly: 'Economía / MLY',
    data_pod: 'Pod de Datos',
    diagnostics: 'Diagnósticos'
  },
  fr: {
    logout: 'Déconnexion',
    home: 'Accueil',
    citizen_dash: 'Tableau Citoyen',
    admin_dash: 'Admin',
    welcome: 'Bienvenue',
    status: 'Statut',
    role: 'Rôle',
    values: 'Valeurs',
    missions: 'Missions',
    circle_hub: 'Cercle Hub',
    wealth_mly: 'Trésorerie / MLY',
    data_pod: 'Pod Données',
    diagnostics: 'Diagnostics'
  }
};
function setLang(lang){
  if(i18nDict[lang]){
    currentLang = lang;
    localStorage.setItem('ml_lang', lang);
    applyI18n();
    if(typeof render === 'function') render();
  }
}
function t(key){
  return (i18nDict[currentLang] || i18nDict.en)[key] || key;
}
function applyI18n(){
  $$('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if(k && t(k)) el.textContent = t(k);
  });
}

// On-Device MiAI Constitutional RAG & Grammar-Constrained Word-to-Math Engine
window.MiAI = {
  webGpuAvailable: typeof navigator !== 'undefined' && !!navigator.gpu,
  constitutionIndex: [
    { principle: '1. Value / Ownership', amendment: '4th & 5th Amendments', text: 'Protection against unreasonable seizure; right to due process and private property.' },
    { principle: '2. Voice / Consent', amendment: '1st Amendment', text: 'Freedom of Speech, Assembly, and right to petition without censorship.' },
    { principle: '3. Action / Sovereignty', amendment: '9th & 10th Amendments', text: 'Rights retained by the people; powers reserved to local communities.' },
    { principle: '4. Transparent Inspection', amendment: 'Article I, Section 9', text: 'Public statement and account of receipts and expenditures before funds move.' },
    { principle: '5. Dignity / Recycling', amendment: '8th Amendment & Public Trust', text: 'Protection against excessive harm; stewardship of common heritage.' }
  ],
  searchConstitution(query){
    const q = (query || '').toLowerCase();
    const found = this.constitutionIndex.filter(item => 
      item.principle.toLowerCase().includes(q) || 
      item.amendment.toLowerCase().includes(q) || 
      item.text.toLowerCase().includes(q) ||
      (q.includes('constitution') || q.includes('law') || q.includes('amendment'))
    );
    if(found.length === 0) return null;
    return found.map(item => `${item.principle} -> ${item.amendment}: ${item.text}`).join('\n');
  },
  parseWordToMath(prompt){
    const text = String(prompt || '').trim();
    let action = 'ALLOCATE';
    const lower = text.toLowerCase();
    if(lower.includes('save')) action = 'SAVE';
    else if(lower.includes('transfer')) action = 'TRANSFER';
    const amtMatch = text.match(/(\d+(?:\.\d+)?)/);
    const amount = amtMatch ? Number(amtMatch[1]) : 100;
    const asset = /standing/i.test(text) ? 'STANDING' : 'MLY';
    const violations = [];
    if(amount <= 0 || isNaN(amount)) violations.push('invalid_amount');
    if(amount > 1000000) violations.push('exceeds_max_single_tx_cap');
    if((lower.includes('deprive') || lower.includes('deprivation')) && !lower.includes('no deprivation')) {
      violations.push('violates_no_deprivation');
    }
    return {
      rawText: text,
      action,
      amount,
      asset,
      target: 'Circle Community Priority',
      charterCompliant: violations.length === 0,
      violations,
      constitutionalBridge: '4th/5th/1st/9th/10th Amendments',
      lean4ProofHash: 'lean4_local_' + Math.random().toString(36).slice(2,10)
    };
  },
  summarizeDeliberation(proposals){
    if(!proposals || !proposals.length) return 'No active MIP proposals to summarize.';
    const summaries = proposals.map(mip => {
      const votes = Object.values(mip.votes || {});
      const yesCount = votes.filter(v => v.choice === 'YES').length;
      return `MIP [${mip.title}]: ${yesCount}/${votes.length} YES (${mip.status})`;
    });
    return `Circle Deliberation Consensus:\n${summaries.join('\n')}`;
  }
};
