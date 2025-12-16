"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { getBucketBalances, listCategories, listCurrencies, type BucketBalance, type Currency } from "@/lib/api"
import { formatMoney } from "@/lib/money"
import Link from "next/link"

export default function BucketsPage() {
  const [bucketBalances, setBucketBalances] = useState<BucketBalance[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [balances, currenciesList, categories] = await Promise.all([
        getBucketBalances(),
        listCurrencies(),
        listCategories(),
      ])

      setBucketBalances(balances)
      setCurrencies(currenciesList)

      const counts: Record<string, number> = {}
      for (const category of categories) {
        counts[category.bucket] = (counts[category.bucket] || 0) + 1
      }
      setCategoryCounts(counts)
    } catch (error) {
      console.error("Failed to load buckets data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-6 sm:h-8 bg-muted rounded w-32 sm:w-48" />
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-64 bg-muted rounded" />
              <div className="h-64 bg-muted rounded" />
              <div className="h-64 bg-muted rounded sm:col-span-2 lg:col-span-1" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Buckets</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Your three financial buckets for organizing money
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bucketBalances.map((bucket) => {
              const categoryCount = categoryCounts[bucket.bucket] || 0

              return (
                <Card key={bucket.bucket} className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 capitalize">
                    {bucket.bucket}
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Categories</div>
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{categoryCount}</div>
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Balances</div>
                      {bucket.balances.length === 0 ? (
                        <div className="text-xs sm:text-sm text-muted-foreground">No transactions</div>
                      ) : (
                        <div className="space-y-1">
                          {bucket.balances.map(({ currencyCode, balanceMinor }) => {
                            const currency = currencies.find((c) => c.code === currencyCode)
                            const isPositive = balanceMinor >= 0

                            return (
                              <div key={currencyCode} className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm text-muted-foreground">{currencyCode}</span>
                                <span
                                  className={`text-base sm:text-lg font-semibold ${isPositive ? "text-success" : "text-destructive"}`}
                                >
                                  {formatMoney(balanceMinor, currencyCode, currency?.symbol)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row gap-2">
                      <Link href={`/transactions?bucket=${bucket.bucket}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent text-xs sm:text-sm">
                          View Transactions
                        </Button>
                      </Link>
                      <Link href={`/categories?bucket=${bucket.bucket}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent text-xs sm:text-sm">
                          Categories
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
