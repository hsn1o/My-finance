import { z } from "zod"

/**
 * Validation schemas for API requests
 */

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
})

export const updatePreferencesSchema = z.object({
  baseCurrency: z.string().min(3).max(3).toUpperCase(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  bucket: z.enum(["obligations", "investments", "personal"]),
  type: z.enum(["income", "expense"]),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100).optional(),
  bucket: z.enum(["obligations", "investments", "personal"]).optional(),
})

export const createTransactionSchema = z.object({
  categoryId: z.string().min(1, "Category ID is required"),
  bucket: z.enum(["obligations", "investments", "personal"]),
  type: z.enum(["income", "outcome"]),
  amountMinor: z.number().int().positive("Amount must be positive"),
  currencyCode: z.string().length(3, "Currency code must be 3 characters").toUpperCase(),
  effectiveAt: z.string().datetime().optional().or(z.date().optional()),
  note: z.string().max(500).optional(),
})

export const updateTransactionSchema = z.object({
  categoryId: z.string().min(1).optional(),
  bucket: z.enum(["obligations", "investments", "personal"]).optional(),
  type: z.enum(["income", "outcome"]).optional(),
  amountMinor: z.number().int().positive().optional(),
  currencyCode: z.string().length(3).toUpperCase().optional(),
  effectiveAt: z.string().datetime().optional().or(z.date().optional()),
  note: z.string().max(500).optional(),
})

export const createTransferSchema = z.object({
  bucket: z.enum(["obligations", "investments", "personal"]),
  fromCurrency: z.string().length(3, "Currency code must be 3 characters").toUpperCase(),
  toCurrency: z.string().length(3, "Currency code must be 3 characters").toUpperCase(),
  fromAmountMinor: z.number().int().positive("Amount must be positive"),
  toAmountMinor: z.number().int().positive("Amount must be positive"),
  manualRate: z.number().positive("Exchange rate must be positive"),
  effectiveAt: z.string().datetime().optional().or(z.date().optional()),
  note: z.string().max(500).optional(),
})

export const incomeSplitSchema = z.object({
  amountMinor: z.number().int().positive("Amount must be positive"),
  currencyCode: z.string().length(3, "Currency code must be 3 characters").toUpperCase(),
  effectiveAt: z.string().datetime().optional().or(z.date().optional()),
  note: z.string().max(500).optional(),
})

export const createCurrencySchema = z.object({
  code: z.string().length(3, "Currency code must be 3 characters").toUpperCase(),
  name: z.string().min(1, "Currency name is required").max(100),
  symbol: z.string().min(1, "Currency symbol is required").max(10),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type CreateTransferInput = z.infer<typeof createTransferSchema>
export type IncomeSplitInput = z.infer<typeof incomeSplitSchema>
export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>

