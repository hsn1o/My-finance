"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { SplitIncomeForm } from "@/components/forms/split-income-form"
import { splitIncomeEqual } from "@/lib/api"

export default function IncomeSplitPage() {
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSplit(data: {
    amountMinor: number
    currencyCode: string
    effectiveAt: Date
    note?: string
  }) {
    try {
      setError(null)
      await splitIncomeEqual(data.amountMinor, data.currencyCode, data.effectiveAt, data.note)
      setSuccess(true)
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err) {
      // Error is handled by SplitIncomeForm component, but we can also set it here as fallback
      setError(err instanceof Error ? err.message : "Failed to split income")
      console.error("Failed to split income:", err)
    }
  }

  function handleCancel() {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Split Income</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Distribute income equally across all three buckets
            </p>
          </div>

          {/* Info Card */}
          <Card className="p-3 sm:p-4 bg-primary/5 border-primary/20">
            <p className="text-xs sm:text-sm text-foreground">
              This feature splits a single income amount into three equal parts, creating one income transaction for
              each bucket (Obligations, Investments, Personal). Any remainder cents are distributed to ensure the total
              matches exactly.
            </p>
          </Card>

          {/* Success Message */}
          {success && (
            <Card className="p-3 sm:p-4 bg-success/10 border-success/20">
              <p className="text-xs sm:text-sm text-success font-medium">
                Income split successfully! Redirecting to dashboard...
              </p>
            </Card>
          )}

          {/* Error Message (fallback if form doesn't catch it) */}
          {error && !success && (
            <Card className="p-3 sm:p-4 bg-destructive/10 border-destructive/20">
              <p className="text-xs sm:text-sm text-destructive font-medium">{error}</p>
            </Card>
          )}

          {/* Form */}
          <Card className="p-4 sm:p-6">
            <SplitIncomeForm onSubmit={handleSplit} onCancel={handleCancel} />
          </Card>
        </div>
      </main>
    </div>
  )
}
