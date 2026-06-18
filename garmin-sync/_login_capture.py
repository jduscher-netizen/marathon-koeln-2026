#!/usr/bin/env python3
"""
Hilfsskript für setup.sh — NICHT direkt aufrufen.

Loggt sich bei Garmin ein und schreibt AUSSCHLIESSLICH den Base64-Token auf
stdout. Alle Prompts und Meldungen gehen auf stderr, damit setup.sh per
$(...) nur den Token einfängt. Muss als echte Datei laufen (nicht über
`python - <<heredoc`), sonst liest input() die Tastatureingabe nicht.
"""
import base64, io, os, sys, tarfile, tempfile
from getpass import getpass
from garminconnect import Garmin


def ask(prompt):
    sys.stderr.write(prompt)
    sys.stderr.flush()
    return sys.stdin.readline().strip()


def main():
    email = ask("Garmin E-Mail: ")
    pw = getpass("Garmin Passwort (Eingabe bleibt unsichtbar): ")
    g = Garmin(
        email=email,
        password=pw,
        prompt_mfa=lambda: ask("2FA-Code (falls gefragt): "),
        retry_attempts=1,  # nicht hämmern — sonst verschärft sich Garmins Rate-Limit
    )

    # login(tokenstore) authentifiziert UND legt die Tokens in diesem
    # Verzeichnis ab — genau das Format, das sync.py später via g.login(dir) lädt.
    d = tempfile.mkdtemp()
    try:
        g.login(d)
    except Exception as e:
        msg = str(e)
        if "429" in msg or "rate" in msg.lower():
            sys.stderr.write(
                "\n✗ Garmin blockiert deine IP gerade (429, Rate-Limit).\n"
                "  → Bitte 1–2 Stunden warten (oder anderes Netz/Handy-Hotspot)\n"
                "    und dann setup.sh GENAU EINMAL erneut ausführen.\n"
                "  Mehrfaches schnelles Wiederholen verlängert die Sperre.\n"
            )
            sys.exit(2)
        raise

    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for fn in os.listdir(d):
            tar.add(os.path.join(d, fn), arcname=fn)

    sys.stderr.write("\n✓ Garmin-Login erfolgreich.\n")
    sys.stdout.write(base64.b64encode(buf.getvalue()).decode())


if __name__ == "__main__":
    main()
