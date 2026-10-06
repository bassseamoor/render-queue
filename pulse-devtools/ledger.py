"""run-ledger — every pulse-devtools run is stored. Pipeline memory."""
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
