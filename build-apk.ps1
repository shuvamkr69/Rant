# Build Android APK
Write-Host "Starting Android build..." -ForegroundColor Green
Write-Host "This window will remain open until the build completes." -ForegroundColor Yellow
Write-Host ""

Set-Location "C:\Users\KIIT\Documents\Rant\android"
& cmd /c "gradlew.bat assemblePlayDebug"

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "APK location: android\app\build\outputs\apk\play\debug\app-play-debug.apk" -ForegroundColor Cyan
} else {
    Write-Host "BUILD FAILED with exit code $LASTEXITCODE" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
