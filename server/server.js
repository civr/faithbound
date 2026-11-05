'use strict';
/* Faithbound server: serves the game and stores accounts and saves. No dependencies, Node 18+.
   Env: PORT (8080), DATA_DIR (/data), PUBLIC_DIR (./public), ALLOW_SIGNUP (true), SIGNUP_CODE (empty = no code). */
const http = require('http'), fs = require('fs'), fsp = fs.promises, path = require('path'), crypto = require('crypto'), zlib = require('zlib');
const PORT = +process.env.PORT || 8080;
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const PUB = path.resolve(process.env.PUBLIC_DIR || path.join(__dirname, 'public'));
const ALLOW_SIGNUP = (process.env.ALLOW_SIGNUP || 'true').toLowerCase() !== 'false';
const SIGNUP_CODE = process.env.SIGNUP_CODE || '';
const MAX_SAVE = 25 * 1024 * 1024, MAX_SLOTS = 30, SESSION_DAYS = 30;
const USER_RE = /^[a-zA-Z0-9_.-]{3,24}$/, SLOT_RE = /^[a-z0-9-]{1,40}$/;

fs.mkdirSync(path.join(DATA, 'saves'), { recursive: true });
const USERS = path.join(DATA, 'users.json'), SESS = path.join(DATA, 'sessions.json'), SHARES = path.join(DATA, 'shares.json');
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
let users = readJSON(USERS, {}), sessions = readJSON(SESS, {}), shares = readJSON(SHARES, {});
const persistShares = () => writeAtomic(SHARES, JSON.stringify(shares)).catch(console.error);

async function writeAtomic(f, data) { const t = `${f}.${crypto.randomBytes(4).toString('hex')}.tmp`; await fsp.writeFile(t, data); await fsp.rename(t, f); }
let sessTimer = null;
function persistSessions() { clearTimeout(sessTimer); sessTimer = setTimeout(() => writeAtomic(SESS, JSON.stringify(sessions)).catch(console.error), 200); }

const hashPw = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => e ? rej(e) : res(k.toString('hex'))));
const hashTok = t => crypto.createHash('sha256').update(t).digest('hex');
function cookies(req) { const o = {}; (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; }
function sessionUser(req) { const t = cookies(req).fb_session; if (!t) return null; const s = sessions[hashTok(t)]; if (!s || s.exp < Date.now() || !users[s.user]) return null; return s.user; }
const isSecure = req => (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
const setCookie = (req, tok, maxAge) => `fb_session=${tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isSecure(req) ? '; Secure' : ''}`;
const ipOf = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;

const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN' };
function send(res, code, obj, headers) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, SEC, headers || {})); res.end(JSON.stringify(obj)); }
function readBody(req, limit) {
  return new Promise((res, rej) => { let n = 0; const ch = [];
    req.on('data', c => { n += c.length; if (n > limit) { const e = new Error('too large'); e.status = 413; rej(e); req.destroy(); return; } ch.push(c); });
    req.on('end', () => res(Buffer.concat(ch))); req.on('error', rej); });
}
async function readJSONBody(req, limit) { const b = await readBody(req, limit); try { return JSON.parse(b.toString('utf8') || '{}'); } catch { const e = new Error('bad json'); e.status = 400; throw e; } }

/* simple rate limit for sign-in and sign-up: 10 tries per minute per address */
const hits = new Map();
function limited(ip) { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000); a.push(now); hits.set(ip, a); return a.length > 10; }

