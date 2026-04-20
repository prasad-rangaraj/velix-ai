import base64
import zlib
import urllib.request
import sys

def generate_kroki_url(diagram):
    compressed = zlib.compress(diagram.encode('utf-8'), 9)
    b64 = base64.urlsafe_b64encode(compressed).decode('ascii')
    return f"https://kroki.io/mermaid/png/{b64}"

try:
    with open("velix_methodology.mmd", "r") as f:
        diagram = f.read()
    
    url = generate_kroki_url(diagram)
    print(f"Downloading from {url}")
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open("VelixAI_Methodology.png", "wb") as out_file:
        out_file.write(response.read())
        
    print("Success")
except Exception as e:
    print(f"Failed: {e}")
    sys.exit(1)
