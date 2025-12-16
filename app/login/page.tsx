"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { loginUser, registerUser, changePassword } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser, user } = useAuth()
  const redirectTo = searchParams.get("redirect") || "/"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectTo)
    }
  }, [user, redirectTo, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      await loginUser({ email, password })
      await refreshUser()
      setMessage({ type: "success", text: "Login successful!" })
      setTimeout(() => {
        router.push(redirectTo)
        router.refresh()
      }, 500)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Login failed. Please try again.",
      })
    setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" })
      return
    }

    setLoading(true)

    try {
      await registerUser({ email, password, name: name || undefined })
      await refreshUser()
      setMessage({ type: "success", text: "Registration successful! Redirecting..." })
    setTimeout(() => {
        router.push(redirectTo)
        router.refresh()
      }, 1000)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Registration failed. Please try again.",
      })
      setLoading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" })
      return
    }

    setLoading(true)

    try {
      await changePassword({
        currentPassword: password,
        newPassword,
      })
      setMessage({ type: "success", text: "Password changed successfully!" })
    setTimeout(() => {
      setIsChangingPassword(false)
      setNewPassword("")
      setConfirmPassword("")
        setPassword("")
      setMessage(null)
        setLoading(false)
    }, 2000)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to change password. Please try again.",
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Title */}
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-foreground hover:text-primary transition-colors">
            Finance Manager
          </Link>
          <p className="text-muted-foreground mt-2">
            {isChangingPassword
              ? "Change your password"
              : isRegistering
                ? "Create a new account"
                : "Sign in to your account"}
          </p>
        </div>

        {/* Login/Register/Change Password Form */}
        <Card className="p-6">
          {isChangingPassword ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {message && (
                <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}>
                  {message.text}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false)
                    setNewPassword("")
                    setConfirmPassword("")
                    setPassword("")
                    setMessage(null)
                  }}
                  className="flex-1"
                  disabled={loading}
                >
                  Back to Login
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </form>
          ) : isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registerName">Name (Optional)</Label>
                <Input
                  id="registerName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registerEmail">Email</Label>
                <Input
                  id="registerEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registerPassword">Password</Label>
                <Input
                  id="registerPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>

              {message && (
                <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}>
                  {message.text}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false)
                    setEmail("")
                    setPassword("")
                    setName("")
                    setMessage(null)
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {message && (
                <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}>
                  {message.text}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="text-primary hover:underline"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true)
                    setEmail("")
                    setPassword("")
                    setMessage(null)
                  }}
                  className="text-primary hover:underline"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <Link href="/" className="text-3xl font-bold text-foreground hover:text-primary transition-colors">
                Finance Manager
              </Link>
              <p className="text-muted-foreground mt-2">Loading...</p>
            </div>
            <Card className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            </Card>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
