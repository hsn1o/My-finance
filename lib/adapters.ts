import type { Transaction, Transfer, Category, BucketName } from "@/lib/api"
import type { Prisma } from "@prisma/client"

/**
 * Data Adapter Layer
 * 
 * Converts between frontend types (lib/api.ts) and database types (Prisma)
 * Handles field name mappings and type conversions
 */

// ============================================================================
// Transaction Adapters
// ============================================================================

/**
 * Convert frontend Transaction type to Prisma TransactionCreateInput
 */
export function transactionToDb(
  transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  userId: string
): Prisma.TransactionCreateInput {
  return {
    user: {
      connect: { id: userId },
    },
    category: {
      connect: { id: transaction.categoryId! },
    },
    bucket: transaction.bucket as Prisma.BucketType,
    type: transaction.type === "outcome" ? "expense" : "income",
    amountCents: transaction.amountMinor,
    currency: transaction.currencyCode,
    description: transaction.note || null,
    date: transaction.effectiveAt,
  }
}

/**
 * Convert Prisma Transaction to frontend Transaction type
 */
export function transactionFromDb(
  dbTransaction: {
    id: string
    bucket: string
    categoryId: string
    type: string
    amountCents: number
    currency: string
    description: string | null
    date: Date
    createdAt: Date
    updatedAt: Date
  }
): Transaction {
  return {
    id: dbTransaction.id,
    bucket: dbTransaction.bucket as BucketName,
    categoryId: dbTransaction.categoryId,
    type: dbTransaction.type === "expense" ? "outcome" : "income",
    amountMinor: dbTransaction.amountCents,
    currencyCode: dbTransaction.currency,
    note: dbTransaction.description || undefined,
    effectiveAt: dbTransaction.date,
    createdAt: dbTransaction.createdAt,
    updatedAt: dbTransaction.updatedAt,
  }
}

/**
 * Convert frontend Transaction update to Prisma TransactionUpdateInput
 */
export function transactionUpdateToDb(
  update: Partial<Omit<Transaction, "id" | "createdAt" | "updatedAt">>
): Prisma.TransactionUpdateInput {
  const updateInput: Prisma.TransactionUpdateInput = {}

  if (update.bucket !== undefined) {
    updateInput.bucket = update.bucket as Prisma.BucketType
  }

  if (update.type !== undefined) {
    updateInput.type = update.type === "outcome" ? "expense" : "income"
  }

  if (update.amountMinor !== undefined) {
    updateInput.amountCents = update.amountMinor
  }

  if (update.currencyCode !== undefined) {
    updateInput.currency = update.currencyCode
  }

  if (update.note !== undefined) {
    updateInput.description = update.note || null
  }

  if (update.effectiveAt !== undefined) {
    updateInput.date = update.effectiveAt
  }

  if (update.categoryId !== undefined) {
    updateInput.category = {
      connect: { id: update.categoryId },
    }
  }

  return updateInput
}

// ============================================================================
// Transfer Adapters
// ============================================================================

/**
 * Convert frontend Transfer type to Prisma TransferCreateInput
 */
export function transferToDb(
  transfer: Omit<Transfer, "id" | "createdAt">,
  userId: string
): Prisma.TransferCreateInput {
  return {
    user: {
      connect: { id: userId },
    },
    bucket: transfer.bucket as Prisma.BucketType,
    fromCurrency: transfer.fromCurrency,
    toCurrency: transfer.toCurrency,
    fromAmountCents: transfer.fromAmountMinor,
    toAmountCents: transfer.toAmountMinor,
    exchangeRate: transfer.manualRate,
    description: transfer.note || null,
    date: transfer.effectiveAt,
  }
}

/**
 * Convert Prisma Transfer to frontend Transfer type
 */
export function transferFromDb(
  dbTransfer: {
    id: string
    bucket: string
    fromCurrency: string
    toCurrency: string
    fromAmountCents: number
    toAmountCents: number
    exchangeRate: number
    description: string | null
    date: Date
    createdAt: Date
  }
): Transfer {
  return {
    id: dbTransfer.id,
    bucket: dbTransfer.bucket as BucketName,
    fromCurrency: dbTransfer.fromCurrency,
    toCurrency: dbTransfer.toCurrency,
    fromAmountMinor: dbTransfer.fromAmountCents,
    toAmountMinor: dbTransfer.toAmountCents,
    manualRate: dbTransfer.exchangeRate,
    note: dbTransfer.description || undefined,
    effectiveAt: dbTransfer.date,
    createdAt: dbTransfer.createdAt,
  }
}

// ============================================================================
// Category Adapters
// ============================================================================

/**
 * Convert frontend Category type to Prisma CategoryCreateInput
 * Note: Frontend Category doesn't have type or userId, so they must be provided
 */
export function categoryToDb(
  category: Omit<Category, "id" | "createdAt">,
  userId: string,
  type: "income" | "expense"
): Prisma.CategoryCreateInput {
  return {
    user: {
      connect: { id: userId },
    },
    name: category.name,
    bucket: category.bucket as Prisma.BucketType,
    type: type as Prisma.CategoryType,
  }
}

/**
 * Convert Prisma Category to frontend Category type
 */
export function categoryFromDb(
  dbCategory: {
    id: string
    name: string
    bucket: string
    type: string
    createdAt: Date
  }
): Category {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    bucket: dbCategory.bucket as BucketName,
    createdAt: dbCategory.createdAt,
  }
}

/**
 * Convert frontend Category update to Prisma CategoryUpdateInput
 */
export function categoryUpdateToDb(
  update: Partial<Omit<Category, "id" | "createdAt">>
): Prisma.CategoryUpdateInput {
  const updateInput: Prisma.CategoryUpdateInput = {}

  if (update.name !== undefined) {
    updateInput.name = update.name
  }

  if (update.bucket !== undefined) {
    updateInput.bucket = update.bucket as Prisma.BucketType
  }

  return updateInput
}

// ============================================================================
// Type Guards and Validators
// ============================================================================

/**
 * Validate that a bucket name is valid
 */
export function isValidBucket(bucket: string): bucket is BucketName {
  return bucket === "obligations" || bucket === "investments" || bucket === "personal"
}

/**
 * Validate that a transaction type is valid
 */
export function isValidTransactionType(type: string): type is "income" | "outcome" {
  return type === "income" || type === "outcome"
}

/**
 * Convert Prisma BucketType to frontend BucketName
 */
export function bucketFromDb(bucket: string): BucketName {
  if (isValidBucket(bucket)) {
    return bucket
  }
  throw new Error(`Invalid bucket type: ${bucket}`)
}

/**
 * Convert frontend BucketName to Prisma BucketType
 */
export function bucketToDb(bucket: BucketName): Prisma.BucketType {
  return bucket as Prisma.BucketType
}

