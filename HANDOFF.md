# SUB4/TEMPO · Handoff / Session-Kontext

> Diese Datei enthält alles, um in einer **neuen Session** sofort weiterarbeiten zu können.
> Sprache der App: **Deutsch**. Alles Persönliche für **einen** Nutzer.
>
> **UPDATE 03.07.2026 — TEMPO-Rebrand + adaptive Features:** Das Design-System „THE LINE"
> wurde vollständig durch **TEMPO** ersetzt (Bahn-Orange #e05a1f auf Navy #16294d, Creme-BG
> #faf5ee, Oswald/Archivo, kein Glow, Nav rein typografisch HEUTE·WOCHEN·TRACKEN·FORM·MEHR,
> Wortmarke **TEMPO**) — Spezifikation: `design/TEMPO-HANDOFF.md` (ersetzt design/README.md).
> Zusätzlich aus V2 portiert: **Morgen-Check** (Garmin-Recovery/Gefühl → Einheit anpassen,
> DB.checkins), **Verpasst-Logik** (Skip mit reason / Verschieben via DB.moves), **Wochenreport**
> (DB.reports, Karte auf Heute + Sheet), **Änderungs-Feed** (DB.changeLog, Mehr → Plan-Änderungen),
> **KI-Coach-Verdict** in der Einzel-Lauf-Analyse (L.aiVerdict, Worker /coach), **Rennwochen-Karte**
> (≤7 Tage: Splits + Checkliste). Farb-Referenzen unten (Teal/near-black) sind veraltet.
> Backup des LINE-Stands: `.claude/index.line-backup.html`. Die V2-App (`v2/`) ist davon getrennt.

---

## 0 · TL;DR (was ist das?)

**SUB4** ist ein persönlicher Marathon-Trainings-Tracker als **Single-File Vanilla-JS PWA** (kein Build-Step, keine Frameworks). Ziel: **Sub 4:00** beim **Marathon München am 11.10.2026**. Die gesamte UI folgt dem dunklen Design-System **„THE LINE"** (near-black + Teal-Akzent `#4ee0c7`, IBM Plex).

- **Eine Datei ist die App:** `index.html` (~4135 Zeilen, HTML+CSS+JS inline).
- **Deployment:** GitHub Pages, live unter **https://jduscher-netizen.github.io/marathon-koeln-2026/**
- **Daten:** komplett im Browser (`localStorage`), optional gesynct über GitHub-Gist.

---

## 1 · Repo, Pfade, Deployment

| Was | Wert |
|---|---|
| Lokaler Pfad | `/Users/janduscher/Documents/Claude/Projects/MarathonApp/` |
| Git-Remote | `https://github.com/jduscher-netizen/marathon-koeln-2026.git` |
| Branch | `main` |
| Live-URL (GitHub Pages) | `https://jduscher-netizen.github.io/marathon-koeln-2026/` |
| Pages-Quelle | `main` / Root (`.nojekyll` vorhanden) |

**Deploy = `git push origin main`.** Pages baut in ~1–2 Min. automatisch. Danach beim Nutzer:
**Hard-Reload** bzw. **PWA schließen & neu öffnen** (PWA/iOS cached aggressiv). Das Homescreen-**Icon** ändert sich nur nach Löschen+neu Hinzufügen der PWA.

