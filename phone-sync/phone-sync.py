#!/usr/bin/env python3
"""phone-sync.py -- pull apps you built on your phone into this PC's Moor.

Your phone's Moor (Settings -> Sync to PC) drops a package into your private
GitHub mailbox repo (bassseamoor/moor-phone-drop). This script fetches that
package and installs each app into your PC Moor's "Made by you" shelf
(data/creations/*.html + data/my-apps.json).

First run asks for two things and remembers them next to this script:
  1. Your Moor folder  (default: C:\\Users\\User\\AppData\\Local\\moor)
  2. A GitHub token that can READ the private moor-phone-drop repo
     (github.com -> Settings -> Developer settings -> Personal access tokens
      -> Fine-grained -> pick moor-phone-drop -> Contents: read-only)

After that, just run it any time -- double-click MOOR-Phone-Sync.cmd.
Only Python's standard library is used.
"""

import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO = "bassseamoor/moor-phone-drop"
DROP_PATH = "drop.json"
CONFIG_NAME = "phone-sync-config.json"
# MOOR_SYNC_API overrides the mailbox URL (used for testing; normally the
# public GitHub API below).
API = os.environ.get("MOOR_SYNC_API") or \
    "https://api.github.com/repos/{}/contents/{}".format(REPO, DROP_PATH)


def script_dir():
    return Path(sys.argv[0]).resolve().parent \
        if getattr(sys, "frozen", False) is False else Path(sys.executable).resolve().parent


def default_moor_dir():
    for cand in (
        Path(r"C:\Users\User\AppData\Local\moor"),
        Path(os.environ.get("LOCALAPPDATA", "")) / "moor",
        Path.home() / "AppData" / "Local" / "moor",
    ):
        if cand and str(cand) and (cand / "serve.py").is_file():
            return str(cand)
    return r"C:\Users\User\AppData\Local\moor"


def load_config():
    cfg_path = script_dir() / CONFIG_NAME
    cfg = {}
    if cfg_path.is_file():
        try:
            cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            cfg = {}
    if "--moor-dir" in sys.argv:
        cfg["moor_dir"] = sys.argv[sys.argv.index("--moor-dir") + 1]
    if "--token" in sys.argv:
        cfg["token"] = sys.argv[sys.argv.index("--token") + 1]
    if not cfg.get("token") and os.environ.get("MOOR_PHONE_TOKEN"):
        cfg["token"] = os.environ["MOOR_PHONE_TOKEN"]

    changed = False
    if not cfg.get("moor_dir"):
        ans = input("Moor folder [{}]: ".format(default_moor_dir())).strip()
        cfg["moor_dir"] = ans or default_moor_dir()
        changed = True
    if not cfg.get("token"):
        print("Create a read-only token: github.com -> Settings -> Developer settings")
        print("-> Personal access tokens -> Fine-grained -> repo: {} -> Contents: read".format(REPO))
        cfg["token"] = input("GitHub token: ").strip()
        changed = True
    if changed:
        try:
            cfg_path.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
            print("Saved settings next to this script.")
        except OSError as e:
            print("Could not save settings: {}".format(e))
    return cfg


def fetch_drop(token):
    req = urllib.request.Request(API, headers={
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + token,
        "User-Agent": "moor-phone-sync",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            doc = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        if e.code in (401, 403):
            sys.exit("GitHub rejected the token ({}). Check it and run again.".format(e.code))
        sys.exit("GitHub said {}. Try again in a bit.".format(e.code))
    except OSError as e:
        sys.exit("Could not reach GitHub: {}".format(e))
    try:
        payload = json.loads(base64.b64decode(doc["content"]).decode("utf-8"))
    except (KeyError, ValueError):
        sys.exit("The mailbox file did not look right. Send again from your phone.")
    if payload.get("kind") != "phone-drop" or not isinstance(payload.get("apps"), list):
        sys.exit("The mailbox file is not a phone drop. Send again from your phone.")
    return payload


def safe_name(app_id):
    s = re.sub(r"[^a-zA-Z0-9_-]", "", str(app_id))[:48]
    return s or "app"


def main():
    cfg = load_config()
    moor_dir = Path(cfg["moor_dir"])
    if not moor_dir.is_dir():
        sys.exit("Moor folder not found: {}\nRun again with --moor-dir <path>.".format(moor_dir))

    payload = fetch_drop(cfg["token"])
    if payload is None:
        print("Nothing in the mailbox yet -- send apps from your phone first")
        print("(Moor on your phone -> Settings -> Sync to PC -> Send apps to PC).")
        return

    apps = payload["apps"]
    print("Mailbox has {} app{} (sent {}).".format(
        len(apps), "" if len(apps) == 1 else "s", payload.get("exported_at", "?")))

    data_dir = moor_dir / "data"
    creations = data_dir / "creations"
    creations.mkdir(parents=True, exist_ok=True)
    reg_path = data_dir / "my-apps.json"
    try:
        registry = json.loads(reg_path.read_text(encoding="utf-8"))
        if not isinstance(registry, list):
            registry = []
    except (OSError, ValueError):
        registry = []
    by_id = {str(a.get("id")): a for a in registry if isinstance(a, dict)}

    added, updated, skipped = 0, 0, 0
    for app in apps:
        if not isinstance(app, dict) or not app.get("html"):
            skipped += 1
            continue
        aid = str(app.get("id") or safe_name(app.get("name")))
        fname = safe_name(aid) + ".html"
        target = creations / fname
        html = app["html"]
        name = str(app.get("name") or "Untitled app")
        desc = "Sent from your phone" + (" - kit: " + app["kit"] if app.get("kit") else "")

        entry = by_id.get(aid)
        if entry is not None and target.is_file():
            try:
                same = target.read_text(encoding="utf-8") == html
            except OSError:
                same = False
            if same and entry.get("file") == fname:
                skipped += 1
                continue
            entry["name"] = name
            entry["desc"] = desc
            entry["file"] = fname
            updated += 1
        else:
            registry.append({"id": aid, "name": name, "desc": desc, "file": fname})
            by_id[aid] = registry[-1]
            added += 1
        try:
            target.write_text(html, encoding="utf-8")
        except OSError as e:
            sys.exit("Could not write {}: {}".format(target, e))

    try:
        reg_path.write_text(json.dumps(registry, indent=2), encoding="utf-8")
    except OSError as e:
        sys.exit("Could not update the app registry: {}".format(e))

    print("Done: {} new, {} updated, {} unchanged.".format(added, updated, skipped))
    print("Refresh your PC Moor's Apps to see them under \"Made by you\".")


if __name__ == "__main__":
    main()
