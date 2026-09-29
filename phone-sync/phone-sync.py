#!/usr/bin/env python3
"""phone-sync.py -- pull apps you built on your phone into this PC's Moor.

Your phone's Moor (Settings -> Sync to PC) drops a package into your private
GitHub mailbox repo (bassseamoor/moor-phone-drop). This script fetches that
package and installs each app into your PC Moor's "Made by you" shelf
(data/creations/*.html + data/my-apps.json).

v2: finds your Moor folder(s) automatically -- no more guessing which folder
your Moor actually runs from. If several look like a real Moor (serve.py
present), the apps go into ALL of them, so whichever one you open has them.
Your saved token (phone-sync-config.json next to this script) is reused;
you are only asked for it once.

After that, just run it any time -- double-click MOOR-Phone-Sync.cmd.
No Moor restart needed: the app reads the shelf from disk on every load.
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


def find_data_dirs():
    """Return data-dir Paths for every Moor install found on this PC."""
    found = []

    # 1. Explicit override wins (serve.py itself honours this env var).
    env_data = os.environ.get("MOOR_DATA_DIR")
    if env_data:
        p = Path(env_data)
        if p.is_dir():
            found.append(p)

    # 2. Known install locations: a folder counts if serve.py lives in it.
    home = Path.home()
    local_app = Path(os.environ.get("LOCALAPPDATA", "")) if os.environ.get("LOCALAPPDATA") else None
    candidates = [
        Path(r"C:\Users\User\AppData\Local\moor"),
        local_app / "moor" if local_app else None,
        home / "AppData" / "Local" / "moor",
        Path(r"C:\Users\User\Documents\Codex\moor-v1-deploy\moor-v1"),
        home / "Documents" / "Codex" / "moor-v1-deploy" / "moor-v1",
    ]
    for cand in candidates:
        if cand is None:
            continue
        try:
            if (cand / "serve.py").is_file():
                d = cand / "data"
                if d not in found:
                    found.append(d)
        except OSError:
            continue

    # 3. Last resort: a saved folder from an older run of this script.
    cfg_path = script_dir() / CONFIG_NAME
    try:
        cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        cfg = {}
    old = cfg.get("moor_dir")
    if old:
        d = Path(old) / "data"
        try:
            if (Path(old) / "serve.py").is_file() and d not in found:
                found.append(d)
        except OSError:
            pass

    # Deduplicate while keeping order.
    seen, uniq = set(), []
    for d in found:
        key = str(d).lower()
        if key not in seen:
            seen.add(key)
            uniq.append(d)
    return uniq


def load_token():
    cfg_path = script_dir() / CONFIG_NAME
    cfg = {}
    if cfg_path.is_file():
        try:
            cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            cfg = {}
    if "--token" in sys.argv:
        cfg["token"] = sys.argv[sys.argv.index("--token") + 1]
    if not cfg.get("token") and os.environ.get("MOOR_PHONE_TOKEN"):
        cfg["token"] = os.environ["MOOR_PHONE_TOKEN"]
    if not cfg.get("token"):
        print("One-time setup: a token that can READ the private mailbox repo.")
        print("github.com -> Settings -> Developer settings -> Personal access")
        print("tokens -> Fine-grained -> repo: {} -> Contents: read".format(REPO))
        cfg["token"] = input("GitHub token: ").strip()
        try:
            cfg_path.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
            print("Saved token next to this script -- you won't be asked again.")
        except OSError as e:
            print("Could not save token: {}".format(e))
    return cfg.get("token", "")


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


def install_into(data_dir, apps):
    """Install apps into one data dir. Returns (added, updated, unchanged, problems)."""
    creations = data_dir / "creations"
    try:
        creations.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        sys.exit("Could not create {}: {}".format(creations, e))
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

    # Verify: every registered entry must have its file on disk.
    problems = []
    try:
        check = json.loads(reg_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        check = []
    for a in check:
        if isinstance(a, dict) and a.get("file"):
            if not (creations / a["file"]).is_file():
                problems.append(a.get("file"))
    return added, updated, skipped, problems


def main():
    data_dirs = find_data_dirs()
    if not data_dirs:
        sys.exit(
            "Could not find your Moor installation on this PC.\n"
            "Set the MOOR_DATA_DIR environment variable to its data folder\n"
            "and run again."
        )
    print("Found Moor data folder(s):")
    for d in data_dirs:
        print("  " + str(d))

    token = load_token()
    if not token:
        sys.exit("No token given -- nothing to do.")

    payload = fetch_drop(token)
    if payload is None:
        print("Nothing in the mailbox yet -- send apps from your phone first")
        print("(Moor on your phone -> Settings -> Sync to PC -> Send apps to PC).")
        return

    apps = payload["apps"]
    print("Mailbox has {} app{} (sent {}).".format(
        len(apps), "" if len(apps) == 1 else "s", payload.get("exported_at", "?")))

    for d in data_dirs:
        added, updated, skipped, problems = install_into(d, apps)
        print("{}: {} new, {} updated, {} unchanged.".format(d, added, updated, skipped))
        if problems:
            print("  WARNING: registered but file missing: {}".format(", ".join(problems)))
    print("Done.")
    print("Just refresh your PC Moor's Apps view -- they are under \"Made by you\".")
    print("(No restart needed.)")


if __name__ == "__main__":
    main()
