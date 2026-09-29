#!/usr/bin/env python3
"""phone-sync.py -- pull apps you built on your phone into this PC's Moor.

Run:  python phone-sync.py        (or double-click MOOR-Phone-Sync.cmd)

One-way phone -> PC. No questions asked: it finds every Moor install on
this PC, installs the phone apps into each one, then checks your RUNNING
Moor (the one in your browser) to prove the apps actually show up.

Your GitHub token is saved in phone-sync-config.json next to this script
(after the first run) so you only paste it once.
"""

import base64
import getpass
import json
import os
import sys
import urllib.request
import urllib.error

OWNER = "bassseamoor"
REPO = "moor-phone-drop"
DROP_PATH = "drop.json"
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "phone-sync-config.json")

APP_VERSION = "v5"


# ---------------------------------------------------------------- config ---
def load_config():
    cfg = {}
    if os.path.isfile(CONFIG_FILE):
        try:
            cfg = json.load(open(CONFIG_FILE, encoding="utf-8"))
        except Exception:
            cfg = {}
    return cfg


def save_config(cfg):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception as e:
        print("Note: could not save config: %s" % e)


def get_token(cfg):
    token = cfg.get("token") or os.environ.get("MOOR_PHONE_DROP_TOKEN") or ""
    if not token:
        print("Paste your GitHub token (input hidden, stored next to this script).")
        try:
            token = getpass.getpass("Token: ").strip()
        except Exception:
            token = input("Token: ").strip()
        if not token:
            print("No token given -- nothing to do.")
            sys.exit(1)
        cfg["token"] = token
        save_config(cfg)
        print("Token saved for next time.")
    return token


# --------------------------------------------------------------- github ---
def gh_request(url, token, method="GET", data=None):
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "moor-phone-sync")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def fetch_drop(token):
    url = ("https://api.github.com/repos/%s/%s/contents/%s"
           % (OWNER, REPO, DROP_PATH))
    status, body = gh_request(url, token)
    if status == 404:
        print("ERROR: the phone mailbox is empty -- send an app from your phone first.")
        sys.exit(1)
    if status != 200:
        print("ERROR: GitHub said %s. Is the token still valid?" % status)
        sys.exit(1)
    content_b64 = json.loads(body.decode("utf-8"))["content"]
    drop = json.loads(base64.b64decode(content_b64).decode("utf-8"))
    if drop.get("kind") != "phone-drop":
        print("ERROR: unexpected mailbox format.")
        sys.exit(1)
    return drop.get("apps", [])


# ----------------------------------------------------------- moor detect ---
def candidate_roots():
    home = os.path.expanduser("~")
    local = os.environ.get("LOCALAPPDATA") or os.path.join(home, "AppData", "Local")
    docs = os.path.join(home, "Documents")
    return [
        os.path.join(local, "moor"),
        os.path.join(home, "AppData", "Local", "moor"),
        os.path.join(docs, "Codex", "moor-v1-deploy", "moor-v1"),
        os.path.join(docs, "Codex", "moor-v1-deploy"),
        os.path.join(home, "moor-v1"),
        os.path.join(home, "moor"),
        os.path.join(home, "Documents", "moor-v1"),
    ]


def find_data_dirs():
    """Every folder where Moor keeps its data (data/my-apps.json)."""
    found = []
    seen = set()

    def add(d):
        d = os.path.normpath(d)
        if d not in seen and os.path.isfile(os.path.join(d, "my-apps.json")):
            seen.add(d)
            found.append(d)

    env = os.environ.get("MOOR_DATA_DIR")
    if env and os.path.isdir(env):
        add(env)

    for root in candidate_roots():
        # serve.py right here -> data/ beside it
        if os.path.isfile(os.path.join(root, "serve.py")):
            d = os.path.join(root, "data")
            if os.path.isdir(d):
                add(d)
        # nested moor-v1/serve.py (standard deploy layout) -> data/ beside it
        nested = os.path.join(root, "moor-v1")
        if os.path.isfile(os.path.join(nested, "serve.py")):
            d = os.path.join(nested, "data")
            if os.path.isdir(d):
                add(d)
        # data dir exists even if serve.py moved
        if os.path.isdir(os.path.join(root, "data")):
            add(os.path.join(root, "data"))

    # last resort: honour the folder from an older config, if it still fits
    cfg = load_config()
    old = cfg.get("moor_dir")
    if old:
        d = os.path.join(old, "data")
        if os.path.isdir(d):
            add(d)

    return found


