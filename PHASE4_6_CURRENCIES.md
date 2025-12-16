# Phase 4.6: Currencies API - Implementation Complete ✅

## Overview

Currencies API has been implemented using a hybrid approach: default currencies are provided as a static list, and users can add custom currencies that are stored in the database. This provides the best of both worlds - common currencies are always available, while users can add their own.

## Files Created/Modified

### `prisma/schema.prisma`
Added Currency model to store user custom currencies.

### `app/api/currencies/route.ts`
Contains GET and POST handlers for currencies.

### `app/api/currencies/[code]/route.ts`
Contains DELETE handler for individual currencies.

## Database Schema

**New Model: Currency**

```prisma
model Currency {
  id          String   @id @default(cuid())
  userId      String
  code        String   // ISO currency code (USD, EUR, etc.)
  name        String   // Display name (US Dollar, Euro, etc.)
  symbol      String   // Currency symbol ($, €, £, etc.)
  isDefault   Boolean  @default(false) // True for system defaults
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(...)
  
  @@unique([userId, code])
  @@index([userId])
}
```

**Note:** You'll need to run a migration to add this model:
```bash
npm run db:migrate
```

## Default Currencies

The following currencies are available by default to all users:
- USD - US Dollar ($)
- EUR - Euro (€)
- GBP - British Pound (£)
- JPY - Japanese Yen (¥)
- CAD - Canadian Dollar (C$)
- AUD - Australian Dollar (A$)
- CHF - Swiss Franc (CHF)
- CNY - Chinese Yuan (¥)

## API Endpoints

### GET /api/currencies

List supported currencies (default + user custom).

**Authentication:** Required

**Response:**
```json
{
  "currencies": [
    {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    },
    {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    {
      "code": "CUSTOM",
      "name": "Custom Currency",
      "symbol": "C"
    }
  ]
}
```

**Behavior:**
- Returns default currencies + user's custom currencies
- Default currencies that user has overridden are excluded
- Currencies sorted by code

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Internal server error

### POST /api/currencies

Add a custom currency.

**Authentication:** Required

**Request Body:**
```json
{
  "code": "BTC",
  "name": "Bitcoin",
  "symbol": "₿"
}
```

**Response:**
```json
{
  "currency": {
    "code": "BTC",
    "name": "Bitcoin",
    "symbol": "₿"
  }
}
```

**Validation:**
- `code` - Required, must be exactly 3 uppercase letters
- `name` - Required, 1-100 characters
- `symbol` - Required, 1-10 characters

**Business Rules:**
- Currency code must be unique for the user
- Cannot add currency code that already exists in defaults
- Custom currencies are stored per-user

**Status Codes:**
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized
- `409` - Conflict (currency already exists)
- `500` - Internal server error

### DELETE /api/currencies/[code]

Remove a custom currency.

**Authentication:** Required

**Response:**
```json
{
  "message": "Currency deleted successfully"
}
```

**Business Rules:**
- Cannot delete default currencies
- Cannot delete currency if used in transactions or transfers
- Only user's custom currencies can be deleted

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (trying to delete default currency)
- `404` - Not found
- `409` - Conflict (currency is in use)
- `500` - Internal server error

**Error Response (if in use):**
```json
{
  "error": "Cannot delete currency that is used in transactions or transfers",
  "details": "This currency is used in 5 transaction(s) and 2 transfer(s)."
}
```

## Features

✅ **Hybrid Approach**
- Default currencies always available
- Users can add custom currencies
- Custom currencies stored in database

✅ **Authentication Required**
- All endpoints require authentication
- Uses `requireAuth()` middleware

✅ **User Ownership**
- Custom currencies belong to the user who created them
- Users can only manage their own custom currencies

✅ **Default Currency Protection**
- Default currencies cannot be deleted
- Default currencies cannot be overridden
- Ensures common currencies are always available

✅ **Usage Protection**
- Cannot delete currencies used in transactions
- Cannot delete currencies used in transfers
- Prevents data integrity issues

✅ **Validation**
- Currency code must be 3 uppercase letters
- Name and symbol length validation
- Prevents duplicate currency codes

## Usage Examples

### List Currencies

```bash
curl -X GET http://localhost:3000/api/currencies \
  -H "Cookie: finance_session=USER_ID_HERE"
```

### Add Custom Currency

```bash
curl -X POST http://localhost:3000/api/currencies \
  -H "Content-Type: application/json" \
  -H "Cookie: finance_session=USER_ID_HERE" \
  -d '{
    "code": "BTC",
    "name": "Bitcoin",
    "symbol": "₿"
  }'
```

### Delete Custom Currency

```bash
curl -X DELETE http://localhost:3000/api/currencies/BTC \
  -H "Cookie: finance_session=USER_ID_HERE"
```

## Migration Required

**Important:** You need to run a database migration to add the Currency model:

```bash
npm run db:migrate
```

This will create the `currencies` table in your database.

## Business Rules

1. **Default Currencies**
   - Always available to all users
   - Cannot be deleted
   - Cannot be overridden

2. **Custom Currencies**
   - Stored per-user in database
   - Can be added and deleted
   - Must have unique code per user

3. **Currency Code Format**
   - Must be exactly 3 uppercase letters
   - Follows ISO 4217 standard
   - Auto-uppercased on input

4. **Deletion Restrictions**
   - Cannot delete default currencies
   - Cannot delete if used in transactions
   - Cannot delete if used in transfers

5. **Uniqueness**
   - Currency code must be unique per user
   - Cannot duplicate default currency codes
   - Cannot duplicate existing custom currency codes

## Integration Points

Currencies are used in:
- **Transactions** - `currency` field
- **Transfers** - `fromCurrency` and `toCurrency` fields
- **User Preferences** - `baseCurrency` field
- **Balance Calculations** - Currency grouping

## Next Steps

✅ **Phase 4.6 Complete!**

Currencies API is fully implemented and ready for use.

**Important:** Don't forget to run the migration:
```bash
npm run db:migrate
```

**Ready for:**
- Phase 4.7: Balance Calculation API (uses currencies)
- Frontend integration (settings page)
- Currency selection in transaction forms

## Notes

- Default currencies are hardcoded (not in database)
- Custom currencies are stored per-user
- Currency codes are automatically uppercased
- Deletion checks prevent data integrity issues
- Default currencies cannot be modified or deleted

