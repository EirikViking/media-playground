# Media Playground Worker Setup Script
# Run this from the worker/ directory
# Usage: .\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Media Playground Worker Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the worker directory
if (-not (Test-Path "wrangler.toml")) {
    Write-Host "Error: Run this script from the worker/ directory" -ForegroundColor Red
    exit 1
}

# Step 1: Install dependencies
Write-Host "[1/5] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies installed!" -ForegroundColor Green

# Step 2: Check wrangler login
Write-Host ""
Write-Host "[2/5] Checking Cloudflare authentication..." -ForegroundColor Yellow
$whoamiResult = npx wrangler whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Not logged in. Opening browser for authentication..." -ForegroundColor Yellow
    npx wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Authentication failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  Authenticated with Cloudflare!" -ForegroundColor Green

# Step 3: Create D1 database (if needed)
Write-Host ""
Write-Host "[3/5] Setting up D1 database..." -ForegroundColor Yellow

# Check if database already exists
$dbList = npx wrangler d1 list 2>&1 | Out-String
if ($dbList -match "media-playground-db") {
    Write-Host "  Database 'media-playground-db' already exists." -ForegroundColor Green
    
    # Extract database ID from list
    $dbInfo = npx wrangler d1 info media-playground-db 2>&1 | Out-String
    if ($dbInfo -match "database_id.*?([a-f0-9-]{36})") {
        $databaseId = $matches[1]
        Write-Host "  Database ID: $databaseId" -ForegroundColor Cyan
    }
} else {
    Write-Host "  Creating database 'media-playground-db'..." -ForegroundColor Yellow
    $createResult = npx wrangler d1 create media-playground-db 2>&1 | Out-String
    Write-Host $createResult
    
    if ($createResult -match "database_id.*?=.*?`"([a-f0-9-]{36})`"") {
        $databaseId = $matches[1]
        Write-Host "  Database ID: $databaseId" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "IMPORTANT: Could not auto-extract database_id" -ForegroundColor Yellow
        Write-Host "Please manually copy the database_id from above and update wrangler.toml" -ForegroundColor Yellow
        $databaseId = Read-Host "Enter the database_id"
    }
}

# Step 4: Update wrangler.toml if needed
Write-Host ""
Write-Host "[4/5] Updating wrangler.toml..." -ForegroundColor Yellow

$wranglerContent = Get-Content "wrangler.toml" -Raw
if ($wranglerContent -match "PLACEHOLDER_REPLACE_AFTER_CREATE") {
    if ($databaseId) {
        $newContent = $wranglerContent -replace "PLACEHOLDER_REPLACE_AFTER_CREATE", $databaseId
        Set-Content "wrangler.toml" $newContent
        Write-Host "  Updated wrangler.toml with database_id: $databaseId" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Could not update wrangler.toml - no database_id available" -ForegroundColor Yellow
        Write-Host "  Please manually update the database_id in wrangler.toml" -ForegroundColor Yellow
    }
} else {
    Write-Host "  wrangler.toml already configured." -ForegroundColor Green
}

# Step 5: Run migration
Write-Host ""
Write-Host "[5/5] Running database migration..." -ForegroundColor Yellow
npx wrangler d1 execute media-playground-db --remote --file=./schema.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Warning: Migration may have failed or table already exists" -ForegroundColor Yellow
} else {
    Write-Host "  Migration completed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Deploy the worker:  npm run deploy" -ForegroundColor White
Write-Host "  2. Verify it works:    curl <worker-url>/api/health" -ForegroundColor White
Write-Host ""