Commits werden auf Deutsch geschrieben und enden mit
`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
Nur committen/pushen, wenn der Nutzer es will (er reviewt live auf Pages, also i. d. R. pushen).

---

## 2 · Lokale Entwicklung & Verifikation (WICHTIG)

Es gibt **keinen Build**. Zum Prüfen einen lokalen Server + die Preview-Tools nutzen:

1. `preview_start` mit `name: "marathon"` → startet `python3 -m http.server 4173` aus dem Repo-Root (`.claude/launch.json`).
2. Viewport aufs Handy setzen: `preview_resize` ~ **402 × 860**.
3. Navigieren: `preview_eval` → `window.location.href='http://localhost:4173/index.html'`.
4. Rendern/prüfen via `preview_eval` (globale Funktionen aufrufen, z. B. `go('woche')`), `preview_screenshot`, `preview_console_logs`.

**Fallen bei der Verifikation:**
- Der Preview-Server **stirbt häufig** zwischen Turns → einfach neu `preview_start`en.
- Nach `window.location.href=...` kann ein sofortiges `preview_eval` „Inspected target navigated"-Fehler werfen → kurz warten (Promise/`setTimeout`) und erneut.
- Konsole zeigt oft `Strava refresh fail … /oauth/token 400` — das kommt von **Test-Tokens im Preview-localStorage** und ist **harmlos** (kein echter Fehler).
- **`DB` und viele Helfer sind lexikalisch gescoped (NICHT auf `window`)** → aus `preview_eval` nicht direkt erreichbar. Global sind u. a.: `go, render, save, openRun, openLog, openRecoveryDetail, openRunAnalysis, openPlanEditor, planEditSend, syncNow, wocheToggle, resetRaceConfig, buildCoachView, stravaImport, startGym, locate, today, dkey, runContent, raceDate, planStart, weekRange` (Funktionsdeklarationen auf Top-Level). Zum Testen mit Daten: in `localStorage['marathon_koeln_2026']` schreiben und `location.reload()`.

---

## 3 · Architektur (Überblick)

`index.html` Struktur (alles inline):
- `<head>`: Meta, IBM-Plex-Fonts (Google Fonts), **`:root`-Design-Tokens**, komplettes CSS.
- `<body>`: `#app` (aktueller Screen), `.nav#nav` (Bottom-Nav), `#modalRoot` (Sheets), `#coachRoot` (Coach-/Plan-Editor-Vollbild), `#gymRoot` (Live-Kraft), `#syncBadge`, `#toast`.
- `<script>`: der gesamte App-Code (~3800 Zeilen).

**Router:** globale `let route` + `function go(k)` + `function render()`.
`render()` mappt `route → view-Funktion`:
`{heute:viewHeute, woche:viewWoche, track:viewTrack, stats:viewStats, mehr:viewMehr}`.
Views geben **HTML-Strings** zurück, die in `#app.innerHTML` gesetzt werden (kein Virtual DOM).
Interaktion über `onclick="globaleFunktion(...)"`.

**Tages-Refresh:** `render()` merkt sich `_renderDay`. Über `visibilitychange`/`focus`/`pageshow` prüft `refreshIfNewDay()` und rendert neu, wenn der Tag gewechselt hat (nur wenn kein Coach/Gym-Overlay offen ist).

---

## 4 · Design-System „THE LINE"

Referenz (nur lesen, läuft NICHT standalone): `design/README.md` + `design/SUB4 - THE LINE.dc.html`.

**Tokens (`:root`):**
- `--bg:#0a0b0d` · `--surface:#14171b` · `--surface-2:#0f1216` · `--surface-nav:#101317`
- `--txt:#f2f3f4` · `--text-2:#cfd2d6` · `--mut:#7e848c` · `--dim:#565c64`
- `--accent:#4ee0c7` (Teal, „die Linie") · `--accent-glow:rgba(78,224,199,.7)` · `--accent-soft` · Warn `#e0a53b`
- `--line:rgba(255,255,255,.06)` / `--line-strong:.10`
- Fonts: `--font:'IBM Plex Sans'` (UI + Zahlen) · `--mono:'IBM Plex Mono'` (Eyebrows/Labels/Nav, uppercase, letter-spacing)

**Kernmotiv:** eine durchgehende leuchtende Linie (`#4ee0c7`) — Brand-Strich, „THE BUILD LINE" (Timeline zum Renntag mit „you are here"-Marker), Sub-4-Threshold-Linie. Muster wiederholt sich auf jedem Screen.

**Wiederverwendbare Primitives (CSS):** `.eyebrow`, `.mono`, `.ln-line`, `.ln-title`, `.ln-card`, `.sbtn` (Sync-Button). Screen-Layouts nutzen bewusst viel **Inline-Style** (pixelgenau aus der Spec).

**Icon-Set:** `_IC` (Feather-Style, `stroke-width 2`, `currentColor`), Renderer `ic(name,size)`. App-Icon (Homescreen/PWA) = weißes „S" + Teal-Outline-„4" auf near-black (`icon-180/192/512/1024.png`, `manifest.json`).

