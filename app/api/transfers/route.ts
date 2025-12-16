import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import { transferToDb, transferFromDb } from "@/lib/adapters"
import { createTransferSchema } from "@/lib/validators"
import type { BucketName } from "@/lib/api"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * GET /api/transfers
 * List transfers (with optional bucket filter)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    // Get optional bucket filter from query params
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get("bucket") as BucketName | null

    // Build where clause
    const where: { userId: string; bucket?: string } = { userId }
    if (bucket && ["obligations", "investments", "personal"].includes(bucket)) {
      where.bucket = bucket
    }

    // Fetch transfers from database
    const dbTransfers = await prisma.transfer.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    })

    // Convert to frontend format
    const transfers = dbTransfers.map(transferFromDb)

    return NextResponse.json({ transfers })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("List transfers error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transfers
 * Create a new transfer
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    const body = await request.json()

    // Validate input
    const validationResult = createTransferSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Validate currencies are different
    if (data.fromCurrency === data.toCurrency) {
      return NextResponse.json(
        { error: "From currency and to currency must be different" },
        { status: 400 }
      )
    }

    // Parse effectiveAt date
    const effectiveAt = data.effectiveAt
      ? new Date(data.effectiveAt)
      : new Date()

    // Convert to database format and create
    const dbInput = transferToDb(
      {
        bucket: data.bucket,
        fromCurrency: data.fromCurrency,
        toCurrency: data.toCurrency,
        fromAmountMinor: data.fromAmountMinor,
        toAmountMinor: data.toAmountMinor,
        manualRate: data.manualRate,
        effectiveAt,
        note: data.note,
      },
      userId
    )

    const dbTransfer = await prisma.transfer.create({
      data: dbInput,
    })

    // Convert back to frontend format
    const transfer = transferFromDb(dbTransfer)

    return NextResponse.json({ transfer }, { status: 201 })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Create transfer error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

