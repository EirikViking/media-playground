# Media Playground API Verification Script
# Tests all API endpoints against a running Worker
# Usage: .\verify.ps1 -WorkerUrl "https://media-playground-api.xxx.workers.dev"
#    or: .\verify.ps1 (defaults to localhost:8787)

param(
    [string]$WorkerUrl = "http://localhost:8787"
)

$ErrorActionPreference = "Continue"
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [string]$Body = $null,
        [string]$ExpectedField = $null
    )
    
    Write-Host -NoNewline "  Testing $Name... "
    
    try {
        $uri = "$WorkerUrl$Path"
        $headers = @{ "Content-Type" = "application/json" }
        
        if ($Body) {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $Body -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -ErrorAction Stop
        }
        
        if ($ExpectedField -and -not ($response.PSObject.Properties.Name -contains $ExpectedField)) {
            Write-Host "FAIL (missing '$ExpectedField')" -ForegroundColor Red
            $script:failed++
            return $null
        }
        
        Write-Host "PASS" -ForegroundColor Green
        $script:passed++
        return $response
    }
    catch {
        Write-Host "FAIL ($($_.Exception.Message))" -ForegroundColor Red
        $script:failed++
        return $null
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Media Playground API Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Target: $WorkerUrl" -ForegroundColor White
Write-Host ""

# Test 1: Health Check
Write-Host "[Health Check]" -ForegroundColor Yellow
$health = Test-Endpoint -Name "GET /api/health" -Method "GET" -Path "/api/health" -ExpectedField "status"

if (-not $health) {
    Write-Host ""
    Write-Host "Health check failed. Is the Worker running?" -ForegroundColor Red
    Write-Host "For local dev: cd worker && npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Create Project
Write-Host ""
Write-Host "[CRUD Operations]" -ForegroundColor Yellow

$createBody = '{"title":"Test Project from Verification Script","data":"{\"version\":1,\"mediaItems\":[],\"testRun\":true}"}'
$created = Test-Endpoint -Name "POST /api/projects (create)" -Method "POST" -Path "/api/projects" -Body $createBody -ExpectedField "id"

if (-not $created) {
    Write-Host "Cannot continue without created project" -ForegroundColor Red
    exit 1
}

$projectId = $created.id
Write-Host "    Created project ID: $projectId" -ForegroundColor Cyan

# Test 3: List Projects
$list = Test-Endpoint -Name "GET /api/projects (list)" -Method "GET" -Path "/api/projects"

# Test 4: Get Project
$get = Test-Endpoint -Name "GET /api/projects/:id (get)" -Method "GET" -Path "/api/projects/$projectId" -ExpectedField "data"

# Test 5: Update Project
$updateBody = '{"title":"Updated Test Project","data":"{\"version\":2,\"updated\":true}"}'
$update = Test-Endpoint -Name "PUT /api/projects/:id (update)" -Method "PUT" -Path "/api/projects/$projectId" -Body $updateBody -ExpectedField "ok"

# Test 6: Delete Project
$delete = Test-Endpoint -Name "DELETE /api/projects/:id (delete)" -Method "DELETE" -Path "/api/projects/$projectId" -ExpectedField "ok"

# Test 7: Verify deletion
Write-Host ""
Write-Host "[Verification]" -ForegroundColor Yellow
Write-Host -NoNewline "  Verifying project was deleted... "

try {
    $check = Invoke-RestMethod -Uri "$WorkerUrl/api/projects/$projectId" -Method "GET" -ErrorAction Stop
    Write-Host "FAIL (project still exists)" -ForegroundColor Red
    $failed++
}
catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "PASS" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "FAIL ($($_.Exception.Message))" -ForegroundColor Red
        $failed++
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Results: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($failed -eq 0) {
    Write-Host "All tests passed! Your API is working correctly." -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed. Check the output above for details." -ForegroundColor Red
    exit 1
}