---

## 5 · Screens (Views) & wichtige Funktionen

| Route | View | Inhalt |
|---|---|---|
| `heute` | `viewHeute` | Brand-Row (+ **Sync-Button** `syncNow`), Hero-Countdown, **THE BUILD LINE**, **Sub-4-Threshold**, Today-Card (erledigt→„✓" + Analyse; sonst „Start"→`openLog`), **Strava-Pending-Block** (`stravaPendingBlock`), **Coach-Card** (Daily Read → `openCoachChat`), Stat-Row, **„Zuletzt absolviert"-Feed** (`recentFeed`) |
| `woche` | `viewWoche` | Vertikale Spine-Timeline, **alle Wochen aufklappbar (Akkordeon)** via `wocheToggle`/`wocheOpen`; offene Woche zeigt Tagesliste + **Freie Einheiten** (`actPanelLine`, antippbar) |
| `track` | `viewTrack` | „+ Lauf manuell eintragen"→`openLog`, offene Läufe (Hollow-Rings)→`openLog`, Kraft-Start (`startGym` push/pull/legs), Aktivitäten-Liste (`actRow`), Rad (`openRide`) |
| `stats` | `viewStats` | 4 LINE-Karten (Prognose mit 3-Punkte-Trend, Recovery, Pflichtläufe, Form/TSB) + darunter „Weitere Analyse" (bestehende `cardCalories/cardZonesTotal/cardVolume/cardLongRun/cardHR/cardStrength/…`) |
| `mehr` | `viewMehr` | Ziel-Karte, **„Trainingsplan bearbeiten"** (`openPlanEditor`) + Reset-Link (`resetRaceConfig`, nur wenn Override), Verbindungen (Garmin/Strava), Freie Einheiten, „Wissen & Referenz" + „Einstellungen" |

**Sheets/Overlays:**
- `openLog(w,slot)` — LINE-Log-Sheet (Distanz/Zeit/Live-Pace/Empfinden); speichert `DB.logs`; Link „Analyse ansehen" & „Mehr Details"→`openRun`.
- `openRun(w,slot)` — detaillierter Editor (HF, RPE, Notiz, GPX/TCX-Import, Plan ändern/verschieben/skip, **Analyse**-Button→`openRunAnalysis`).
- `openRunAnalysis(w,slot)` — **Einzel-Lauf-Analyse** (Coach-Verdict `runVerdict`, Tempo, HF, Zonen, Plan-Abgleich). Verdict ist datengetrieben/variabel (Vergleich zur eigenen Historie, Bestzeiten, Plan-Pace, HF-Effizienz).
- `openRecoveryDetail()` — LINE-Recovery-Sheet (Score, Balken, Kacheln).
- `buildCoachView()` — Coach-Chat (Vollbild, `.cv`-Klassen).
- `openPlanEditor()` — Plan-Editor-Chat (siehe §8).

---

## 6 · Datenmodell & Speicherung

**localStorage-Keys:**
- `marathon_koeln_2026` → Haupt-DB (`let DB = load()`), Migration über `migrateDB(d)` (füllt fehlende Keys aus `freshDB()`).
- `marathon_koeln_2026_cloud` → `CLOUD` (GitHub-Token, gistId, user).
- `marathon_koeln_2026_bk_<ts>` → automatische Backups (Wiederherstellung via `cardRestore`/`restoreBackup`, Notfall-Recovery in `load()`).

**DB-Felder (Auswahl):** `logs` (Lauf-Ergebnisse, Key `W{w}-{slot}`), `planEdits` (Einheit-Overrides je Run), `moves` (Tag-Verschiebung je Run), `skips`, `acts` (freie-Einheiten-Zähler, Key `${w}::${id}`), `activities` (DEFAULT_ACTS), `gym.sessions`, `rides`, `workouts`, `weights`, `wellness` (Garmin), `strava`, `garmin`, `coach` (history, workerUrl, day), `planChat` (Plan-Editor-Verlauf), `push`, **`cfg`** (Eckdaten-Override, siehe §7).

