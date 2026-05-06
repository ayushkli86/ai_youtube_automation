import os, json, sqlite3, base64, sys, subprocess
from pathlib import Path

try:
    import win32crypt
    from Crypto.Cipher import AES
except ImportError:
    os.system(f"{sys.executable} -m pip install pywin32 pycryptodome -q")
    import win32crypt
    from Crypto.Cipher import AES

EDGE_DIR    = Path(os.environ['LOCALAPPDATA']) / 'Microsoft' / 'Edge' / 'User Data'
LOCAL_STATE = EDGE_DIR / 'Local State'
TMP_DIR     = Path(os.environ['TEMP'])
TMP_DB      = TMP_DIR / 'Cookies'
USERNAME    = os.environ['USERNAME']

def get_key():
    state = json.loads(LOCAL_STATE.read_text(encoding='utf-8'))
    enc_key = base64.b64decode(state['os_crypt']['encrypted_key'])[5:]
    return win32crypt.CryptUnprotectData(enc_key, None, None, None, 0)[1]

def decrypt(enc_val, key):
    try:
        cipher = AES.new(key, AES.MODE_GCM, nonce=enc_val[3:15])
        return cipher.decrypt_and_verify(enc_val[15:-16], enc_val[-16:]).decode()
    except Exception:
        try:
            return win32crypt.CryptUnprotectData(enc_val, None, None, None, 0)[1].decode()
        except Exception:
            return None

# Use VSS (Volume Shadow Copy) to copy the locked Cookies file
ps_script = TMP_DIR / '_vss_copy.ps1'
cookie_rel = f"Users\\{USERNAME}\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Network\\Cookies"
ps_script.write_text(f"""
$s = (Get-WmiObject -List Win32_ShadowCopy).Create("C:\\\\", "ClientAccessible")
$dev = (Get-WmiObject Win32_ShadowCopy | Sort-Object InstallDate | Select-Object -Last 1).DeviceObject
Copy-Item "$dev\\{cookie_rel}" "{TMP_DB}" -Force
""", encoding='utf-8')

subprocess.run(['powershell', '-ExecutionPolicy', 'Bypass', '-File', str(ps_script)],
               capture_output=True)
ps_script.unlink(missing_ok=True)

if not TMP_DB.exists():
    sys.exit("ERROR: VSS copy failed. Try running this script as Administrator.")

key = get_key()
conn = sqlite3.connect(str(TMP_DB))
DOMAINS = ('.google.com', '.youtube.com', 'studio.youtube.com')
rows = conn.execute(
    "SELECT host_key,name,value,encrypted_value,path,expires_utc,is_secure,is_httponly,samesite FROM cookies "
    "WHERE " + " OR ".join(f"host_key LIKE '%{d}'" for d in DOMAINS)
).fetchall()
conn.close()
TMP_DB.unlink()

SAMESITE = {-1:'Lax', 0:'Lax', 1:'Lax', 2:'Strict', 3:'None'}
cookies = []
for host, name, value, enc_val, path, expires, secure, httponly, samesite in rows:
    val = value or (decrypt(enc_val, key) if enc_val else None)
    if not val:
        continue
    cookies.append({
        "domain":   host,
        "name":     name,
        "value":    val,
        "path":     path,
        "expires":  (expires - 11644473600000000) / 1000000 if expires else -1,
        "secure":   bool(secure),
        "httpOnly": bool(httponly),
        "sameSite": SAMESITE.get(samesite, 'Lax'),
    })

Path('session.json').write_text(json.dumps({"cookies": cookies}, indent=2))
print(f"[OK] Saved {len(cookies)} cookies to session.json")

KEY_TOKENS = {'SID','HSID','SSID','APISID','SAPISID','__Secure-3PSID','__Secure-1PSID','YSC','VISITOR_INFO1_LIVE'}
print("\n[KEY TOKENS FOUND]")
for c in cookies:
    if c['name'] in KEY_TOKENS:
        print(f"  {c['name']} [{c['domain']}] = {c['value'][:20]}...")
