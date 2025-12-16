import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import { transactionToDb, transactionFromDb } from "@/lib/adapters"
import { createTransactionSchema } from "@/lib/validators"
import type { BucketName } from "@/lib/api"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * GET /api/transactions
 * List transactions with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get("bucket") as BucketName | null
    const categoryId = searchParams.get("categoryId")
    const currencyCode = searchParams.get("currencyCode")
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build where clause
    const where: any = { userId }

    if (bucket && ["obligations", "investments", "personal"].includes(bucket)) {
      where.bucket = bucket
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (currencyCode) {
      where.currency = currencyCode.toUpperCase()
    }

    if (type) {
      // Convert frontend type to database type
      where.type = type === "outcome" ? "expense" : "income"
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // Fetch transactions from database
    const dbTransactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    })

    // Convert to frontend format
    const transactions = dbTransactions.map(transactionFromDb)

    return NextResponse.json({ transactions })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("List transactions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    const body = await request.json()

    // Validate input
    const validationResult = createTransactionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Verify category exists and belongs to user
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    if (category.userId !== userId) {
      return NextResponse.json(
        { error: "Category does not belong to you" },
        { status: 403 }
      )
    }

    // Parse effectiveAt date
    const effectiveAt = data.effectiveAt
      ? new Date(data.effectiveAt)
      : new Date()

    // Convert to database format and create
    const dbInput = transactionToDb(
      {
        categoryId: data.categoryId,
        bucket: data.bucket,
        type: data.type,
        amountMinor: data.amountMinor,
        currencyCode: data.currencyCode,
        effectiveAt,
        note: data.note,
      },
      userId
    )

    const dbTransaction = await prisma.transaction.create({
      data: dbInput,
    })

    // Convert back to frontend format
    const transaction = transactionFromDb(dbTransaction)

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Create transaction error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

