'use strict';
/* Faithbound server: serves the game and stores accounts and saves. No dependencies, Node 18+.
   Env: PORT (8080), DATA_DIR (/data), PUBLIC_DIR (./public), ALLOW_SIGNUP (true), SIGNUP_CODE (empty = no code). */
const http = require('http'), fs = require('fs'), fsp = fs.promises, path = require('path'), crypto = require('crypto'), zlib = require('zlib');
const PORT = +process.env.PORT || 8080;
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const PUB = path.resolve(process.env.PUBLIC_DIR || path.join(__dirname, 'public'));
const ALLOW_SIGNUP = (process.env.ALLOW_SIGNUP || 'true').toLowerCase() !== 'false';
const SIGNUP_CODE = process.env.SIGNUP_CODE || '';
const MAX_SAVE = 25 * 1024 * 1024, MAX_SLOTS = 30, SESSION_DAYS = 30, QUOTA = (+process.env.QUOTA_MB || 200) * 1024 * 1024;
const USER_RE = /^[a-zA-Z0-9_.-]{3,24}$/, SLOT_RE = /^[a-z0-9-]{1,40}$/;

fs.mkdirSync(DATA, { recursive: true });
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

/* ---------- the database: one SQLite file (Node's built-in sqlite, no packages) holding accounts, sessions, worlds and shared links.
   Worlds are stored gzip-compressed. Each save of a world raises its revision, so two devices cannot silently overwrite each other. ---------- */
{ const ew = process.emitWarning; process.emitWarning = function (w, ...a) { if (String(w).includes('SQLite')) return; return ew.call(this, w, ...a); }; }
const { DatabaseSync } = require('node:sqlite');
const DB_FILE = path.join(DATA, 'faithbound.db'), db = new DatabaseSync(DB_FILE);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS users (key TEXT PRIMARY KEY, name TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (h TEXT PRIMARY KEY, user TEXT NOT NULL, exp INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS worlds (user TEXT NOT NULL, slot TEXT NOT NULL, meta TEXT NOT NULL, data BLOB NOT NULL, bytes INTEGER NOT NULL, saved INTEGER NOT NULL, rev INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (user, slot));
  CREATE TABLE IF NOT EXISTS shares (tok TEXT PRIMARY KEY, user TEXT NOT NULL, slot TEXT NOT NULL, created INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS shares_user ON shares (user, slot);`);
const Q = {
  user: db.prepare('SELECT * FROM users WHERE key = ?'), addUser: db.prepare('INSERT INTO users (key, name, salt, hash, created) VALUES (?, ?, ?, ?, ?)'),
  sess: db.prepare('SELECT * FROM sessions WHERE h = ?'), addSess: db.prepare('INSERT OR REPLACE INTO sessions (h, user, exp) VALUES (?, ?, ?)'), delSess: db.prepare('DELETE FROM sessions WHERE h = ?'),
  oldSess: db.prepare('DELETE FROM sessions WHERE exp < ?'),
  list: db.prepare('SELECT meta, rev FROM worlds WHERE user = ? ORDER BY saved DESC'), world: db.prepare('SELECT data, rev FROM worlds WHERE user = ? AND slot = ?'),
  head: db.prepare('SELECT rev, meta FROM worlds WHERE user = ? AND slot = ?'), count: db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(bytes), 0) AS b FROM worlds WHERE user = ? AND slot != ?'),
  put: db.prepare(`INSERT INTO worlds (user, slot, meta, data, bytes, saved, rev) VALUES (?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT (user, slot) DO UPDATE SET meta = excluded.meta, data = excluded.data, bytes = excluded.bytes, saved = excluded.saved, rev = worlds.rev + 1`),
  delWorld: db.prepare('DELETE FROM worlds WHERE user = ? AND slot = ?'),
  share: db.prepare('SELECT * FROM shares WHERE tok = ?'), shareOf: db.prepare('SELECT tok FROM shares WHERE user = ? AND slot = ?'),
  addShare: db.prepare('INSERT INTO shares (tok, user, slot, created) VALUES (?, ?, ?, ?)'), delShares: db.prepare('DELETE FROM shares WHERE user = ? AND slot = ?') };
const tx = fn => { db.exec('BEGIN'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };
/* first start after the update: the old files (users.json, sessions.json, shares.json, saves/<user>/<world>.json) move into the database.
   The old files are kept, renamed with .migrated, as a backup. */
(function migrate() {
  const UF = path.join(DATA, 'users.json'); if (!fs.existsSync(UF)) return;
  const users = readJSON(UF, {}), sess = readJSON(path.join(DATA, 'sessions.json'), {}), shares = readJSON(path.join(DATA, 'shares.json'), {}); let nw = 0;
  tx(() => {
    for (const k of Object.keys(users)) { const u = users[k]; if (u && u.salt && u.hash && !Q.user.get(k)) Q.addUser.run(k, String(u.name || k), u.salt, u.hash, u.created || Date.now()); }
    for (const h of Object.keys(sess)) { const x = sess[h]; if (x && x.exp > Date.now() && x.user) Q.addSess.run(h, x.user, x.exp); }
    for (const t of Object.keys(shares)) { const x = shares[t]; if (x && x.user && x.slot && !Q.share.get(t)) Q.addShare.run(t, x.user, x.slot, x.created || Date.now()); }
    const SD = path.join(DATA, 'saves');
    for (const u of fs.existsSync(SD) ? fs.readdirSync(SD) : []) { const dir = path.join(SD, u); if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir)) { if (!f.endsWith('.json') || f.endsWith('.meta.json')) continue; const slot = f.slice(0, -5); if (!SLOT_RE.test(slot)) continue;
        const raw = fs.readFileSync(path.join(dir, f)), meta = readJSON(path.join(dir, slot + '.meta.json'), null) || { slot, name: 'A world', year: 0, era: 0, nations: 0, saved: Date.now() };
        const gz = zlib.gzipSync(raw); meta.bytes = raw.length; meta.stored = gz.length; Q.put.run(u, slot, JSON.stringify(meta), gz, gz.length, meta.saved || Date.now()); nw++; } } });
  for (const f of ['users.json', 'sessions.json', 'shares.json', 'saves']) { const a = path.join(DATA, f); if (fs.existsSync(a)) fs.renameSync(a, a + '.migrated'); }
  console.log(`Moved ${Object.keys(users).length} accounts and ${nw} worlds into the database (${DB_FILE}). The old files are kept with .migrated at the end.`);
})();

const hashPw = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => e ? rej(e) : res(k.toString('hex'))));
const hashTok = t => crypto.createHash('sha256').update(t).digest('hex');
function cookies(req) { const o = {}; (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; }
function sessionUser(req) { const t = cookies(req).fb_session; if (!t) return null; const s = Q.sess.get(hashTok(t)); if (!s || s.exp < Date.now() || !Q.user.get(s.user)) return null; return s.user; }
const isSecure = req => (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
const setCookie = (req, tok, maxAge) => `fb_session=${tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isSecure(req) ? '; Secure' : ''}`;
/* behind Nginx Proxy Manager the real address is the last one in X-Forwarded-For (the proxy appends it); anything before it was written by the
   visitor and can be faked. TRUST_PROXY=0 ignores the header entirely (when the server faces the internet directly). */
const TRUST_PROXY = (process.env.TRUST_PROXY || '1') !== '0';
const ipOf = req => { const xf = TRUST_PROXY ? (req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean) : []; return xf.length ? xf[xf.length - 1] : req.socket.remoteAddress; };

const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  /* the page may only load its own files and its fonts, and only talk to this server */
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'" };
function send(res, code, obj, headers) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, SEC, headers || {})); res.end(JSON.stringify(obj)); }
function readBody(req, limit) {
  return new Promise((res, rej) => { let n = 0; const ch = [];
    req.on('data', c => { n += c.length; if (n > limit) { const e = new Error('too large'); e.status = 413; rej(e); req.destroy(); return; } ch.push(c); });
    req.on('end', () => res(Buffer.concat(ch))); req.on('error', rej); });
}
async function readJSONBody(req, limit) { const b = await readBody(req, limit); try { return JSON.parse(b.toString('utf8') || '{}'); } catch { const e = new Error('bad json'); e.status = 400; throw e; } }

/* simple rate limit for sign-in and sign-up: 10 tries per minute per address */
const hits = new Map();
function limited(key, max, win) { max = max || 10; win = win || 60000; const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < win); a.push(now); hits.set(key, a); return a.length > max; }
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.length || now - a[a.length - 1] > 3600e3) hits.delete(k); }, 300e3).unref();
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

function startSession(req, res, key) {
  const tok = crypto.randomBytes(32).toString('hex');
  Q.addSess.run(hashTok(tok), key, Date.now() + SESSION_DAYS * 864e5);
  send(res, 200, { username: Q.user.get(key).name }, { 'Set-Cookie': setCookie(req, tok, SESSION_DAYS * 86400) });
}
const nameOf = key => { const u = key && Q.user.get(key); return u ? u.name : null; };
/* a save arrives gzip-compressed from the browser (or plain from older pages); it is checked, and stored compressed */
async function readSave(req) {
  const raw = await readBody(req, MAX_SAVE); let gz, txt;
  if (/gzip/i.test(req.headers['content-encoding'] || '')) { gz = raw; try { txt = zlib.gunzipSync(raw, { maxOutputLength: MAX_SAVE * 8 }).toString('utf8'); } catch { const e = new Error('bad gzip'); e.status = 400; throw e; } }
  else { txt = raw.toString('utf8'); gz = zlib.gzipSync(raw); }
  let d; try { d = JSON.parse(txt); } catch { const e = new Error('bad json'); e.status = 400; throw e; }
  return { d, gz, size: txt.length };
}
/* worlds go out compressed when the browser accepts it (it always does) */
function sendWorld(req, res, gz, extra) {
  const h = Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, SEC, extra || {});
  if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) { res.writeHead(200, Object.assign(h, { 'Content-Encoding': 'gzip', 'Content-Length': gz.length })); return res.end(gz); }
  const b = zlib.gunzipSync(gz); res.writeHead(200, Object.assign(h, { 'Content-Length': b.length })); res.end(b);
}

/* ---------- co-op: one host runs the world, guests watch it live and send their miracles to the host.
   Rooms live in memory only. Messages go out over Server-Sent Events, so no extra packages are needed. ---------- */
const rooms = new Map(), ROOM_RE = /^[A-HJ-NP-Z2-9]{6}$/, MAX_PLAYERS = 8, MAX_MSG = 16 * 1024 * 1024;
const PCOL = ['#e0b44a', '#5fb0e8', '#e2665a', '#7bc47f', '#b98be6', '#f08fc0', '#58c7c0', '#e8925a'];
const roomCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (const b of crypto.randomBytes(6)) s += a[b % a.length]; return s; };
const cleanName = (v, d) => String(v || d).replace(/[<>&"'`]/g, '').trim().slice(0, 20) || d;
function sse(pl, msg) { if (!pl.res) return; try { pl.res.write('data: ' + msg + '\n\n'); } catch {} }
function roomPlayers(r) { return [...r.players.values()].map(q => ({ pid: q.pid, name: q.name, color: q.color, on: !!q.res, host: q.pid === 0 })); }
function roomCast(r, obj, except) { const msg = JSON.stringify(obj); for (const q of r.players.values()) if (q.pid !== except) sse(q, msg); }
function playerByTok(r, tok) { if (!tok) return null; const h = hashTok(tok); for (const q of r.players.values()) if (q.th === h) return q; return null; }
function newPlayer(r, name) { const tok = crypto.randomBytes(18).toString('hex'); let pid = 0; while ([...r.players.values()].some(q => q.pid === pid)) pid++;
  const pl = { pid, name, color: PCOL[pid % PCOL.length], th: hashTok(tok), res: null, seen: Date.now() }; r.players.set(pid, pl); return { pl, tok }; }
function closeRoom(code, why) { const r = rooms.get(code); if (!r) return; roomCast(r, { t: 'end', why }); for (const q of r.players.values()) if (q.res) try { q.res.end(); } catch {} rooms.delete(code); }
setInterval(() => { const now = Date.now();
  for (const [code, r] of rooms) { const host = r.players.get(0);
    if (!host || (!host.res && now - host.seen > 120e3)) { closeRoom(code, 'The host left the world.'); continue; }
    for (const q of r.players.values()) { if (q.res) sse(q, '{"t":"ping"}'); else if (q.pid && now - q.seen > 300e3) { r.players.delete(q.pid); roomCast(r, { t: 'players', list: roomPlayers(r) }); } } } }, 15e3).unref();
async function coop(req, res, url, m, p) {
  if (p === '/api/coop/host' && m === 'POST') {
    const b = await readJSONBody(req, 4096); if (rooms.size >= 60) return send(res, 503, { error: 'The server has too many co-op worlds open. Try again later.' });
    const ip = ipOf(req); if ([...rooms.values()].filter(q => q.ip === ip).length >= 3) return send(res, 429, { error: 'You already have three co-op worlds open.' });
    if (limited('host:' + ip, 10, 600e3)) return send(res, 429, { error: 'Too many co-op worlds opened. Wait a few minutes.' });
    let code; do code = roomCode(); while (rooms.has(code));
    const r = { code, ip, world: cleanName(b.world, 'A world'), players: new Map(), made: Date.now() }; rooms.set(code, r);
    const { pl, tok } = newPlayer(r, cleanName(b.name || nameOf(sessionUser(req)), 'Host'));
    return send(res, 200, { room: code, tok, pid: pl.pid, color: pl.color });
  }
  const jm = p.match(/^\/api\/coop\/(join|stream|send|leave)\/([A-Z0-9]{6})$/); if (!jm || !ROOM_RE.test(jm[2])) return false;
  const r = rooms.get(jm[2]); if (!r) return send(res, 404, { error: 'That co-op world is closed or the code is wrong.' });
  const act = jm[1];
  if (act === 'join' && m === 'POST') {
    if (limited('join:' + ipOf(req), 20, 60000)) return send(res, 429, { error: 'Too many tries. Wait a minute.' });
    const b = await readJSONBody(req, 4096); if (r.players.size >= MAX_PLAYERS) return send(res, 409, { error: `This world already has ${MAX_PLAYERS} gods.` });
    const { pl, tok } = newPlayer(r, cleanName(b.name || nameOf(sessionUser(req)), 'Guest'));
    roomCast(r, { t: 'join', pid: pl.pid, name: pl.name, color: pl.color }, pl.pid); roomCast(r, { t: 'players', list: roomPlayers(r) });
    return send(res, 200, { room: r.code, tok, pid: pl.pid, color: pl.color, world: r.world, host: (r.players.get(0) || {}).name });
  }
  const pl = playerByTok(r, url.searchParams.get('tok')); if (!pl) return send(res, 403, { error: 'You are not part of this world.' });
  pl.seen = Date.now();
  if (act === 'stream' && m === 'GET') {
    if (pl.res) try { pl.res.end(); } catch {}
    res.writeHead(200, Object.assign({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' }, SEC));
    res.write('retry: 2000\n\n'); pl.res = res; req.socket.setTimeout(0);
    sse(pl, JSON.stringify({ t: 'hello', pid: pl.pid, list: roomPlayers(r), world: r.world }));
    roomCast(r, { t: 'players', list: roomPlayers(r) }, pl.pid);
    req.on('close', () => { if (pl.res === res) { pl.res = null; pl.seen = Date.now(); roomCast(r, { t: 'players', list: roomPlayers(r) }); } });
    return true;
  }
  if (act === 'send' && m === 'POST') {
    const b = await readJSONBody(req, pl.pid === 0 ? MAX_MSG : 256 * 1024); const t = String(b.t || '');/* only the host sends the world; guests send miracles, cursors and chat */ if (!/^[a-z]{2,12}$/.test(t)) return send(res, 400, { error: 'Bad message.' });
    const out = { t, from: pl.pid, d: b.d };
    if (pl.pid === 0) { if (b.to != null) { const q = r.players.get(+b.to); if (q) sse(q, JSON.stringify(out)); } else roomCast(r, out, 0); }
    else if (t === 'cur' || t === 'chat') roomCast(r, out, pl.pid);
    else { const h = r.players.get(0); if (h) sse(h, JSON.stringify(out)); }
    return send(res, 200, { ok: true });
  }
  if (act === 'leave' && m === 'POST') {
    if (pl.pid === 0) { closeRoom(r.code, 'The host closed the world.'); return send(res, 200, { ok: true }); }
    if (pl.res) try { pl.res.end(); } catch {} r.players.delete(pl.pid); roomCast(r, { t: 'leave', pid: pl.pid, name: pl.name }); roomCast(r, { t: 'players', list: roomPlayers(r) });
    return send(res, 200, { ok: true });
  }
  return send(res, 405, { error: 'Method not allowed.' });
}

async function api(req, res, url) {
  const m = req.method, p = url.pathname;
  /* JSON only for writes: blocks cross-site form posts */
  if (m !== 'GET' && m !== 'HEAD' && !(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'Send JSON.' });
  if (p === '/api/health') return send(res, 200, { ok: true });
  if (p.startsWith('/api/coop/')) { const done = await coop(req, res, url, m, p); if (done !== false) return; }
  if (p === '/api/config' && m === 'GET') return send(res, 200, { signup: ALLOW_SIGNUP, code: !!SIGNUP_CODE });

  if (p === '/api/register' && m === 'POST') {
    if (!ALLOW_SIGNUP) return send(res, 403, { error: 'New accounts are switched off on this server.' });
    if (limited(ipOf(req))) return send(res, 429, { error: 'Too many attempts. Wait a minute and try again.' });
    const b = await readJSONBody(req, 4096), name = String(b.username || '').trim(), pw = String(b.password || '');
    if (!USER_RE.test(name)) return send(res, 400, { error: 'Pick a name of 3 to 24 letters, digits, dots, dashes or underscores.' });
    if (pw.length < 8) return send(res, 400, { error: 'Use a password of at least 8 characters.' });
    if (SIGNUP_CODE && String(b.code || '') !== SIGNUP_CODE) return send(res, 403, { error: 'That invite code is not right.' });
    if (limited('signup', 30, 3600e3)) return send(res, 429, { error: 'Too many new accounts right now. Try again later.' });
    const key = name.toLowerCase(); if (Q.user.get(key)) return send(res, 409, { error: 'That name is already taken.' });
    const salt = crypto.randomBytes(16).toString('hex'), hash = await hashPw(pw, salt);
    try { Q.addUser.run(key, name, salt, hash, Date.now()); } catch { return send(res, 409, { error: 'That name is already taken.' }); }
    return startSession(req, res, key);
  }
  if (p === '/api/login' && m === 'POST') {
    if (limited(ipOf(req))) return send(res, 429, { error: 'Too many attempts. Wait a minute and try again.' });
    const b = await readJSONBody(req, 4096), key = String(b.username || '').trim().toLowerCase(), u = Q.user.get(key) || null;
    if (limited('acct:' + key, 20, 15 * 60000)) return send(res, 429, { error: 'Too many attempts for this name. Wait a quarter of an hour.' });
    const h = await hashPw(String(b.password || ''), u ? u.salt : '00000000000000000000000000000000');
    if (!u || !crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(u.hash, 'hex'))) return send(res, 401, { error: 'That name or password is not right.' });
    return startSession(req, res, key);
  }
  if (p === '/api/logout' && m === 'POST') {
    const t = cookies(req).fb_session; if (t) Q.delSess.run(hashTok(t));
    return send(res, 200, { ok: true }, { 'Set-Cookie': setCookie(req, '', 0) });
  }

  /* a shared world: anyone with the link may read it, nobody can write through it */
  const shm = p.match(/^\/api\/shared\/([a-f0-9]{16,64})$/);
  if (shm && m === 'GET') {
    const s = Q.share.get(shm[1]); if (!s) return send(res, 404, { error: 'That shared world was not found.' });
    const w = Q.world.get(s.user, s.slot); if (!w) return send(res, 404, { error: 'That world is gone.' });
    return sendWorld(req, res, Buffer.from(w.data), { 'X-Owner': encodeURIComponent(nameOf(s.user) || '') });
  }
  const key = sessionUser(req);
  if (!key) return send(res, 401, { error: 'Not signed in.' });
  const shs = p.match(/^\/api\/share\/([a-z0-9-]{1,40})$/);
  if (shs && SLOT_RE.test(shs[1])) {
    const slot = shs[1];
    if (m === 'POST') {
      if (!Q.head.get(key, slot)) return send(res, 404, { error: 'Save the world on the server first.' });
      const row = Q.shareOf.get(key, slot); let tok = row && row.tok;
      if (!tok) { tok = crypto.randomBytes(16).toString('hex'); Q.addShare.run(tok, key, slot, Date.now()); }
      return send(res, 200, { token: tok });
    }
    if (m === 'DELETE') { Q.delShares.run(key, slot); return send(res, 200, { ok: true }); }
  }
  if (p === '/api/me' && m === 'GET') return send(res, 200, { username: nameOf(key) });

  if (p === '/api/saves' && m === 'GET') {
    return send(res, 200, Q.list.all(key).map(r => Object.assign(JSON.parse(r.meta), { rev: r.rev })));
  }
  const sm = p.match(/^\/api\/saves\/([a-z0-9-]{1,40})$/);
  if (sm && SLOT_RE.test(sm[1])) {
    const slot = sm[1];
    if (m === 'GET') { const w = Q.world.get(key, slot); if (!w) return send(res, 404, { error: 'That world was not found.' }); return sendWorld(req, res, Buffer.from(w.data), { 'X-Rev': String(w.rev) }); }
    if (m === 'PUT') {
      const { d, gz, size } = await readSave(req), cur = Q.head.get(key, slot);
      /* another device saved this world after this one last loaded or saved it: ask before overwriting */
      const base = +(req.headers['x-base-rev'] || 0);
      if (cur && base && base < cur.rev && req.headers['x-force'] !== '1') return send(res, 409, { error: 'conflict', conflict: true, rev: cur.rev, meta: JSON.parse(cur.meta) });
      const used = Q.count.get(key, slot);
      if (!cur && used.n >= MAX_SLOTS) return send(res, 409, { error: `You can keep ${MAX_SLOTS} worlds. Delete one first.` });
      if (used.b + gz.length > QUOTA) return send(res, 409, { error: 'Your worlds use all the space this server gives you. Delete one first.' });
      const s2 = d.summary || {};
      const meta = { slot, name: String(d.worldName || 'Unnamed world').slice(0, 40), year: d.year | 0, era: s2.era | 0, nations: s2.nations | 0,
        size: d.sizeKey || '', calendar: !!(d.worldOpts && d.worldOpts.calendar), saved: Date.now(), bytes: size, stored: gz.length };
      Q.put.run(key, slot, JSON.stringify(meta), gz, gz.length, meta.saved);
      return send(res, 200, Object.assign(meta, { rev: Q.head.get(key, slot).rev }));
    }
    if (m === 'DELETE') { tx(() => { Q.delWorld.run(key, slot); Q.delShares.run(key, slot); }); return send(res, 200, { ok: true }); }
  }
  return send(res, 404, { error: 'Not found.' });
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const gzCache = new Map();
async function serveStatic(req, res, url) {
  let p; try { p = decodeURIComponent(url.pathname); } catch { return send(res, 400, { error: 'Bad path.' }); }
  if (p === '/') p = '/index.html';
  /* only the game itself is public: never the data folder, the server or config files */
  if (!/^\/(index\.html|three\.min\.js|js\/[a-z0-9_-]+\.js|favicon\.(ico|svg|png)|assets\/(textures|models)\/[a-z0-9_-]+\.(jpg|png|glb))$/i.test(p)) return send(res, 404, { error: 'Not found.' });
  const f = path.normalize(path.join(PUB, p));
  if (!f.startsWith(PUB + path.sep)) return send(res, 404, { error: 'Not found.' });
  let st; try { st = await fsp.stat(f); } catch { return send(res, 404, { error: 'Not found.' }); }
  if (!st.isFile()) return send(res, 404, { error: 'Not found.' });
  const ext = path.extname(f), type = TYPES[ext] || 'application/octet-stream';
  const headers = Object.assign({ 'Content-Type': type, 'Cache-Control': ext === '.html' ? 'no-cache' : ext === '.js' ? 'public, max-age=3600' : 'public, max-age=86400' }, SEC);
  if (/\bgzip\b/.test(req.headers['accept-encoding'] || '') && /html|javascript|css|json|svg|plain/.test(type)) {
    const k = f + ':' + st.mtimeMs; let b = gzCache.get(k); if (!b) { b = zlib.gzipSync(await fsp.readFile(f)); gzCache.set(k, b); }
    res.writeHead(200, Object.assign(headers, { 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding', 'Content-Length': b.length }));
    return res.end(req.method === 'HEAD' ? undefined : b);
  }
  res.writeHead(200, Object.assign(headers, { 'Content-Length': st.size }));
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(f).pipe(res);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
    return await serveStatic(req, res, url);
  } catch (e) {
    if (!res.headersSent) send(res, e.status || 500, { error: e.status === 413 ? 'That save is too large.' : e.status === 400 ? 'The request is not valid.' : 'Something went wrong on the server.' });
    if (!e.status) console.error(e);
  }
}).listen(PORT, () => console.log(`Faithbound on port ${PORT}. Data in ${DATA}. Sign-up ${ALLOW_SIGNUP ? 'open' : 'closed'}${SIGNUP_CODE ? ' with invite code' : ''}.`));

setInterval(() => { try { Q.oldSess.run(Date.now()); } catch (e) { console.error(e); } }, 3600e3).unref();
/* close the database cleanly when the container stops */
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { try { db.close(); } catch {} process.exit(0); });
