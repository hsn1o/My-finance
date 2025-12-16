"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CategoryForm } from "@/components/forms/category-form"
import { Navigation } from "@/components/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
  type BucketName,
} from "@/lib/api"
import { formatDate } from "@/lib/dates"
import Link from "next/link"

const bucketColors: Record<BucketName, string> = {
  obligations: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  investments: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  personal: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [filterBucket, setFilterBucket] = useState<BucketName | "all">("all")

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    try {
      const data = await listCategories()
      setCategories(data)
    } catch (error) {
      console.error("Failed to load categories:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(data: { bucket: BucketName; name: string }) {
    try {
      await createCategory(data)
      await loadCategories()
      setDialogOpen(false)
    } catch (error) {
      // Error is handled by CategoryForm component
      throw error
    }
  }

  async function handleUpdate(data: { bucket: BucketName; name: string }) {
    if (!editingCategory) return
    try {
      await updateCategory(editingCategory.id, data)
      await loadCategories()
      setDialogOpen(false)
      setEditingCategory(null)
    } catch (error) {
      // Error is handled by CategoryForm component
      throw error
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      await deleteCategory(id)
      await loadCategories()
    } catch (error) {
      console.error("Failed to delete category:", error)
      alert(error instanceof Error ? error.message : "Failed to delete category. It may have associated transactions.")
    }
  }

  function openCreateDialog() {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const filteredCategories = filterBucket === "all" ? categories : categories.filter((c) => c.bucket === filterBucket)

  // Calculate counts from all categories (not filtered) for filter buttons
  const categoriesByBucket = {
    obligations: categories.filter((c) => c.bucket === "obligations"),
    investments: categories.filter((c) => c.bucket === "investments"),
    personal: categories.filter((c) => c.bucket === "personal"),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-6 sm:h-8 bg-muted rounded w-32 sm:w-48" />
            <div className="h-8 sm:h-10 bg-muted rounded w-full sm:w-64" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-32 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
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
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Categories</h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Organize your transactions by category
              </p>
            </div>
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              Create Category
            </Button>
          </div>

          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterBucket === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterBucket("all")}
              className="text-xs sm:text-sm"
            >
              All ({categories.length})
            </Button>
            <Button
              variant={filterBucket === "obligations" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterBucket("obligations")}
              className="text-xs sm:text-sm"
            >
              Obligations ({categoriesByBucket.obligations.length})
            </Button>
            <Button
              variant={filterBucket === "investments" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterBucket("investments")}
              className="text-xs sm:text-sm"
            >
              Investments ({categoriesByBucket.investments.length})
            </Button>
            <Button
              variant={filterBucket === "personal" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterBucket("personal")}
              className="text-xs sm:text-sm"
            >
              Personal ({categoriesByBucket.personal.length})
            </Button>
          </div>

          {/* Categories List */}
          {filteredCategories.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <p className="text-sm sm:text-base text-muted-foreground">
                No categories found. Create your first category to get started.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                <Card key={category.id} className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 truncate">
                        {category.name}
                      </h3>
                      <Badge className={`${bucketColors[category.bucket]} text-xs`} variant="secondary">
                        {category.bucket}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-2 sm:mb-3">
                    Created {formatDate(category.createdAt)}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                      className="flex-1 text-xs sm:text-sm"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      className="text-destructive hover:text-destructive text-xs sm:text-sm"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details below."
                : "Add a new category to organize your transactions."}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={editingCategory || undefined}
            onSubmit={editingCategory ? handleUpdate : handleCreate}
            onCancel={() => {
              setDialogOpen(false)
              setEditingCategory(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
