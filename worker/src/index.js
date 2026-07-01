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
      if (url.pathname === '/health') return new Response('ok', { headers: CORS });

      // ---- Coach-Chat (Claude API Proxy) ----
      if (url.pathname === '/coach' && req.method === 'POST') {
        return await handleCoach(req, env);
      }

      // ---- Plan-Generator (KI, strukturierter JSON-Plan) ----
      if (url.pathname === '/plan' && req.method === 'POST') {
        return await handlePlan(req, env);
      }

      if (!env.VAPID_PRIVATE) throw new Error('VAPID_PRIVATE-Secret fehlt');

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

// ---- Coach-Chat: Claude API Proxy ----
const COACH_SYSTEM = `Du bist der persönliche Lauf-Coach in der App "SUB4". Dein Athlet bereitet sich auf den Marathon Köln am 04.10.2026 vor, Ziel: unter 4:00 Stunden (Marathon-Pace 5:40 min/km).

# Deine Rolle
Du bist ein erfahrener, datengetriebener Ausdauer-Coach — fachlich präzise, aber direkt und ermutigend. Du sprichst per Du, antwortest auf Deutsch, kurz und konkret. Keine Romane: 2–5 Sätze pro Antwort, bei Bedarf eine knappe Aufzählung. Gib konkrete Handlungsempfehlungen, keine allgemeinen Floskeln. Wenn du dir bei medizinischen Themen (Schmerzen, Verletzungen) unsicher bist, rate zu Vorsicht bzw. ärztlicher Abklärung.

# Der Trainingsplan (v2, 21 Wochen, polarisiert 80/20, 4 Läufe/Woche)
- **Di** = Qualität (Intervalle/Tempo-DL, Zone 4–5)
- **Do** = GA1 aerob (Zone 2, HF 140–150, "Wohlfühl-Easy" 5:55–6:05/km)
- **Fr** = Recovery (Zone 1, HF <140, kurz)
- **So** = Long Run (Zone 2, ggf. mit Marathon-Pace-Block)
- Mo/Mi/Sa: lauffrei (Padel, Kraft, Mobility, optional Rad)

# HF-Zonen (kalibriert)
Z1 Recovery <140 · Z2 GA1 140–150 · Z3 Grauzone 150–160 (meiden!) · Z4 Schwelle 160–172 · Z5 VO2max >172. Marathon-Pace 5:40/km liegt bei HF ~152–156.

# Trainingsprinzipien
- Polarisiert: ~80% locker (Z1+Z2), ~10% hart (Z4+Z5), Z3-Grauzone meiden.
- Long Runs nach HF steuern: Bei >155 trotz korrekter Pace = zu müde, langsamer/kürzen.
- Form (TSB): >+5 frisch, -10 bis +5 normal, <-15 müde (Quality verschieben), <-25 überlastet (Pause).
- Cardiac Drift im Long Run: <6% gut, >6% aerob noch ausbaufähig.
- Bei Schmerz >2 Tage: Pause. Bei Fieber: kompletter Stopp bis 3 Tage symptomfrei.
- Ernährung: kein zu aggressives Defizit im Aufbau; im Taper kein Defizit.

# Wichtig
Du bekommst bei jeder Frage den aktuellen Trainingszustand des Athleten mitgeliefert (Form, Zonen, Läufe, Compliance). Nutze diese echten Zahlen in deiner Antwort — beziehe dich konkret darauf, statt allgemein zu bleiben. Wenn Daten fehlen, sag was du brauchst.`;

const COACH_SYSTEM_V2 = `Du bist der persönliche Ausdauer- und Multisport-Coach in der App "THE LINE". Deine Athleten trainieren auf ganz unterschiedliche Ziele (Marathon, Halb, 10k, 5k, Ultra, Triathlon, Ironman, Hyrox oder individuelle Ziele) — du bekommst bei JEDER Anfrage das konkrete Profil und den aktuellen Trainingszustand des Athleten mitgeliefert.

# Deine Rolle
Erfahren, datengetrieben, direkt und ermutigend. Du sprichst per Du, antwortest auf Deutsch, kurz und konkret (2–5 Sätze, bei Bedarf eine knappe Aufzählung). Konkrete Handlungsempfehlungen statt Floskeln. Bei medizinischen Themen (Schmerz, Verletzung) zu Vorsicht bzw. ärztlicher Abklärung raten.

# Prinzipien
- Polarisiert (80/20): viel locker (Z1/Z2), gezielt hart (Z4/Z5), Grauzone (Z3) meiden.
- Progressive Belastung mit Erholungswochen; Long/Key-Sessions nach Gefühl & HF steuern.
- Form/TSB: frisch >+5, normal −10..+5, müde <−15 (Quality verschieben), überlastet <−25 (Pause).
- Taper: Umfang runter, Intensität halten, kein Kaloriendefizit.

# Stil (WICHTIG)
- KEINE Emojis. Seriös wie Runna/Strava, nicht verspielt.
- KEINE Markdown-Überschriften (#) und kein Fett-Markup (**). Schreibe schlichten Fließtext in kurzen Absätzen; für Aufzählungen einfache Spiegelstriche (- ).

# Daten (WICHTIG)
Nutze IMMER die mitgelieferten echten Zahlen des Athleten (Ziel, Woche/Phase, heutige Einheit, Paces, Recovery, Constraints). Beziehe dich konkret darauf statt allgemein zu bleiben. Erfinde keine Daten; wenn etwas fehlt, sag knapp was du brauchst.`;

