# THE LINE — V2 (kommerziell, athleten-onboarded)

V2 ist eine **eigenständige, generische** App: statt fest auf einen Athleten/ein Rennen verdrahtet
(wie V1 im Repo-Root), onboardet sie **jeden Nutzer** und generiert daraus einen individuellen Plan.
Ziel: „fühlt sich für jeden an, als wäre die App für ihn gemacht."

- **Eine Datei:** `v2/index.html` (HTML+CSS+JS inline, kein Build). Design-System: **THE LINE** (near-black + Teal `#4ee0c7`, IBM Plex) — identisch zu V1, aber sauber neu aufgebaut.
- **V1 bleibt unangetastet** im Repo-Root. V2 liegt unter `/v2/` → live: `…github.io/marathon-koeln-2026/v2/`.
- **localStorage-Key:** `theline_v2` (getrennt von V1).

## Flow
1. **Onboarding-Wizard** (`OB` / `OB_STEPS`): Sport → Ziel (Zeit/Ankommen) → Zielzeit → Datum/Ort →
   Erfahrung → Umfang → Tage/Woche + verfügbare Wochentage → langer Tag → Zeit/Einheit →
   Zusatztraining → Constraints → Review.
2. **Plan-Generierung** (`finishOnboarding`):
   - **Primär: KI über Worker** — `generatePlanAI()` POSTet das Profil an `DB.coach.workerUrl + /plan`
     (neuer Endpoint in `worker/src/index.js`, `handlePlan` → Anthropic, gibt strukturiertes JSON).
   - **Fallback: lokal** — `generatePlanLocal()` (deterministisch, offline, lauf-fokussiert) läuft, wenn
     kein Worker verbunden ist oder die KI fehlschlägt. So funktioniert die App **immer**.
   - `normalizePlan()` verankert Wochennummern, **Startdaten** (aus Renndatum rückgerechnet) und Paces
     deterministisch — die KI liefert nur den *Inhalt*, nie die Anker.
3. **App** (`route`/`go`/`render`, Views `viewHeute|viewWoche|viewTrack|viewAnalyse|viewMehr`):
   Countdown + THE BUILD LINE, Wochen-Timeline (Akkordeon), Tracken (offene Läufe), Analyse
   (Compliance/Gesamt), Mehr (Ziel, Plan neu generieren, Verbindungen, Reset).
4. **Log-Sheet** (`openLog`/`saveLog`): Distanz/Zeit → Live-Pace, Empfinden; persistiert in `DB.logs`
   (Key `W{week}-{day}`, day 0=Mo..6=So).

## Datenmodell (`theline_v2`)
`{ v, onboarded, profile, plan, logs, acts, coach:{workerUrl}, connections }`
- `profile`: sport, goalMode, targetSec/targetStr, raceDate/raceName, experience, currentVolume,
  daysPerWeek, availableDays[7], longDay, sessionMinutes, cross[], constraints, weeks.
- `plan`: `{ generatedAt, source:'ai'|'local', summary, startDate, paces, weeks:[{w,phase,start,km,longKm,down,sessions:[{day,kind,sport,title,detail,zone}]}] }`.

## Sportarten
`SPORTS`: marathon, half, 10k, 5k, ultra, triathlon, ironman, hyrox, custom. Der lokale Fallback ist
lauf-zentriert; Multisport-Feinheiten (Schwimmen/Rad/Koppel, Hyrox-Stationen) liefert der **KI-Pfad**.

## Worker
Neuer Endpoint `POST /plan` in `worker/src/index.js` (`handlePlan`, `PLAN_SYSTEM`, `extractJSON`).
Nutzt dasselbe `ANTHROPIC_API_KEY`-Secret wie der Coach. Zum Aktivieren: Worker deployen und die
Worker-URL in der App unter **Mehr → KI-Coach & Plan** eintragen.

## Lokal testen
`.claude/launch.json` (Server `marathon`, jetzt Node via `.claude/serve.js` — sandbox-sicher) →
`http://localhost:4173/v2/index.html`. Viewport ~402×860.

## Offen / nächste Schritte
- Fallback-Generator für echte Multisport-Struktur (Schwimmen/Rad/Koppel, Hyrox) ausbauen.
- Garmin/Strava-Integration aus V1 übernehmen (aktuell nur UI-Platzhalter unter „Verbindungen").
- Coach-Chat-Screen (Worker `/coach` existiert bereits) in V2 einhängen.
- Kraft-/Mobility-Tracking-Sheet, Einzel-Lauf-Analyse.
- Kommerzielle Schicht (Accounts/Sync/Billing) — bewusst noch nicht enthalten (MVP = local-first).
