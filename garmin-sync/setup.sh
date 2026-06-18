#!/usr/bin/env bash
#
# EINMALIG LOKAL AUSFÜHREN — richtet den Garmin-Sync vollständig ein:
#   1. Garmin-Login (E-Mail/Passwort/2FA werden lokal abgefragt, gehen nur zu Garmin)
#   2. Login-Token wird direkt als GitHub-Secret GARMINTOKENS_B64 gespeichert (nicht angezeigt)
#   3. Der tägliche Sync-Workflow wird einmal manuell gestartet
#
# Aufruf:
#   bash garmin-sync/setup.sh
#
# Voraussetzungen (sind auf diesem Rechner schon erfüllt): uv, gh (eingeloggt).
set -euo pipefail

REPO="jduscher-netizen/marathon-koeln-2026"
UV="${HOME}/.local/bin/uv"
HERE="$(cd "$(dirname "$0")" && pwd)"

command -v "$UV" >/dev/null 2>&1 || { echo "Fehler: uv nicht gefunden unter $UV" >&2; exit 1; }
command -v gh  >/dev/null 2>&1 || { echo "Fehler: gh (GitHub CLI) nicht gefunden" >&2; exit 1; }

echo "→ Garmin-Login. Gleich wirst du nacheinander gefragt:" >&2
echo "    1) Garmin E-Mail  (sichtbar)" >&2
echo "    2) Garmin Passwort (unsichtbar — einfach tippen, nichts erscheint, dann Enter)" >&2
echo "    3) ggf. 2FA-Code" >&2
echo "  Die Eingaben bleiben lokal und gehen ausschließlich an Garmin." >&2
echo >&2

# Login läuft als echte Datei -> Tastatureingabe (stdin) bleibt mit dem Terminal
# verbunden; nur der Token landet auf stdout und wird hier eingefangen.
B64="$("$UV" run --quiet --python 3.12 --with "garminconnect>=0.3.6" python "$HERE/_login_capture.py")"

if [ -z "${B64:-}" ]; then
  echo "Fehler: Kein Token erhalten — Login abgebrochen?" >&2
  exit 1
fi

echo "→ Token als GitHub-Secret GARMINTOKENS_B64 speichern…" >&2
printf '%s' "$B64" | gh secret set GARMINTOKENS_B64 --repo "$REPO"

echo "→ Sync-Workflow einmal starten…" >&2
gh workflow run "Garmin Wellness Sync" --repo "$REPO"

echo >&2
echo "✓ Fertig. Der Sync läuft jetzt und danach täglich um 06:00 UTC." >&2
echo "  Status:  gh run list --repo $REPO --workflow 'Garmin Wellness Sync'" >&2
