"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { TransactionForm } from "@/components/forms/transaction-form"
import { Navigation } from "@/components/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listCategories,
  listCurrencies,
  type Transaction,
  type BucketName,
  type Category,
  type Currency,
} from "@/lib/api"
import { formatMoney } from "@/lib/money"
import { formatDateTime } from "@/lib/dates"
import Link from "next/link"

const bucketColors: Record<BucketName, string> = {
  obligations: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  investments: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  personal: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
}

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // Filters
  const [filterBucket, setFilterBucket] = useState<BucketName | "all">(
    (searchParams.get("bucket") as BucketName) || "all",
  )
  const [filterType, setFilterType] = useState<"income" | "outcome" | "all">("all")
  const [filterCurrency, setFilterCurrency] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [transactionsList, categoriesList, currenciesList] = await Promise.all([
        listTransactions(),
        listCategories(),
        listCurrencies(),
      ])
      setTransactions(transactionsList)
      setCategories(categoriesList)
      setCurrencies(currenciesList)
    } catch (error) {
      console.error("Failed to load transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(data: {
    bucket: BucketName
    categoryId?: string
    type: "income" | "outcome"
    amountMinor: number
    currencyCode: string
    effectiveAt: Date
    note?: string
  }) {
    try {
      await createTransaction(data)
      await loadData()
      setDialogOpen(false)
    } catch (error) {
      // Error is handled by TransactionForm component
      throw error
    }
  }

  async function handleUpdate(data: {
    bucket: BucketName
    categoryId?: string
    type: "income" | "outcome"
    amountMinor: number
    currencyCode: string
    effectiveAt: Date
    note?: string
  }) {
    if (!editingTransaction) return
    try {
      await updateTransaction(editingTransaction.id, data)
      await loadData()
      setDialogOpen(false)
      setEditingTransaction(null)
    } catch (error) {
      // Error is handled by TransactionForm component
      throw error
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this transaction?")) return
    try {
      await deleteTransaction(id)
      await loadData()
    } catch (error) {
      console.error("Failed to delete transaction:", error)
      alert(error instanceof Error ? error.message : "Failed to delete transaction")
    }
  }

  function openCreateDialog() {
    setEditingTransaction(null)
    setDialogOpen(true)
  }

  function openEditDialog(transaction: Transaction) {
    setEditingTransaction(transaction)
    setDialogOpen(true)
  }

  // Apply filters
  const filteredTransactions = transactions.filter((tx) => {
    if (filterBucket !== "all" && tx.bucket !== filterBucket) return false
    if (filterType !== "all" && tx.type !== filterType) return false
    if (filterCurrency !== "all" && tx.currencyCode !== filterCurrency) return false
    if (filterCategory !== "all" && tx.categoryId !== filterCategory) return false
    if (searchQuery && !tx.note?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-6 sm:h-8 bg-muted rounded w-32 sm:w-48" />
            <div className="h-16 sm:h-20 bg-muted rounded" />
            <div className="h-8 sm:h-10 bg-muted rounded w-full sm:w-64" />
            <div className="space-y-3">
              <div className="h-20 sm:h-24 bg-muted rounded" />
              <div className="h-20 sm:h-24 bg-muted rounded" />
              <div className="h-20 sm:h-24 bg-muted rounded" />
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
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Transactions</h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Track all your income and expenses</p>
            </div>
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              Add Transaction
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-3 sm:p-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">Bucket</label>
                <Select value={filterBucket} onValueChange={(value) => setFilterBucket(value as BucketName | "all")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buckets</SelectItem>
                    <SelectItem value="obligations">Obligations</SelectItem>
                    <SelectItem value="investments">Investments</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">Type</label>
                <Select
                  value={filterType}
                  onValueChange={(value) => setFilterType(value as "income" | "outcome" | "all")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="outcome">Outcome</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">Currency</label>
                <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Currencies</SelectItem>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">Category</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">Search</label>
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Results Count */}
          <div className="text-xs sm:text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <p className="text-sm sm:text-base text-muted-foreground">
                No transactions found. Add your first transaction to get started.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId)
                const currency = currencies.find((c) => c.code === tx.currencyCode)
                const isIncome = tx.type === "income"

                return (
                  <Card key={tx.id} className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={`${bucketColors[tx.bucket]} text-xs`} variant="secondary">
                            {tx.bucket}
                          </Badge>
                          <Badge
                            variant={isIncome ? "default" : "secondary"}
                            className={`text-xs ${isIncome ? "bg-success" : ""}`}
                          >
                            {tx.type}
                          </Badge>
                          {category && (
                            <span className="text-xs sm:text-sm text-muted-foreground truncate">
                              • {category.name}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 mb-1">
                          <span
                            className={`text-xl sm:text-2xl font-bold ${isIncome ? "text-success" : "text-foreground"}`}
                          >
                            {isIncome ? "+" : "-"}
                            {formatMoney(tx.amountMinor, tx.currencyCode, currency?.symbol)}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {formatDateTime(tx.effectiveAt)}
                          </span>
                        </div>

                        {tx.note && (
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">{tx.note}</p>
                        )}
                      </div>

                      <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(tx)}
                          className="text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(tx.id)}
                          className="text-destructive hover:text-destructive text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
            <DialogDescription>
              {editingTransaction
                ? "Update the transaction details below."
                : "Record a new income or expense transaction."}
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            transaction={editingTransaction || undefined}
            onSubmit={editingTransaction ? handleUpdate : handleCreate}
            onCancel={() => {
              setDialogOpen(false)
              setEditingTransaction(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
