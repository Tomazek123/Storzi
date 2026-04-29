@echo off
cd "C:\Users\Nejkaa\Desktop\STORZI\Storzi-main"
"C:\Program Files\GitHub CLI\gh.exe" add -A
"C:\Program Files\GitHub CLI\gh.exe" commit -m "Update"
"C:\Program Files\GitHub CLI\gh.exe" push origin main --force
pause