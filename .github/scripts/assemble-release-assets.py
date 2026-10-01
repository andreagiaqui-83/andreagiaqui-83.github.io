"""Rejoin transport parts of already approved binaries; never rebuild executables."""
from pathlib import Path
import hashlib
import json
import os
import re

root = Path.cwd().resolve()
manifest = root / '.github/release-assets/manifest.json'
if not manifest.exists():
    print('No transport parts to finalize.')
    raise SystemExit(0)
files = json.loads(manifest.read_text())['files']
assert files and len(files) <= 10
ready = []
seen = set()
for item in files:
    dest = root / item['file']
    assert re.fullmatch(r'downloads/[a-z0-9-]+/[A-Za-z0-9_.-]+\.(exe|zip)', item['file'])
    assert dest not in seen and 0 < item['bytes'] < 100 * 1024 * 1024
    seen.add(dest)
    parts = [root / part for part in item['parts']]
    assert parts and len(parts) == len(set(parts))
    for part in parts:
        assert part.resolve().parent == manifest.parent and not part.is_symlink()
    data = b''.join(part.read_bytes() for part in parts)
    assert len(data) == item['bytes'], item['file'] + ': size mismatch'
    assert hashlib.sha256(data).hexdigest() == item['sha256'], item['file'] + ': SHA mismatch'
    assert data[:2] == (b'MZ' if dest.suffix == '.exe' else b'PK')
    if dest.exists():
        assert dest.read_bytes() == data, 'Refusing to replace a different existing binary'
    ready.append((dest, data, parts))
# Write only after every approved hash has matched.
for dest, data, parts in ready:
    dest.parent.mkdir(parents=True, exist_ok=True)
    temporary = dest.with_suffix(dest.suffix + '.transport-tmp')
    temporary.write_bytes(data)
    os.replace(temporary, dest)
    for part in parts:
        part.unlink()
    print(dest.relative_to(root), len(data), hashlib.sha256(data).hexdigest())
manifest.unlink()
manifest.parent.rmdir()
