# Fix Gradle Cache Script
# Run this AFTER restarting your computer

Write-Host "Stopping all Gradle daemons..." -ForegroundColor Yellow
cd C:\Users\KIIT\Documents\Rant\android
.\gradlew.bat --stop

Write-Host "`nDeleting corrupted Gradle caches..." -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.gradle\caches" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.gradle\daemon" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`nCaches cleared! Now building release bundle..." -ForegroundColor Green
.\gradlew.bat bundlePlayRelease

Write-Host "`n✅ Done! Your AAB will be at:" -ForegroundColor Green
Write-Host "android\app\build\outputs\bundle\playRelease\app-play-release.aab" -ForegroundColor Cyan
