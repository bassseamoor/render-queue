# devtools — scripted verification for beta builds.
# Derived from funnel run ~/workspace/funnel/runs/devtools-20261005-night.md:
# one tool per named failure (F1..F5), nothing invented.
# Usage: python3 run.py [--beta PATH] [--live-url URL] [--require NAME]
# Exit 0 = all pass. Exit 1 = any fail (FAIL blocks ship, never auto-fix).
