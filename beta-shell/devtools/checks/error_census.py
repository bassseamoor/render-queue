"""F4: error-census — the build must run clean headless.
PASS = zero pageerrors and zero console errors.

Note: the beta is loaded via file:// (this Chromium blocks local HTTP).
The self-updater's fetch of moor-beta-version.txt therefore fails under
file:// — that is a harness artifact, not a product bug, so it is on the
default ignore list and reported visibly, never silently.
"""
import harness

DEFAULT_IGNORE = ['moor-beta-version.txt']


def run(ctx):
    beta = ctx['beta_path']
    ignore = ctx.get('ignore_console', DEFAULT_IGNORE)
    p, b = harness.launch()
    try:
        pg = harness.new_page(b)
        pageerrors, console_errors, ignored = [], [], []
        pg.on('pageerror', lambda e: pageerrors.append(str(e)[:200]))

        def _on_failed(req):
            url = req.url
            if any(pat in url for pat in ignore):
                ignored.append('not-found: ' + url[-60:])
            else:
                console_errors.append('not-found: ' + url[-60:])
        pg.on('requestfailed', _on_failed)

        def _on_console(m):
            if m.type == 'error':
                txt = m.text[:200]
                # resource-load failures are already captured with URL via requestfailed
                if 'Failed to load resource' not in txt:
                    console_errors.append(txt)
        pg.on('console', _on_console)
        pg.goto('file://' + beta)
        pg.wait_for_timeout(harness.LOAD_WAIT_MS)
        pg.close()
    finally:
        b.close()
        p.stop()
    passed = not pageerrors and not console_errors
    summary = '%d pageerrors, %d console errors' % (len(pageerrors), len(console_errors))
    if ignored:
        summary += ' (%d ignored: %s)' % (len(ignored), '; '.join(ignored)[:80])
    return {
        'name': 'error-census',
        'passed': passed,
        'summary': summary,
        'metrics': {'pageerrors': len(pageerrors), 'console_errors': len(console_errors),
                    'ignored': ignored},
        'details': (pageerrors + console_errors)[:5],
    }
