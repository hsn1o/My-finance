"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useIsMobile } from "@/components/ui/use-mobile"
import { Menu, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/buckets", label: "Buckets" },
    { href: "/categories", label: "Categories" },
    { href: "/transactions", label: "Transactions" },
    { href: "/transfers", label: "Transfers" },
    { href: "/settings", label: "Settings" },
  ]

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const handleLinkClick = () => {
    setMobileMenuOpen(false)
  }

  const NavLinks = () => (
    <>
      {navLinks.map((link) => {
        const active = isActive(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={handleLinkClick}
            className={
              active
                ? "text-sm font-medium text-foreground"
                : "text-sm text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            {link.label}
          </Link>
        )
      })}
    </>
  )

  const UserSection = () => (
    <>
      {user ? (
        <>
          <span className="text-sm text-muted-foreground truncate max-w-[120px]">
            {user.name || user.email}
          </span>
          <Button variant="outline" size="sm" onClick={logout} className="text-sm">
            Logout
          </Button>
        </>
      ) : (
        <Link
          href="/login"
          onClick={handleLinkClick}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Login
        </Link>
      )}
    </>
  )

  return (
    <header className="border-b bg-card sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold text-foreground hover:text-primary transition-colors"
          >
            Finance Manager
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="flex items-center gap-4">
              <NavLinks />
              <UserSection />
            </nav>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold">Finance Manager</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleLinkClick}
                    className={
                      active
                        ? "text-base font-medium text-foreground py-2 px-3 rounded-md bg-muted"
                        : "text-base text-muted-foreground hover:text-foreground hover:bg-muted/50 py-2 px-3 rounded-md transition-colors"
                    }
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="border-t pt-4 mt-4">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <div className="text-sm text-muted-foreground px-3 py-2">
                      {user.name || user.email}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full justify-start"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={handleLinkClick}
                    className="text-base text-muted-foreground hover:text-foreground hover:bg-muted/50 py-2 px-3 rounded-md transition-colors block"
                  >
                    Login
                  </Link>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      )}
    </header>
  )
}

