# Phase 4.2: Categories API - Implementation Complete ✅

## Overview

Categories API has been implemented to allow users to manage their transaction categories. Categories are organized by bucket (obligations, investments, personal) and type (income, expense).

## Files Created

### `app/api/categories/route.ts`
Contains GET and POST handlers for categories.

### `app/api/categories/[id]/route.ts`
Contains PUT and DELETE handlers for individual categories.

## API Endpoints

### GET /api/categories

List categories with optional bucket filter.

**Authentication:** Required

**Query Parameters:**
- `bucket` (optional) - Filter by bucket: `obligations`, `investments`, or `personal`

**Response:**
```json
{
  "categories": [
    {
      "id": "cat123",
      "name": "Rent",
      "bucket": "obligations",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "cat456",
      "name": "Groceries",
      "bucket": "personal",
      "createdAt": "2025-01-02T00:00:00.000Z"
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
# Get all categories
GET /api/categories

# Get categories in obligations bucket
GET /api/categories?bucket=obligations
```

### POST /api/categories

Create a new category.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Rent",
  "bucket": "obligations",
  "type": "expense"
}
```

**Response:**
```json
{
  "category": {
    "id": "cat123",
    "name": "Rent",
    "bucket": "obligations",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Validation:**
- `name` - Required, 1-100 characters
- `bucket` - Required, must be: `obligations`, `investments`, or `personal`
- `type` - Required, must be: `income` or `expense`

**Business Rules:**
- Category name must be unique within the same bucket and type for the user
- Categories are automatically associated with the authenticated user

**Status Codes:**
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized
- `409` - Conflict (duplicate category name)
- `500` - Internal server error

### PUT /api/categories/[id]

Update a category.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Updated Rent",
  "bucket": "obligations"
}
```

**Response:**
```json
{
  "category": {
    "id": "cat123",
    "name": "Updated Rent",
    "bucket": "obligations",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Validation:**
- `name` - Optional, 1-100 characters
- `bucket` - Optional, must be: `obligations`, `investments`, or `personal`

**Business Rules:**
- Category must belong to the authenticated user
- Updated name must be unique within the same bucket and type
- Category type cannot be changed (only name and bucket)

**Status Codes:**
- `200` - Success
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (category doesn't belong to user)
- `404` - Not found
- `409` - Conflict (duplicate category name)
- `500` - Internal server error

### DELETE /api/categories/[id]

Delete a category.

**Authentication:** Required

**Response:**
```json
{
  "message": "Category deleted successfully"
}
```

**Business Rules:**
- Category must belong to the authenticated user
- Category cannot be deleted if it has associated transactions
- Prisma schema enforces this with `onDelete: Restrict`

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (category doesn't belong to user)
- `404` - Not found
- `409` - Conflict (category has transactions)
- `500` - Internal server error

**Error Response (if has transactions):**
```json
{
  "error": "Cannot delete category with existing transactions",
  "details": "This category has 5 transaction(s). Please delete or reassign them first."
}
```

## Features

✅ **Authentication Required**
- All endpoints require authentication
- Uses `requireAuth()` middleware

✅ **User Ownership**
- Categories are automatically associated with the authenticated user
- Users can only access/modify their own categories

✅ **Bucket Filtering**
- GET endpoint supports optional bucket filter
- Returns categories sorted by bucket and name

✅ **Duplicate Prevention**
- Prevents duplicate category names within same bucket and type
- Returns 409 Conflict with clear error message

✅ **Deletion Protection**
- Prevents deletion of categories with transactions
- Checks transaction count before deletion
- Returns helpful error message with transaction count

✅ **Validation**
- Zod schema validation for all inputs
- Name length validation (1-100 characters)
- Bucket and type enum validation

✅ **Type Safety**
- Uses adapters from Phase 3 for type conversions
- Full TypeScript support

## Usage Examples

### List All Categories

```bash
curl -X GET http://localhost:3000/api/categories \
  -H "Cookie: finance_session=USER_ID_HERE"
```

### List Categories in Obligations Bucket

```bash
curl -X GET "http://localhost:3000/api/categories?bucket=obligations" \
  -H "Cookie: finance_session=USER_ID_HERE"
```

### Create Category

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Cookie: finance_session=USER_ID_HERE" \
  -d '{
    "name": "Rent",
    "bucket": "obligations",
    "type": "expense"
  }'
```

### Update Category

```bash
curl -X PUT http://localhost:3000/api/categories/cat123 \
  -H "Content-Type: application/json" \
  -H "Cookie: finance_session=USER_ID_HERE" \
  -d '{
    "name": "Monthly Rent"
  }'
```

### Delete Category

```bash
curl -X DELETE http://localhost:3000/api/categories/cat123 \
  -H "Cookie: finance_session=USER_ID_HERE"
```

## Database Schema

Categories are stored in the `categories` table:

```prisma
model Category {
  id          String       @id @default(cuid())
  userId      String
  name        String
  bucket      BucketType
  type        CategoryType
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  user        User         @relation(...)
  transactions Transaction[]
}
```

**Indexes:**
- `userId` + `bucket` (for efficient filtering)

**Constraints:**
- `onDelete: Restrict` for transactions (prevents deletion if has transactions)

## Business Rules

1. **User Ownership**
   - Categories belong to the user who created them
   - Users can only access their own categories

2. **Uniqueness**
   - Category name must be unique within the same bucket and type
   - Same name can exist in different buckets or types

3. **Deletion Restrictions**
   - Categories with transactions cannot be deleted
   - Must delete or reassign transactions first

4. **Category Type**
   - Type is set on creation and cannot be changed
   - Type determines if category is for income or expense transactions

5. **Bucket Organization**
   - Categories are organized into three buckets:
     - `obligations` - Bills and necessities
     - `investments` - Savings and retirement
     - `personal` - Discretionary spending

## Integration with Adapters

The API uses adapters from Phase 3:
- `categoryToDb()` - Converts frontend category to database format
- `categoryFromDb()` - Converts database category to frontend format
- `categoryUpdateToDb()` - Converts update data to database format

## Next Steps

✅ **Phase 4.2 Complete!**

Categories API is fully implemented and ready for use.

**Ready for:**
- Phase 4.3: Transactions API (depends on categories)
- Frontend integration (categories page)
- Transaction creation (requires categories)

## Notes

- Category type (`income`/`expense`) is required in database but not in frontend type
- Type is provided separately when creating categories
- Categories are sorted by bucket and name for consistent ordering
- Deletion protection ensures data integrity

