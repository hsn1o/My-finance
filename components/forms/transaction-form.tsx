"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  listCategories,
  listCurrencies,
  type BucketName,
  type Category,
  type Currency,
  type Transaction,
} from "@/lib/api"
import { toDateTimeLocal } from "@/lib/dates"

interface TransactionFormProps {
  transaction?: Transaction
  onSubmit: (data: {
    bucket: BucketName
    categoryId?: string
    type: "income" | "outcome"
    amountMinor: number
    currencyCode: string
    effectiveAt: Date
    note?: string
  }) => Promise<void>
  onCancel: () => void
}

export function TransactionForm({ transaction, onSubmit, onCancel }: TransactionFormProps) {
  const [bucket, setBucket] = useState<BucketName>(transaction?.bucket || "obligations")
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || "defaultCategoryId")
  const [type, setType] = useState<"income" | "outcome">(transaction?.type || "outcome")
  const [amount, setAmount] = useState(transaction ? (transaction.amountMinor / 100).toFixed(2) : "")
  const [currencyCode, setCurrencyCode] = useState(transaction?.currencyCode || "USD")
  const [effectiveAt, setEffectiveAt] = useState(
    transaction ? toDateTimeLocal(transaction.effectiveAt) : toDateTimeLocal(new Date()),
  )
  const [note, setNote] = useState(transaction?.note || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])

  useEffect(() => {
    loadData()
  }, [bucket])

  async function loadData() {
    try {
      const [categoriesList, currenciesList] = await Promise.all([listCategories(bucket), listCurrencies()])
      setCategories(categoriesList)
      setCurrencies(currenciesList)
    } catch (error) {
      console.error("Failed to load form data:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const amountNum = Number.parseFloat(amount)
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        bucket,
        categoryId: categoryId || undefined,
        type,
        amountMinor: Math.round(amountNum * 100),
        currencyCode,
        effectiveAt: new Date(effectiveAt),
        note: note.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bucket">Bucket</Label>
          <Select value={bucket} onValueChange={(value) => setBucket(value as BucketName)}>
            <SelectTrigger id="bucket">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="obligations">Obligations</SelectItem>
              <SelectItem value="investments">Investments</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(value) => setType(value as "income" | "outcome")}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="outcome">Outcome</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category (optional)</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="defaultCategoryId">No category</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={currencyCode} onValueChange={setCurrencyCode}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="effectiveAt">Effective Date</Label>
        <Input
          id="effectiveAt"
          type="datetime-local"
          value={effectiveAt}
          onChange={(e) => setEffectiveAt(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about this transaction"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : transaction ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}
