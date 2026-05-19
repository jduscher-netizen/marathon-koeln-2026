# Marathon Köln 2026 — Trainings-Tracker

Persönliche, mobile-first Single-File-Web-App zum Tracken des Marathonplans Köln (04.10.2026, Ziel Sub 4:00).

- **Live:** `https://<dein-user>.github.io/<repo>/`
- Komplett offline-fähig, alle Daten liegen lokal im Browser (localStorage). Nichts wird hochgeladen.
- Auf dem iPhone: Seite öffnen → Teilen → „Zum Home-Bildschirm" → läuft wie eine App.

## Features
- Heute / Woche mit den 4 fixen Läufen (Di/Do/Fr/So) + freie Einheiten (Zähler) + Rad
- Tracken mit Distanz/Zeit/HF/RPE, Plan je Lauf editierbar, Verschieben/Überspringen
- Analyse: Sub-4:00-Prognose, HF-Effizienz, Umfang & Compliance, Aktivitäten, Rad, Gewicht
- Import aus Strava/Garmin (GPX/TCX) pro Lauf oder Bulk + Strava-CSV
- Alle Nicht-Lauf-Infos (Zonen, Kraft, Mobility, Ernährung, Strategie) unter „Mehr"
- JSON Export/Import als Backup

## Hosting
Statische Datei — GitHub Pages serviert `index.html` direkt. Keine Build-Tools nötig.

> Backups regelmäßig über **Mehr → Daten-Backup → Export** ziehen (Daten sind gerätelokal).
