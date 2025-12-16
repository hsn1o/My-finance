import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import type { BucketName } from "@/lib/api"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * GET /api/balances/buckets
 * Get balances per bucket per currency
 * 
 * Calculates balance for each bucket by summing transactions and transfers:
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
          bucket: true,
          type: true,
          amountCents: true,
          currency: true,
        },
      }),
      prisma.transfer.findMany({
        where: { userId },
        select: {
          bucket: true,
          fromCurrency: true,
          toCurrency: true,
          fromAmountCents: true,
          toAmountCents: true,
        },
      }),
    ])

    // Calculate balances per bucket and currency
    const balanceMap = new Map<string, Map<string, number>>()

    // Initialize buckets
    const buckets: BucketName[] = ["obligations", "investments", "personal"]
    buckets.forEach((bucket) => {
      balanceMap.set(bucket, new Map<string, number>())
    })

    // Calculate balances from transactions
    for (const tx of transactions) {
      const bucketMap = balanceMap.get(tx.bucket)
      if (!bucketMap) continue

      const current = bucketMap.get(tx.currency) || 0
      const delta = tx.type === "income" ? tx.amountCents : -tx.amountCents
      bucketMap.set(tx.currency, current + delta)
    }

    // Calculate balances from transfers
    // Transfers subtract from "fromCurrency" and add to "toCurrency" within the same bucket
    for (const transfer of transfers) {
      const bucketMap = balanceMap.get(transfer.bucket)
      if (!bucketMap) continue

      // Subtract from "fromCurrency"
      const fromCurrent = bucketMap.get(transfer.fromCurrency) || 0
      bucketMap.set(transfer.fromCurrency, fromCurrent - transfer.fromAmountCents)

      // Add to "toCurrency"
      const toCurrent = bucketMap.get(transfer.toCurrency) || 0
      bucketMap.set(transfer.toCurrency, toCurrent + transfer.toAmountCents)
    }

    // Convert to response format, excluding hidden currencies
    const result = buckets.map((bucket) => {
      const bucketMap = balanceMap.get(bucket) || new Map()
      const balances = Array.from(bucketMap.entries())
        .map(([currencyCode, balanceMinor]) => ({
          currencyCode,
          balanceMinor,
        }))
        .filter((b) => b.balanceMinor !== 0 && !hiddenSet.has(b.currencyCode.toUpperCase())) // Exclude zero balances and hidden currencies

      return {
        bucket,
        balances,
      }
    })

    return NextResponse.json({ balances: result })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Get bucket balances error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

