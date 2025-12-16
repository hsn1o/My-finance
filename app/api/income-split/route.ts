import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import { transactionToDb, transactionFromDb } from "@/lib/adapters"
import { distributeMoney } from "@/lib/money"
import { incomeSplitSchema } from "@/lib/validators"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * POST /api/income-split
 * Split income equally across 3 buckets
 * 
 * Business Rules:
 * - Creates 3 transactions (one per bucket)
 * - Divides amount equally, remainder distributed to first buckets
 * - All transactions marked as type: income
 * - Uses same currency and date
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    const body = await request.json()

    // Validate input
    const validationResult = incomeSplitSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { amountMinor, currencyCode, effectiveAt, note } = validationResult.data

    // Parse effectiveAt date
    const date = effectiveAt ? new Date(effectiveAt) : new Date()

    // Get or create income categories for each bucket
    const buckets: Array<"obligations" | "investments" | "personal"> = [
      "obligations",
      "investments",
      "personal",
    ]

    // Find or create income categories for each bucket
    const categories = await Promise.all(
      buckets.map(async (bucket) => {
        // Try to find existing income category in this bucket
        let category = await prisma.category.findFirst({
          where: {
            userId,
            bucket: bucket as any,
            type: "income",
          },
        })

        // If no income category exists, create a default one
        if (!category) {
          category = await prisma.category.create({
            data: {
              userId,
              name: "Income",
              bucket: bucket as any,
              type: "income",
            },
          })
        }

        return { bucket, categoryId: category.id }
      })
    )

    // Distribute amount equally across 3 buckets
    // Remainder is distributed to first buckets
    const amounts = distributeMoney(amountMinor, 3)

    // Create all 3 transactions in a database transaction
    const transactions = await prisma.$transaction(
      categories.map(({ bucket, categoryId }, index) =>
        prisma.transaction.create({
          data: transactionToDb(
            {
              categoryId,
              bucket,
              type: "income",
              amountMinor: amounts[index],
              currencyCode,
              effectiveAt: date,
              note: note ? `${note} (split)` : "Income split",
            },
            userId
          ),
        })
      )
    )

    // Convert to frontend format
    const frontendTransactions = transactions.map(transactionFromDb)

    return NextResponse.json(
      { transactions: frontendTransactions },
      { status: 201 }
    )
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Income split error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

