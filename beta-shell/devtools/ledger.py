"""F5: run-ledger — every tool run is stored, so findings compound.
Appends one JSON line per run to ledger.jsonl and writes last-run.json.
Pipeline memory: a skipped funnel run can never happen silently again,
because the ledger shows what was (and wasn't) verified."""
import datetime
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def store(record):
    record = dict(record)
    record['ts'] = datetime.datetime.utcnow().isoformat() + 'Z'
    line = json.dumps(record)
    with open(os.path.join(HERE, 'ledger.jsonl'), 'a') as f:
        f.write(line + '\n')
    with open(os.path.join(HERE, 'last-run.json'), 'w') as f:
        f.write(json.dumps(record, indent=2))
    return record
