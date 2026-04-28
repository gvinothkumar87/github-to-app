# build-run-mobile.ps1

# Step 0: Ensure folder path is simple (no parentheses/spaces if possible)
Write-Host "Starting build & run script..."

# Step 1: Set environment variable for mobile build
$env:BUILD_TARGET = "mobile"

# Step 2: Install project dependencies
Write-Host "Installing npm dependencies..."
npm install

# Step 3: Install Vite locally if missing
if (-not (Test-Path "node_modules/vite")) {
    Write-Host "Installing Vite locally..."
    npm install --save-dev vite
}

# Step 4: Build the mobile assets
Write-Host "Building mobile assets..."
npx vite build

# Step 5: Ensure Android assets folder exists (create later after fresh android folder)
$assetsPath = "android\app\src\main\assets"

# Step 5.5: Force refresh Android platform
if (Test-Path "android") {
    Write-Host "Removing old Android platform..."
    # Using cmd /c rd to be more aggressive than Remove-Item on Windows
    cmd /c rd /s /q android
    
    if (Test-Path "android") {
        Write-Host "Warning: Could not fully remove 'android' directory. Please close Android Studio or other processes using it." -ForegroundColor Yellow
    }
}

if (-not (Test-Path "android")) {
    Write-Host "Adding fresh Android platform..."
    npx cap add android
} else {
    Write-Host "Android platform already exists, skipping 'add'..."
}

# Step 5.6: Recreate assets folder if missing
if (-not (Test-Path $assetsPath)) {
    Write-Host "Creating Android assets folder..."
    New-Item -ItemType Directory -Path $assetsPath -Force | Out-Null
}

# Step 6: Sync Capacitor
Write-Host "Syncing Capacitor..."
npx cap sync

# Step 7: Run on Android device/emulator
Write-Host "Running app on Android..."
npx cap open android

Write-Host "Done! Mobile app should now be running."
