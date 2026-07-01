# SUB4 — Marathon-Trainings-Tracker

Persönliche, mobile-first **Single-File-Web-App (PWA)** zum Tracken des Marathon-Trainings.
Ziel: **Sub 4:00** beim **Marathon München am 11.10.2026** — daher der Name.

- **Live:** https://jduscher-netizen.github.io/marathon-koeln-2026/
- Auf dem iPhone: Seite öffnen → Teilen → „Zum Home-Bildschirm" → läuft wie eine App.
- Alle Daten liegen lokal im Browser (localStorage). Optional: Cloud-Sync & Coach über eigene Dienste (siehe unten).

## Design — „THE LINE"
Dunkles Identity-System: near-black Hintergrund, Teal-Akzent `#4ee0c7` (die „durchgehende Linie"),
Typografie **IBM Plex Sans + Mono**. Das Linien-Motiv zieht sich als Brand-Strich, Trainings-Timeline
(„THE BUILD LINE") und Sub-4-Schwelle durch alle Screens.

## Screens
- **Heute** — Countdown, Build-Line zum Renntag, Sub-4-Prognose, heutige Einheit, Strava-Vorschläge, Coach-Kurzlage, „Zuletzt absolviert"
- **Woche** — 21-Wochen-Timeline, jede Woche aufklappbar (Tagesliste + freie Einheiten)
- **Tracken** — Läufe manuell/aus Strava eintragen, Krafttraining live mitschreiben, Aktivitäten
- **Analyse** — Marathon-Prognose (Trend), Recovery (Garmin), Pflichtläufe, Form/TSB, Kalorien, Zonen, Volumen, Kraft u. a.; pro Lauf detaillierte Einzel-Analyse
- **Mehr** — Ziel, **Trainingsplan per Chat bearbeiten**, Verbindungen (Garmin/Strava), freie Einheiten, Wissen/Referenz, Einstellungen & Backup

## Features
- 4 fixe Läufe/Woche (Di Qualität · Do GA1 · Fr Recovery · So Long Run) + freie Einheiten (Padel/Kraft/Mobility/Rad)
- Tracken mit Distanz/Zeit/HF/RPE/Empfinden, Live-Pace; GPX/TCX-Import; Verschieben/Überspringen
- **Strava-Sync** (Aktivitäten → Vorschläge → 1-Klick übernehmen) und **Garmin** (Schlaf/HRV/Recovery)
- **Coach-Chat** (kennt Plan, Form & letzte Läufe) und **Plan-Editor-Chat** (Änderungen in Worten → werden übernommen; absolvierte Einheiten bleiben erhalten)
- **Sync-Button** auf der Startseite, täglicher Web-Push-Reminder (optional)
- Auto-Backups + JSON-Export/-Import

## Wichtiges zum Datum/Plan
- Der **Trainingsstart ist fix** (11.05.2026). Das **Renndatum** ist flexibel (nur der Countdown ändert sich) — die Wochen und alle absolvierten Läufe bleiben immer ausgerichtet.
- Absolvierte Einheiten hängen an *Woche + Slot*, nicht am Datum — sie gehen bei Plan-Änderungen nie verloren.

## Hosting / Deploy
Statische Datei — GitHub Pages serviert `index.html` direkt aus `main`. **Kein Build.**
Änderung → `git push origin main` → in ~1–2 Min. live. Danach am Gerät **hart neu laden** bzw. PWA neu öffnen (Cache).

## Für Entwickler / neue KI-Sessions
Vollständiger Kontext (Architektur, Datenmodell, Design-Tokens, Konfig-/Datums-Logik, Integrationen,
Verifikations-Workflow, Fallstricke) → **[`HANDOFF.md`](HANDOFF.md)**.
Design-Referenz (nur lesen): **`design/README.md`** + `design/SUB4 - THE LINE.dc.html`.

> Backups regelmäßig über **Mehr → Einstellungen → Export** ziehen (Daten sind gerätelokal).
