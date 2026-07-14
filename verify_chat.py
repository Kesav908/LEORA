import json
import urllib.request

req = urllib.request.Request(
    'http://127.0.0.1:8001',
    data=json.dumps({
        'name': 'Test',
        'email': 'x@y.com',
        'company': 'Test',
        'phone': '1234567890',
        'description': 'hi'
    }).encode(),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req, timeout=10) as f:
    print(f.read().decode())
