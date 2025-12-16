# Phase 4.1: User Preferences API - Implementation Complete ✅

## Overview

User Preferences API has been implemented to allow users to get and update their preferences, specifically the base currency for currency conversions.

## Files Created

### `app/api/preferences/route.ts`

Contains both GET and PUT handlers for user preferences.

## API Endpoints

### GET /api/preferences

Get user preferences (base currency).

**Authentication:** Required

**Response:**
```json
{
  "preferences": {
    "baseCurrency": "USD",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Behavior:**
- Returns user's current preferences
- If preferences don't exist, creates them with default values (USD)
- Always returns preferences (never null)

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Internal server error

### PUT /api/preferences

Update user preferences.

**Authentication:** Required

**Request Body:**
```json
{
  "baseCurrency": "EUR"
}
```

**Response:**
```json
{
  "preferences": {
    "baseCurrency": "EUR",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

**Validation:**
- `baseCurrency` must be exactly 3 characters
- Automatically converted to uppercase
- Must match pattern: `^[A-Z]{3}$` (e.g., USD, EUR, GBP)

**Status Codes:**
- `200` - Success
- `400` - Validation error
- `401` - Unauthorized
- `500` - Internal server error

## Features

✅ **Authentication Required**
- Uses `requireAuth()` middleware
- Returns 401 if not authenticated

✅ **Auto-Creation**
- GET endpoint creates preferences if they don't exist
- Default base currency: USD

✅ **Upsert Logic**
- PUT endpoint uses upsert (update or create)
- Ensures preferences always exist

✅ **Validation**
- Zod schema validation
- Currency code format validation
- Automatic uppercase conversion

✅ **Error Handling**
- Proper HTTP status codes
- User-friendly error messages
- Detailed validation errors

## Usage Examples

### Get Preferences

```bash
curl -X GET http://localhost:3000/api/preferences \
  -H "Cookie: finance_session=USER_ID_HERE"
```

**Response:**
```json
{
  "preferences": {
    "baseCurrency": "USD",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Update Preferences

```bash
curl -X PUT http://localhost:3000/api/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: finance_session=USER_ID_HERE" \
  -d '{
    "baseCurrency": "EUR"
  }'
```

**Response:**
```json
{
  "preferences": {
    "baseCurrency": "EUR",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

### Invalid Currency Code

```bash
curl -X PUT http://localhost:3000/api/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: finance_session=USER_ID_HERE" \
  -d '{
    "baseCurrency": "us"
  }'
```

**Response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["baseCurrency"],
      "message": "String must contain at least 3 character(s)"
    }
  ]
}
```

## Database Schema

The preferences are stored in the `user_preferences` table:

```prisma
model UserPreferences {
  id              String   @id @default(cuid())
  userId          String   @unique
  baseCurrency    String   @default("USD")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(...)
}
```

## Business Rules

1. **One Preferences Per User**
   - Each user has exactly one preferences record
   - Enforced by unique constraint on `userId`

2. **Default Base Currency**
   - Default is USD if not specified
   - Created automatically on first GET request

3. **Currency Code Format**
   - Must be 3 uppercase letters
   - Standard ISO 4217 format (USD, EUR, GBP, etc.)

4. **Auto-Uppercase**
   - Input is automatically converted to uppercase
   - "usd" → "USD", "eur" → "EUR"

## Integration with Frontend

The preferences API is ready to be integrated with the frontend settings page. The base currency will be used for:
- Currency conversions in balance calculations
- Displaying converted totals
- Exchange rate calculations

## Next Steps

✅ **Phase 4.1 Complete!**

User Preferences API is fully implemented and ready for use.

**Ready for:**
- Phase 4.2: Categories API
- Frontend integration (settings page)
- Currency conversion features

## Notes

- Preferences are created automatically on first access
- Base currency is used throughout the app for conversions
- Validation ensures only valid currency codes are stored
- All operations require authentication

