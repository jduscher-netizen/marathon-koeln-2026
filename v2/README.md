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

## Coach-Chat (KI)
Vollbild-Overlay `#coachRoot` (`openCoach`/`renderCoach`/`coachSend`). POSTet an Worker `/coach` mit
`mode:'v2'` + `context` aus `buildCoachContext()` (Profil, Woche/Phase, heutige Einheit, Paces,
Recovery, Constraints). Der Worker nutzt bei `mode:'v2'` einen **generischen** Coach-Prompt
(`COACH_SYSTEM_V2`) statt des V1-Köln/Sub-4-Prompts. `fmtCoach()` rendert clientseitig Light-Markdown
und **entfernt Emojis** (App-Regel). Verlauf in `DB.coach.history`.

## Integrationen (Garmin & Strava)
- **Garmin-Recovery:** GitHub-Token (`DB.github.token`) + Wellness-Gist-ID (`DB.garmin.gistId`) →
  `fetchWellness()` liest `garmin-wellness.json`, `recoveryScore()` bildet 0–100. UI: Recovery-Kachel
  auf Heute (→ `openRecovery`-Sheet), Recovery-Karte auf Analyse. Setup: **Mehr → Garmin**.
- **Strava:** OAuth (Client-ID/Secret, Redirect zurück zur App, `checkStravaCallback` beim Laden).
  `stravaFetchActivities()` → `DB.strava.pending`; Pending-Block auf Heute; `stravaImport()` mappt
  Läufe per Datum auf den geplanten Slot (`sessionOn`→`DB.logs`), sonst in `DB.activities`.
- **Sync:** `syncNow()` (Garmin + Strava), auch beim App-Start im Hintergrund.

## Worker
`worker/src/index.js`:
- `POST /plan` (`handlePlan`, `PLAN_SYSTEM`, `extractJSON`) — strukturierter KI-Plan.
- `POST /coach` — bei `mode:'v2'` generischer `COACH_SYSTEM_V2`, sonst der bestehende V1-Prompt (V1 unberührt).
Nutzt dasselbe `ANTHROPIC_API_KEY`-Secret. **Deployed** (`marathon-koeln-push.j-duscher.workers.dev`).
Worker-URL in der App unter **Mehr → KI-Coach & Plan** eintragen (aktiviert KI-Plan + Coach).

## Lokal testen
`.claude/launch.json` (Server `marathon`, jetzt Node via `.claude/serve.js` — sandbox-sicher) →
`http://localhost:4173/v2/index.html`. Viewport ~402×860.

## Offen / nächste Schritte
- Einzel-Lauf-Analyse (Coach-Verdict pro Lauf), Kraft-/Mobility-Tracking-Sheet.
- Aktivitäten-Liste (`DB.activities`) auf „Tracken"/„Analyse" sichtbar machen.
- Cloud-Sync (Gist) für geräteübergreifende Daten wie in V1.
- GPX/TCX-Import & Stream-Analyse (in V1 vorhanden, in V2 noch nicht portiert).
- Kommerzielle Schicht (Accounts/Sync/Billing) — bewusst noch nicht enthalten (MVP = local-first).
