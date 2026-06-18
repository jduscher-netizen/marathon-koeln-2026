#!/usr/bin/env python3
"""
Täglicher Garmin-Wellness-Sync (läuft in GitHub Actions).
Zieht Schlaf, HRV, Ruhepuls, Body Battery der letzten 8 Tage und schreibt sie
in einen privaten Gist, den die SUB4-App liest.

Env (als GitHub-Secrets):
  GARMINTOKENS_B64   – aus login.py
  GIST_TOKEN         – GitHub-PAT mit Scope "gist"
  WELLNESS_GIST_ID   – ID des Wellness-Gists

Defensiv: jede Metrik einzeln in try/except — fehlt ein Feld, bleibt es null
statt den ganzen Lauf abzubrechen. Garmin ändert Feldnamen gelegentlich.
"""
import base64, datetime, io, json, os, tarfile, tempfile
import requests
from garminconnect import Garmin


def restore_login():
    b64 = os.environ["GARMINTOKENS_B64"]
    d = tempfile.mkdtemp()
    with tarfile.open(fileobj=io.BytesIO(base64.b64decode(b64)), mode="r:gz") as tar:
        tar.extractall(d)
    g = Garmin()
    g.login(d)
    return g


def safe(fn, default=None):
    try:
        return fn()
    except Exception as e:
        return default


def day_entry(g, ds):
    e = {"date": ds}
    sleep = safe(lambda: g.get_sleep_data(ds), {}) or {}
    dto = (sleep.get("dailySleepDTO") or {})
    e["sleepSeconds"] = dto.get("sleepTimeSeconds")
    e["deepSeconds"] = dto.get("deepSleepSeconds")
    e["remSeconds"] = dto.get("remSleepSeconds")
    e["lightSeconds"] = dto.get("lightSleepSeconds")
    e["awakeSeconds"] = dto.get("awakeSleepSeconds")
    scores = (dto.get("sleepScores") or {})
    e["sleepScore"] = ((scores.get("overall") or {}).get("value"))

    hrv = safe(lambda: g.get_hrv_data(ds), {}) or {}
    hsum = (hrv.get("hrvSummary") or {})
    e["hrvLastNight"] = hsum.get("lastNightAvg")
    e["hrvWeeklyAvg"] = hsum.get("weeklyAvg")
    e["hrvStatus"] = hsum.get("status")
    bl = (hsum.get("baseline") or {})
    e["hrvBalancedLow"] = bl.get("balancedLow")
    e["hrvBalancedHigh"] = bl.get("balancedUpper") or bl.get("balancedHigh")

    rhr = safe(lambda: g.get_rhr_day(ds), {}) or {}
    # Struktur variiert je Version — mehrere Pfade versuchen
    val = None
    try:
        mm = ((rhr.get("allMetrics") or {}).get("metricsMap") or {})
        arr = mm.get("WELLNESS_RESTING_HEART_RATE") or []
        if arr:
            val = arr[0].get("value")
    except Exception:
        pass
    if val is None:
        val = rhr.get("restingHeartRate")
    e["restingHr"] = val

    bb = safe(lambda: g.get_body_battery(ds, ds), []) or []
    if isinstance(bb, list) and bb:
        e["bodyBatteryCharged"] = bb[0].get("charged")
        e["bodyBatteryDrained"] = bb[0].get("drained")
        lvls = bb[0].get("bodyBatteryValuesArray") or []
        if lvls:
            # letzter gemessener Wert des Tages
            try:
                e["bodyBatteryLast"] = lvls[-1][1]
            except Exception:
                pass
    return e


def main():
    g = restore_login()
    today = datetime.date.today()
    days = []
    for i in range(8):
        ds = (today - datetime.timedelta(days=i)).isoformat()
        days.append(day_entry(g, ds))

    payload = {"updated": datetime.datetime.utcnow().isoformat() + "Z", "days": days}
    out = json.dumps(payload, ensure_ascii=False)

    r = requests.patch(
        f"https://api.github.com/gists/{os.environ['WELLNESS_GIST_ID']}",
        headers={
            "Authorization": "token " + os.environ["GIST_TOKEN"],
            "Accept": "application/vnd.github+json",
        },
        json={"files": {"garmin-wellness.json": {"content": out}}},
        timeout=30,
    )
    r.raise_for_status()
    filled = sum(1 for d in days if d.get("sleepSeconds") or d.get("hrvLastNight"))
    print(f"OK — {len(days)} Tage geschrieben, {filled} mit Schlaf/HRV-Daten.")


if __name__ == "__main__":
    main()
