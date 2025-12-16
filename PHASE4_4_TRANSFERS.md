# Phase 4.4: Transfers API - Implementation Complete ✅

## Overview

Transfers API has been implemented to allow users to manage currency transfers within the same bucket. Transfers represent moving money from one currency to another at a manually specified exchange rate.

## Files Created

### `app/api/transfers/route.ts`
Contains GET and POST handlers for transfers.

### `app/api/transfers/[id]/route.ts`
Contains DELETE handler for individual transfers.

## API Endpoints

### GET /api/transfers

List transfers with optional bucket filter.

**Authentication:** Required

**Query Parameters:**
- `bucket` (optional) - Filter by bucket: `obligations`, `investments`, or `personal`

**Response:**
```json
{
  "transfers": [
    {
      "id": "trf123",
      "bucket": "personal",
      "fromCurrency": "USD",
      "toCurrency": "EUR",
      "fromAmountMinor": 100000,
      "toAmountMinor": 92000,
      "manualRate": 0.92,
      "effectiveAt": "2025-01-01T00:00:00.000Z",
      "note": "Currency exchange",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Internal server error

**Examples:**
```bash
# Get all transfers
GET /api/transfers

# Get transfers in obligations bucket
GET /api/transfers?bucket=obligations
```

### POST /api/transfers

Create a new transfer.

**Authentication:** Required

**Request Body:**
```json
{
  "bucket": "personal",
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "fromAmountMinor": 100000,
  "toAmountMinor": 92000,
  "manualRate": 0.92,
  "effectiveAt": "2025-01-01T00:00:00.000Z",
  "note": "Currency exchange"
}
```

**Response:**
```json
{
  "transfer": {
    "id": "trf123",
    "bucket": "personal",
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "fromAmountMinor": 100000,
    "toAmountMinor": 92000,
    "manualRate": 0.92,
    "effectiveAt": "2025-01-01T00:00:00.000Z",
    "note": "Currency exchange",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Validation:**
- `bucket` - Required, must be: `obligations`, `investments`, or `personal`
- `fromCurrency` - Required, must be 3 uppercase letters (e.g., USD, EUR)
- `toCurrency` - Required, must be 3 uppercase letters (e.g., USD, EUR)
- `fromAmountMinor` - Required, must be positive integer (amount in cents)
- `toAmountMinor` - Required, must be positive integer (amount in cents)
- `manualRate` - Required, must be positive number (exchange rate)
- `effectiveAt` - Optional, ISO 8601 datetime (defaults to now)
- `note` - Optional, max 500 characters

**Business Rules:**
- Transfer must belong to authenticated user
- From currency and to currency must be different
- Both amounts must be provided (in minor units/cents)
- Exchange rate is manually provided (not calculated)
- Transfers are within the same bucket

**Status Codes:**
- `201` - Created
- `400` - Validation error (including same currency error)
- `401` - Unauthorized
- `500` - Internal server error

### DELETE /api/transfers/[id]

Delete a transfer.

**Authentication:** Required

**Response:**
```json
{
  "message": "Transfer deleted successfully"
}
```

**Business Rules:**
- Transfer must belong to authenticated user

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (transfer doesn't belong to user)
- `404` - Not found
- `500` - Internal server error

## Features

✅ **Authentication Required**
- All endpoints require authentication
- Uses `requireAuth()` middleware

✅ **User Ownership**
- Transfers are automatically associated with authenticated user
- Users can only access/modify their own transfers

✅ **Bucket Filtering**
- GET endpoint supports optional bucket filter
- Returns transfers sorted by date (newest first)

✅ **Currency Validation**
- Validates currency codes are 3 uppercase letters
- Ensures from and to currencies are different
- Auto-uppercases currency codes

✅ **Amount Validation**
- Both amounts must be positive integers
- Stored in minor units (cents) for precision
- No decimal handling needed

✅ **Exchange Rate**
- Exchange rate is manually provided
- Not calculated automatically
- Must be positive number

✅ **Type Safety**
- Uses adapters from Phase 3 for conversions
- Full TypeScript support

## Usage Examples

### List All Transfers

```bash
curl -X GET http://localhost:3000/api/transfers \
  -H "Cookie: finance_session=USER_ID_HERE"
```

### List Transfers in Bucket

```bash
curl -X GET "http://localhost:3000/api/transfers?bucket=personal" \
  -H "Cookie: finance_session=USER_ID_HERE"
```

### Create Transfer

```bash
curl -X POST http://localhost:3000/api/transfers \
  -H "Content-Type: application/json" \
  -H "Cookie: finance_session=USER_ID_HERE" \
  -d '{
    "bucket": "personal",
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "fromAmountMinor": 100000,
    "toAmountMinor": 92000,
    "manualRate": 0.92,
    "effectiveAt": "2025-01-01T00:00:00.000Z",
    "note": "Currency exchange"
  }'
```

### Delete Transfer

```bash
curl -X DELETE http://localhost:3000/api/transfers/trf123 \
  -H "Cookie: finance_session=USER_ID_HERE"
```

## Database Schema

Transfers are stored in the `transfers` table:

```prisma
model Transfer {
  id              String     @id @default(cuid())
  userId          String
  bucket          BucketType
  fromCurrency    String
  toCurrency      String
  fromAmountCents Int
  toAmountCents   Int
  exchangeRate    Float
  description     String?
  date            DateTime   @default(now())
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  user            User       @relation(...)
}
```

**Indexes:**
- `userId` + `bucket` (for efficient filtering)
- `userId` + `date` (for date-based queries)

## Business Rules

1. **User Ownership**
   - Transfers belong to the user who created them
   - Users can only access their own transfers

2. **Same Bucket**
   - Transfers are within the same bucket
   - Cannot transfer between buckets (use transactions instead)

3. **Different Currencies**
   - From currency and to currency must be different
   - Cannot transfer USD to USD (no-op)

4. **Manual Exchange Rate**
   - Exchange rate is provided by the user
   - Not calculated automatically
   - Allows for manual rate entry or custom rates

5. **Both Amounts Required**
   - Both `fromAmountMinor` and `toAmountMinor` must be provided
   - Allows for precise tracking of both sides of the transfer

6. **Amount Storage**
   - Amounts stored in minor units (cents)
   - No decimal precision issues
   - Must be positive integers

## Integration with Adapters

The API uses adapters from Phase 3:
- `transferToDb()` - Converts frontend transfer to database format
- `transferFromDb()` - Converts database transfer to frontend format

**Field Mappings:**
- `fromAmountMinor` ↔ `fromAmountCents`
- `toAmountMinor` ↔ `toAmountCents`
- `manualRate` ↔ `exchangeRate`
- `effectiveAt` ↔ `date`
- `note` ↔ `description`

## Use Cases

### Currency Exchange
Transfer money from USD to EUR within the personal bucket:
```json
{
  "bucket": "personal",
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "fromAmountMinor": 100000,
  "toAmountMinor": 92000,
  "manualRate": 0.92
}
```

### Multi-Currency Portfolio
Track currency conversions in investment bucket:
```json
{
  "bucket": "investments",
  "fromCurrency": "GBP",
  "toCurrency": "USD",
  "fromAmountMinor": 50000,
  "toAmountMinor": 63500,
  "manualRate": 1.27
}
```

## Next Steps

✅ **Phase 4.4 Complete!**

Transfers API is fully implemented and ready for use.

**Ready for:**
- Phase 4.5: Income Split API
- Phase 4.6: Currencies API
- Phase 4.7: Balance Calculation API (uses transfers for exchange rates)
- Frontend integration (transfers page)

## Notes

- Transfers are sorted by date (newest first)
- All amounts are in minor units (cents) for precision
- Currency codes are automatically uppercased
- Exchange rate is manual (not fetched from API)
- Transfers are within the same bucket only
- No update endpoint (transfers are immutable - delete and recreate if needed)

