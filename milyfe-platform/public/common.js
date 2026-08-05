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
