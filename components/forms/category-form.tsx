"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BucketName, Category } from "@/lib/api"

interface CategoryFormProps {
  category?: Category
  onSubmit: (data: { bucket: BucketName; name: string }) => Promise<void>
  onCancel: () => void
}

export function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [bucket, setBucket] = useState<BucketName>(category?.bucket || "obligations")
  const [name, setName] = useState(category?.name || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Category name is required")
      return
    }

    setLoading(true)
    try {
      await onSubmit({ bucket, name: name.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bucket">Bucket</Label>
        <Select value={bucket} onValueChange={(value) => setBucket(value as BucketName)} disabled={!!category}>
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
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Rent, Groceries, Stocks"
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : category ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}
