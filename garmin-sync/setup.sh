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

command -v "$UV" >/dev/null 2>&1 || { echo "Fehler: uv nicht gefunden unter $UV" >&2; exit 1; }
command -v gh  >/dev/null 2>&1 || { echo "Fehler: gh (GitHub CLI) nicht gefunden" >&2; exit 1; }

echo "→ Garmin-Login. Passwort + ggf. 2FA werden gleich abgefragt." >&2
echo "  (Die Eingaben bleiben lokal und gehen ausschließlich an Garmin.)" >&2
echo >&2

# Nur der Base64-Token landet auf stdout; alle Prompts/Meldungen gehen nach stderr,
# damit $(...) unten ausschließlich den Token einfängt.
B64="$("$UV" run --quiet --python 3.12 --with "garminconnect>=0.3.6" python - <<'PY'
import base64, io, os, sys, tarfile, tempfile
from getpass import getpass
from garminconnect import Garmin

def ask(p):
    sys.stderr.write(p); sys.stderr.flush()
    return sys.stdin.readline().strip()

email = ask("Garmin E-Mail: ")
pw = getpass("Garmin Passwort: ")  # schreibt Prompt auf /dev/tty, nicht stdout
g = Garmin(email=email, password=pw, prompt_mfa=lambda: ask("2FA-Code (falls gefragt): "))
g.login()

d = tempfile.mkdtemp()
g.garth.dump(d)
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode="w:gz") as tar:
    for fn in os.listdir(d):
        tar.add(os.path.join(d, fn), arcname=fn)

sys.stderr.write("\n✓ Garmin-Login erfolgreich.\n")
sys.stdout.write(base64.b64encode(buf.getvalue()).decode())
PY
)"

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
echo "  Status ansehen:  gh run list --repo $REPO --workflow 'Garmin Wellness Sync'" >&2
