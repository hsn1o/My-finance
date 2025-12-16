import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * GET /api/balances/overall
 * Get overall balances per currency (across all buckets)
 * 
 * Calculates total balance for each currency by summing all transactions and transfers:
 * - Income transactions add to balance
 * - Expense transactions subtract from balance
 * - Transfers: subtract fromAmount from fromCurrency, add toAmount to toCurrency
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    // Get user preferences to check for hidden currencies
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    })

    // Parse hidden currencies from preferences
    let hiddenCurrencies: string[] = []
    if (preferences?.hiddenCurrencies) {
      try {
        hiddenCurrencies = JSON.parse(preferences.hiddenCurrencies) as string[]
        if (!Array.isArray(hiddenCurrencies)) {
          hiddenCurrencies = []
        }
      } catch {
        hiddenCurrencies = []
      }
    }
    const hiddenSet = new Set(hiddenCurrencies.map((c) => c.toUpperCase()))

    // Get all transactions and transfers for the user
    const [transactions, transfers] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        select: {
          type: true,
          amountCents: true,
          currency: true,
        },
      }),
      prisma.transfer.findMany({
        where: { userId },
        select: {
          fromCurrency: true,
          toCurrency: true,
          fromAmountCents: true,
          toAmountCents: true,
        },
      }),
    ])

    // Calculate overall balances per currency
    const balanceMap = new Map<string, number>()

    // Calculate from transactions
    for (const tx of transactions) {
      const current = balanceMap.get(tx.currency) || 0
      const delta = tx.type === "income" ? tx.amountCents : -tx.amountCents
      balanceMap.set(tx.currency, current + delta)
    }

    // Calculate from transfers
    // Transfers subtract from "fromCurrency" and add to "toCurrency"
    for (const transfer of transfers) {
      // Subtract from "fromCurrency"
      const fromCurrent = balanceMap.get(transfer.fromCurrency) || 0
      balanceMap.set(transfer.fromCurrency, fromCurrent - transfer.fromAmountCents)

      // Add to "toCurrency"
      const toCurrent = balanceMap.get(transfer.toCurrency) || 0
      balanceMap.set(transfer.toCurrency, toCurrent + transfer.toAmountCents)
    }

    // Convert to response format, excluding hidden currencies
    const balances = Array.from(balanceMap.entries())
      .map(([currencyCode, totalMinor]) => ({
        currencyCode,
        totalMinor,
      }))
      .filter((b) => b.totalMinor !== 0 && !hiddenSet.has(b.currencyCode.toUpperCase())) // Exclude zero balances and hidden currencies
      .sort((a, b) => a.currencyCode.localeCompare(b.currencyCode))

    return NextResponse.json({ balances })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Get overall balances error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

