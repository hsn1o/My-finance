import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import { categoryToDb, categoryFromDb } from "@/lib/adapters"
import { createCategorySchema } from "@/lib/validators"
import type { BucketName } from "@/lib/api"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * GET /api/categories
 * List categories (with optional bucket filter)
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

    // Fetch categories from database
    const dbCategories = await prisma.category.findMany({
      where,
      orderBy: [
        { bucket: "asc" },
        { name: "asc" },
      ],
    })

    // Convert to frontend format
    const categories = dbCategories.map(categoryFromDb)

    return NextResponse.json({ categories })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("List categories error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    const body = await request.json()

    // Validate input
    const validationResult = createCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, bucket, type } = validationResult.data

    // Check if category with same name, bucket, and type already exists
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name,
        bucket: bucket as any,
        type: type as any,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Category with this name already exists in this bucket" },
        { status: 409 }
      )
    }

    // Convert to database format and create
    const dbInput = categoryToDb(
      { name, bucket },
      userId,
      type
    )

    const dbCategory = await prisma.category.create({
      data: dbInput,
    })

    // Convert back to frontend format
    const category = categoryFromDb(dbCategory)

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Create category error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

