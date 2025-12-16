"use client"

// Client-side preferences store using localStorage

const BASE_CURRENCY_KEY = "finance-app-base-currency"

export function getBaseCurrency(): string {
  if (typeof window === "undefined") return "USD"
  return localStorage.getItem(BASE_CURRENCY_KEY) || "USD"
}

export function setBaseCurrency(code: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(BASE_CURRENCY_KEY, code)
}
