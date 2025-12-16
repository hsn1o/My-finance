"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { BucketCard } from "@/components/dashboard/bucket-card"
import { OverallBalances } from "@/components/dashboard/overall-balances"
import { ConvertedTotal } from "@/components/dashboard/converted-total"
import { Navigation } from "@/components/navigation"
import {
  getBucketBalances,
  getOverallBalances,
  listCurrencies,
  getConvertedTotal,
  type BucketBalance,
  type OverallBalance,
  type Currency,
} from "@/lib/api"
import Link from "next/link"

export default function DashboardPage() {
  const [bucketBalances, setBucketBalances] = useState<BucketBalance[]>([])
  const [overallBalances, setOverallBalances] = useState<OverallBalance[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [convertedTotal, setConvertedTotal] = useState<number>(0)
  const [baseCurrency, setBaseCurrency] = useState<string>("USD")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load all data in parallel
      const [buckets, overall, currenciesList, converted] = await Promise.all([
        getBucketBalances(),
        getOverallBalances(),
        listCurrencies(),
        getConvertedTotal().catch((error) => {
          console.error("Failed to get converted total:", error)
          // Return default if API fails
          return { baseCurrency: "USD", totalMinor: 0 }
        }),
      ])

      setBucketBalances(buckets)
      setOverallBalances(overall)
      setCurrencies(currenciesList)
      setConvertedTotal(converted.totalMinor)
      setBaseCurrency(converted.baseCurrency)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      // Set defaults on error
      setBaseCurrency("USD")
      setConvertedTotal(0)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="animate-pulse space-y-6 sm:space-y-8">
            <div className="h-6 sm:h-8 bg-muted rounded w-32 sm:w-48" />
            <div className="h-24 sm:h-32 bg-muted rounded" />
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-40 bg-muted rounded" />
              <div className="h-40 bg-muted rounded" />
              <div className="h-40 bg-muted rounded sm:col-span-2 lg:col-span-1" />
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
        <div className="space-y-6 sm:space-y-8">
          {/* Page Title and Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Overview of your finances across all buckets
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Link href="/transactions/new" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Add Transaction</Button>
              </Link>
              <Link href="/income-split" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">Split Income</Button>
              </Link>
            </div>
          </div>

          {/* Converted Total */}
          <ConvertedTotal baseCurrency={baseCurrency} totalMinor={convertedTotal} currencies={currencies} />

          {/* Bucket Balances */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Buckets</h3>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bucketBalances.map((bucket) => (
                <BucketCard
                  key={bucket.bucket}
                  bucket={bucket.bucket}
                  balances={bucket.balances}
                  currencies={currencies}
                />
              ))}
            </div>
          </div>

          {/* Overall Balances */}
          <OverallBalances balances={overallBalances} currencies={currencies} />
        </div>
      </main>
    </div>
  )
}
