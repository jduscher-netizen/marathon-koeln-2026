# THE LINE V2 — Analyse & Roadmap zum kommerziellen Produkt

> **Nordstern:** Eine App, die **alle Daten zusammenbringt und auswertet** — mit einem Trainingsplan,
> der **alles berücksichtigt** und auf **dich und dein Leben** geschnitten ist.
> „Fühlt sich für jeden an, als wäre sie für ihn gemacht."
>
> Stand der Analyse: 02.07.2026, nach Commit `dc57bae`.

---

## 1 · Ehrliche Ist-Analyse

### Was bereits stark ist
| Bereich | Stand |
|---|---|
| **Design/Identität** | THE LINE ist ein echtes, wiedererkennbares Design-System — Niveau kommerzieller Apps (Runna/WHOOP-Liga). Größtes vorhandenes Asset. |
| **Onboarding** | 12 Schritte, 9 Disziplinen, fühlt sich hochwertig an. Kern der „für mich gemacht"-Wirkung steht. |
| **KI-Plan** | Worker `/plan` liefert echte, profilbasierte Pläne; deterministischer Fallback → App funktioniert immer. Architektonisch richtig. |
| **KI-Coach** | Kontextbewusst (Profil, Woche, Recovery, Paces). Live verifiziert. Das ist der Baustein, den Konkurrenten (Runna, TrainingPeaks) so nicht haben. |
| **Kern-Loop** | Plan sehen → Einheit tracken → Fortschritt sehen funktioniert end-to-end. |

