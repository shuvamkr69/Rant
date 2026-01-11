# Quick Debug Build Script
Write-Host "🔧 Building Debug APK with Purchase Flow Alerts..." -ForegroundColor Cyan

cd C:\Users\KIIT\Documents\Rant\android

Write-Host "`n📦 Building Play Debug variant..." -ForegroundColor Yellow
.\gradlew.bat assemblePlayDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build successful!" -ForegroundColor Green
    Write-Host "`n📱 Installing to device..." -ForegroundColor Yellow
    
    $apkPath = "app\build\outputs\apk\play\debug\app-play-debug.apk"
    
    if (Test-Path $apkPath) {
        adb install -r $apkPath
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Installed successfully!" -ForegroundColor Green
            Write-Host "`n🎯 Now test the purchase flow - you'll see DEBUG alerts at each step" -ForegroundColor Cyan
        } else {
            Write-Host "`n⚠️ Install failed. Manually install from:" -ForegroundColor Yellow
            Write-Host "   $apkPath" -ForegroundColor White
        }
    }
} else {
    Write-Host "`n❌ Build failed!" -ForegroundColor Red
}
