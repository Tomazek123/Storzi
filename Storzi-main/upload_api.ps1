$baseDir = "C:\Users\Nejkaa\Desktop\STORZI\Storzi-main"
$gh = "C:\Program Files\GitHub CLI\gh.exe"
$owner = "Tomazek123"
$repo = "Storzi"

Set-Location $baseDir

$files = @(
    "index.html",
    "style.css", 
    "posts.js",
    "prijave.js",
    "prijave.css",
    "worker.js",
    "wrangler.jsonc",
    "build.py",
    "robots.txt",
    "sitemap.xml",
    "404.html",
    "_headers",
    ".gitignore"
)

foreach ($f in $files) {
    $path = Join-Path $baseDir $f
    if (Test-Path $path) {
        Write-Host "Uploading $f..."
        $content = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($path))
        $body = @{
            message = "Update $f"
            content = $content
        } | ConvertTo-Json
        
        & $gh api -X PUT "repos/$owner/$repo/contents/$f" -f "message=Update $f" -f "content=$content" --indent 4
    }
}

Write-Host "Done uploading main files!"
Write-Host "Now uploading images..."

$imagesDir = Join-Path $baseDir "images"
if (Test-Path $imagesDir) {
    Get-ChildItem $imagesDir -File | ForEach-Object {
        Write-Host "Uploading images/$($_.Name)..."
        $content = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($_.FullName))
        & $gh api -X PUT "repos/$owner/$repo/contents/images/$($_.Name)" -f "message=Update $($_.Name)" -f "content=$content" --indent 4
    }
}

Write-Host "All done!"