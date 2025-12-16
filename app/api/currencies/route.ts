import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import { createCurrencySchema } from "@/lib/validators"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * Default currencies available to all users
 */
const DEFAULT_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", isDefault: true },
  { code: "EUR", name: "Euro", symbol: "€", isDefault: true },
  { code: "GBP", name: "British Pound", symbol: "£", isDefault: true },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", isDefault: true },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", isDefault: true },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", isDefault: true },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", isDefault: true },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", isDefault: true },
]

/**
 * GET /api/currencies
 * List supported currencies (default + user custom)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    // Get user preferences to check for hidden currencies
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    })

    // Parse hidden currencies from preferences, handling null/empty or invalid JSON
    let hiddenCurrencies: string[] = []
    if (preferences?.hiddenCurrencies) {
      try {
        hiddenCurrencies = JSON.parse(preferences.hiddenCurrencies) as string[]
        if (!Array.isArray(hiddenCurrencies)) {
          hiddenCurrencies = []
        }
      } catch {
        // If JSON is invalid, treat as empty array
        hiddenCurrencies = []
      }
    }

    const hiddenSet = new Set(hiddenCurrencies.map((c) => c.toUpperCase()))

    // Get user's custom currencies from database
    const userCurrencies = await prisma.currency.findMany({
      where: { userId },
      orderBy: { code: "asc" },
    })

    // Combine default currencies with user custom currencies
    // Filter out defaults that user has overridden or hidden
    const userCurrencyCodes = new Set(userCurrencies.map((c: { code: string }) => c.code))
    const defaultCurrencies = DEFAULT_CURRENCIES.filter(
      (c: { code: string; name: string; symbol: string; isDefault: boolean }) => !userCurrencyCodes.has(c.code) && !hiddenSet.has(c.code)
    )

    // Convert to frontend format
    const currencies = [
      ...defaultCurrencies.map((c: { code: string; name: string; symbol: string }) => ({
        code: c.code,
        name: c.name,
        symbol: c.symbol,
      })),
      ...userCurrencies.map((c: { code: string; name: string; symbol: string }) => ({
        code: c.code,
        name: c.name,
        symbol: c.symbol,
      })),
    ]

    return NextResponse.json({ currencies })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("List currencies error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/currencies
 * Add a custom currency
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    const body = await request.json()

    // Validate input
    const validationResult = createCurrencySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { code, name, symbol } = validationResult.data

    // Check if currency code already exists (default or user custom)
    const isDefault = DEFAULT_CURRENCIES.some((c) => c.code === code)
    if (isDefault) {
      return NextResponse.json(
        { error: "Currency code already exists in default currencies" },
        { status: 409 }
      )
    }

    // Check if user already has this currency
    const existing = await prisma.currency.findUnique({
      where: {
        userId_code: {
          userId,
          code,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Currency already exists" },
        { status: 409 }
      )
    }

    // Create custom currency
    const currency = await prisma.currency.create({
      data: {
        userId,
        code,
        name,
        symbol,
        isDefault: false,
      },
    })

    return NextResponse.json(
      {
        currency: {
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Currency already exists" },
        { status: 409 }
      )
    }

    console.error("Create currency error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

