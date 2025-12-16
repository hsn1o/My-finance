// Money formatting and calculation utilities

export function formatMoney(amountMinor: number, currencyCode: string, symbol?: string): string {
  const amount = amountMinor / 100
  const formatted = amount.toFixed(2)

  if (symbol) {
    return `${symbol}${formatted}`
  }

  return `${currencyCode} ${formatted}`
}

export function parseMoney(amount: string): number {
  const cleaned = amount.replace(/[^0-9.-]/g, "")
  const parsed = Number.parseFloat(cleaned)
  return Math.round(parsed * 100)
}

export function addMoney(a: number, b: number): number {
  return a + b
}

export function subtractMoney(a: number, b: number): number {
  return a - b
}

export function convertMoney(amountMinor: number, rate: number): number {
  return Math.round(amountMinor * rate)
}

export function distributeMoney(totalMinor: number, parts: number): number[] {
  const base = Math.floor(totalMinor / parts)
  const remainder = totalMinor % parts

  const result: number[] = []
  for (let i = 0; i < parts; i++) {
    result.push(base + (i < remainder ? 1 : 0))
  }

  return result
}