function startSession(req, res, key) {
  const tok = crypto.randomBytes(32).toString('hex');
  sessions[hashTok(tok)] = { user: key, exp: Date.now() + SESSION_DAYS * 864e5 }; persistSessions();
  send(res, 200, { username: users[key].name }, { 'Set-Cookie': setCookie(req, tok, SESSION_DAYS * 86400) });
}
const userDir = key => path.join(DATA, 'saves', key);

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
    let code; do code = roomCode(); while (rooms.has(code));
    const r = { code, world: cleanName(b.world, 'A world'), players: new Map(), made: Date.now() }; rooms.set(code, r);
    const { pl, tok } = newPlayer(r, cleanName(b.name || sessionUser(req) && users[sessionUser(req)].name, 'Host'));
    return send(res, 200, { room: code, tok, pid: pl.pid, color: pl.color });
  }
  const jm = p.match(/^\/api\/coop\/(join|stream|send|leave)\/([A-Z0-9]{6})$/); if (!jm || !ROOM_RE.test(jm[2])) return false;
  const r = rooms.get(jm[2]); if (!r) return send(res, 404, { error: 'That co-op world is closed or the code is wrong.' });
  const act = jm[1];
  if (act === 'join' && m === 'POST') {
    const b = await readJSONBody(req, 4096); if (r.players.size >= MAX_PLAYERS) return send(res, 409, { error: `This world already has ${MAX_PLAYERS} gods.` });
    const { pl, tok } = newPlayer(r, cleanName(b.name || sessionUser(req) && users[sessionUser(req)].name, 'Guest'));
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
    const b = await readJSONBody(req, MAX_MSG); const t = String(b.t || ''); if (!/^[a-z]{2,12}$/.test(t)) return send(res, 400, { error: 'Bad message.' });
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
    const key = name.toLowerCase(); if (users[key]) return send(res, 409, { error: 'That name is already taken.' });
    const salt = crypto.randomBytes(16).toString('hex');
    users[key] = { name, salt, hash: await hashPw(pw, salt), created: Date.now() };
    await writeAtomic(USERS, JSON.stringify(users));
    return startSession(req, res, key);
  }
  if (p === '/api/login' && m === 'POST') {
    if (limited(ipOf(req))) return send(res, 429, { error: 'Too many attempts. Wait a minute and try again.' });
    const b = await readJSONBody(req, 4096), key = String(b.username || '').trim().toLowerCase(), u = users[key];
    const h = await hashPw(String(b.password || ''), u ? u.salt : '00000000000000000000000000000000');
    if (!u || !crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(u.hash, 'hex'))) return send(res, 401, { error: 'That name or password is not right.' });
    return startSession(req, res, key);
  }
  if (p === '/api/logout' && m === 'POST') {
    const t = cookies(req).fb_session; if (t) { delete sessions[hashTok(t)]; persistSessions(); }
    return send(res, 200, { ok: true }, { 'Set-Cookie': setCookie(req, '', 0) });
  }

  /* a shared world: anyone with the link may read it, nobody can write through it */
  const shm = p.match(/^\/api\/shared\/([a-f0-9]{16,64})$/);
  if (shm && m === 'GET') {
    const s = shares[shm[1]]; if (!s) return send(res, 404, { error: 'That shared world was not found.' });
    try { const data = JSON.parse(await fsp.readFile(path.join(userDir(s.user), s.slot + '.json'), 'utf8')); data.owner = users[s.user] ? users[s.user].name : null;
      return send(res, 200, data); } catch { return send(res, 404, { error: 'That world is gone.' }); }
  }
  const key = sessionUser(req);
  if (!key) return send(res, 401, { error: 'Not signed in.' });
  const shs = p.match(/^\/api\/share\/([a-z0-9-]{1,40})$/);
  if (shs && SLOT_RE.test(shs[1])) {
    const slot = shs[1];
    if (m === 'POST') {
      if (!fs.existsSync(path.join(userDir(key), slot + '.json'))) return send(res, 404, { error: 'Save the world on the server first.' });
      let tok = Object.keys(shares).find(t => shares[t].user === key && shares[t].slot === slot);
      if (!tok) { tok = crypto.randomBytes(16).toString('hex'); shares[tok] = { user: key, slot, created: Date.now() }; await persistShares(); }
      return send(res, 200, { token: tok });
    }
    if (m === 'DELETE') { for (const t of Object.keys(shares)) if (shares[t].user === key && shares[t].slot === slot) delete shares[t]; await persistShares(); return send(res, 200, { ok: true }); }
  }
  if (p === '/api/me' && m === 'GET') return send(res, 200, { username: users[key].name });

  if (p === '/api/saves' && m === 'GET') {
    const dir = userDir(key), list = [];
    for (const f of await fsp.readdir(dir).catch(() => [])) if (f.endsWith('.meta.json')) { const meta = readJSON(path.join(dir, f), null); if (meta) list.push(meta); }
    list.sort((a, b) => b.saved - a.saved); return send(res, 200, list);
  }
  const sm = p.match(/^\/api\/saves\/([a-z0-9-]{1,40})$/);
  if (sm && SLOT_RE.test(sm[1])) {
    const slot = sm[1], dir = userDir(key), f = path.join(dir, slot + '.json'), mf = path.join(dir, slot + '.meta.json');
    if (m === 'GET') {
      try { const data = await fsp.readFile(f); res.writeHead(200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, SEC)); return res.end(data); }
      catch { return send(res, 404, { error: 'That world was not found.' }); }
    }
    if (m === 'PUT') {
      const buf = await readBody(req, MAX_SAVE); let d;
      try { d = JSON.parse(buf.toString('utf8')); } catch { return send(res, 400, { error: 'The save is not valid.' }); }
      await fsp.mkdir(dir, { recursive: true });
      const exists = fs.existsSync(f), count = (await fsp.readdir(dir)).filter(x => x.endsWith('.meta.json')).length;
      if (!exists && count >= MAX_SLOTS) return send(res, 409, { error: `You can keep ${MAX_SLOTS} worlds. Delete one first.` });
      const s = d.summary || {};
      const meta = { slot, name: String(d.worldName || 'Unnamed world').slice(0, 40), year: d.year | 0, era: s.era | 0, nations: s.nations | 0,
        size: d.sizeKey || '', calendar: !!(d.worldOpts && d.worldOpts.calendar), saved: Date.now(), bytes: buf.length };
      await writeAtomic(f, buf); await writeAtomic(mf, JSON.stringify(meta));
      return send(res, 200, meta);
    }
    if (m === 'DELETE') { await fsp.rm(f, { force: true }); await fsp.rm(mf, { force: true }); for (const t of Object.keys(shares)) if (shares[t].user === key && shares[t].slot === slot) delete shares[t]; persistShares(); return send(res, 200, { ok: true }); }
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
  if (!/^\/(index\.html|three\.min\.js|js\/[a-z0-9_-]+\.js|favicon\.(ico|svg|png))$/i.test(p)) return send(res, 404, { error: 'Not found.' });
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

setInterval(() => { const now = Date.now(); let ch = false; for (const k in sessions) if (sessions[k].exp < now) { delete sessions[k]; ch = true; } if (ch) persistSessions(); }, 3600e3).unref();
