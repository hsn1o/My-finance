# Phase 4.3: Transactions API - Implementation Complete ✅

## Overview

Transactions API has been implemented to allow users to manage their income and expense transactions. Transactions are the core of the finance tracking system and support extensive filtering.

## Files Created

### `app/api/transactions/route.ts`
Contains GET and POST handlers for transactions.

### `app/api/transactions/[id]/route.ts`
Contains PUT and DELETE handlers for individual transactions.

## API Endpoints

### GET /api/transactions

List transactions with optional filters.

**Authentication:** Required

**Query Parameters:**
- `bucket` (optional) - Filter by bucket: `obligations`, `investments`, or `personal`
- `categoryId` (optional) - Filter by category ID
- `currencyCode` (optional) - Filter by currency code (e.g., USD, EUR)
- `type` (optional) - Filter by type: `income` or `outcome`
- `startDate` (optional) - Filter transactions from this date (ISO 8601)
- `endDate` (optional) - Filter transactions until this date (ISO 8601)

**Response:**
```json
{
  "transactions": [
    {
      "id": "tx123",
      "bucket": "obligations",
      "categoryId": "cat123",
      "type": "outcome",
      "amountMinor": 150000,
      "currencyCode": "USD",
      "effectiveAt": "2025-01-01T00:00:00.000Z",
      "note": "Monthly rent",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
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
# Get all transactions
GET /api/transactions

# Get transactions in obligations bucket
GET /api/transactions?bucket=obligations

# Get income transactions
GET /api/transactions?type=income

# Get transactions in date range
GET /api/transactions?startDate=2025-01-01&endDate=2025-01-31

# Combine filters
GET /api/transactions?bucket=personal&type=outcome&currencyCode=USD
```

### POST /api/transactions

Create a new transaction.

**Authentication:** Required

**Request Body:**
```json
{
  "categoryId": "cat123",
  "bucket": "obligations",
  "type": "outcome",
  "amountMinor": 150000,
  "currencyCode": "USD",
  "effectiveAt": "2025-01-01T00:00:00.000Z",
  "note": "Monthly rent"
}
```

