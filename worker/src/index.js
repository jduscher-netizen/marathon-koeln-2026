import { sendPush } from './push.js';
import { PLAN, PLAN_START } from './plan.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    try {
      if (!env.VAPID_PRIVATE) throw new Error('VAPID_PRIVATE-Secret fehlt');

      if (url.pathname === '/health') return new Response('ok', { headers: CORS });

      if (url.pathname === '/subscribe' && req.method === 'POST') {
        const sub = await req.json();
        if (!sub?.endpoint || !sub?.keys) return jsonResp({ error: 'Subscription unvollständig' }, 400);
        await env.SUBS.put(subKey(sub.endpoint), JSON.stringify(sub));
        return jsonResp({ ok: true });
      }
      if (url.pathname === '/unsubscribe' && req.method === 'POST') {
        const { endpoint } = await req.json();
        if (endpoint) await env.SUBS.delete(subKey(endpoint));
        return jsonResp({ ok: true });
      }
      if (url.pathname === '/test' && req.method === 'POST') {
        const subs = await listSubs(env);
        if (!subs.length) return jsonResp({ error: 'Keine Abos registriert' }, 404);
        const r = await sendAll(env, subs, { title: 'Test ✓', body: 'Push funktioniert. Morgen 7:00 startet der Daily-Reminder.' });
        return jsonResp(r);
      }
      if (url.pathname === '/run-scheduled' && req.method === 'POST') {
        // Manuell den scheduled-Handler ausführen für Debug
        const subs = await listSubs(env);
        const payload = todaysPayload(new Date());
        if (!payload) return jsonResp({ skipped: 'todaysPayload null' });
        if (!subs.length) return jsonResp({ skipped: 'no subscriptions' });
        const r = await sendAll(env, subs, payload);
        return jsonResp({ ranAt: new Date().toISOString(), payload, ...r });
      }
      if (url.pathname === '/preview' && req.method === 'GET') {
        // Vorschau-Payload für heute (ohne zu senden)
        return jsonResp(todaysPayload(new Date()) || { info: 'außerhalb Trainingsplan' });
      }
      return new Response('Not Found', { status: 404, headers: CORS });
    } catch (e) {
      return jsonResp({ error: e.message }, 500);
    }
  },

  async scheduled(controller, env, ctx) {
    const t = new Date().toISOString();
    console.log(`[scheduled] fired at ${t} (cron: ${controller.cron})`);
    if (!env.VAPID_PRIVATE) { console.error('[scheduled] VAPID_PRIVATE fehlt'); return; }
    const subs = await listSubs(env);
    if (!subs.length) { console.log('[scheduled] no subs'); return; }

    const payload = todaysPayload(new Date());
    if (!payload) { console.log('[scheduled] no payload'); return; }
    const result = await sendAll(env, subs, payload);
    console.log(`[scheduled] payload="${payload.title}" result=${JSON.stringify(result)}`);
  }
};

function subKey(endpoint) {
  // KV-Key: kurzer Hash-Surrogat aus Endpoint
  let h = 0;
  for (let i = 0; i < endpoint.length; i++) h = ((h << 5) - h + endpoint.charCodeAt(i)) | 0;
  return 'sub:' + (h >>> 0).toString(36) + ':' + endpoint.slice(-12);
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function listSubs(env) {
  const list = await env.SUBS.list({ prefix: 'sub:' });
  const subs = [];
  for (const k of list.keys) {
    const v = await env.SUBS.get(k.name);
    if (v) subs.push(JSON.parse(v));
  }
  return subs;
}

async function sendAll(env, subs, payload) {
  let sent = 0, failed = 0, removed = 0;
  const errors = [];
  for (const sub of subs) {
    try {
      await sendPush(sub, JSON.stringify(payload), env);
      sent++;
    } catch (e) {
      failed++;
      const err = { endpoint: (sub.endpoint||"").slice(0,80)+"…", status: e.statusCode||null, body: (e.body||"").slice(0,200), msg: e.message||String(e) };
      errors.push(err);
      console.error("Push failed:", JSON.stringify(err));
      if (e.statusCode === 404 || e.statusCode === 410) {
        await env.SUBS.delete(subKey(sub.endpoint));
        removed++;
      }
    }
  }
  return { sent, failed, removed, errors };
}

function todaysPayload(date) {
  // Tag-Index ab Plan-Start
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayIdx = Math.floor((today - PLAN_START) / 86400000);
  if (dayIdx < 0 || dayIdx >= 21 * 7) return null;
  const w = Math.floor(dayIdx / 7);
  const d = dayIdx % 7;
  const week = PLAN[w];
  const SLOTS = { 1: 'di', 3: 'do', 4: 'fr', 6: 'so' };
  const LABELS = { di: '🏃 Qualität', do: '🏃 GA1 aerob', fr: '🏃 Recovery', so: '🏃 Long Run' };
  const url = 'https://jduscher-netizen.github.io/marathon-koeln-2026/';

  if (!(d in SLOTS)) {
    return { title: `SUB4 · W${w + 1}/21`, body: 'Heute kein fester Lauf — freie Einheiten nach Lust.', url };
  }
  const content = week[SLOTS[d]];
  if (!content || content.trim() === '–') {
    return { title: `SUB4 · W${w + 1}/21 · ${week.ph}`, body: 'Heute frei.', url };
  }
  return {
    title: `${LABELS[SLOTS[d]]} · W${w + 1}/21`,
    body: content,
    url
  };
}
