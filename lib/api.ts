// Core domain types for the finance app

export type BucketName = "obligations" | "investments" | "personal"

// User types
export interface User {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

export interface Currency {
  code: string
  name: string
  symbol: string
}

export interface Category {
  id: string
  bucket: BucketName
  name: string
  createdAt: Date
}

export type TransactionType = "income" | "outcome"

export interface Transaction {
  id: string
  bucket: BucketName
  categoryId?: string
  type: TransactionType
  amountMinor: number // Amount in minor units (cents)
  currencyCode: string
  effectiveAt: Date
  note?: string
  createdAt: Date
  updatedAt: Date
}

export interface Transfer {
  id: string
  bucket: BucketName
  fromCurrency: string
  toCurrency: string
  fromAmountMinor: number
  toAmountMinor: number
  manualRate: number
  effectiveAt: Date
  note?: string
  createdAt: Date
}

// API response types
export interface BucketBalance {
  bucket: BucketName
  balances: Array<{
    currencyCode: string
    balanceMinor: number
  }>
}

export interface OverallBalance {
  currencyCode: string
  totalMinor: number
}

export interface ConvertedTotal {
  baseCurrency: string
  totalMinor: number
}

// API Helper Functions

/**
 * Make an API request with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Include cookies for session management
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "An error occurred")
  }

  return data
}

// Authentication API

export async function registerUser(data: {
  email: string
  password: string
  name?: string
}): Promise<{ user: User }> {
  return apiRequest<{ user: User }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function loginUser(data: {
  email: string
  password: string
}): Promise<{ user: User }> {
  return apiRequest<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function logoutUser(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/logout", {
    method: "POST",
  })
}

export async function getCurrentUser(): Promise<{ user: User } | null> {
  try {
    return await apiRequest<{ user: User }>("/api/auth/me", {
      method: "GET",
    })
  } catch (error) {
    return null
  }
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Preferences API
export async function getPreferences(): Promise<{ baseCurrency: string }> {
  const response = await apiRequest<{ preferences: { baseCurrency: string } }>("/api/preferences")
  return { baseCurrency: response.preferences.baseCurrency }
}

export async function updatePreferences(data: { baseCurrency: string }): Promise<{ baseCurrency: string }> {
  const response = await apiRequest<{ preferences: { baseCurrency: string } }>("/api/preferences", {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return { baseCurrency: response.preferences.baseCurrency }
}

// Helper function to parse dates in API responses
function parseDates<T extends Record<string, any>>(obj: T): T {
  const parsed = { ...obj }
  for (const key in parsed) {
    if (key.includes("At") || key === "date" || key === "effectiveAt") {
      if (typeof parsed[key] === "string") {
        parsed[key] = new Date(parsed[key]) as any
      }
    }
  }
  return parsed
}

// Buckets API
export async function getBuckets(): Promise<BucketName[]> {
  // Static list - no API endpoint needed
  return ["obligations", "investments", "personal"]
}

// Categories API
export async function listCategories(bucket?: BucketName): Promise<Category[]> {
  const url = bucket ? `/api/categories?bucket=${bucket}` : "/api/categories"
  const response = await apiRequest<{ categories: Category[] }>(url)
  return response.categories.map((c) => parseDates(c))
}

export async function createCategory(
  data: Omit<Category, "id" | "createdAt"> & { type?: "income" | "expense" }
): Promise<Category> {
  // Default to "expense" if type not provided (for backward compatibility)
  // TODO: Update frontend form to collect category type
  const response = await apiRequest<{ category: Category }>("/api/categories", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      bucket: data.bucket,
      type: data.type || "expense",
    }),
  })
  return parseDates(response.category)
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, "id" | "createdAt">>
): Promise<Category> {
  const response = await apiRequest<{ category: Category }>(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return parseDates(response.category)
}

export async function deleteCategory(id: string): Promise<void> {
  await apiRequest(`/api/categories/${id}`, {
    method: "DELETE",
  })
}

// Transactions API
export async function listTransactions(filters?: {
  bucket?: BucketName
  categoryId?: string
  currencyCode?: string
  type?: "income" | "outcome"
  startDate?: Date
  endDate?: Date
}): Promise<Transaction[]> {
  const params = new URLSearchParams()
  if (filters?.bucket) params.append("bucket", filters.bucket)
  if (filters?.categoryId) params.append("categoryId", filters.categoryId)
  if (filters?.currencyCode) params.append("currencyCode", filters.currencyCode)
  if (filters?.type) params.append("type", filters.type)
  if (filters?.startDate) params.append("startDate", filters.startDate.toISOString())
  if (filters?.endDate) params.append("endDate", filters.endDate.toISOString())

  const url = `/api/transactions${params.toString() ? `?${params.toString()}` : ""}`
  const response = await apiRequest<{ transactions: Transaction[] }>(url)
  return response.transactions.map((t) => parseDates(t))
}

export async function createTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<Transaction> {
  const response = await apiRequest<{ transaction: Transaction }>("/api/transactions", {
    method: "POST",
    body: JSON.stringify({
      categoryId: data.categoryId,
      bucket: data.bucket,
      type: data.type,
      amountMinor: data.amountMinor,
      currencyCode: data.currencyCode,
      effectiveAt: data.effectiveAt.toISOString(),
      note: data.note,
    }),
  })
  return parseDates(response.transaction)
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, "id" | "createdAt" | "updatedAt">>,
): Promise<Transaction> {
  const body: any = { ...data }
  if (data.effectiveAt) {
    body.effectiveAt = data.effectiveAt.toISOString()
  }

  const response = await apiRequest<{ transaction: Transaction }>(`/api/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
  return parseDates(response.transaction)
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiRequest(`/api/transactions/${id}`, {
    method: "DELETE",
  })
}

// Transfers API
export async function listTransfers(bucket?: BucketName): Promise<Transfer[]> {
  const url = bucket ? `/api/transfers?bucket=${bucket}` : "/api/transfers"
  const response = await apiRequest<{ transfers: Transfer[] }>(url)
  return response.transfers.map((t) => parseDates(t))
}

export async function createTransfer(data: Omit<Transfer, "id" | "createdAt">): Promise<Transfer> {
  const response = await apiRequest<{ transfer: Transfer }>("/api/transfers", {
    method: "POST",
    body: JSON.stringify({
      bucket: data.bucket,
      fromCurrency: data.fromCurrency,
      toCurrency: data.toCurrency,
      fromAmountMinor: data.fromAmountMinor,
      toAmountMinor: data.toAmountMinor,
      manualRate: data.manualRate,
      effectiveAt: data.effectiveAt.toISOString(),
      note: data.note,
    }),
  })
  return parseDates(response.transfer)
}

export async function deleteTransfer(id: string): Promise<void> {
  await apiRequest(`/api/transfers/${id}`, {
    method: "DELETE",
  })
}

// Income Split API
export async function splitIncomeEqual(
  amountMinor: number,
  currencyCode: string,
  effectiveAt: Date,
  note?: string,
): Promise<Transaction[]> {
  const response = await apiRequest<{ transactions: Transaction[] }>("/api/income-split", {
    method: "POST",
    body: JSON.stringify({
      amountMinor,
      currencyCode,
      effectiveAt: effectiveAt.toISOString(),
      note,
    }),
  })
  return response.transactions.map((t) => parseDates(t))
}

// Currencies API
export async function listCurrencies(): Promise<Currency[]> {
  const response = await apiRequest<{ currencies: Currency[] }>("/api/currencies")
  return response.currencies
}

export async function createCurrency(data: Currency): Promise<Currency> {
  const response = await apiRequest<{ currency: Currency }>("/api/currencies", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.currency
}

export async function deleteCurrency(code: string): Promise<void> {
  await apiRequest(`/api/currencies/${code}`, {
    method: "DELETE",
  })
}

// Balance calculations
export async function getBucketBalances(): Promise<BucketBalance[]> {
  const response = await apiRequest<{ balances: BucketBalance[] }>("/api/balances/buckets")
  return response.balances
}

export async function getOverallBalances(): Promise<OverallBalance[]> {
  const response = await apiRequest<{ balances: OverallBalance[] }>("/api/balances/overall")
  return response.balances
}

export async function getLatestRateToBase(fromCurrency: string, baseCurrency: string): Promise<number> {
  // This function is used for converting balances in the frontend
  // The actual conversion is now handled by the /api/balances/converted endpoint
  // This is kept for backward compatibility but could be deprecated
  // For now, return 1 as a fallback (conversion happens server-side)
  return 1
}

// Get converted total (new function)
export async function getConvertedTotal(): Promise<ConvertedTotal> {
  const response = await apiRequest<ConvertedTotal>("/api/balances/converted")
  return response
}
