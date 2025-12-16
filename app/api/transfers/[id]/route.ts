import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

/**
 * DELETE /api/transfers/[id]
 * Delete a transfer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth(request)
    const transferId = params.id

    // Check if transfer exists and belongs to user
    const existing = await prisma.transfer.findUnique({
      where: { id: transferId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 }
      )
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - Transfer does not belong to you" },
        { status: 403 }
      )
    }

    // Delete the transfer
    await prisma.transfer.delete({
      where: { id: transferId },
    })

    return NextResponse.json({ message: "Transfer deleted successfully" })
  } catch (error) {
    // Handle NextResponse errors from requireAuth
    if (error instanceof NextResponse) {
      return error
    }

    console.error("Delete transfer error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

