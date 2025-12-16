import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Session cookie name
 */
export const SESSION_COOKIE_NAME = "finance_session"

/**
 * Get the current user ID from session cookie
 * @param request Next.js request object
 * @returns User ID if authenticated, null otherwise
 */
export async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    return null
  }

  try {
    // In a production app, you'd verify the session token
    // For now, we'll use a simple approach where the session ID is the user ID
    // In production, consider using JWT tokens or a session store
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: { id: true },
    })

    return user?.id || null
  } catch (error) {
    console.error("Error verifying session:", error)
    return null
  }
}

/**
 * Get the current user from session
 * @param request Next.js request object
 * @returns User object if authenticated, null otherwise
 */
export async function getCurrentUser(request: NextRequest) {
  const userId = await getUserIdFromSession(request)

  if (!userId) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return user
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

/**
 * Require authentication middleware
 * Returns 401 if user is not authenticated
 * @param request Next.js request object
 * @returns User ID if authenticated, throws error response otherwise
 */
export async function requireAuth(request: NextRequest): Promise<string> {
  const userId = await getUserIdFromSession(request)

  if (!userId) {
    throw new NextResponse(
      JSON.stringify({ error: "Unauthorized - Authentication required" }),
      { status: 401 }
    )
  }

  return userId
}