**Response:**
```json
{
  "transaction": {
    "id": "tx123",
    "bucket": "obligations",
    "categoryId": "cat123",
    "type": "outcome",
    "amountMinor": 150000,
    "currencyCode": "USD",
    "effectiveAt": "2025-01-01T00:00:00.000Z",
    "note": "Monthly rent",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Validation:**
- `categoryId` - Required, must exist and belong to user
- `bucket` - Required, must be: `obligations`, `investments`, or `personal`
- `type` - Required, must be: `income` or `outcome`
- `amountMinor` - Required, must be positive integer (amount in cents)
- `currencyCode` - Required, must be 3 uppercase letters (e.g., USD, EUR)
- `effectiveAt` - Optional, ISO 8601 datetime (defaults to now)
- `note` - Optional, max 500 characters

**Business Rules:**
- Transaction must belong to authenticated user
- Category must exist and belong to the user
- Amount is stored in minor units (cents)
- Date defaults to current time if not provided

**Status Codes:**
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (category doesn't belong to user)
- `404` - Category not found
- `500` - Internal server error

### PUT /api/transactions/[id]

Update a transaction.

**Authentication:** Required

**Request Body:**
```json
{
  "amountMinor": 200000,
  "note": "Updated rent amount"
}
```

**Response:**
```json
{
  "transaction": {
    "id": "tx123",
    "bucket": "obligations",
    "categoryId": "cat123",
    "type": "outcome",
    "amountMinor": 200000,
    "currencyCode": "USD",
    "effectiveAt": "2025-01-01T00:00:00.000Z",
    "note": "Updated rent amount",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

**Validation:**
- All fields are optional
- Same validation rules as create for provided fields
- If `categoryId` is updated, new category must exist and belong to user

**Business Rules:**
- Transaction must belong to authenticated user
- If category is changed, new category must belong to user
- Only provided fields are updated

**Status Codes:**
- `200` - Success
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (transaction or category doesn't belong to user)
- `404` - Transaction or category not found
- `500` - Internal server error

### DELETE /api/transactions/[id]

Delete a transaction.

**Authentication:** Required

**Response:**
```json
{
  "message": "Transaction deleted successfully"
}
```

**Business Rules:**
- Transaction must belong to authenticated user

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (transaction doesn't belong to user)
- `404` - Not found
- `500` - Internal server error

## Features

✅ **Authentication Required**
- All endpoints require authentication
- Uses `requireAuth()` middleware

✅ **User Ownership**
- Transactions are automatically associated with authenticated user
- Users can only access/modify their own transactions

✅ **Advanced Filtering**
- Filter by bucket, category, currency, type, and date range
- Multiple filters can be combined
- Efficient database queries with indexes

✅ **Category Validation**
- Verifies category exists before creating/updating
- Ensures category belongs to user
- Prevents orphaned transactions

✅ **Amount Validation**
- Amount must be positive integer
- Stored in minor units (cents) for precision
- No decimal handling needed

✅ **Date Handling**
- Supports ISO 8601 datetime strings
- Defaults to current time if not provided
- Date range filtering for reports

✅ **Type Safety**
- Uses adapters from Phase 3 for conversions
- Full TypeScript support
- Proper type conversions (outcome ↔ expense)

## Usage Examples

### List All Transactions

```bash
curl -X GET http://localhost:3000/api/transactions \
  -H "Cookie: finance_session=USER_ID_HERE"
```

### List Transactions with Filters

```bash
# Filter by bucket and type
curl -X GET "http://localhost:3000/api/transactions?bucket=obligations&type=outcome" \
  -H "Cookie: finance_session=USER_ID_HERE"

# Filter by date range
curl -X GET "http://localhost:3000/api/transactions?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Cookie: finance_session=USER_ID_HERE"

# Filter by category and currency
curl -X GET "http://localhost:3000/api/transactions?categoryId=cat123&currencyCode=USD" \
  -H "Cookie: finance_session=USER_ID_HERE"
```

### Create Transaction

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Cookie: finance_session=USER_ID_HERE" \
  -d '{
    "categoryId": "cat123",
    "bucket": "obligations",
    "type": "outcome",
    "amountMinor": 150000,
    "currencyCode": "USD",
    "effectiveAt": "2025-01-01T00:00:00.000Z",
    "note": "Monthly rent"
  }'
```

### Update Transaction

```bash
curl -X PUT http://localhost:3000/api/transactions/tx123 \
  -H "Content-Type: application/json" \
  -H "Cookie: finance_session=USER_ID_HERE" \
  -d '{
    "amountMinor": 200000,
    "note": "Updated rent"
  }'
```

### Delete Transaction

```bash
curl -X DELETE http://localhost:3000/api/transactions/tx123 \
  -H "Cookie: finance_session=USER_ID_HERE"
```

## Database Schema

Transactions are stored in the `transactions` table:

```prisma
model Transaction {
  id          String          @id @default(cuid())
  userId      String
  categoryId  String
  bucket      BucketType
  type        TransactionType
  amountCents Int
  currency    String
  description String?
  date        DateTime        @default(now())
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  user        User            @relation(...)
  category    Category        @relation(...)
}
```

**Indexes:**
- `userId` + `bucket` (for efficient filtering)
- `userId` + `date` (for date range queries)
- `categoryId` (for category filtering)

**Constraints:**
- `onDelete: Restrict` for category (prevents deletion if has transactions)

## Business Rules

1. **User Ownership**
   - Transactions belong to the user who created them
   - Users can only access their own transactions

2. **Category Requirement**
   - Every transaction must have a category
   - Category must exist and belong to the user
   - Category cannot be deleted if it has transactions

3. **Amount Storage**
   - Amounts stored in minor units (cents)
   - No decimal precision issues
   - Must be positive integers

4. **Date Handling**
   - Date can be set manually or defaults to now
   - Supports date range filtering
   - Stored as DateTime in database

5. **Type Conversion**
   - Frontend uses: `income` / `outcome`
   - Database uses: `income` / `expense`
   - Adapters handle conversion automatically

## Integration with Adapters

The API uses adapters from Phase 3:
- `transactionToDb()` - Converts frontend transaction to database format
- `transactionFromDb()` - Converts database transaction to frontend format
- `transactionUpdateToDb()` - Converts update data to database format

**Field Mappings:**
- `type: "outcome"` ↔ `type: "expense"`
- `effectiveAt` ↔ `date`
- `note` ↔ `description`
- `amountMinor` ↔ `amountCents`
- `currencyCode` ↔ `currency`

## Next Steps

✅ **Phase 4.3 Complete!**

Transactions API is fully implemented and ready for use.

**Ready for:**
- Phase 4.4: Transfers API
- Phase 4.5: Income Split API (uses transactions)
- Phase 4.7: Balance Calculation API (uses transactions)
- Frontend integration (transactions page)

## Notes

- Transactions are sorted by date (newest first)
- All amounts are in minor units (cents) for precision
- Currency codes are automatically uppercased
- Date filtering supports both start and end dates
- Category validation ensures data integrity