# ---------------------------------------------------------------- install ---
def _created_label(app):
    c = app.get("created")
    if isinstance(c, bool):
        return ""
    if isinstance(c, (int, float)):
        try:
            import datetime
            ts = c / 1000.0 if c > 1e12 else float(c)
            return " - " + datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
        except Exception:
            return ""
    if isinstance(c, str) and c:
        return " - " + c[:10]
    return ""


def install_into(data_dir, apps):
    creations = os.path.join(data_dir, "creations")
    os.makedirs(creations, exist_ok=True)
    reg_path = os.path.join(data_dir, "my-apps.json")

    try:
        registered = json.load(open(reg_path, encoding="utf-8"))
        if not isinstance(registered, list):
            registered = []
    except Exception:
        registered = []
    by_id = {a.get("id"): a for a in registered if isinstance(a, dict)}

    new = updated = unchanged = 0
    for app in apps:
        aid = app.get("id") or "app"
        html = app.get("html") or ""
        fname = aid + ".html"
        dest = os.path.join(creations, fname)
        entry = {
            "id": aid,
            "name": app.get("name") or aid,
            "desc": "Built on phone" + _created_label(app),
            # basename only: serve.py serves /creations/<file> and the
            # registry guard matches on the exact string.
            "file": fname,
        }
        old = by_id.get(aid)
        same = (old == entry and os.path.isfile(dest)
                and open(dest, encoding="utf-8").read() == html)
        if same:
            unchanged += 1
            continue
        with open(dest, "w", encoding="utf-8") as f:
            f.write(html)
        if old:
            registered[registered.index(old)] = entry
            updated += 1
        else:
            registered.append(entry)
            new += 1
        by_id[aid] = entry

    with open(reg_path, "w", encoding="utf-8") as f:
        json.dump(registered, f, indent=2)

    # verify: every registered app really has its file
    missing = [a["id"] for a in registered
               if isinstance(a, dict)
               and not os.path.isfile(os.path.join(creations, a.get("file", "")))]
    if missing:
        print("WARNING in %s: registered but file missing: %s"
              % (data_dir, ", ".join(missing)))
    return new, updated, unchanged


# ------------------------------------------------------------------ live ---
def live_check(app_ids):
    """Ask the RUNNING Moor in the browser which of our apps it shows."""
    results = {}
    for port in (18793, 18794):
        try:
            with urllib.request.urlopen(
                    "http://127.0.0.1:%d/api/apps" % port, timeout=5) as r:
                data = json.loads(r.read().decode("utf-8"))
            have = {a.get("id") for a in data.get("apps", [])
                    if isinstance(a, dict)}
            results[port] = sorted(i for i in app_ids if i in have)
        except Exception:
            results[port] = None
    return results


# ------------------------------------------------------------------- main ---
def main():
    print("MOOR phone sync %s" % APP_VERSION)
    print("=" * 40)
    cfg = load_config()
    token = get_token(cfg)

    print("Reading the phone mailbox...")
    apps = fetch_drop(token)
    print("Mailbox has %d app(s)." % len(apps))
    if not apps:
        print("Nothing to install.")
        return

    data_dirs = find_data_dirs()
    if not data_dirs:
        print("ERROR: could not find your Moor's data folder on this PC.")
        print("Tried the usual places; tell me where your Moor lives and I'll fix it.")
        sys.exit(1)

    print("Found Moor data folder(s):")
    for d in data_dirs:
        print("  " + d)

    total = [0, 0, 0]
    for d in data_dirs:
        n, u, c = install_into(d, apps)
        total[0] += n
        total[1] += u
        total[2] += c
        print("Installed into %s: %d new, %d updated, %d unchanged"
              % (d, n, u, c))

    print("-" * 40)
    print("Checking the Moor running in your browser...")
    ids = [a.get("id") for a in apps if a.get("id")]
    live = live_check(ids)
    any_live = False
    for port, shown in live.items():
        if shown is None:
            print("  port %d: no Moor answering there" % port)
        else:
            any_live = True
            print("  port %d: Moor shows %d of %d phone app(s)%s" % (
                port, len(shown), len(ids),
                (" (%s)" % ", ".join(shown)) if shown else ""))
    print("=" * 40)
    if any_live and all(live[p] is not None and len(live[p]) == len(ids)
                        for p in live if live[p] is not None):
        print("Done. Open your Moor's Apps view (grid icon, left side),")
        print("look under 'Made by you' -- your phone apps are there.")
    else:
        print("Files are installed, but the running Moor isn't showing them yet.")
        print("Tell me what you see above and I'll sort it out.")


if __name__ == "__main__":
    main()
