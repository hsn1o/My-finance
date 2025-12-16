import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import { categoryUpdateToDb, categoryFromDb } from "@/lib/adapters"
import { updateCategorySchema } from "@/lib/validators"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * PUT /api/categories/[id]
 * Update a category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth(request)
    const categoryId = params.id

    const body = await request.json()

    // Validate input
    const validationResult = updateCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Check if category exists and belongs to user
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - Category does not belong to you" },
        { status: 403 }
      )
    }

    // Check for duplicate name if name is being updated
    if (body.name && body.name !== existing.name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          userId,
          name: body.name,
          bucket: body.bucket ? (body.bucket as any) : existing.bucket,
          type: existing.type,
          id: { not: categoryId },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: "Category with this name already exists in this bucket" },
          { status: 409 }
        )
      }
    }

    // Convert to database format and update
    const dbUpdate = categoryUpdateToDb(validationResult.data)

    const dbCategory = await prisma.category.update({
      where: { id: categoryId },
      data: dbUpdate,
    })

    // Convert back to frontend format
    const category = categoryFromDb(dbCategory)

    return NextResponse.json({ category })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Update category error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete a category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth(request)
    const categoryId = params.id

    // Check if category exists and belongs to user
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - Category does not belong to you" },
        { status: 403 }
      )
    }

    // Check if category has transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId },
    })

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with existing transactions",
          details: `This category has ${transactionCount} transaction(s). Please delete or reassign them first.`,
        },
        { status: 409 }
      )
    }

    // Delete the category
    // Note: Prisma schema has onDelete: Restrict for transactions,
    // but we check manually above for better error messages
    await prisma.category.delete({
      where: { id: categoryId },
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    // Handle Prisma foreign key constraint errors
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return NextResponse.json(
        {
          error: "Cannot delete category with existing transactions",
          details: "This category is referenced by one or more transactions.",
        },
        { status: 409 }
      )
    }

    console.error("Delete category error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