**Plan:**
- `WEEKS[]` — 21 Wochen, je `{w, dr, ph, km, lr, di, do, fr, so}` (`di`/`do`/`fr`/`so` = Einheit-Beschreibung als String). Aktuell: **München-Plan** (W15/W16 als USA-Reise-Woche mit Z2 statt Long/Intervalle; W21 = Taper/Rennwoche).
- `RUNS` — 4 Slots: `di`(quality), `do`(easy), `fr`(recovery), `so`(long).
- `runContent(w,slot)` = `WEEKS`-Vorgabe, überschrieben durch `DB.planEdits[runId]`.
- `runId(w,slot) = 'W'+w+'-'+slot`. **Logs hängen an Woche+Slot, nicht am Datum.**

---

## 7 · Eckdaten-/Konfig-System (Renndatum, Ziel) — SEHR WICHTIG

Überschreibbar über `DB.cfg`, mit **festen Defaults**. Getter statt Konstanten:

```
DEFAULT_START = 11.05.2026   // Trainingsstart, W1 Tag0 (Montag)
DEFAULT_RACE  = 11.10.2026   // Marathon München
DEFAULT_GOAL  = 14400        // Sub 4:00:00 (Sekunden)

planStart()  → IMMER DEFAULT_START (FIX! cfg.planStart wird IGNORIERT)
raceDate()   → DB.cfg.raceDate || DEFAULT_RACE   (überschreibbar)
raceCity()   → DB.cfg.raceCity || "München"
goalSec()    → DB.cfg.goalSec  || DEFAULT_GOAL
```

Weitere Helfer: `raceLabel()`, `raceDateStr()`, `weekRange(w)`, `goalStr()`, `goalShort()`, `dmShort(d)`, `parseLocalDate(s)`.

**Warum der Trainingsstart FIX ist (Lessons learned!):**
- Logs hängen an *Woche+Slot*. Wenn man `planStart` verschiebt (Re-Anchor), rutscht „diese Woche" auf eine **bereits absolvierte Wochen-Nummer** → alles wirkt getrackt. Das hat mehrfach Ärger gemacht.
- Deshalb: **`planStart()` liefert immer `DEFAULT_START`**, `cfg.planStart` wird ignoriert; `migrateDB` **löscht** einen evtl. gespeicherten `cfg.planStart` (Auto-Reparatur). Ein Renndatum-Wechsel ändert nur den **Countdown**, verschiebt die Wochen **nicht**.

**Datums-Logik (zeitzonen-/DST-sicher):**
- `today()` = lokale Mitternacht. `locate(d)` rechnet über `Date.UTC(Jahr,Monat,Tag)`-Komponenten (kein ms-Diff → kein Off-by-one).
- `locate`: „post" (Plan beendet) erst **nach** `raceDate()`. Tage zwischen Plan-Ende (W21) und Rennen werden als W21 (Rennwoche) gezeigt.
- Config-Datumsstrings werden **lokal** geparst (`parseLocalDate`), nicht UTC.

**Reset:** `resetRaceConfig()` setzt `DB.cfg={}` (→ Defaults München/Sub-4). Link erscheint auf „Mehr", wenn `hasRaceOverride()`.

---

## 8 · Plan bearbeiten (2 Wege)

