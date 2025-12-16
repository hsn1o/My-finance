"use client"

import { Card } from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import type { BucketName, Currency } from "@/lib/api"
import Link from "next/link"

interface BucketCardProps {
  bucket: BucketName
  balances: Array<{
    currencyCode: string
    balanceMinor: number
  }>
  currencies: Currency[]
}

const bucketLabels: Record<BucketName, string> = {
  obligations: "Obligations",
  investments: "Investments",
  personal: "Personal",
}

const bucketColors: Record<BucketName, string> = {
  obligations: "border-l-amber-500",
  investments: "border-l-emerald-500",
  personal: "border-l-teal-500",
}

export function BucketCard({ bucket, balances, currencies }: BucketCardProps) {
  return (
    <Card className={`p-4 sm:p-6 border-l-4 ${bucketColors[bucket]}`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{bucketLabels[bucket]}</h3>
        <Link
          href={`/transactions?bucket=${bucket}`}
          className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          View transactions
        </Link>
      </div>

      {balances.length === 0 ? (
        <p className="text-xs sm:text-sm text-muted-foreground">No transactions yet</p>
      ) : (
        <div className="space-y-2">
          {balances.map(({ currencyCode, balanceMinor }) => {
            const currency = currencies.find((c) => c.code === currencyCode)
            const isPositive = balanceMinor >= 0

            return (
              <div key={currencyCode} className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">{currencyCode}</span>
                <span className={`text-base sm:text-lg font-semibold ${isPositive ? "text-success" : "text-destructive"}`}>
                  {formatMoney(balanceMinor, currencyCode, currency?.symbol)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
