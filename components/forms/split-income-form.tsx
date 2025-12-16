"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { listCurrencies, type Currency } from "@/lib/api"
import { toDateTimeLocal } from "@/lib/dates"
import { distributeMoney, formatMoney } from "@/lib/money"

interface SplitIncomeFormProps {
  onSubmit: (data: { amountMinor: number; currencyCode: string; effectiveAt: Date; note?: string }) => Promise<void>
  onCancel: () => void
}

export function SplitIncomeForm({ onSubmit, onCancel }: SplitIncomeFormProps) {
  const [amount, setAmount] = useState("")
  const [currencyCode, setCurrencyCode] = useState("USD")
  const [effectiveAt, setEffectiveAt] = useState(toDateTimeLocal(new Date()))
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [splitAmounts, setSplitAmounts] = useState<number[]>([])

  useEffect(() => {
    loadCurrencies()
  }, [])

  async function loadCurrencies() {
    try {
      const currenciesList = await listCurrencies()
      setCurrencies(currenciesList)
    } catch (error) {
      console.error("Failed to load currencies:", error)
    }
  }

  // Calculate split amounts when amount changes
  useEffect(() => {
    const amountNum = Number.parseFloat(amount)
    if (!Number.isNaN(amountNum) && amountNum > 0) {
      const amountMinor = Math.round(amountNum * 100)
      const splits = distributeMoney(amountMinor, 3)
      setSplitAmounts(splits)
    } else {
      setSplitAmounts([])
    }
  }, [amount])

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
        amountMinor: Math.round(amountNum * 100),
        currencyCode,
        effectiveAt: new Date(effectiveAt),
        note: note.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to split income")
    } finally {
      setLoading(false)
    }
  }

  const currency = currencies.find((c) => c.code === currencyCode)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Total Income Amount</Label>
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
          placeholder="Add a note about this income"
          rows={2}
        />
      </div>

      {/* Preview Split */}
      {splitAmounts.length > 0 && (
        <div className="space-y-3">
          <Label>Split Preview</Label>
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4 border-l-4 border-l-amber-500">
              <div className="text-sm text-muted-foreground mb-1">Obligations</div>
              <div className="text-xl font-bold text-foreground">
                {formatMoney(splitAmounts[0], currencyCode, currency?.symbol)}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-emerald-500">
              <div className="text-sm text-muted-foreground mb-1">Investments</div>
              <div className="text-xl font-bold text-foreground">
                {formatMoney(splitAmounts[1], currencyCode, currency?.symbol)}
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-teal-500">
              <div className="text-sm text-muted-foreground mb-1">Personal</div>
              <div className="text-xl font-bold text-foreground">
                {formatMoney(splitAmounts[2], currencyCode, currency?.symbol)}
              </div>
            </Card>
          </div>
          <p className="text-xs text-muted-foreground">
            Income will be split equally across all three buckets. Any remainder cents are distributed to ensure the
            total matches exactly.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || splitAmounts.length === 0}>
          {loading ? "Splitting..." : "Split Income"}
        </Button>
      </div>
    </form>
  )
}
