// Cloudflare Worker: Telegram admin bot that updates updates.json in GitHub Pages repo

const COPY_STRING_FIELDS = {ageTitle: true, ageText: true, ageButton: true, ctaLabel: true, ctaHint: true, planBTitle: true, planBHint: true, joinTitle: true, botsTitle: true, botsHint: true, updatesTitle: true, legalTitle: true, footer: true};
const COPY_LIST_FIELDS = {taglines: true, joinSteps: true, legalItems: true};
const DEFAULT_COPY = {
  ageTitle: 'Halaman 18+',
  ageText: 'Dengan lanjut, lo nyatakan umur 18+ dan setuju sama aturan halaman ini.',
  ageButton: 'Gue 18+ (Lanjut)',
  taglines: [
    'Pusat Info Resmi (18+)',
    'Kalo channel lagi pindah/kena report, link terbaru SELALU ada di sini.'
  ],
  ctaLabel: 'Masuk Channel (18+)',
  ctaHint: 'Kalo tombol hijau ngeyel, pake cadangan di bawah ya.',
  planBTitle: 'Plan B (kalo tombol hijau rewel)',
  planBHint: 'Tips: abis klik "Salin Link", buka Telegram terus tempel link-nya di search/browser Telegram.',
  joinTitle: 'Cara Join (3 langkah)',
  joinSteps: [
    'Install/buka Telegram dulu.',
    'Klik tombol hijau "Masuk Channel" di atas.',
    'Di Telegram, pencet "Join/Bergabung" — beres.'
  ],
  botsTitle: 'Bot Resmi',
  botsHint: 'Cara pakai: Klik Mulai → pilih menu → ikutin instruksi. Gampang kok. Kalo satu lagi rewel, cobain bot lain.',
  updatesTitle: 'Update Terbaru',
  legalTitle: 'Legal / 18+',
  legalItems: [
    '18+ ONLY. Bukan untuk yang di bawah 18.',
    'Konten legal dan konsensual. Ini cuma pusat info/link, tanpa konten eksplisit.',
    'Kalo ada masalah/DMCA, hubungi kami via bot.'
  ],
  footer: 'Simpen halaman ini biar gampang dicari kalo channel pindah. Stay safe, hormati rules platform.'
};


function errMsg(err) {
  if (!err) return 'unknown error';
  if (err.message) return err.message;
  try { return JSON.stringify(err); } catch (_) { return String(err); }
}

function ensureCopy(cfg) {
  if (!cfg.copy || typeof cfg.copy !== 'object') cfg.copy = {};
  return cfg.copy;
}

function formatCopy(copy) {
  const c = copy || {};
  const lines = [];
  lines.push('Copy (teks):');
  Object.keys(COPY_STRING_FIELDS).forEach((key) => {
    const raw = c[key];
    const val = (typeof raw === 'string' && raw.trim()) ? raw.trim() : DEFAULT_COPY[key];
    lines.push(`- ${key}: ${val}`);
  });
  lines.push('');
  lines.push('Copy (list):');
  Object.keys(COPY_LIST_FIELDS).forEach((key) => {
    const raw = c[key];
    const list = Array.isArray(raw) && raw.length ? raw : DEFAULT_COPY[key];
    lines.push(`- ${key}:`);
    list.forEach((item, idx) => {
      lines.push(`    ${idx + 1}. ${item}`);
    });
  });
  return lines.join('\n');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return handleOptions();
    if (url.pathname === '/telegram') return handleTelegram(request, env);
    if (url.pathname === '/health') return new Response('ok');
    return new Response('not found', { status: 404 });
  }
};

function handleOptions() {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'content-type,authorization'
      }
    });
}

