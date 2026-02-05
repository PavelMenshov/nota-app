# EYWA Authentication API Test Script
# This script tests the authentication endpoints

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "EYWA Authentication API Test Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$apiUrl = "http://localhost:4000"
$testEmail = "test-$(Get-Date -Format 'yyyyMMdd-HHmmss')@example.com"
$testPassword = "SecurePassword123!"
$testName = "Test User"

# Headers
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Test Configuration:" -ForegroundColor Yellow
Write-Host "  API URL: $apiUrl" -ForegroundColor Gray
Write-Host "  Test Email: $testEmail" -ForegroundColor Gray
Write-Host "  Test Name: $testName" -ForegroundColor Gray
Write-Host ""

# Test 1: Check if API is running
Write-Host "[1/5] Checking if API is running..." -ForegroundColor Yellow
try {
    $rootResponse = Invoke-RestMethod -Uri "$apiUrl/api/" -Method GET
    Write-Host "  ✓ API is running!" -ForegroundColor Green
    Write-Host "  API Name: $($rootResponse.name)" -ForegroundColor Gray
    Write-Host "  API Version: $($rootResponse.version)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Failed to connect to API!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure the API server is running with: pnpm dev:api" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Get Auth Info
Write-Host "[2/5] Getting authentication endpoint information..." -ForegroundColor Yellow
try {
    $authInfoResponse = Invoke-RestMethod -Uri "$apiUrl/api/auth" -Method GET
    Write-Host "  ✓ Auth endpoint is accessible!" -ForegroundColor Green
    Write-Host "  Available endpoints:" -ForegroundColor Gray
    Write-Host "    - Register: POST $apiUrl/api/auth/register" -ForegroundColor Gray
    Write-Host "    - Login: POST $apiUrl/api/auth/login" -ForegroundColor Gray
    Write-Host "    - Profile: GET $apiUrl/api/auth/me" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Failed to get auth info!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 3: Register a new user
Write-Host "[3/5] Registering a new user..." -ForegroundColor Yellow
$registerBody = @{
    email = $testEmail
    password = $testPassword
    name = $testName
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$apiUrl/api/auth/register" `
                                          -Method POST `
                                          -Headers $headers `
                                          -Body $registerBody
    Write-Host "  ✓ User registered successfully!" -ForegroundColor Green
    Write-Host "  User ID: $($registerResponse.user.id)" -ForegroundColor Gray
    Write-Host "  User Email: $($registerResponse.user.email)" -ForegroundColor Gray
    Write-Host "  User Name: $($registerResponse.user.name)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Registration failed!" -ForegroundColor Red
    Write-Host "  Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Show more details if available
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "  Details: $($errorDetails.message)" -ForegroundColor Red
    }
    exit 1
}
Write-Host ""

# Test 4: Login with the new user
Write-Host "[4/5] Logging in with the new user..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/api/auth/login" `
                                       -Method POST `
                                       -Headers $headers `
                                       -Body $loginBody
    Write-Host "  ✓ Login successful!" -ForegroundColor Green
    Write-Host "  Access Token: $($loginResponse.access_token.Substring(0, 50))..." -ForegroundColor Gray
    $accessToken = $loginResponse.access_token
} catch {
    Write-Host "  ✗ Login failed!" -ForegroundColor Red
    Write-Host "  Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 5: Get user profile (authenticated request)
Write-Host "[5/5] Getting user profile (authenticated request)..." -ForegroundColor Yellow
$authHeaders = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

try {
    $profileResponse = Invoke-RestMethod -Uri "$apiUrl/api/auth/me" `
                                         -Method GET `
                                         -Headers $authHeaders
    Write-Host "  ✓ Profile retrieved successfully!" -ForegroundColor Green
    Write-Host "  User ID: $($profileResponse.id)" -ForegroundColor Gray
    Write-Host "  User Email: $($profileResponse.email)" -ForegroundColor Gray
    Write-Host "  User Name: $($profileResponse.name)" -ForegroundColor Gray
    Write-Host "  Created At: $($profileResponse.createdAt)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Failed to get profile!" -ForegroundColor Red
    Write-Host "  Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "All tests passed successfully! ✓" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your authentication endpoints are working correctly." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Visit http://localhost:4000/api/docs for interactive API documentation" -ForegroundColor Gray
Write-Host "  2. Use the access token for authenticated requests" -ForegroundColor Gray
Write-Host "  3. Read docs/AUTH_API_USAGE.md for more information" -ForegroundColor Gray
Write-Host ""
Write-Host "Note: The test user ($testEmail) is now registered in your database." -ForegroundColor Cyan
