# build-electron-app.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting Electron Build for Windows    " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Install dependencies (optional but safe)
Write-Host "`n[1/3] Verifying dependencies..." -ForegroundColor Yellow
npm install

# Step 2: Run the build command
Write-Host "`n[2/3] Building Electron App (this may take a few minutes)..." -ForegroundColor Yellow
$buildProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "build:electron" -NoNewWindow -PassThru -Wait

if ($buildProcess.ExitCode -eq 0) {
    Write-Host "`n[3/3] Build Successful!!!" -ForegroundColor Green
    
    # Step 3: Open the output directory
    $outputDir = Join-Path $PSScriptRoot "dist-electron_installer"
    if (Test-Path $outputDir) {
        Write-Host "Opening output directory: $outputDir" -ForegroundColor Gray
        Invoke-Item $outputDir
    }
    else {
        Write-Host "Warning: Output directory not found at $outputDir" -ForegroundColor Red
    }
}
else {
    Write-Host "`n[ERROR] Build Failed with exit code $($buildProcess.ExitCode)" -ForegroundColor Red
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