async function handleTelegram(request, env) {
  try {
    const update = await request.json();
    const msg = update.message || update.edited_message;
    const cq = update.callback_query;
    const chatId = msg?.chat?.id || cq?.message?.chat?.id;
    const fromId = msg?.from?.id || cq?.from?.id;
    const text = (msg?.text || '').trim();

    if (!chatId || !fromId) return new Response('ok');
    if (!isAdmin(fromId, env)) {
      await tgSend(env, chatId, 'Akses ditolak.');
      return new Response('ok');
    }

    if (cq && cq.data) {
      // Simple menu callbacks: just show help for the command
      const map = {
        'menu:setmain': 'Kirim: /main <url>\nContoh: /main https://t.me/ltddev',
        'menu:addmirror': 'Kirim: /addmirror <url>',
        'menu:delmirror': 'Kirim: /delmirror <index> (mulai dari 1)',
        'menu:status': 'Kirim: /status <teks status>',
        'menu:update': 'Kirim: /update <teks pengumuman>',
        'menu:addbot': 'Kirim: /addbot <url bot>',
        'menu:delbot': 'Kirim: /delbot <index> (mulai dari 1)',
        'menu:listupdates': 'Kirim: /updates buat liat semua update + index.',
        'menu:delupdate': 'Kirim: /delupdate <index> (cek index pakai /updates).',
        'menu:editupdate': 'Kirim: /editupdate <index> <teks baru>.',
        'menu:setcopy': 'Format: /setcopy <key> <teks>. Lihat key via /showcopy. Ketik default buat reset.',
        'menu:setcopylist': 'Format: /setcopylist <key> item1 | item2 | item3. Pakai default buat reset.',
        'menu:show': 'Kirim: /show (ringkasan config)',
        'menu:showcopy': 'Kirim: /showcopy (lihat teks statis).'
      };
      const t = map[cq.data] || 'Pilih aksi lalu ikuti petunjuk.';
      await tgAnswerCallback(env, cq.id, 'OK');
      await tgSend(env, chatId, t, { reply_to_message_id: cq.message.message_id });
      return new Response('ok');
    }

    if (text === '/start' || text === '/menu') {
      await tgSend(env, chatId, 'Menu Admin — pilih aksi:', menuKeyboard());
      return new Response('ok');
    }

    if (text === '/show') {
      const cfg = await ghGetConfig(env);
      const preview = summarizeConfig(cfg);
      await tgSend(env, chatId, 'Config sekarang:\n' + preview);
      return new Response('ok');
    }

    const cfg = await ghGetConfig(env);
    const nowTs = new Date().toISOString();

    if (text === '/updates' || text === '/listupdates') {
      await tgSend(env, chatId, formatUpdates(cfg.updates || []));
      return new Response('ok');
    }

    if (text === '/showcopy') {
      await tgSend(env, chatId, formatCopy(cfg.copy || {}));
      return new Response('ok');
    }

    if (text.startsWith('/setcopylist ')) {
      const match = text.match(/^\/setcopylist\s+([A-Za-z0-9_]+)\s+([\s\S]+)/);
      if (!match) return tgReply(env, chatId, 'Format: /setcopylist <key> item1 | item2 | item3.');
      const key = match[1];
      const raw = match[2].trim();
      if (!COPY_LIST_FIELDS[key]) return tgReply(env, chatId, 'Key list ga dikenal. Cek /showcopy.');
      const copyState = ensureCopy(cfg);
      const lower = raw.toLowerCase();
      if (lower === 'default' || raw === '-') {
        delete copyState[key];
        await ghPutConfig(env, cfg, `Reset copy list ${key}`);
        return tgReply(env, chatId, `List ${key} balik ke default.`);
      }
      const items = raw.split('|').map(s=>s.trim()).filter(Boolean);
      if (items.length === 0) return tgReply(env, chatId, 'Minimal 1 item. Pisah pakai tanda |.');
      copyState[key] = items;
      try {
        await ghPutConfig(env, cfg, `Update copy list ${key}`);
      } catch (err) {
        return tgReply(env, chatId, 'Gagal update list: ' + errMsg(err));
      }
      return tgReply(env, chatId, `List ${key} diset (${items.length} item).`);
    }

    if (text.startsWith('/setcopy ')) {
      const match = text.match(/^\/setcopy\s+([A-Za-z0-9_]+)\s+([\s\S]+)/);
      if (!match) return tgReply(env, chatId, 'Format: /setcopy <key> <teks baru>.');
      const key = match[1];
      const value = match[2].trim();
      if (!COPY_STRING_FIELDS[key]) return tgReply(env, chatId, 'Key teks ga dikenal. Cek /showcopy.');
      const copyState = ensureCopy(cfg);
      const lower = value.toLowerCase();
      if (lower === 'default' || value === '-') {
        delete copyState[key];
        return tgReply(env, chatId, `Copy ${key} balik ke default.`);
      }
      copyState[key] = value;
      try {
        await ghPutConfig(env, cfg, `Update copy ${key}`);
      } catch (err) {
        return tgReply(env, chatId, 'Gagal update copy: ' + errMsg(err));
      }
      return tgReply(env, chatId, `Copy ${key} diset.`);
    }

    if (text.startsWith('/main ')) {
      const url = text.split(/\s+/)[1];
      if (!isUrl(url)) return tgReply(env, chatId, 'URL ga valid.');
      cfg.latestLink = url;
      pushUpdate(cfg, nowTs, 'Link channel utama diupdate. Tombol hijau udah ganti.');
      await ghPutConfig(env, cfg, `Set main link to ${url}`);
      return tgReply(env, chatId, 'Sip. Link utama diupdate.');
    }

    if (text.startsWith('/addmirror ')) {
      const url = text.split(/\s+/)[1];
      if (!isUrl(url)) return tgReply(env, chatId, 'URL ga valid.');
      cfg.mirrors = cfg.mirrors || [];
      if (!cfg.mirrors.includes(url)) cfg.mirrors.push(url);
      pushUpdate(cfg, nowTs, 'Link cadangan ditambah.');
      await ghPutConfig(env, cfg, `Add mirror ${url}`);
      return tgReply(env, chatId, 'Oke. Mirror ditambah.');
    }

    if (text.startsWith('/delmirror ')) {
      const idx = parseInt(text.split(/\s+/)[1], 10) - 1;
      if (isNaN(idx)) return tgReply(env, chatId, 'Index harus angka.');
      cfg.mirrors = cfg.mirrors || [];
      if (idx < 0 || idx >= cfg.mirrors.length) return tgReply(env, chatId, 'Index di luar range.');
      const removed = cfg.mirrors.splice(idx, 1);
      pushUpdate(cfg, nowTs, `Mirror dihapus: ${removed[0]}`);
      await ghPutConfig(env, cfg, `Delete mirror index ${idx+1}`);
      return tgReply(env, chatId, 'Sip. Mirror dihapus.');
    }

    if (text.startsWith('/status ')) {
      cfg.status = text.slice('/status '.length).trim();
      await ghPutConfig(env, cfg, 'Update status');
      return tgReply(env, chatId, 'Status diupdate.');
    }

    if (text.startsWith('/update ')) {
      pushUpdate(cfg, nowTs, text.slice('/update '.length).trim());
      await ghPutConfig(env, cfg, 'Add update note');
      return tgReply(env, chatId, 'Update ditambah.');
    }

    if (text.startsWith('/addbot ')) {
      const url = text.split(/\s+/)[1];
      if (!isUrl(url)) return tgReply(env, chatId, 'URL bot ga valid.');
      cfg.bots = cfg.bots || [];
      if (!cfg.bots.includes(url)) cfg.bots.push(url);
      await ghPutConfig(env, cfg, `Add bot ${url}`);
      return tgReply(env, chatId, 'Bot ditambah.');
    }

    if (text.startsWith('/delbot ')) {
      const idx = parseInt(text.split(/\s+/)[1], 10) - 1;
      if (isNaN(idx)) return tgReply(env, chatId, 'Index harus angka.');
      cfg.bots = cfg.bots || [];
      if (idx < 0 || idx >= cfg.bots.length) return tgReply(env, chatId, 'Index di luar range.');
      const removed = cfg.bots.splice(idx, 1);
      await ghPutConfig(env, cfg, `Delete bot index ${idx+1}`);
      return tgReply(env, chatId, 'Bot dihapus: ' + (removed[0] || '')); 
    }

    if (text.startsWith('/delupdate ')) {
      const idx = parseInt(text.split(/\s+/)[1], 10) - 1;
      if (isNaN(idx)) return tgReply(env, chatId, 'Index update harus angka.');
      cfg.updates = cfg.updates || [];
      if (idx < 0 || idx >= cfg.updates.length) return tgReply(env, chatId, 'Index update di luar range.');
      const removed = cfg.updates.splice(idx, 1)[0];
      await ghPutConfig(env, cfg, `Delete update index ${idx+1}`);
      return tgReply(env, chatId, 'Update dihapus: ' + ((removed && removed.text) || '')); 
    }

    if (text.startsWith('/editupdate ')) {
      const match = text.match(/^\/editupdate\s+(\d+)\s+([\s\S]+)/);
      if (!match) return tgReply(env, chatId, 'Format: /editupdate <index> <teks baru>.');
      const idx = parseInt(match[1], 10) - 1;
      const newText = match[2].trim();
      if (!newText) return tgReply(env, chatId, 'Teks baru ga boleh kosong.');
      cfg.updates = cfg.updates || [];
      if (idx < 0 || idx >= cfg.updates.length) return tgReply(env, chatId, 'Index update di luar range.');
      cfg.updates[idx].text = newText;
      cfg.updates[idx].ts = tsWIB(nowTs);
      await ghPutConfig(env, cfg, `Edit update index ${idx+1}`);
      return tgReply(env, chatId, 'Update #' + (idx+1) + ' diganti.');
    }

    await tgSend(env, chatId, helpText());
    return new Response('ok');
  } catch (e) {
    const msg = 'Error: ' + errMsg(e);
    try {
      if (typeof chatId === 'number') {
        await tgSend(env, chatId, msg);
      } else {
        const fallback = (env.ADMIN_IDS || '').split(',').map(s=>s.trim()).filter(Boolean)[0];
        if (fallback) await tgSend(env, fallback, msg);
      }
    } catch (_) { /* ignore */ }
    return new Response('ok');
  }
}

