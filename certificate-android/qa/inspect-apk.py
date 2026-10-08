"""Verify release contents byte-for-byte against this checkout, never just CI status."""
import hashlib
import pathlib
import sys
import zipfile
apk=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(apk) as z:
    for name in ['index.html','styles.css','app.js','iet-forms.js','manifest.webmanifest','icon.svg','vendor/jspdf.umd.min.js','vendor/jspdf.plugin.autotable.min.js']:
        data=z.read('assets/certificates/'+name)
        assert data==pathlib.Path('public/certificates',name).read_bytes(), 'Stale bundled '+name
    app=z.read('assets/certificates/app.js').decode()
    index=z.read('assets/certificates/index.html').decode()
    assert '<title>Sperin Certificates</title>' in index
    assert "const VERSION = '1.7.14'" in app
    assert "const STORAGE_KEY = 'sperin-certificates-data-v1'" in app
    assert 'sperin-certificates-board-templates-v1' in app
    assert 'sperin-certificates-circuit-templates-v1' in app
    dex=b''.join(z.read(n) for n in z.namelist() if n.endswith('.dex'))
    assert b'/certificates-app' in dex
    assert b'https://sperinservices.co.uk/certificates-app/' in dex
    assert b'certificates-app-v' not in dex
print('APK_CONTENTS_VERIFIED',apk.name,hashlib.sha256(apk.read_bytes()).hexdigest())
