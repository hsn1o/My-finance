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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-6 sm:h-8 bg-muted rounded w-40 sm:w-48" />
            <div className="h-12 sm:h-16 bg-muted rounded" />
            <div className="space-y-3">
              <div className="h-28 sm:h-32 bg-muted rounded" />
              <div className="h-28 sm:h-32 bg-muted rounded" />
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
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Currency Transfers</h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Convert between currencies within the same bucket
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
              New Transfer
            </Button>
          </div>

          {/* Info Card */}
          <Card className="p-3 sm:p-4 bg-primary/5 border-primary/20">
            <p className="text-xs sm:text-sm text-foreground">
              Transfers allow you to convert money from one currency to another within the same bucket. Enter your
              exchange rate manually to track the conversion.
            </p>
          </Card>

          {/* Transfers List */}
          {transfers.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <p className="text-sm sm:text-base text-muted-foreground">
                No transfers yet. Create your first currency transfer to get started.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {transfers.map((transfer) => {
                const fromCurrency = currencies.find((c) => c.code === transfer.fromCurrency)
                const toCurrency = currencies.find((c) => c.code === transfer.toCurrency)

                return (
                  <Card key={transfer.id} className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                          <Badge variant="secondary" className="capitalize text-xs">
                            {transfer.bucket}
                          </Badge>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {formatDateTime(transfer.effectiveAt)}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
                          <div className="text-center sm:text-left">
                            <div className="text-xs sm:text-sm text-muted-foreground mb-1">From</div>
                            <div className="text-lg sm:text-xl font-bold text-foreground">
                              {formatMoney(transfer.fromAmountMinor, transfer.fromCurrency, fromCurrency?.symbol)}
                            </div>
                          </div>

                          <div className="text-xl sm:text-2xl text-muted-foreground text-center sm:text-left">→</div>

                          <div className="text-center sm:text-left">
                            <div className="text-xs sm:text-sm text-muted-foreground mb-1">To</div>
                            <div className="text-lg sm:text-xl font-bold text-success">
                              {formatMoney(transfer.toAmountMinor, transfer.toCurrency, toCurrency?.symbol)}
                            </div>
                          </div>

                          <div className="sm:ml-4 text-center sm:text-left">
                            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Rate</div>
                            <div className="text-base sm:text-lg font-semibold text-foreground break-all">
                              {transfer.manualRate.toFixed(6)}
                            </div>
                          </div>
                        </div>

                        {transfer.note && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2 break-words">{transfer.note}</p>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(transfer.id)}
                        className="text-destructive hover:text-destructive sm:ml-4 w-full sm:w-auto text-xs sm:text-sm"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Currency Transfer</DialogTitle>
            <DialogDescription>
              Convert money from one currency to another within the same bucket. The exchange rate is entered manually.
            </DialogDescription>
          </DialogHeader>
          <TransferForm
            onSubmit={handleCreate}
            onCancel={() => {
              setDialogOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
