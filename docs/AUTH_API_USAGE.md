# Authentication API Usage Guide

## Understanding the Issue

### The Problem
When trying to access `http://localhost:4000/api/auth/register` directly in a browser, you receive a **404 error**. However, the same endpoints work perfectly when called from the Swagger documentation interface.

**Note**: Before this fix, accessing `http://localhost:4000/api/auth` also returned a 404 error. Now, this endpoint returns helpful information about the authentication API.

### Important Clarification

**This issue ONLY affects typing URLs in the browser address bar.** Your web application (the frontend at `localhost:3001`) can and should use these endpoints normally! 

👉 **See [Web App Auth Integration Guide](./WEB_APP_AUTH_INTEGRATION.md) for how your web application properly uses these endpoints.**

### Why This Happens
This is **NOT a bug** - it's expected behavior! Here's why:

1. **Browser Navigation Uses GET Requests**: When you type a URL in your browser's address bar and press Enter, the browser sends a `GET` request.

2. **Auth Endpoints Require POST**: The `/api/auth/register` and `/api/auth/login` endpoints only accept `POST` requests (not GET), because they need to receive data in the request body (email, password, etc.).

3. **Swagger Works Because It Uses POST**: The Swagger documentation interface correctly sends POST requests with the proper headers and body, which is why it works.

## Solution

We've added a **GET endpoint** at `/api/auth` that provides information about the authentication API and how to use it properly.

Now when you visit `http://localhost:4000/api/auth` in your browser, you'll see:

```json
{
  "message": "EYWA Authentication API",
  "version": "1.0.0",
  "endpoints": {
    "register": {
      "method": "POST",
      "path": "/api/auth/register",
      "description": "Register a new user",
      "requiredFields": ["email", "password", "name"],
      "example": {
        "email": "user@example.com",
        "password": "securePassword123",
        "name": "John Doe"
      }
    },
    "login": {
      "method": "POST",
      "path": "/api/auth/login",
      "description": "Login with email and password",
      "requiredFields": ["email", "password"],
      "example": {
        "email": "user@example.com",
        "password": "securePassword123"
      }
    },
    "me": {
      "method": "GET",
      "path": "/api/auth/me",
      "description": "Get current user profile (requires JWT token)",
      "requiresAuth": true
    }
  },
  "documentation": "/api/docs",
  "note": "Use POST method for register and login endpoints. Browser address bar uses GET and will not work for these endpoints."
}
```

## How to Test the API Properly

### Option 1: Use Swagger Documentation (Recommended for Development)
Visit `http://localhost:4000/api/docs` and use the interactive interface to test the APIs.

### Option 2: Use curl (Command Line)

#### Register a New User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "John Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

This will return a JWT token:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Get User Profile (Requires Authentication)
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Option 3: Use Postman or Thunder Client (VS Code Extension)

1. Create a new POST request
2. Set URL to `http://localhost:4000/api/auth/register`
3. Set Headers: `Content-Type: application/json`
4. Set Body (raw JSON):
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```
5. Send the request

### Option 4: Use PowerShell (Windows)

#### Register:
```powershell
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    email = "user@example.com"
    password = "securePassword123"
    name = "John Doe"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/register" `
                  -Method POST `
                  -Headers $headers `
                  -Body $body
```

#### Login:
```powershell
$body = @{
    email = "user@example.com"
    password = "securePassword123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" `
                  -Method POST `
                  -Headers $headers `
                  -Body $body
```

## Key Takeaways

1. **✅ The API is working correctly** - there's no bug to fix
2. **❌ Don't use browser address bar** for POST endpoints (register/login)
3. **✅ Use Swagger UI, curl, Postman, or PowerShell** to test POST endpoints
4. **✅ GET endpoints** (like `/api/auth` and `/api/auth/me`) work fine in the browser
5. **✅ Web applications work perfectly** - they send POST requests via JavaScript (see [Web App Integration Guide](./WEB_APP_AUTH_INTEGRATION.md))

## For Web Developers

**If you're building a web application that needs authentication:**

👉 **Read the [Web App Auth Integration Guide](./WEB_APP_AUTH_INTEGRATION.md)** for complete examples of how to properly integrate these endpoints in React, Vue, Angular, or any other frontend framework.

Your web app will work perfectly! The confusion only comes from trying to test endpoints by typing URLs in the browser address bar.

## Why Not Create a Separate Docker Container?

Creating a separate Docker container for authentication is unnecessary and would introduce complexity:

- ✅ **Current Setup**: All endpoints are in one API server, properly organized by modules
- ❌ **Separate Container**: Would require inter-service communication, additional network configuration, and increased deployment complexity
- 🎯 **Best Practice**: Keep related functionality together until you have a specific scalability reason to split them

The authentication endpoints are working as designed. The issue was simply using the wrong HTTP method (GET instead of POST) to access them.
