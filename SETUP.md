# Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running (local or remote)
- npm or yarn package manager

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This will automatically run `prisma generate` after installation (via postinstall script).

### 2. Database Configuration

1. **Create a PostgreSQL database** (if you haven't already):
   ```bash
   # Using psql
   createdb finance_db
   
   # Or using PostgreSQL client
   psql -U postgres -c "CREATE DATABASE finance_db;"
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and update `DATABASE_URL` with your database credentials:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/finance_db"
     ```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

This will:
- Create all database tables based on the Prisma schema
- Set up relationships and indexes
- Create a migration history

### 4. Verify Database Setup

You can use Prisma Studio to view your database:

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can browse and edit your database.

## Development

### Start Development Server

```bash
npm run dev
```

### Useful Commands

- `npm run db:generate` - Generate Prisma Client (runs automatically on install)
- `npm run db:migrate` - Create and apply a new migration
- `npm run db:push` - Push schema changes to database without creating migration (dev only)
- `npm run db:studio` - Open Prisma Studio to view/edit database
- `npm run build` - Build for production
- `npm run start` - Start production server

## Database Schema

The database schema is defined in `prisma/schema.prisma`. Key models:

- **User** - User accounts with authentication
- **UserPreferences** - User settings (base currency, etc.)
- **Category** - Transaction categories organized by bucket
- **Transaction** - Income and expense transactions
- **Transfer** - Currency transfers within buckets

## Troubleshooting

### Prisma Client Not Found

If you see errors about Prisma Client not being found:

```bash
npm run db:generate
```

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   # Check if PostgreSQL is running
   pg_isready
   ```

2. Verify DATABASE_URL in `.env` is correct
3. Check database credentials and permissions

### Migration Issues

If migrations fail:

1. Check database connection
2. Verify schema syntax in `prisma/schema.prisma`
3. For development, you can reset the database:
   ```bash
   # WARNING: This deletes all data!
   npx prisma migrate reset
   ```

## Next Steps

After completing setup:

1. ✅ Database is connected
2. ✅ Prisma Client is generated
3. ⏭️ Proceed to Phase 2: Authentication System

