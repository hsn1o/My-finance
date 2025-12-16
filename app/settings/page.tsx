"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navigation } from "@/components/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  listCurrencies,
  createCurrency,
  deleteCurrency,
  getPreferences,
  updatePreferences,
  type Currency,
} from "@/lib/api"

export default function SettingsPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [baseCurrency, setBaseCurrencyState] = useState<string>("USD")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // New currency form
  const [newCode, setNewCode] = useState("")
  const [newName, setNewName] = useState("")
  const [newSymbol, setNewSymbol] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [currenciesList, prefs] = await Promise.all([listCurrencies(), getPreferences()])
      setCurrencies(currenciesList)
      setBaseCurrencyState(prefs.baseCurrency)
    } catch (error) {
      console.error("Failed to load settings:", error)
      setBaseCurrencyState("USD") // Fallback
    } finally {
      setLoading(false)
    }
  }

  async function handleBaseCurrencyChange(code: string) {
    try {
      await updatePreferences({ baseCurrency: code })
    setBaseCurrencyState(code)
    } catch (error) {
      console.error("Failed to update base currency:", error)
      alert("Failed to update base currency. Please try again.")
    }
  }

  async function handleAddCurrency(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!newCode.trim() || !newName.trim() || !newSymbol.trim()) {
      setFormError("All fields are required")
      return
    }

    setFormLoading(true)
    try {
      await createCurrency({
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        symbol: newSymbol.trim(),
      })
      await loadData()
      setDialogOpen(false)
      setNewCode("")
      setNewName("")
      setNewSymbol("")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add currency")
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteCurrency(code: string) {
    if (code === baseCurrency) {
      alert("Cannot delete the base currency. Please change the base currency first.")
      return
    }

    if (!confirm(`Are you sure you want to delete ${code}?`)) return

    try {
      await deleteCurrency(code)
      await loadData()
    } catch (error) {
      console.error("Failed to delete currency:", error)
      alert(error instanceof Error ? error.message : "Failed to delete currency. It may be in use by transactions or transfers.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="animate-pulse space-y-6 sm:space-y-8">
            <div className="h-6 sm:h-8 bg-muted rounded w-32 sm:w-48" />
            <div className="h-32 sm:h-40 bg-muted rounded" />
            <div className="h-48 sm:h-64 bg-muted rounded" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Page Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage currencies and preferences</p>
          </div>

          {/* Base Currency */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Base Currency</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Choose your base currency for converted totals on the dashboard.
            </p>

            <div className="max-w-xs w-full">
              <Label htmlFor="baseCurrency">Base Currency</Label>
              <Select value={baseCurrency} onValueChange={handleBaseCurrencyChange}>
                <SelectTrigger id="baseCurrency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Currencies Management */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">Currencies</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Add or remove currencies for your transactions
                </p>
              </div>
              <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
                Add Currency
              </Button>
            </div>

            <div className="space-y-2">
              {currencies.map((currency) => (
                <div
                  key={currency.code}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xl sm:text-2xl flex-shrink-0">{currency.symbol}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-base font-semibold text-foreground truncate">
                        {currency.code}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">{currency.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {currency.code === baseCurrency && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">
                        Base
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCurrency(currency.code)}
                      className="text-destructive hover:text-destructive text-xs sm:text-sm"
                      disabled={currency.code === baseCurrency}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Add Currency Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Currency</DialogTitle>
            <DialogDescription>Add a new currency to use in your transactions and transfers.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCurrency} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Currency Code</Label>
              <Input
                id="code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g., JPY"
                maxLength={3}
                required
              />
              <p className="text-xs text-muted-foreground">3-letter ISO code (e.g., USD, EUR, GBP)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Currency Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Japanese Yen"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="e.g., ¥"
                maxLength={3}
                required
              />
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  setNewCode("")
                  setNewName("")
                  setNewSymbol("")
                  setFormError(null)
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Adding..." : "Add Currency"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
