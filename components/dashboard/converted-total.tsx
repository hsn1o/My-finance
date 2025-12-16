"use client"

import { Card } from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import type { Currency } from "@/lib/api"

interface ConvertedTotalProps {
  baseCurrency: string
  totalMinor: number
  currencies: Currency[]
}

export function ConvertedTotal({ baseCurrency, totalMinor, currencies }: ConvertedTotalProps) {
  const currency = currencies.find((c) => c.code === baseCurrency)
  const isPositive = totalMinor >= 0

  return (
    <Card className="p-4 sm:p-6 bg-primary text-primary-foreground">
      <div className="text-xs sm:text-sm font-medium mb-2">Total (converted to {baseCurrency})</div>
      <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isPositive ? "" : "opacity-80"}`}>
        {formatMoney(totalMinor, baseCurrency, currency?.symbol)}
      </div>
      <div className="text-xs sm:text-sm mt-2 opacity-90">Based on latest exchange rates</div>
    </Card>
  )
}
