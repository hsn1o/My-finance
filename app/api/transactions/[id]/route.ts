import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import { transactionUpdateToDb, transactionFromDb } from "@/lib/adapters"
import { updateTransactionSchema } from "@/lib/validators"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * PUT /api/transactions/[id]
 * Update a transaction
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth(request)
    const transactionId = params.id

    const body = await request.json()

    // Validate input
    const validationResult = updateTransactionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Check if transaction exists and belongs to user
    const existing = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - Transaction does not belong to you" },
        { status: 403 }
      )
    }

    // If categoryId is being updated, verify it exists and belongs to user
    if (body.categoryId && body.categoryId !== existing.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId },
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
    }

    // Prepare update data
    const updateData: any = validationResult.data

    // Parse effectiveAt if provided
    if (updateData.effectiveAt) {
      updateData.effectiveAt = new Date(updateData.effectiveAt)
    }

    // Convert to database format and update
    const dbUpdate = transactionUpdateToDb(updateData)

    const dbTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: dbUpdate,
    })

    // Convert back to frontend format
    const transaction = transactionFromDb(dbTransaction)

    return NextResponse.json({ transaction })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Update transaction error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transactions/[id]
 * Delete a transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth(request)
    const transactionId = params.id

    // Check if transaction exists and belongs to user
    const existing = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - Transaction does not belong to you" },
        { status: 403 }
      )
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id: transactionId },
    })

    return NextResponse.json({ message: "Transaction deleted successfully" })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Delete transaction error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

