# Backend Implementation Plan
## Personal Finance App - Multi-Currency Tracker

---

## 📋 Project Overview

**Current State:**
- ✅ Frontend UI complete with mock data
- ✅ Prisma schema defined and ready
- ❌ Backend API routes need implementation
- ❌ Authentication system needs implementation
- ❌ Database connection and Prisma client setup needed

**Tech Stack:**
- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Session-based (to be implemented)
- **API:** Next.js API Routes (`app/api/*`)

---

## 🎯 Implementation Strategy

### Phase 1: Foundation Setup
**Goal:** Set up core infrastructure and database connection

1. **Install Dependencies**
   - Add `@prisma/client` and `prisma` to package.json
   - Add authentication library (e.g., `bcryptjs` for password hashing, `next-auth` or custom session management)
   - Add validation library (Zod is already installed)

2. **Prisma Client Setup**
   - Create `lib/prisma.ts` for singleton Prisma client instance
   - Handle connection pooling and development hot-reload issues
   - Add Prisma generate script to package.json

3. **Environment Variables**
   - Set up `.env` file with `DATABASE_URL`
   - Add `.env.example` template
   - Document required environment variables

4. **Database Migration**
   - Run `prisma migrate dev` to create database schema
   - Verify all tables and relationships are created correctly

---

### Phase 2: Authentication System
**Goal:** Implement user authentication and session management

1. **Password Hashing Utility**
   - Create `lib/auth.ts` with password hashing/verification functions
   - Use `bcryptjs` for secure password hashing

2. **Session Management**
   - Option A: Use NextAuth.js (recommended for production)
   - Option B: Custom session with JWT tokens
   - Create session middleware/utilities

3. **Auth API Routes**
   - `POST /api/auth/register` - User registration
   - `POST /api/auth/login` - User login
   - `POST /api/auth/logout` - User logout
   - `GET /api/auth/me` - Get current user
   - `POST /api/auth/change-password` - Change password

4. **Protected Route Middleware**
   - Create `lib/middleware.ts` for API route protection
   - Helper function to get current user from session

---

### Phase 3: Data Adapter Layer
**Goal:** Bridge frontend types and database schema

**Field Mapping Issues Identified:**
- Frontend `type: "outcome"` → Database `type: "expense"`
- Frontend `effectiveAt` → Database `date`
- Frontend `note` → Database `description`
- Frontend `amountMinor` → Database `amountCents`
- Frontend `currencyCode` → Database `currency`
- Frontend `manualRate` → Database `exchangeRate`

**Solution:**
- Create `lib/adapters.ts` with transformation functions
- Convert between frontend types (`lib/api.ts` types) and Prisma types
- Ensure type safety throughout

---

### Phase 4: Core API Routes Implementation

#### 4.1 User Preferences API
- `GET /api/preferences` - Get user preferences (base currency)
- `PUT /api/preferences` - Update user preferences

#### 4.2 Categories API
- `GET /api/categories` - List categories (with optional bucket filter)
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

**Business Rules:**
- Categories must belong to authenticated user
- Category deletion restricted if transactions exist (Prisma schema enforces this)

#### 4.3 Transactions API
- `GET /api/transactions` - List transactions with filters:
  - `bucket` (obligations/investments/personal)
  - `categoryId`
  - `currencyCode`
  - `type` (income/expense)
  - `startDate` / `endDate`
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction

**Business Rules:**
- All transactions must belong to authenticated user
- Transaction must reference valid category
- Amount stored in minor units (cents)
- Date can be set manually (defaults to now)

#### 4.4 Transfers API
- `GET /api/transfers` - List transfers (with optional bucket filter)
- `POST /api/transfers` - Create transfer
- `DELETE /api/transfers/[id]` - Delete transfer

**Business Rules:**
- Transfers are within the same bucket, between currencies
- Exchange rate is manually provided
- Both `fromAmountCents` and `toAmountCents` must be provided

#### 4.5 Income Split API
- `POST /api/income-split` - Split income equally across 3 buckets

**Business Rules:**
- Creates 3 transactions (one per bucket)
- Divides amount equally, remainder distributed to first buckets
- All transactions marked as `type: income`
- Uses same currency and date

#### 4.6 Currencies API
- `GET /api/currencies` - List supported currencies
- `POST /api/currencies` - Add currency
- `DELETE /api/currencies/[code]` - Remove currency

**Note:** Currencies might be stored in database or as static config. Decision needed.

#### 4.7 Balance Calculation API
- `GET /api/balances/buckets` - Get balances per bucket per currency
- `GET /api/balances/overall` - Get overall balances per currency
- `GET /api/balances/converted` - Get converted total in base currency

**Business Rules:**
- Calculate from transactions (income adds, expense subtracts)
- Group by bucket and currency
- Exchange rate calculation from transfers or manual rates

---

### Phase 5: Update Frontend API Client
**Goal:** Replace mock functions with real API calls

1. **Update `lib/api.ts`**
   - Replace mock implementations with `fetch()` calls to API routes
   - Keep same function signatures for frontend compatibility
   - Add error handling and response parsing
   - Handle authentication tokens/sessions