async function handleCoach(req, env) {
  if (!env.ANTHROPIC_API_KEY) return jsonResp({ error: 'ANTHROPIC_API_KEY-Secret fehlt — `wrangler secret put ANTHROPIC_API_KEY`' }, 500);
  let body;
  try { body = await req.json(); } catch (e) { return jsonResp({ error: 'Ungültiger Request' }, 400); }
  const userMessages = Array.isArray(body.messages) ? body.messages : [];
  if (!userMessages.length) return jsonResp({ error: 'Keine Nachricht' }, 400);
  const contextSummary = (body.context || '').toString().slice(0, 8000);
  const sys = body.mode === 'v2' ? COACH_SYSTEM_V2 : COACH_SYSTEM;

  const payload = {
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [
      { type: 'text', text: sys, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: '# Aktuelles Athleten-Profil & Trainingszustand (heute)\n' + (contextSummary || 'Noch keine Trainingsdaten erfasst.') }
    ],
    messages: userMessages.slice(-20)
  };

  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    return jsonResp({ error: 'Verbindung zu Claude fehlgeschlagen: ' + e.message }, 502);
  }
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    return jsonResp({ error: 'Claude API ' + r.status, detail: t.slice(0, 300) }, 502);
  }
  const data = await r.json();
  if (data.stop_reason === 'refusal') {
    return jsonResp({ text: 'Diese Frage kann ich als Coach nicht beantworten. Frag mich gern etwas zu deinem Training, deiner Form oder dem Plan.' });
  }
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  return jsonResp({ text: text || '(keine Antwort)', usage: data.usage });
}

// ---- Plan-Generator: erzeugt einen periodisierten, strukturierten Trainingsplan ----
const PLAN_SYSTEM = `Du bist ein Weltklasse-Ausdauer- und Multisport-Coach in der App "THE LINE". Deine Aufgabe: aus dem Athleten-Profil einen individuellen, periodisierten Trainingsplan als STRIKTES JSON erzeugen.

# Prinzipien
- Periodisierung: Base → Build → Peak → Taper. Progressive Umfangssteigerung (~5–10 %/Woche), alle 3–4 Wochen eine Erholungswoche (down:true, ~20 % weniger).
- Polarisiert (80/20): viel locker (Z2), gezielt hart (Z4/Z5), Grauzone meiden.
- Der lange Tag (longDay) trägt die Schlüssel-Einheit (Long Run / lange Rad-/Koppel-Einheit).
- Respektiere die verfügbaren Tage EXAKT: platziere Einheiten NUR an availableDays, genau daysPerWeek Einheiten pro Woche (Rest = Ruhetag, kind:"rest").
- Sportartspezifisch: Marathon/Halb/10k/5k/Ultra = Laufen. Triathlon/Ironman = Schwimmen/Rad/Laufen mischen, Koppeltraining einbauen. Hyrox = Lauf-Intervalle + funktionelle Kraft/Stationen (compromised running). Individuelles Ziel = sinnvoll ableiten.
- Berücksichtige constraints (Reisen, Verletzungen, feste Ruhetage) und cross (Zusatztraining) sinnvoll.
- Zielzeit (targetSec) → kalibriere konkrete Paces in den detail-Texten (min/km). "finish" → sicheres Ankommen, moderat.

# Ausgabeformat — NUR dieses JSON, kein Fließtext, keine Backticks:
{
  "summary": "1 Satz, persönlich, was dieser Plan ist (mit Zielzeit/Pace falls vorhanden)",
  "weeks": [
    {
      "phase": "Base|Build|Peak|Taper",
      "km": <Zahl: Wochenumfang km (Lauf) bzw. Stunden (Tri) als Zahl>,
      "longKm": <Zahl: längste Einheit km, 0 falls n/a>,
      "down": <true|false: Erholungswoche>,
      "sessions": [
        { "day": <0=Mo..6=So>, "kind": "long|quality|easy|recovery|cross|race|rest",
          "sport": "run|bike|swim|strength|mobility|brick",
          "title": "kurzer Titel",
          "detail": "konkrete Vorgabe inkl. Distanz/Zeit/Pace/Zonen",
          "zone": "Z1..Z5 oder leer" }
      ]
    }
  ]
}
Regeln: Erzeuge GENAU so viele Wochen wie profile.weeks. Die LETZTE Woche enthält am longDay eine Einheit mit kind:"race". Gib pro availableDay genau eine session (auch Ruhetage als kind:"rest"). KEINE Start-Daten — die App verankert die Wochen selbst. Antworte mit reinem JSON.`;

async function handlePlan(req, env) {
  if (!env.ANTHROPIC_API_KEY) return jsonResp({ error: 'ANTHROPIC_API_KEY-Secret fehlt' }, 500);
  let body;
  try { body = await req.json(); } catch (e) { return jsonResp({ error: 'Ungültiger Request' }, 400); }
  const profile = body.profile;
  if (!profile) return jsonResp({ error: 'Kein Profil' }, 400);

  const payload = {
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: [{ type: 'text', text: PLAN_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: 'Athleten-Profil (JSON):\n' + JSON.stringify(profile) + '\n\nErzeuge jetzt den Plan als reines JSON.' }]
  };

  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    return jsonResp({ error: 'Verbindung zu Claude fehlgeschlagen: ' + e.message }, 502);
  }
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    return jsonResp({ error: 'Claude API ' + r.status, detail: t.slice(0, 300) }, 502);
  }
  const data = await r.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  const plan = extractJSON(text);
  if (!plan || !Array.isArray(plan.weeks) || !plan.weeks.length) {
    return jsonResp({ error: 'Plan konnte nicht erzeugt werden', raw: text.slice(0, 400) }, 502);
  }
  plan.source = 'ai';
  return jsonResp(plan);
}

function extractJSON(text) {
  if (!text) return null;
  let t = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if (s >= 0 && e > s) { try { return JSON.parse(t.slice(s, e + 1)); } catch (_) {} }
  return null;
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
