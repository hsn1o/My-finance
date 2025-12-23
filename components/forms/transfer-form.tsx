"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { listCurrencies, type BucketName, type Currency } from "@/lib/api"
import { toDateTimeLocal } from "@/lib/dates"

interface TransferFormProps {
  onSubmit: (data: {
    bucket: BucketName
    fromCurrency: string
    toCurrency: string
    fromAmountMinor: number
    toAmountMinor: number
    manualRate: number
    effectiveAt: Date
    note?: string
  }) => Promise<void>
  onCancel: () => void
}

export function TransferForm({ onSubmit, onCancel }: TransferFormProps) {
  const [bucket, setBucket] = useState<BucketName>("obligations")
  const [fromCurrency, setFromCurrency] = useState("USD")
  const [toCurrency, setToCurrency] = useState("EUR")
  const [fromAmount, setFromAmount] = useState("")
  const [manualRate, setManualRate] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [effectiveAt, setEffectiveAt] = useState(toDateTimeLocal(new Date()))
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [currencies, setCurrencies] = useState<Currency[]>([])

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

  // Calculate toAmount when fromAmount or manualRate changes
  useEffect(() => {
    const fromNum = Number.parseFloat(fromAmount)
    const rateNum = Number.parseFloat(manualRate)

    if (!Number.isNaN(fromNum) && !Number.isNaN(rateNum) && fromNum > 0 && rateNum > 0) {
      const calculated = fromNum * rateNum
      setToAmount(calculated.toFixed(2))
    } else {
      setToAmount("")
    }
  }, [fromAmount, manualRate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (fromCurrency === toCurrency) {
      setError("From and To currencies must be different")
      return
    }

    const fromNum = Number.parseFloat(fromAmount)
    const rateNum = Number.parseFloat(manualRate)
    const toNum = Number.parseFloat(toAmount)

    if (Number.isNaN(fromNum) || fromNum <= 0) {
      setError("Please enter a valid from amount")
      return
    }

    if (Number.isNaN(rateNum) || rateNum <= 0) {
      setError("Please enter a valid exchange rate")
      return
    }

    if (Number.isNaN(toNum) || toNum <= 0) {
      setError("Please enter a valid to amount")
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        bucket,
        fromCurrency,
        toCurrency,
        fromAmountMinor: Math.round(fromNum * 100),
        toAmountMinor: Math.round(toNum * 100),
        manualRate: rateNum,
        effectiveAt: new Date(effectiveAt),
        note: note.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create transfer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
      <div className="space-y-2">
        <Label htmlFor="bucket" className="text-sm sm:text-base">Bucket</Label>
        <Select value={bucket} onValueChange={(value) => setBucket(value as BucketName)}>
          <SelectTrigger id="bucket" className="text-sm sm:text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="obligations">Obligations</SelectItem>
            <SelectItem value="investments">Investments</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs sm:text-sm text-muted-foreground">Transfers happen within the same bucket</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromCurrency" className="text-sm sm:text-base">From Currency</Label>
          <Select value={fromCurrency} onValueChange={setFromCurrency}>
            <SelectTrigger id="fromCurrency" className="text-sm sm:text-base">
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

        <div className="space-y-2">
          <Label htmlFor="toCurrency" className="text-sm sm:text-base">To Currency</Label>
          <Select value={toCurrency} onValueChange={setToCurrency}>
            <SelectTrigger id="toCurrency" className="text-sm sm:text-base">
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
        <Label htmlFor="fromAmount" className="text-sm sm:text-base">From Amount</Label>
        <Input
          id="fromAmount"
          type="number"
          step="0.01"
          min="0"
          value={fromAmount}
          onChange={(e) => setFromAmount(e.target.value)}
          placeholder="0.00"
          required
          className="text-sm sm:text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="manualRate" className="text-sm sm:text-base">Exchange Rate</Label>
        <Input
          id="manualRate"
          type="number"
          step="0.000001"
          min="0"
          value={manualRate}
          onChange={(e) => setManualRate(e.target.value)}
          placeholder="e.g., 0.92 for USD to EUR"
          required
          className="text-sm sm:text-base"
        />
        <p className="text-xs sm:text-sm text-muted-foreground">
          How much 1 {fromCurrency} equals in {toCurrency}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="toAmount" className="text-sm sm:text-base">To Amount (calculated)</Label>
        <Input 
          id="toAmount" 
          type="number" 
          step="0.01" 
          value={toAmount} 
          readOnly 
          className="bg-muted text-sm sm:text-base" 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="effectiveAt" className="text-sm sm:text-base">Effective Date</Label>
        <Input
          id="effectiveAt"
          type="datetime-local"
          value={effectiveAt}
          onChange={(e) => setEffectiveAt(e.target.value)}
          required
          className="text-sm sm:text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note" className="text-sm sm:text-base">Note (optional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about this transfer"
          rows={2}
          className="text-sm sm:text-base resize-none"
        />
      </div>

      {error && <p className="text-xs sm:text-sm text-destructive">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={loading}
          className="w-full sm:w-auto text-sm sm:text-base"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full sm:w-auto text-sm sm:text-base"
        >
          {loading ? "Creating..." : "Create Transfer"}
        </Button>
      </div>
    </form>
  )
}
