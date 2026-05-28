# SUB4 — Push-Worker (Cloudflare)

Tägliche Trainings-Reminder per Web-Push. Cron im Worker feuert um 07:00 (MESZ) und schickt Push an alle abonnierten Geräte.

## Setup (einmalig, ~10–15 min)

### 1) Cloudflare-Account
Gratis bei https://dash.cloudflare.com/sign-up registrieren.

### 2) Wrangler CLI
Im `worker/`-Ordner:
```
cd worker
npm install
```

### 3) Bei Cloudflare einloggen
```
npx wrangler login
```
Browser öffnet sich → autorisieren.

### 4) KV-Namespace anlegen
```
npx wrangler kv namespace create SUBS
```
Ausgabe enthält eine `id = "..."`. **Diese ID in `wrangler.toml`** unter `[[kv_namespaces]]` eintragen (`FILL_AFTER_WRANGLER_KV_CREATE` ersetzen).

### 5) VAPID-Private-Key als Secret setzen
```
npx wrangler secret put VAPID_PRIVATE
```
Wenn aufgefordert, einfügen:
```
2OVgx-8D_p-AP3Ke049fzYjkikAGk-0gZl_lkL4ejdw
```
*(Das ist der von der App generierte Private-Key — gehört nur hierher, nicht ins Repo!)*

### 6) Deploy
```
npx wrangler deploy
```
Am Ende kommt eine URL wie `https://marathon-koeln-push.<dein-subdomain>.workers.dev`. **Diese URL kopieren.**

### 7) In der App eintragen
- App öffnen → **Mehr → 🔔 Push-Notifications**
- Worker-URL einfügen → „URL speichern"
- „Push aktivieren" → iOS-Berechtigung gewähren
- „Test senden" → eine Notification sollte erscheinen

### 8) Cron prüfen (optional)
```
npx wrangler tail
```
Zeigt Live-Logs. Jeden Morgen um 5:00 UTC (= 7:00 MESZ) sollte der Cron auslösen.

## Plan-Änderungen

Wenn sich der Trainingsplan ändert: `src/plan.js` aktualisieren und neu deployen:
```
npx wrangler deploy
```

## Endpoints

| Pfad | Methode | Zweck |
|---|---|---|
| `/subscribe` | POST | Subscription speichern (App ruft das beim Aktivieren auf) |
| `/unsubscribe` | POST | Subscription löschen |
| `/test` | POST | Sofort Test-Push an alle Abos |
| `/preview` | GET | Heutiges Payload anzeigen (ohne zu senden) |
| `/health` | GET | Liveness-Check |

## Kosten

Cloudflare Workers Free Tier: 100.000 Requests/Tag, KV: 100.000 Reads/Tag, 1.000 Writes/Tag, Cron-Triggers gratis. Bei 1 Nutzer + 1 Push/Tag → praktisch null Verbrauch.
