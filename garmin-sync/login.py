#!/usr/bin/env python3
"""
EINMALIG LOKAL AUSFÜHREN — erzeugt einen Login-Token für den GitHub-Actions-Job,
damit der nicht jedes Mal dein Passwort + 2FA braucht.

    cd garmin-sync
    pip install -r requirements.txt
    python login.py

Loggt dich bei Garmin ein (inkl. 2FA-Abfrage falls aktiv) und gibt am Ende einen
langen Base64-Block aus. Den als GitHub-Secret GARMINTOKENS_B64 speichern:

    gh secret set GARMINTOKENS_B64 --repo jduscher-netizen/marathon-koeln-2026
    (dann den Block einfügen)

Der Token läuft ~1 Jahr; danach login.py erneut ausführen.
"""
import base64, io, os, tarfile, tempfile
from getpass import getpass
from garminconnect import Garmin

def main():
    email = input("Garmin E-Mail: ").strip()
    pw = getpass("Garmin Passwort: ")
    g = Garmin(email=email, password=pw, prompt_mfa=lambda: input("2FA-Code (falls gefragt): ").strip())
    g.login()
    tokendir = tempfile.mkdtemp()
    g.garth.dump(tokendir)
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for fn in os.listdir(tokendir):
            tar.add(os.path.join(tokendir, fn), arcname=fn)
    b64 = base64.b64encode(buf.getvalue()).decode()
    print("\n================ GARMINTOKENS_B64 (kopieren) ================\n")
    print(b64)
    print("\n============================================================\n")
    print("Als GitHub-Secret speichern:")
    print("  gh secret set GARMINTOKENS_B64 --repo jduscher-netizen/marathon-koeln-2026")

if __name__ == "__main__":
    main()
