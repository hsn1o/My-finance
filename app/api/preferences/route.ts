import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import { updatePreferencesSchema } from "@/lib/validators"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * GET /api/preferences
 * Get user preferences (base currency)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    // Get or create user preferences
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    })

    // If preferences don't exist, create them with defaults
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          baseCurrency: "USD",
        },
      })
    }

    return NextResponse.json({
      preferences: {
        baseCurrency: preferences.baseCurrency,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt,
      },
    })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Get preferences error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/preferences
 * Update user preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    const body = await request.json()

    // Validate input
    const validationResult = updatePreferencesSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { baseCurrency } = validationResult.data

    // Validate currency code format (3 uppercase letters)
    if (!/^[A-Z]{3}$/.test(baseCurrency)) {
      return NextResponse.json(
        { error: "Invalid currency code. Must be 3 uppercase letters (e.g., USD, EUR)" },
        { status: 400 }
      )
    }

    // Update or create preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        baseCurrency,
      },
      create: {
        userId,
        baseCurrency,
      },
    })

    return NextResponse.json({
      preferences: {
        baseCurrency: preferences.baseCurrency,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt,
      },
    })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Update preferences error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