### Was Prototyp-Niveau ist (Blocker für Kommerzialisierung)
| Problem | Warum kritisch |
|---|---|
| **Nur localStorage** | Daten weg bei PWA-Neuinstallation/Gerätewechsel. Kein Account, kein Multi-Device. Für zahlende Kunden inakzeptabel. |
| **Strava-Anbindung** | Jeder Nutzer müsste eine **eigene Strava-API-App** anlegen (Client-ID/Secret via `prompt()`). Kein normaler Kunde kann/will das. Es braucht **eine zentrale OAuth-App** mit Token-Austausch im Backend (Secret darf nie in den Client). |
| **Garmin-Anbindung** | GitHub-Token + eigener Gist + selbst gehosteter Python-Sync — funktioniert nur für Entwickler. Kommerziell braucht es die **offizielle Garmin Health API** (Partnerantrag) oder Aggregatoren (Terra/ROOK) bzw. **Apple Health/HealthKit** (erfordert nativen Wrapper). |
| **Worker offen** | `/plan` & `/coach` ohne Auth/Rate-Limit → jeder kann deine Anthropic-Kosten verbrennen. Vor jedem echten Launch fixen. |
| **Statischer Plan** | Nach Generierung passiert nichts mehr. Die Vision („berücksichtigt alles") verlangt **Anpassung**: verpasste Einheiten, Recovery, Reisen, Fortschritt. Heute: 0 %. |
| **Auswertung flach** | Compliance-% + Summen. Kein Fitness/Ermüdungs-Modell, keine Prognose-Entwicklung, keine Einzel-Lauf-Analyse (V1 hat mehr als V2!). |
| **Kein PWA-Manifest in V2** | Nicht sauber auf den Homescreen installierbar, kein Icon, kein Standalone-Modus. |
| **Keine Monetarisierung** | Kein Account → kein Abo → kein Umsatz. |
| **Rechtliches** | Keine Datenschutzerklärung, kein Impressum, kein Gesundheits-Disclaimer, keine AGB. In DE/EU nicht verhandelbar. |
| **Nur Deutsch, nur km** | Begrenzt den Markt; i18n später teuer nachzurüsten. |

---

## 2 · Gap-Analyse gegen die Vision (4 Säulen)

### Säule A — „Alle Daten zusammenbringen"
**Heute:** manuelle Logs, Bastel-Strava, Bastel-Garmin.
**Ziel:** Ein-Klick-Verbindungen: **Strava (zentral) → Apple Health/HealthKit → Garmin (offiziell) → manuell**. Dazu Wetter, Kalender (Reisen/Termine → Plan weiß Bescheid), später Schlaf-/Ernährungsquellen.
**Gap:** Backend + zentrale OAuth + nativer Wrapper (HealthKit). Ohne das bleibt die Säule Behauptung.

### Säule B — „…und auswertet"
**Heute:** Recovery-Score (gut), Compliance, Summen.
**Ziel:** Belastungsmodell (CTL/ATL/TSB aus HF/Dauer), laufende **Prognose** („aktuell auf Kurs für 3:52 — 7 min unter Ziel"), Einzel-Einheiten-Analyse mit Coach-Verdict, Zonenverteilung (80/20-Check), Trends (Pace bei gleicher HF ↓ = fitter).
**Gap:** Rechenmodelle sind ohne Backend machbar (Client reicht), aber es fehlen die Rohdaten (HF-Streams) → hängt an Säule A.

### Säule C — „Ein Plan, der alles berücksichtigt" ⟵ **DER Differenzierer**
**Heute:** Plan wird einmal generiert, dann statisch.
**Ziel — der adaptive Loop, den kein Wettbewerber sauber hat:**
1. **Morgens:** Recovery schlecht? → heutige Quality-Einheit wird automatisch getauscht/entschärft, mit Begründung vom Coach.
2. **Einheit verpasst?** → Woche wird umgeplant (nicht einfach „verpasst" markiert).
3. **Wöchentliche Rekalibrierung:** Ist-Paces vs. Plan-Paces → Zonen & Prognose nachziehen; zu leicht/zu schwer → Umfang anpassen.
4. **Leben passiert:** „Nächste Woche Dienstreise" im Coach-Chat → Plan baut die Woche um (Kurz-Einheiten, Hotel-Kraft, Long Run verschoben).
**Gap:** Re-Planning-Engine (Worker-Endpoint `/replan` + Diff-Anwendung auf `DB.plan`), Trigger-Logik, UI für „Plan wurde angepasst, hier warum".

### Säule D — „Auf dich und dein Leben geschnitten"
**Heute:** Onboarding erfasst Leben grob (Tage, langer Tag, Constraints als Freitext).
**Ziel:** HF-Zonen/Geburtsjahr/Gewicht im Onboarding (für Zonen & Kalorien), Verletzungshistorie strukturiert, Kalender-Anbindung, Mehrere Rennen/Saison, Tageszeit-Präferenzen, Wetter am Standort.
**Gap:** Onboarding v2 + Profilpflege-UI (statt `prompt()`), Kalender-Integration.

---

## 3 · Strategie (festgelegt 02.07.2026): Produkt vor Infrastruktur

> **Entscheidung:** Die App bleibt **lokal** (localStorage, kein Backend), bis sie funktionell
> „der Hammer" ist. Erst dann kommt das technische Gerüst (Accounts/Sync), und **als allerletzter
> Schritt** die Datenanbindung — dann über **Apple Health/HealthKit als DIE eine Quelle**
> (einfacher für Endverbraucher als Strava-/Garmin-APIs; Garmin-/Strava-Daten landen ohnehin
> in Apple Health). Die bestehenden Strava-/Garmin-Bastel-Anbindungen bleiben als Dev-Features
> für den eigenen Gebrauch.

**Konsequenz für die Reihenfolge:**

| Stufe | Inhalt | Status |
|---|---|---|
| **A — Produkt** (jetzt) | Alles, was die App lokal herausragend macht: adaptiver Plan, Analyse-Tiefe, Tracking komplett, Renntag, Feinschliff | ⟵ **aktueller Fokus** |
| **B — Gerüst** | Accounts, DB-Sync, Worker-Härtung, Domain, DSGVO | danach |
| **C — Anbindung & Launch** | Capacitor + **HealthKit** (eine Integration statt drei), App Store, Abo | zuletzt |

**Wichtig für A:** Datenmodell so halten, dass HealthKit es später nur „befüllt"
(Aktivitäten mit HF/Dauer/Distanz, Schlaf/HRV als Wellness-Tage) — dann ist Stufe C ein
Adapter, kein Umbau. Das ist heute bereits so angelegt (`DB.logs`, `DB.activities`, `DB.wellness`).

### Stufe A im Detail — was „der Hammer" konkret heißt

**A1 · Der adaptive Plan** *(Kern der Vision, komplett lokal machbar — Recovery kommt solange aus Garmin-Dev-Anbindung oder manueller Eingabe „Wie fühlst du dich heute?")*
- [x] Morgen-Check: schlechte Recovery/Gefühl → Einheit wird entschärft (ein Tap, mit Begründung) *(02.07.)*
- [ ] Verpasst-Logik: nicht getrackte Einheit → Umplanungs-Vorschlag statt stilles Loch
- [ ] Wochen-Rekalibrierung: Ist-Paces vs. Plan → Zonen/Prognose nachziehen (So-Abend-Report)
- [ ] Coach führt Planänderungen aus (JSON-Diff → Plan), nicht nur beraten
- [ ] Änderungs-Feed: „Plan angepasst — deshalb" (Vertrauen!)

**A2 · Analyse-Tiefe**
- [ ] Einzel-Einheiten-Analyse mit KI-Verdict (Pace/HF, Plan-Abgleich — V1-Funktion als Vorbild)
- [ ] Form-Modell (CTL/ATL/TSB) aus geloggten Einheiten — rein clientseitig
- [ ] Prognose-Trend „unter der Linie" (3-Punkte-Chart, Design existiert in der Spec)
- [ ] Zonenverteilung / 80-20-Check pro Woche

**A3 · Tracking komplett**
- [ ] Aktivitäten-Liste sichtbar (DB.activities existiert schon, keine UI)
- [ ] Kraft-/Mobility-Einheit live mitschreiben (V1-Gym als Vorbild, Hyrox-relevant!)
- [ ] Freie Einheiten je Woche (Padel, Rad, …) zählen wie in V1
- [x] Subjektives Tagesgefühl erfassen (ersetzt Garmin-Recovery, bis HealthKit kommt) *(02.07., Teil des Morgen-Checks)*

**A4 · Renntag & Erlebnis**
- [ ] Rennwochen-Modus (Taper-Countdown, Checkliste, Pacing-Plan)
- [ ] Wochenreport (Zusammenfassung + Coach-Einordnung)
- [ ] Onboarding-Ergänzung: Geburtsjahr/HF-Daten (max/Ruhe) → echte Zonen statt Schätzung

**A5 · Feinschliff**
- [ ] Übergänge/Animationen (Sheet-Motion, Tab-Crossfade), Leere-Zustände, Microcopy
- [ ] PWA-Manifest + Icons für V2 (lokal installierbar „wie echt")
- [ ] Plan-Editor-Feinheiten (Einheit verschieben/tauschen per UI, nicht nur Chat)

---

## 3b · Ursprüngliche Phasen (B/C-Material, verschoben bis Stufe A fertig)

### Phase 0 — Fundament reparieren *(Tage, kein Backend nötig)*
- [ ] Eigenes **Repo + Domain** (z. B. `theline.app`) — weg von `…/marathon-koeln-2026/v2/`.
- [ ] **PWA komplett**: eigenes Manifest, Icons, Standalone, Theme — installierbar wie V1.
- [ ] Worker-URL **fest eingebaut** (Default), `prompt()`-Setup nur noch als Override.
- [ ] Fehler-Tracking (z. B. Sentry) + einfache, DSGVO-freundliche Nutzungsstatistik.
- [ ] Health-**Disclaimer** in Onboarding, Impressum/Datenschutz-Seiten (statisch reicht zunächst).

### Phase 1 — Commercial-ready Kern *(Wochen: Accounts, sichere Integrationen)*
- [ ] **Backend**: Cloudflare Workers + **D1** (SQL) + KV — passt zum Stack, eine Plattform, günstig skalierend. (Alternative: Supabase, wenn schneller.)
- [ ] **Accounts**: E-Mail-Magic-Link oder Sign in with Apple/Google. DB-Sync statt nur localStorage (localStorage bleibt Offline-Cache).
- [ ] **Zentrale Strava-OAuth**: eine App, Token-Exchange im Worker, Nutzer klickt nur „Verbinden".
- [ ] **Worker-Härtung**: Auth-Token pro Nutzer, Rate-Limits, Kosten-Kappe pro Konto und Tier.
- [ ] Verbindungen-UI ohne `prompt()` (echte Settings-Screens im LINE-Stil).
- [ ] **DSGVO**: Datenexport, Konto löschen, AV-abgesicherte Dienste.

### Phase 2 — Der adaptive Plan *(der Burggraben — parallel zu Phase 1 beginnbar)*
- [ ] Worker `/replan`: bekommt Plan + Ereignis (Recovery, Skip, Reise, Ist-Zeiten) → liefert Wochen-Diff mit Begründung.
- [ ] **Morgen-Check**: Recovery < Schwelle → Vorschlag „Heute Z2 statt Intervalle" (annehmen/ablehnen, ein Tap).
- [ ] **Verpasst-Logik**: Einheit nicht getrackt bis Tagesende → Umplanungs-Vorschlag am Folgetag.
- [ ] **Wöchentliche Rekalibrierung**: So-Abend-Zusammenfassung („Woche 8: 92 % erfüllt, Easy-Pace 8 s schneller bei gleicher HF → Zonen angepasst, Prognose 3:52").
- [ ] Coach-Chat kann Planänderungen **ausführen** (wie V1-Plan-Editor: JSON-Diff → `DB.plan`), nicht nur beraten.
- [ ] Änderungshistorie: „Dein Plan wurde angepasst — deshalb." (Vertrauen = Kern des Produkts.)

### Phase 3 — Datentiefe & echte Integrationen *(macht Säule A+B wahr)*
- [ ] **Capacitor-Wrapper** (iOS zuerst) → **HealthKit**: HF, Schlaf, Workouts von Apple Watch — löst „Garmin-Problem" für die Mehrheit elegant.
- [ ] **Garmin Health API** Partnerantrag parallel stellen (Vorlauf!); Fallback: Aggregator (Terra/ROOK) evaluieren.
- [ ] Belastungsmodell **CTL/ATL/TSB** + Form-Anzeige („frisch/müde") — clientseitig berechenbar.
- [ ] **Einzel-Einheiten-Analyse** (V1-Funktion portieren + KI-Verdict): Pace/HF-Verlauf, Drift, Zonen, Plan-Abgleich.
- [ ] **Prognose-Trend** auf Analyse (3-Punkte-Chart „unter der Linie" — Design existiert schon in der Spec).
- [ ] GPX/TCX-Import (aus V1 portieren).

### Phase 4 — Monetarisierung & Wachstum
- [ ] **Pricing** (Benchmark, Größenordnung): Runna ~ 16–18 €/M, TrainingPeaks ~ 20 $/M. Einstieg z. B. **9,99 €/M / 69,99 €/J** — KI-Coach + adaptiver Plan rechtfertigen das.
- [ ] **Free Tier**: Onboarding + statischer Plan + manuelles Tracking. **Premium**: KI-Coach, adaptiver Plan, Integrationen, Tiefenanalyse. (Free muss beeindrucken, Premium muss der Ort sein, wo die Vision lebt.)
- [ ] **Stripe** (Web) zuerst; App-Store-IAP erst mit Capacitor-Release.
- [ ] **Push-Reminder** (Worker existiert aus V1!): heutige Einheit, Wochenrückblick, Recovery-Warnung.
- [ ] Retention: Wochenreport, Streaks dezent (seriös, kein Gamification-Kitsch — Markenkern!).
- [ ] **i18n** (EN als zweite Sprache, mi/km-Umschalter) — öffnet 10× Markt.
- [ ] App Store / Play Store Release (Capacitor), Landing Page mit Produktvideo (Mockup-Tooling existiert in `mockups/`).

### Phase 5 — Vertiefung (nach Product-Market-Fit)
- Kalender-Integration (Termine → Plan), Wetter → Einheiten-Hinweise.
- Renntag-Modul: Pacing-Plan, Verpflegungsstrategie, Countdown-Woche.
- Saisonplanung (mehrere Rennen, A/B/C-Priorität).
- Kraft-/Mobility-Bibliothek mit geführten Einheiten (Hyrox!).
- Community/Coach-Marktplatz (optional, spät).

---

## 4 · Technik-Empfehlungen (konkret)

| Entscheidung | Empfehlung | Warum |
|---|---|---|
| App-Shell | **PWA behalten**, mit Capacitor für Stores/HealthKit ummanteln | Ein Code, native Fähigkeiten nur wo nötig |
| Backend | **Cloudflare Workers + D1 + KV** | Stack existiert schon (Worker läuft), eine Plattform, minimale Fixkosten |
| Auth | Magic-Link + Sign in with Apple | Passwortlos = weniger Support, Apple nötig für iOS-Release |
| KI | Weiter Anthropic via Worker; **Caching + Tier-Limits**; Fallback-Generator behalten | Kostenkontrolle; App bleibt offline funktionsfähig |
| Code | `v2/index.html` (1.376 Zeilen) bald in Module splitten (ohne Framework möglich: ES-Module + kleiner Build) | Wartbarkeit vor Feature-Explosion |
| Wearables | Reihenfolge: **Strava zentral → HealthKit → Garmin offiziell** | Aufwand/Nutzen: Strava = 80 % der Läufer, HealthKit = Apple-Watch-Masse, Garmin-API dauert (Antrag) |

---

## 5 · Risiken & Gegenmittel

| Risiko | Gegenmittel |
|---|---|
| Garmin-API-Zugang dauert/scheitert | HealthKit zuerst; Aggregator als Plan B; Strava deckt Aktivitäten ab |
| KI-Kosten laufen weg | Harte Tier-Limits, Caching, Fallback-Generator, kleines Modell für Routine-Antworten |
| Konkurrenz (Runna, Coopah, TrainingPeaks) | Deren Schwäche: statische Pläne bzw. keine Recovery-Integration. **Phase 2 (adaptiv) ist der Burggraben — priorisieren.** |
| Ein-Personen-Projekt-Risiko | Jede Phase endet auslieferbar; kein Big-Bang-Rewrite; Fallbacks überall |
| Health-Claims / Haftung | Disclaimer, konservative Coach-Prompts (existieren), keine Diagnostik |

---

## 6 · Die nächsten 5 konkreten Schritte (Produkt-first, Stand 02.07.2026)

1. **Morgen-Check + Tagesgefühl** (A1/A3): „Wie fühlst du dich?" bzw. Recovery → Einheit anpassen mit Begründung. Kleinster Baustein, größte „für mich gemacht"-Wirkung.
2. **Verpasst-Logik + Coach führt Änderungen aus** (A1): der Plan lebt.
3. **Einzel-Einheiten-Analyse mit KI-Verdict** (A2): nach jedem Lauf ein echtes Coach-Feedback.
4. **Wochen-Rekalibrierung + Wochenreport** (A1/A4): Sonntagabend-Moment.
5. **Kraft/Mobility-Tracking + Aktivitäten-Liste** (A3): Tracking fühlt sich vollständig an.

*(Worker-Härtung, Domain, Accounts: bewusst zurückgestellt bis Stufe A sitzt. Einzige Ausnahme: sollte der Worker öffentlich kursieren, Auth vorziehen.)*

---

*Dokument wird fortgeschrieben; Haken setzen direkt hier im Markdown.*
