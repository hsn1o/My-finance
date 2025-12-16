# Phase 4.5: Income Split API - Implementation Complete ✅

## Overview

Income Split API has been implemented to allow users to split incoming income equally across all three buckets (obligations, investments, personal). This is a convenient feature for automatically distributing income according to the app's core philosophy.

## Files Created

### `app/api/income-split/route.ts`
Contains POST handler for splitting income.

## API Endpoints

### POST /api/income-split

Split income equally across 3 buckets.

**Authentication:** Required

**Request Body:**
```json
{
  "amountMinor": 300000,
  "currencyCode": "USD",
  "effectiveAt": "2025-01-01T00:00:00.000Z",
  "note": "Monthly salary"
}
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "tx1",
      "bucket": "obligations",
      "categoryId": "cat1",
      "type": "income",
      "amountMinor": 100000,
      "currencyCode": "USD",
      "effectiveAt": "2025-01-01T00:00:00.000Z",
      "note": "Monthly salary (split)",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "tx2",
      "bucket": "investments",
      "categoryId": "cat2",
      "type": "income",
      "amountMinor": 100000,
      "currencyCode": "USD",
      "effectiveAt": "2025-01-01T00:00:00.000Z",
      "note": "Monthly salary (split)",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "tx3",
      "bucket": "personal",
      "categoryId": "cat3",
      "type": "income",
      "amountMinor": 100000,
      "currencyCode": "USD",
      "effectiveAt": "2025-01-01T00:00:00.000Z",
      "note": "Monthly salary (split)",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Validation:**
- `amountMinor` - Required, must be positive integer (amount in cents)
- `currencyCode` - Required, must be 3 uppercase letters (e.g., USD, EUR)
- `effectiveAt` - Optional, ISO 8601 datetime (defaults to now)
- `note` - Optional, max 500 characters

**Business Rules:**
- Creates 3 transactions (one per bucket)
- Divides amount equally across 3 buckets
- Remainder is distributed to first buckets (obligations, investments, personal)
- All transactions marked as `type: income`
- Uses same currency and date for all transactions
- Auto-creates "Income" category in each bucket if it doesn't exist
- All transactions created in a database transaction (atomic)

**Distribution Logic:**
- Total amount: 300,000 cents ($3,000)
- Each bucket gets: 100,000 cents ($1,000)
- Total: 300,000 cents ✓

- Total amount: 100,000 cents ($1,000)
- Base per bucket: 33,333 cents
- Remainder: 1 cent
- Distribution:
  - Obligations: 33,334 cents
  - Investments: 33,333 cents
  - Personal: 33,333 cents
- Total: 100,000 cents ✓

**Status Codes:**
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized
- `500` - Internal server error

## Features

✅ **Authentication Required**
- Endpoint requires authentication
- Uses `requireAuth()` middleware

✅ **Equal Distribution**
- Amount divided equally across 3 buckets
- Uses `distributeMoney()` utility function
- Remainder distributed to first buckets

✅ **Automatic Category Creation**
- Finds existing income category in each bucket
- Creates "Income" category if it doesn't exist
- Ensures transactions can be created

✅ **Atomic Operation**
- All 3 transactions created in database transaction
- Either all succeed or all fail
- Data integrity guaranteed

✅ **Consistent Data**
- All transactions use same currency
- All transactions use same date
- All transactions marked as income
- Note is appended with "(split)" suffix

✅ **Type Safety**
- Uses adapters from Phase 3 for conversions
- Full TypeScript support

## Usage Examples

### Split Income

```bash
curl -X POST http://localhost:3000/api/income-split \
  -H "Content-Type: application/json" \
  -H "Cookie: finance_session=USER_ID_HERE" \
  -d '{
    "amountMinor": 300000,
    "currencyCode": "USD",
    "effectiveAt": "2025-01-01T00:00:00.000Z",
    "note": "Monthly salary"
  }'
```

### Split Income with Default Date

```bash
curl -X POST http://localhost:3000/api/income-split \
  -H "Content-Type: application/json" \
  -H "Cookie: finance_session=USER_ID_HERE" \
  -d '{
    "amountMinor": 500000,
    "currencyCode": "EUR",
    "note": "Freelance payment"
  }'
```

## Distribution Examples

### Example 1: Perfectly Divisible Amount

**Input:**
- Amount: 300,000 cents ($3,000)

**Output:**
- Obligations: 100,000 cents ($1,000)
- Investments: 100,000 cents ($1,000)
- Personal: 100,000 cents ($1,000)
- Total: 300,000 cents ✓

### Example 2: Amount with Remainder

**Input:**
- Amount: 100,000 cents ($1,000)

**Output:**
- Obligations: 33,334 cents ($333.34)
- Investments: 33,333 cents ($333.33)
- Personal: 33,333 cents ($333.33)
- Total: 100,000 cents ✓

### Example 3: Small Amount

**Input:**
- Amount: 5 cents ($0.05)

**Output:**
- Obligations: 2 cents
- Investments: 2 cents
- Personal: 1 cent
- Total: 5 cents ✓

## Database Transaction

All 3 transactions are created in a single database transaction:

```typescript
await prisma.$transaction(
  categories.map(({ bucket, categoryId }, index) =>
    prisma.transaction.create({
      data: transactionToDb(...),
    })
  )
)
```

**Benefits:**
- Atomic operation (all or nothing)
- Data consistency guaranteed
- No partial splits possible

## Category Management

The API automatically handles income categories:

1. **Find Existing Category**
   - Searches for income category in each bucket
   - Uses first income category found

2. **Create Default Category**
   - If no income category exists, creates "Income" category
   - Category type: `income`
   - Category name: "Income"

3. **Bucket-Specific Categories**
   - Each bucket can have its own income category
   - Categories are created per bucket if needed

## Integration with Transactions API

The income split creates regular transactions that:
- Can be viewed via GET /api/transactions
- Can be updated via PUT /api/transactions/[id]
- Can be deleted via DELETE /api/transactions/[id]
- Appear in balance calculations
- Support all transaction filters

## Use Cases

### Monthly Salary Distribution
Split monthly salary across all buckets:
```json
{
  "amountMinor": 500000,
  "currencyCode": "USD",
  "note": "January 2025 salary"
}
```

### Freelance Income
Split freelance payment:
```json
{
  "amountMinor": 150000,
  "currencyCode": "EUR",
  "note": "Project completion payment"
}
```

### Bonus Distribution
Split bonus equally:
```json
{
  "amountMinor": 1000000,
  "currencyCode": "USD",
  "note": "Annual bonus"
}
```

## Next Steps

✅ **Phase 4.5 Complete!**

Income Split API is fully implemented and ready for use.

**Ready for:**
- Phase 4.6: Currencies API
- Phase 4.7: Balance Calculation API (uses these transactions)
- Frontend integration (income split page)

## Notes

- All transactions are created atomically
- Amount distribution handles remainders correctly
- Income categories are auto-created if needed
- Transactions can be individually managed after creation
- Note is automatically appended with "(split)" for identification
- All transactions use the same currency and date

