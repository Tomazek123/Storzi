Set-Location "C:\Users\Nejkaa\Desktop\STORZI\Storzi-main"

$gh = "C:\Program Files\GitHub CLI\gh.exe"

Write-Host "Initializing git..."
git init
git add .
git commit -m "Update site"

Write-Host "Adding remote..."
git remote add origin https://github.com/Tomazek123/Storzi.git

Write-Host "Pushing..."
git push -u origin main --force

Write-Host "Done!"