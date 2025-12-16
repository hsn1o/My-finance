import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

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
 * DELETE /api/currencies/[code]
 * Remove a currency (custom or default)
 * 
 * For custom currencies: Deletes from database
 * For default currencies: Hides by adding to hiddenCurrencies in preferences (if not in use)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const userId = await requireAuth(request)
    const currencyCode = params.code.toUpperCase()

    // Check if currency is used in transactions or transfers
    const [transactionCount, transferCount] = await Promise.all([
      prisma.transaction.count({
        where: {
          userId,
          currency: currencyCode,
        },
      }),
      prisma.transfer.count({
        where: {
          userId,
          OR: [
            { fromCurrency: currencyCode },
            { toCurrency: currencyCode },
          ],
        },
      }),
    ])

    if (transactionCount > 0 || transferCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete currency that is used in transactions or transfers",
          details: `This currency is used in ${transactionCount} transaction(s) and ${transferCount} transfer(s).`,
        },
        { status: 409 }
      )
    }

    // Check if it's a default currency
    const isDefault = DEFAULT_CURRENCIES.some((c) => c.code === currencyCode)

    if (isDefault) {
      // For default currencies, hide them by adding to hiddenCurrencies
      const preferences = await prisma.userPreferences.findUnique({
        where: { userId },
      })

      // Parse hidden currencies, handling null/empty or invalid JSON
      let hiddenCurrencies: string[] = []
      if (preferences?.hiddenCurrencies) {
        try {
          hiddenCurrencies = JSON.parse(preferences.hiddenCurrencies) as string[]
          if (!Array.isArray(hiddenCurrencies)) {
            hiddenCurrencies = []
          }
        } catch {
          // If JSON is invalid, start with empty array
          hiddenCurrencies = []
        }
      }

      // Add to hidden list if not already there
      if (!hiddenCurrencies.includes(currencyCode)) {
        hiddenCurrencies.push(currencyCode)
      }

      // Update preferences
      await prisma.userPreferences.upsert({
        where: { userId },
        update: {
          hiddenCurrencies: JSON.stringify(hiddenCurrencies),
        },
        create: {
          userId,
          baseCurrency: "USD",
          hiddenCurrencies: JSON.stringify(hiddenCurrencies),
        },
      })

      return NextResponse.json({ message: "Currency hidden successfully" })
    } else {
      // For custom currencies, check if it exists and belongs to user
      const existing = await prisma.currency.findUnique({
        where: {
          userId_code: {
            userId,
            code: currencyCode,
          },
        },
      })

      if (!existing) {
        return NextResponse.json(
          { error: "Currency not found" },
          { status: 404 }
        )
      }

      // Delete the custom currency
      await prisma.currency.delete({
        where: {
          userId_code: {
            userId,
            code: currencyCode,
          },
        },
      })

      return NextResponse.json({ message: "Currency deleted successfully" })
    }
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Delete currency error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