function isAdmin(userId, env) {
  const raw = env.ADMIN_IDS || '';
  return raw.split(',').map(s=>s.trim()).filter(Boolean).includes(String(userId));
}

function helpText() {
  return [
    'Perintah:',
    '/menu — tampilkan tombol aksi',
    '/show — lihat config sekarang',
    '/showcopy — lihat teks statis yang lagi kepake',
    '/main <url> — set link utama',
    '/addmirror <url> — tambah mirror',
    '/delmirror <index> — hapus mirror (mulai 1)',
    '/status <teks> — set status',
    '/update <teks> — tambah pengumuman',
    '/updates — tampilkan daftar update + index',
    '/delupdate <index> — hapus update (mulai 1)',
    '/editupdate <index> <teks> — ganti isi update',
    '/setcopy <key> <teks> — ganti teks statis (lihat key di /showcopy)',
    '/setcopylist <key> item1 | item2 — ganti list copy',
    '/addbot <url> — tambah bot',
    '/delbot <index> — hapus bot (mulai 1)'  
  ].join('\n');
}

function menuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [ { text: 'Set Main Link', callback_data: 'menu:setmain' }, { text: 'Add Mirror', callback_data: 'menu:addmirror' } ],
        [ { text: 'Del Mirror', callback_data: 'menu:delmirror' }, { text: 'Status', callback_data: 'menu:status' } ],
        [ { text: 'Add Bot', callback_data: 'menu:addbot' }, { text: 'Del Bot', callback_data: 'menu:delbot' } ],
        [ { text: 'Post Update', callback_data: 'menu:update' }, { text: 'List Updates', callback_data: 'menu:listupdates' } ],
        [ { text: 'Del Update', callback_data: 'menu:delupdate' }, { text: 'Edit Update', callback_data: 'menu:editupdate' } ],
        [ { text: 'Set Copy', callback_data: 'menu:setcopy' }, { text: 'Set Copy List', callback_data: 'menu:setcopylist' } ],
        [ { text: 'Show Config', callback_data: 'menu:show' }, { text: 'Show Copy', callback_data: 'menu:showcopy' } ]
      ]
    }
  };
}

