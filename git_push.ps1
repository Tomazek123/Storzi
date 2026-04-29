Set-Location "C:\Users\Nejkaa\Desktop\STORZI\Storzi-main"

# Configure git
git config --global user.email "test@test.com"
git config --global user.name "Test"

# Add all files
git add -A

# Commit
git commit -m "Update site"

# Push with force
git push -u origin main --force --allow-unrelated-histories