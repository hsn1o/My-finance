"use client"

import { Card } from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import type { Currency } from "@/lib/api"

interface OverallBalancesProps {
  balances: Array<{
    currencyCode: string
    totalMinor: number
  }>
  currencies: Currency[]
}

export function OverallBalances({ balances, currencies }: OverallBalancesProps) {
  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Overall Balances</h3>

      {balances.length === 0 ? (
        <p className="text-xs sm:text-sm text-muted-foreground">No transactions yet</p>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {balances.map(({ currencyCode, totalMinor }) => {
            const currency = currencies.find((c) => c.code === currencyCode)
            const isPositive = totalMinor >= 0

            return (
              <div key={currencyCode} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{currency?.symbol || currencyCode}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground truncate">
                    {currency?.name || currencyCode}
                  </span>
                </div>
                <span className={`text-lg sm:text-xl lg:text-2xl font-bold flex-shrink-0 ml-2 ${isPositive ? "text-success" : "text-destructive"}`}>
                  {formatMoney(totalMinor, currencyCode, currency?.symbol)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
