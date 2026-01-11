# Fix Expo Gradle Plugin Kotlin compatibility issues
# Replace internal Gradle API with public API

$files = @(
    "node_modules\expo-modules-autolinking\android\expo-gradle-plugin\expo-autolinking-plugin\src\main\kotlin\expo\modules\plugin\ExpoRootProjectPlugin.kt",
    "node_modules\expo-modules-core\expo-module-gradle-plugin\src\main\kotlin\expo\modules\plugin\ExpoModulesGradlePlugin.kt",
    "node_modules\expo-modules-core\expo-module-gradle-plugin\src\main\kotlin\expo\modules\plugin\ProjectConfiguration.kt",
    "node_modules\expo-modules-core\expo-module-gradle-plugin\src\main\kotlin\expo\modules\plugin\gradle\ExpoModuleExtension.kt"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Patching $file..."
        $content = Get-Content $file -Raw
        
        # Replace the import
        $content = $content -replace 'import org\.gradle\.internal\.extensions\.core\.extra', 'import org.gradle.api.plugins.ExtraPropertiesExtension'
        
        # Replace usage patterns
        $content = $content -replace '(\w+)\.extra\.', '$1.extensions.getByType(ExtraPropertiesExtension::class.java).'
        $content = $content -replace '(\w+)\.extra\[', '$1.extensions.getByType(ExtraPropertiesExtension::class.java)['
        
        Set-Content $file -Value $content -NoNewline
        Write-Host "  ✓ Patched successfully"
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "All files patched!" -ForegroundColor Green
