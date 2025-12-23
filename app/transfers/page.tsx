"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TransferForm } from "@/components/forms/transfer-form"
import { Navigation } from "@/components/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  listTransfers,
  createTransfer,
  deleteTransfer,
  listCurrencies,
  type Transfer,
  type Currency,
  type BucketName,
} from "@/lib/api"
import { formatMoney } from "@/lib/money"
import { formatDateTime } from "@/lib/dates"

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [transfersList, currenciesList] = await Promise.all([listTransfers(), listCurrencies()])
      setTransfers(transfersList)
      setCurrencies(currenciesList)
    } catch (error) {
      console.error("Failed to load transfers:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(data: {
    bucket: BucketName
    fromCurrency: string
    toCurrency: string
    fromAmountMinor: number
    toAmountMinor: number
    manualRate: number
    effectiveAt: Date
    note?: string
  }) {
    try {
      await createTransfer(data)
      await loadData()
      setDialogOpen(false)
    } catch (error) {
      // Error is handled by TransferForm component
      throw error
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this transfer?")) return
    try {
      await deleteTransfer(id)
      await loadData()
    } catch (error) {
      console.error("Failed to delete transfer:", error)
      alert(error instanceof Error ? error.message : "Failed to delete transfer")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
          <div className="animate-pulse space-y-3 sm:space-y-4 md:space-y-6">
            <div className="h-6 sm:h-7 md:h-8 bg-muted rounded w-32 sm:w-40 md:w-48" />
            <div className="h-10 sm:h-12 md:h-16 bg-muted rounded" />
            <div className="space-y-2 sm:space-y-3">
              <div className="h-24 sm:h-28 md:h-32 bg-muted rounded" />
              <div className="h-24 sm:h-28 md:h-32 bg-muted rounded" />
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
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Page Header */}
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Currency Transfers</h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-1.5">
                Convert between currencies within the same bucket
              </p>
            </div>
            <Button 
              onClick={() => setDialogOpen(true)} 
              className="w-full sm:w-auto sm:min-w-[140px] md:min-w-[160px] text-sm sm:text-base"
              size="sm"
            >
              New Transfer
            </Button>
          </div>

          {/* Info Card */}
          <Card className="p-3 sm:p-4 md:p-5 bg-primary/5 border-primary/20">
            <p className="text-xs sm:text-sm md:text-base text-foreground leading-relaxed">
              Transfers allow you to convert money from one currency to another within the same bucket. Enter your
              exchange rate manually to track the conversion.
            </p>
          </Card>

          {/* Transfers List */}
          {transfers.length === 0 ? (
            <Card className="p-6 sm:p-8 md:p-10 lg:p-12 text-center">
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                No transfers yet. Create your first currency transfer to get started.
              </p>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {transfers.map((transfer) => {
                const fromCurrency = currencies.find((c) => c.code === transfer.fromCurrency)
                const toCurrency = currencies.find((c) => c.code === transfer.toCurrency)

                return (
                  <Card key={transfer.id} className="p-3 sm:p-4 md:p-5 lg:p-6">
                    <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                          <Badge variant="secondary" className="capitalize text-xs sm:text-sm">
                            {transfer.bucket}
                          </Badge>
                          <span className="text-xs sm:text-sm md:text-base text-muted-foreground">
                            {formatDateTime(transfer.effectiveAt)}
                          </span>
                        </div>

                        {/* Transfer Details - Responsive Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-start">
                          <div className="text-center sm:text-left">
                            <div className="text-xs sm:text-sm md:text-base text-muted-foreground mb-1 sm:mb-1.5">From</div>
                            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground break-words">
                              {formatMoney(transfer.fromAmountMinor, transfer.fromCurrency, fromCurrency?.symbol)}
                            </div>
                          </div>

                          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground text-center sm:text-left flex items-center justify-center sm:justify-start">
                            →
                          </div>

                          <div className="text-center sm:text-left">
                            <div className="text-xs sm:text-sm md:text-base text-muted-foreground mb-1 sm:mb-1.5">To</div>
                            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-success break-words">
                              {formatMoney(transfer.toAmountMinor, transfer.toCurrency, toCurrency?.symbol)}
                            </div>
                          </div>

                          <div className="text-center sm:text-left md:col-span-1 sm:col-span-2 md:col-span-1">
                            <div className="text-xs sm:text-sm md:text-base text-muted-foreground mb-1 sm:mb-1.5">Rate</div>
                            <div className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-foreground break-all">
                              {transfer.manualRate.toFixed(6)}
                            </div>
                          </div>
                        </div>

                        {transfer.note && (
                          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2 sm:mt-3 break-words leading-relaxed">
                            {transfer.note}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(transfer.id)}
                        className="text-destructive hover:text-destructive md:ml-4 w-full sm:w-auto md:min-w-[100px] text-xs sm:text-sm shrink-0"
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg md:max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg md:text-xl">New Currency Transfer</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm md:text-base">
              Convert money from one currency to another within the same bucket. The exchange rate is entered manually.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 sm:mt-4">
            <TransferForm
              onSubmit={handleCreate}
              onCancel={() => {
                setDialogOpen(false)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