function isUrl(s) {
  try { new URL(s); return true; } catch { return false; }
}

function pushUpdate(cfg, tsIso, text) {
  cfg.updates = cfg.updates || [];
  cfg.updates.unshift({ ts: tsWIB(tsIso), text });
}

function formatUpdates(list) {
  if (!list || list.length === 0) return 'Belum ada update. Pakai /update buat nambah.';
  return list.map((u, i) => {
    const when = u.ts ? `[${u.ts}] ` : '';
    return `${i + 1}. ${when}${u.text || ''}`.trim();
  }).slice(0, 20).join('\n');
}

function tsWIB(tsIso) {
  // Keep as ISO but annotated with +07:00 if not present
  try {
    const dt = new Date(tsIso);
    // Format YYYY-MM-DDTHH:mm:ss+07:00
    const pad = (n)=>String(n).padStart(2,'0');
    const y = dt.getUTCFullYear();
    const m = pad(dt.getUTCMonth()+1);
    const d = pad(dt.getUTCDate());
    const hh = pad(dt.getUTCHours()+7 >= 24 ? (dt.getUTCHours()+7-24) : (dt.getUTCHours()+7));
    const mm = pad(dt.getUTCMinutes());
    const ss = pad(dt.getUTCSeconds());
    // This is a simplification (no DST) suitable for WIB
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}+07:00`;
  } catch {
    return tsIso;
  }
}

function summarizeConfig(cfg) {
  const bots = (cfg.bots||[]).map((b,i)=>`${i+1}. ${b}`).join('\n') || '-';
  const mirrors = (cfg.mirrors||[]).map((m,i)=>`${i+1}. ${m}`).join('\n') || '-';
  const last = (cfg.updates||[])[0];
  return [
    `Brand: ${cfg.brand||'-'}`,
    `Status: ${cfg.status||'-'}`,
    `Main: ${cfg.latestLink||'-'}`,
    'Mirrors:\n'+mirrors,
    'Bots:\n'+bots,
    'Last update: ' + (last ? (`[${last.ts}] ${last.text}`) : '-')
  ].join('\n');
}

async function ghGetConfig(env) {
  const owner = env.REPO_OWNER; const repo = env.REPO_NAME; const path = env.FILE_PATH || 'updates.json';
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${env.BRANCH||'main'}`;
  const r = await fetch(url, { headers: ghHeaders(env) });
  if (!r.ok) throw new Error('Failed fetch updates.json');
  const j = await r.json();
  const raw = atob(j.content.replace(/\n/g,''));
  const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
  const content = new TextDecoder('utf-8').decode(bytes);
  const cfg = JSON.parse(content);
  cfg._sha = j.sha;
  return cfg;
}

async function ghPutConfig(env, cfg, message) {
  const owner = env.REPO_OWNER; const repo = env.REPO_NAME; const path = env.FILE_PATH || 'updates.json';
  const sha = cfg._sha; delete cfg._sha;
  const json = JSON.stringify(cfg, null, 2);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  const newContent = btoa(binary);
  const body = {
    message: message || 'Update updates.json via bot',
    content: newContent,
    sha,
    branch: env.BRANCH || 'main',
    committer: { name: 'LTD Bot', email: 'bot@ltd.dev' }
  };
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const r = await fetch(url, { method: 'PUT', headers: ghHeaders(env), body: JSON.stringify(body) });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('Failed to update file: ' + t);
  }
  return true;
}

function ghHeaders(env) {
  return {
    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ltd-admin-bot'
  };
}

async function tgSend(env, chatId, text, extra) {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
  const body = Object.assign({ chat_id: chatId, text }, extra || {});
  await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}

async function tgReply(env, chatId, text) {
  await tgSend(env, chatId, text);
  return new Response('ok');
}
async function tgAnswerCallback(env, cbId, text) {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/answerCallbackQuery`;
  await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ callback_query_id: cbId, text }) });
}