2. **Error Handling**
   - Create consistent error response format
   - Handle network errors gracefully
   - Show user-friendly error messages

---

### Phase 6: Testing & Validation
**Goal:** Ensure everything works correctly

1. **Input Validation**
   - Use Zod schemas for request validation
   - Validate currency codes, amounts, dates
   - Ensure proper error messages

2. **Edge Cases**
   - Test with multiple currencies
   - Test balance calculations with various scenarios
   - Test income split with different amounts
   - Test category deletion restrictions

3. **Integration Testing**
   - Test full user flows (register → create category → add transaction → view balance)
   - Test multi-currency scenarios
   - Test transfer functionality

---

## 📁 Proposed File Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── register/
│   │   │   └── route.ts
│   │   ├── login/
│   │   │   └── route.ts
│   │   ├── logout/
│   │   │   └── route.ts
│   │   ├── me/
│   │   │   └── route.ts
│   │   └── change-password/
│   │       └── route.ts
│   ├── categories/
│   │   ├── route.ts (GET, POST)
│   │   └── [id]/
│   │       └── route.ts (PUT, DELETE)
│   ├── transactions/
│   │   ├── route.ts (GET, POST)
│   │   └── [id]/
│   │       └── route.ts (PUT, DELETE)
│   ├── transfers/
│   │   ├── route.ts (GET, POST)
│   │   └── [id]/
│   │       └── route.ts (DELETE)
│   ├── income-split/
│   │   └── route.ts (POST)
│   ├── currencies/
│   │   ├── route.ts (GET, POST)
│   │   └── [code]/
│   │       └── route.ts (DELETE)
│   ├── balances/
│   │   ├── buckets/
│   │   │   └── route.ts (GET)
│   │   ├── overall/
│   │   │   └── route.ts (GET)
│   │   └── converted/
│   │       └── route.ts (GET)
│   └── preferences/
│       └── route.ts (GET, PUT)

lib/
├── prisma.ts (Prisma client singleton)
├── auth.ts (Password hashing, session utilities)
├── middleware.ts (API route protection)
├── adapters.ts (Frontend ↔ Database type conversions)
├── validators.ts (Zod schemas for validation)
└── api.ts (Updated to call real API routes)

prisma/
└── schema.prisma (Already exists)
```

---

## 🔄 Workflow Process

### How We'll Work Together

1. **Incremental Implementation**
   - We'll implement one API route at a time
   - Test each route before moving to the next
   - Update frontend integration as we go

2. **Code Review Points**
   - After each major phase, review the implementation
   - Discuss any design decisions or trade-offs
   - Adjust plan if needed based on findings

3. **Testing Strategy**
   - Manual testing via frontend after each route
   - Use Postman/Thunder Client for API testing
   - Verify database state after operations

4. **Error Handling**
   - Consistent error response format
   - Proper HTTP status codes
   - User-friendly error messages

5. **Documentation**
   - Comment complex business logic
   - Document API endpoints (request/response formats)
   - Keep this plan updated with progress

---

## 🚨 Important Considerations

### Security
- ✅ Always validate user ownership of resources
- ✅ Use parameterized queries (Prisma handles this)
- ✅ Hash passwords securely (bcrypt)
- ✅ Validate all inputs (Zod schemas)
- ✅ Protect API routes with authentication middleware

### Data Integrity
- ✅ Use database transactions for multi-step operations (income split)
- ✅ Enforce foreign key constraints (Prisma schema handles this)
- ✅ Validate currency codes
- ✅ Ensure amounts are positive integers (minor units)

### Performance
- ✅ Use database indexes (already in Prisma schema)
- ✅ Optimize balance calculation queries
- ✅ Consider caching for currency exchange rates
- ✅ Paginate large transaction lists if needed

### Currency Handling
- ⚠️ **Decision Needed:** How to store/manage supported currencies?
  - Option A: Static list in code/config
  - Option B: Database table for currencies
  - Option C: Hybrid (default list + user custom currencies)

---

## 📝 Next Steps

1. **Start with Phase 1:** Set up Prisma and database connection
2. **Then Phase 2:** Implement authentication (critical for all other routes)
3. **Then Phase 3:** Create adapter layer for type conversions
4. **Then Phase 4:** Implement API routes in logical order:
   - Preferences (simple, needed for base currency)
   - Categories (needed for transactions)
   - Transactions (core functionality)
   - Transfers (depends on transactions)
   - Income Split (uses transactions)
   - Currencies (simple CRUD)
   - Balances (depends on transactions)

5. **Finally Phase 5 & 6:** Update frontend and test everything

---

## 🤝 Collaboration Guidelines

- **Ask Questions:** If anything is unclear, ask before implementing
- **Propose Changes:** If you see a better approach, suggest it
- **Test Together:** We'll test each feature as we build it
- **Iterate:** We can refine the implementation as we learn

---

**Ready to start?** Let's begin with Phase 1: Foundation Setup! 🚀

