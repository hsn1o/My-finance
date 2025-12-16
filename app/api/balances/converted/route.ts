import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import { convertMoney } from "@/lib/money"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * Get exchange rate from transfers
 * Returns the most recent exchange rate for converting fromCurrency to toCurrency
 */
async function getExchangeRateFromTransfers(
  userId: string,
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  // Find most recent transfer that converts fromCurrency to toCurrency
  const transfer = await prisma.transfer.findFirst({
    where: {
      userId,
      fromCurrency,
      toCurrency,
    },
    orderBy: {
      date: "desc",
    },
    select: {
      exchangeRate: true,
    },
  })

  if (transfer) {
    return transfer.exchangeRate
  }

  // Try reverse direction (toCurrency to fromCurrency)
  const reverseTransfer = await prisma.transfer.findFirst({
    where: {
      userId,
      fromCurrency: toCurrency,
      toCurrency: fromCurrency,
    },
    orderBy: {
      date: "desc",
    },
    select: {
      exchangeRate: true,
    },
  })

  if (reverseTransfer) {
    // Invert the rate
    return 1 / reverseTransfer.exchangeRate
  }

  return null
}

/**
 * GET /api/balances/converted
 * Get converted total in base currency
 * 
 * Converts all currency balances to the user's base currency using:
 * 1. Exchange rates from transfers (most recent)
 * 2. Falls back to 1:1 if no rate found (same currency or no transfer)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    // Get user's base currency and hidden currencies from preferences
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    })

    const baseCurrency = preferences?.baseCurrency || "USD"

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

    // Convert all balances to base currency, excluding hidden currencies
    let totalMinor = 0

    for (const [currencyCode, balanceMinor] of balanceMap.entries()) {
      // Skip hidden currencies
      if (hiddenSet.has(currencyCode.toUpperCase())) {
        continue
      }

      if (currencyCode === baseCurrency) {
        // Same currency, no conversion needed
        totalMinor += balanceMinor
      } else {
        // Get exchange rate from transfers
        const rate = await getExchangeRateFromTransfers(
          userId,
          currencyCode,
          baseCurrency
        )

        if (rate) {
          // Convert using transfer rate
          const converted = convertMoney(balanceMinor, rate)
          totalMinor += converted
        } else {
          // No exchange rate found - use 1:1 (or could return error)
          // For now, we'll include it as-is with a note
          totalMinor += balanceMinor
        }
      }
    }

    return NextResponse.json({
      baseCurrency,
      totalMinor,
    })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Get converted total error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