**A) Direkt im Code (bevorzugt für größere/strukturelle Änderungen):**
- Einheiten ändern → `WEEKS[...]`-Zeilen editieren (di/do/fr/so/km/lr). Kurzform in der Wochenliste splittet den `det`-String bei `:`/`(` → **Distanz zuerst schreiben** (z. B. „12 km Z2 locker (New York) · …"), sonst wird's zu „…" abgeschnitten.
- Renndatum/Ort/Ziel → `DEFAULT_RACE` / `raceCity()`-Default / `DEFAULT_GOAL`.
- **Absolvierte Läufe (`DB.logs`) NIE anfassen** — nur Vorgaben ändern.

**B) Plan-Editor-Chatbot (`openPlanEditor`, Eintrag auf „Mehr"):**
- Nutzer schreibt in Worten, was sich ändern soll. Läuft über **denselben Cloudflare-Worker wie der Coach** (`/coach`-Endpoint, relayt an Claude-API). Verlauf in `DB.planChat`.
- `buildPlanEditContext()` schickt Rolle + aktuellen Plan + Eckdaten. Das Modell antwortet menschlich **plus** einen `json`-Block:
  `{"changes":[{"week":9,"slot":"di","title":"…","det":"…","day":0-6}], "config":{"raceDate":"YYYY-MM-DD","raceCity":"…","goalTime":"H:MM:SS"}}`
- `applyPlanChangesFromText(text)` parst den Block und schreibt **nur** `DB.planEdits` / `DB.moves` / `DB.cfg` (raceDate/raceCity/goalSec) — **`planStart` ist fix**, `reanchor` gibt es nicht mehr. `DB.logs` bleibt unberührt.
- Braucht die Worker-URL (wie der Coach). Ohne Worker → `openCoachSetup`.

---

## 9 · Integrationen

- **Garmin (Recovery/Schlaf/HRV):** GitHub Action `.github/workflows/garmin-sync.yml` (Cron) führt `garmin-sync/sync.py` aus (Python, `garminconnect`, via `uv`), schreibt Wellness in einen **Gist**. App liest den Gist über den **GitHub-Token** (`CLOUD.token`) → `fetchWellness()`, Ziel `DB.wellness`. `DB.garmin.gistId`. Composite `recoveryScore()`.
- **Strava (Aktivitäten):** OAuth, `DB.strava` (`clientId/clientSecret/accessToken/refreshToken/expiresAt`). `stravaFetchActivities()` → neue Aktivitäten in `DB.strava.pending` → `stravaImport(id)` matcht auf Plan-Slot (Lauf) bzw. legt Rad/Workout/Gym an. UI: Pending-Block auf „Heute", Sync via `syncNow`.
- **Cloud-Sync:** GitHub-Gist (`CLOUD.token`+`gistId`). `cloudPull`/`cloudPush` (debounced). **Schutz:** nie leeres Lokal über gefülltes Remote pushen.
- **Coach + Plan-Editor:** Cloudflare-Worker (`worker/src/index.js`, Endpoint `/coach` → Anthropic-API). Worker-URL in `DB.coach.workerUrl`. `ANTHROPIC_API_KEY` liegt **als Worker-Secret** (nie im Repo/Chat).
- **Web-Push (täglicher Reminder):** separater Worker `marathon-koeln-push` (`worker/`, VAPID, KV-Namespace `SUBS`, Cron `0 5 * * *` = 7:00 MESZ). `sw.js` behandelt nur `push`/`notificationclick` (kein Asset-Caching!). Abos sterben auf iOS still → im Zweifel Push in der App aus/einschalten (`pushEnable`/`pushDisable`/`pushTest` unter Mehr→Einstellungen).

---

## 10 · Wichtige Muster & Fallstricke

- **`sw.js` cached KEINE Assets** (nur Push). „Alte Version"-Effekte kommen von HTTP-/PWA-Cache → Hard-Reload/Inkognito/PWA-neu.
- **iOS-PWA neu hinzufügen leert localStorage** → Tokens weg. Danach ggf. **Backup wiederherstellen** und Strava/Garmin neu verbinden. (Backups liegen lokal, `_bk_*`.)
- **Keine Emojis in der UI** (Nutzer-Regel; Linien-Icons statt Emojis).
- **Design seriös** wie Runna/Strava (Nutzer-Präferenz, app-übergreifend).
- Verifiziere Änderungen **im Preview** (Screenshot/Console), bevor du pushst — der Nutzer kann nur die Live-Seite prüfen.
- `mockups/` ist **lokal & gitignored** (Produktvideos + `node_modules` mit puppeteer/ffmpeg zum MP4-Rendern); **nicht** Teil der App.

---

## 11 · Aktueller Stand / letzte Arbeit (Commits, neueste zuerst)

```
bfb2c23  Trainingsstart fix verankert — kein Wochen-Shift mehr
f4212e5  Marathon München 11.10.2026 + USA-Reise-Woche (Z2 statt Long/Intervalle)
a4d4280  Plan-Eckdaten: kein Auto-Neuanker mehr + Reset auf Original
bbf4188  Datum/Wochen-Off-by-one (UTC vs. lokal)
5695441  Datum aktualisiert sich beim App-Resume über Mitternacht
df47e0c  Plan-Editor: Eckdaten änderbar (Renndatum, Ort, Zielzeit)
48fd433  Plan-Editor als Chatbot
23e512b  Woche: alle Wochen auf-/zuklappbar (Akkordeon)
8619399  Analyse: Einzel-Lauf-Verdict reicher/variabler
19311e5  Heute/Woche: Sync-Button, Freie-Einheiten-Übersicht, Today-done, „Zuletzt"-Feed
a64fd12  Einzel-Lauf-Analyse wieder erreichbar
930ef44  Strava-Pending-Block auf „Heute" wieder eingebaut
6102ed5  Neues „S4"-App-Icon
81af276  Bottom-Nav-Höhe korrigiert
```
Davor: kompletter **THE-LINE-Redesign** aller 5 Screens + Sheets + Coach (dunkles Theme, IBM Plex, Teal).

**Verifizierter Zustand:** München 11.10.2026 / Sub-4 aktiv; aktuelle Woche korrekt (kein Shift); USA-Reise-Woche (W15 So / W16 Di+Do) auf Z2; Datum robust.

---

## 12 · Offene Ideen / mögliche nächste Schritte

- „Weitere Analyse"-Karten auf `stats` (Kalorien/Zonen/Volumen/…) sind dunkel getönt, aber noch **nicht 1:1 im LINE-Stil** durchgestylt.
- Optionaler **Auto-Sync** beim Wechsel auf „Heute" (z. B. max. alle 10 Min.) statt nur beim Start/Button.
- Freie-Einheiten pro Woche: evtl. für zukünftige Wochen ausblenden.
- Statische Referenztexte (Wettkampf-Strategie etc.) sind teils noch generisch/fix.
- W16 „Königswoche": 32-km-Long-Run am So 30.08. (nach US-Rückreise) ggf. entschärfen, falls gewünscht.

---

## 13 · Sicherheits-Constraints (dauerhaft)

- **Keine API-Keys/Secrets im Chat** — lokal ablegen, einlesen, löschen. Garmin-Creds nur als GitHub-Secrets. `ANTHROPIC_API_KEY`/VAPID nur als Worker-Secrets.
- Cloud-Sync: **nie leeres Lokal über gefülltes Remote** schreiben.
- `mockups/` nicht committen/deployen.

---

## 14 · Datei-Karte (Repo)

```
index.html            ← DIE APP (HTML/CSS/JS inline, ~4135 Zeilen)
manifest.json         ← PWA-Manifest (Icons, Farben, München-Beschreibung)
sw.js                 ← Service Worker (nur Web-Push)
icon-180/192/512/1024.png  ← App-Icons („S4")
design/               ← THE-LINE-Referenz (README.md + *.dc.html) — NUR lesen
garmin-sync/          ← Python-Garmin-Sync (sync.py, login.py, requirements.txt, setup.sh)
worker/src/           ← Cloudflare-Worker (index.js Coach/Push, plan.js, push.js)
.github/workflows/    ← garmin-sync.yml (Cron)
mockups/              ← lokal/gitignored: Produktvideos + Render-Tooling (NICHT App)
README.md             ← Projekt-Readme
HANDOFF.md            ← diese Datei
```

---

## 15 · So startest du eine neue Session

1. In `/Users/janduscher/Documents/Claude/Projects/MarathonApp/` arbeiten; `git pull` (falls nötig).
2. Diese `HANDOFF.md` + `design/README.md` lesen.
3. Änderungen in `index.html` (bzw. `manifest.json`/`worker/`/`garmin-sync/`).
4. Mit den Preview-Tools verifizieren (§2) — Screenshot/Console.
5. Auf Deutsch committen + `git push origin main` → live auf GitHub Pages.
6. Dem Nutzer sagen: **Hard-Reload / PWA neu öffnen** (Cache).
