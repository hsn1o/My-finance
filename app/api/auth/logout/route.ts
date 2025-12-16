import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE_NAME } from "@/lib/middleware"

/**
 * POST /api/auth/logout
 * Clear user session
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ message: "Logged out successfully" })
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

