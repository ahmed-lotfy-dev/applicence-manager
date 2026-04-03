# Fawtarly API Reference

**Version:** 1.0.0  
**Base URL:** `http://localhost:8000` (development)  
**Authentication:** Better Auth session-based authentication

---

## Table of Contents

1. [Authentication](#authentication)
2. [Applications (Managed Apps)](#applications)
3. [Licenses](#licenses)
4. [Activations](#activations)
5. [Clients](#clients)
6. [Invoices](#invoices)
7. [Freelancer Profile](#freelancer-profile)
8. [Public Endpoints](#public-endpoints)
9. [Error Handling](#error-handling)

---

## Authentication

All authenticated endpoints require a valid session cookie. Authentication is handled via Better Auth.

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-in/email` | Sign in with email/password |
| POST | `/api/auth/sign-up/email` | Sign up with email/password |
| GET | `/api/auth/sign-in/github` | GitHub OAuth sign-in |
| GET | `/api/auth/sign-in/google` | Google OAuth sign-in |
| GET | `/api/auth/callback/github` | GitHub OAuth callback |
| GET | `/api/auth/callback/google` | Google OAuth callback |
| POST | `/api/auth/sign-out` | Sign out current user |
| GET | `/api/auth/session` | Get current session |

### Session Response

```json
{
  "session": {
    "id": "uuid",
    "userId": "uuid",
    "expiresAt": "2026-03-26T00:00:00.000Z"
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-03-26T00:00:00.000Z"
  }
}
```

---

## Applications

Manage applications for licensing.

### List Applications

```
GET /api/apps
```

**Response:**
```json
{
  "apps": [
    {
      "id": "uuid",
      "name": "MyApp",
      "displayName": "My Application",
      "userId": "uuid",
      "totalLicenses": 10,
      "activeLicenses": 8,
      "activationsCount": 15,
      "policy": "license_device_binding",
      "maxActivationsPerLicense": 3,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-03-26T00:00:00.000Z"
    }
  ]
}
```

### Create Application

```
POST /api/apps
```

**Body:**
```json
{
  "name": "MyApp",
  "displayName": "My Application",
  "policy": "license_device_binding",
  "maxActivationsPerLicense": 3
}
```

**Response:**
```json
{
  "success": true,
  "app": { ... }
}
```

### Get Application by ID

```
GET /api/apps/:id
```

### Update Application

```
PATCH /api/apps/:id
```

**Body:**
```json
{
  "displayName": "New Display Name",
  "maxActivationsPerLicense": 5
}
```

### Delete Application

```
DELETE /api/apps/:id
```

---

## Licenses

Manage license keys.

### List Licenses

```
GET /api/licenses?appName=MyApp
```

**Query Parameters:**
- `appName` (optional): Filter by application name

**Response:**
```json
{
  "licenses": [
    {
      "id": "uuid",
      "key": "FWTL-XXXX-XXXX-XXXX",
      "appName": "MyApp",
      "userId": "uuid",
      "status": "active",
      "email": "client@example.com",
      "metadata": {},
      "activationsCount": 2,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-03-26T00:00:00.000Z"
    }
  ]
}
```

### Create License

```
POST /api/licenses
```

**Body:**
```json
{
  "appName": "MyApp",
  "email": "client@example.com",
  "metadata": {
    "plan": "pro",
    "purchasedAt": "2026-03-26"
  }
}
```

**Response:**
```json
{
  "success": true,
  "license": {
    "id": "uuid",
    "key": "FWTL-XXXX-XXXX-XXXX",
    ...
  }
}
```

### Get License by ID

```
GET /api/licenses/:id
```

### Update License

```
PATCH /api/licenses/:id
```

**Body:**
```json
{
  "email": "newemail@example.com",
  "metadata": {
    "plan": "enterprise"
  }
}
```

### Set License Status

```
PATCH /api/licenses/:id/status
```

**Body:**
```json
{
  "status": "revoked"
}
```

**Valid statuses:** `active`, `revoked`, `expired`

### Delete License

```
DELETE /api/licenses/:id
```

---

## Activations

Manage device activations.

### List Activations

```
GET /api/activations?appName=MyApp&licenseId=uuid
```

**Query Parameters:**
- `appName` (optional): Filter by application name
- `licenseId` (optional): Filter by license ID

**Response:**
```json
{
  "activations": [
    {
      "id": "uuid",
      "licenseId": "uuid",
      "appName": "MyApp",
      "userId": "uuid",
      "deviceId": "device-fingerprint",
      "deviceName": "John's MacBook",
      "deviceInfo": {
        "os": "macOS 14.0",
        "model": "MacBook Pro",
        "hostname": "johns-macbook"
      },
      "ipAddress": "192.168.1.1",
      "activatedAt": "2026-01-01T00:00:00.000Z",
      "lastSeenAt": "2026-03-26T00:00:00.000Z",
      "isActive": true
    }
  ]
}
```

### Deactivate Activation

```
DELETE /api/activations/:id
```

---

## Clients

Manage client contacts.

### List Clients

```
GET /api/clients
```

**Response:**
```json
{
  "clients": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0100",
      "notes": "Premium client",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-03-26T00:00:00.000Z",
      "deletedAt": null
    }
  ]
}
```

### Create Client

```
POST /api/clients
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "notes": "Premium client",
  "status": "active"
}
```

### Update Client

```
PATCH /api/clients/:id
```

### Archive Client (Soft Delete)

```
PATCH /api/clients/:id/archive
```

### Restore Client

```
PATCH /api/clients/:id/restore
```

### Hard Delete Client

```
DELETE /api/clients/:id
```

---

## Invoices

Manage invoices and PDF generation.

### List Invoices

```
GET /api/invoices
```

**Response:**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "userId": "uuid",
      "clientId": "uuid",
      "invoiceNo": "INV-2026-0001",
      "totalAmount": 1500.00,
      "paidAmount": 750.00,
      "currency": "USD",
      "invoiceLanguage": "en",
      "status": "partially_paid",
      "dueDate": "2026-04-15",
      "issuedAt": "2026-03-26",
      "notes": "50% upfront payment",
      "createdAt": "2026-03-26T00:00:00.000Z",
      "updatedAt": "2026-03-26T00:00:00.000Z"
    }
  ]
}
```

### Get Invoice Statistics

```
GET /api/invoices/stats
```

**Response:**
```json
{
  "stats": {
    "totalInvoiced": 50000.00,
    "totalPaid": 35000.00,
    "totalOutstanding": 15000.00,
    "invoiceCount": 45,
    "paidCount": 30,
    "overdueCount": 5
  }
}
```

### Get Next Invoice Number

```
GET /api/invoices/next-number
```

**Response:**
```json
{
  "invoiceNo": "INV-2026-0046"
}
```

### Create Invoice

```
POST /api/invoices
```

**Body:**
```json
{
  "clientId": "uuid",
  "invoiceNo": "INV-2026-0001",
  "totalAmount": 1500.00,
  "paidAmount": 0,
  "currency": "USD",
  "invoiceLanguage": "en",
  "status": "draft",
  "dueDate": "2026-04-15",
  "issuedAt": "2026-03-26",
  "notes": "Payment for licensing services"
}
```

### Update Invoice

```
PATCH /api/invoices/:id
```

### Generate PDF

```
POST /api/invoices/:id/generate-pdf
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "uuid",
    "invoiceId": "uuid",
    "status": "pending",
    "createdAt": "2026-03-26T00:00:00.000Z"
  }
}
```

### Check PDF Status

```
GET /api/invoices/:id/pdf-status
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "uuid",
    "status": "completed",
    "outputPath": "/tmp/invoices/INV-2026-0001.pdf",
    "completedAt": "2026-03-26T00:00:00.000Z"
  }
}
```

**Job statuses:** `pending`, `processing`, `completed`, `failed`

### Download PDF

```
GET /api/invoices/:id/pdf
```

Returns PDF file with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: inline; filename="INV-2026-0001.pdf"`

### Send Invoice via Email

```
POST /api/invoices/:id/send-email
```

**Response:**
```json
{
  "success": true,
  "emailId": "re_abc123"
}
```

### Archive/Restore/Hard Delete

```
PATCH /api/invoices/:id/archive
PATCH /api/invoices/:id/restore
DELETE /api/invoices/:id
```

---

## Freelancer Profile

Manage freelancer branding settings.

### Get Profile

```
GET /api/freelancer-profile
```

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "userId": "uuid",
    "brandName": "John's Software",
    "brandTagline": "Quality Software Solutions",
    "logoUrl": "https://r2.example.com/logos/logo.png",
    "primaryColor": "#3B82F6",
    "secondaryColor": "#1E40AF",
    "defaultCurrency": "USD",
    "defaultInvoiceLanguage": "en",
    "invoiceFooterText": "Thank you for your business!",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-03-26T00:00:00.000Z"
  }
}
```

### Upsert Profile

```
POST /api/freelancer-profile
```

**Body:**
```json
{
  "brandName": "John's Software",
  "brandTagline": "Quality Software Solutions",
  "primaryColor": "#3B82F6",
  "secondaryColor": "#1E40AF",
  "defaultCurrency": "USD",
  "defaultInvoiceLanguage": "en",
  "invoiceFooterText": "Payment due within 30 days."
}
```

---

## Public Endpoints

These endpoints are accessible without authentication for license validation.

### Validate License

```
POST /api/v1/license/validate
```

**Body:**
```json
{
  "licenseKey": "FWTL-XXXX-XXXX-XXXX",
  "appName": "MyApp",
  "deviceId": "device-fingerprint"
}
```

**Success Response (200):**
```json
{
  "valid": true,
  "license": {
    "id": "uuid",
    "key": "FWTL-XXXX-XXXX-XXXX",
    "status": "active"
  },
  "activationsRemaining": 2,
  "activationsUsed": 1
}
```

**Error Response (400):**
```json
{
  "valid": false,
  "error": "License revoked"
}
```

### Request Activation

```
POST /api/v1/activation/request
```

**Body:**
```json
{
  "licenseKey": "FWTL-XXXX-XXXX-XXXX",
  "appName": "MyApp",
  "deviceId": "device-fingerprint",
  "deviceName": "John's MacBook",
  "deviceInfo": {
    "os": "macOS 14.0",
    "model": "MacBook Pro",
    "hostname": "johns-macbook"
  }
}
```

**Success Response (202):**
```json
{
  "success": true,
  "requestId": "uuid",
  "status": "pending",
  "message": "Activation request submitted. Awaiting approval."
}
```

### Check Activation Request Status

```
GET /api/v1/activation/request/:requestId
```

**Response:**
```json
{
  "request": {
    "id": "uuid",
    "licenseId": "uuid",
    "deviceId": "device-fingerprint",
    "deviceName": "John's MacBook",
    "status": "approved",
    "requestedAt": "2026-03-26T00:00:00.000Z",
    "processedAt": "2026-03-26T00:05:00.000Z",
    "activationToken": "token-abc123"
  }
}
```

**Request statuses:** `pending`, `approved`, `rejected`

### Complete Activation

```
POST /api/v1/activation/complete
```

**Body:**
```json
{
  "activationToken": "token-abc123"
}
```

**Success Response:**
```json
{
  "success": true,
  "activation": {
    "id": "uuid",
    "deviceId": "device-fingerprint",
    "activatedAt": "2026-03-26T00:00:00.000Z"
  }
}
```

### Deactivate Device

```
POST /api/v1/activation/deactivate
```

**Body:**
```json
{
  "licenseKey": "FWTL-XXXX-XXXX-XXXX",
  "appName": "MyApp",
  "deviceId": "device-fingerprint"
}
```

---

## Error Handling

All endpoints follow consistent error responses:

### 400 Bad Request

```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limiting

Public endpoints are rate-limited:
- `/api/v1/*`: 100 requests per minute per IP

Authenticated endpoints have higher limits.

---

## CORS

CORS is enabled for:
- Development: `http://localhost:3000`
- Production: Configured via `CORS_ORIGIN` environment variable
