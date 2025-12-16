"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { getCurrentUser, logoutUser, type User } from "@/lib/api"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Public routes that don't require authentication
const publicRoutes = ["/login"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refreshUser = async () => {
    try {
      const response = await getCurrentUser()
      setUser(response?.user || null)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  // Redirect to login if user is not authenticated and not on a public route
  useEffect(() => {
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      const currentPath = pathname
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
    }
  }, [user, loading, pathname, router])

  const logout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      router.push("/login")
      router.refresh()
    }
  }

  // Don't render children if user is not authenticated and not on a public route
  // (middleware should handle this, but this is a backup)
  if (!loading && !user && !publicRoutes.includes(pathname)) {
    return null
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

