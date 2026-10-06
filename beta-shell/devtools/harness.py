"""Shared headless harness for devtools checks."""
import os
import socket
import subprocess
import time

CHROME = '/opt/meta-chromium/chrome'
FLAGS = ['--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage']
LOAD_WAIT_MS = 25000


def launch():
    from playwright.sync_api import sync_playwright
    p = sync_playwright().start()
    b = p.chromium.launch(executable_path=CHROME, args=FLAGS)
    return p, b


def new_page(b, width=960, height=540):
    return b.new_page(viewport={'width': width, 'height': height})


def default_beta_path():
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(os.path.dirname(here), 'moor-beta.html')


def _free_port():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port


class Server:
    """Serve a directory over local HTTP (the real deployment is HTTP, not
    file:// — file:// turns relative fetches like moor-beta-version.txt into
    fake ERR_FILE_NOT_FOUND noise)."""

    def __init__(self, directory):
        self.directory = directory
        self.port = _free_port()
        self.proc = subprocess.Popen(
            ['python3', '-m', 'http.server', str(self.port), '--bind', '127.0.0.1'],
            cwd=directory, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.7)

    def url(self, filename):
        return 'http://127.0.0.1:%d/%s' % (self.port, filename)

    def stop(self):
        try:
            self.proc.terminate()
        except Exception:
            pass
