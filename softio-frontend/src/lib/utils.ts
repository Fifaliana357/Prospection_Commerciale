import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const amountFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })

export function formatMGA(value: number | string | null | undefined) {
  return `${amountFormatter.format(Number(value) || 0)} MGA`
}

export function formatAR(value: number | string | null | undefined) {
  return `${amountFormatter.format(Number(value) || 0)} AR`
}

function underHundred(value: number): string {
  const small = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"]
  if (value <= 16) return small[value]
  if (value < 20) return `dix-${small[value - 10]}`
  if (value < 70) {
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"]
    const decade = Math.floor(value / 10)
    const remainder = value % 10
    if (!remainder) return tens[decade]
    return remainder === 1 ? `${tens[decade]} et un` : `${tens[decade]}-${small[remainder]}`
  }
  if (value < 80) return value === 71 ? "soixante et onze" : `soixante-${underHundred(value - 60)}`
  if (value === 80) return "quatre-vingts"
  return `quatre-vingt-${underHundred(value - 80)}`
}

function underThousand(value: number): string {
  if (value < 100) return underHundred(value)
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100
  const prefix = hundreds === 1 ? "cent" : `${underHundred(hundreds)} cent`
  if (!remainder) return hundreds > 1 ? `${prefix}s` : prefix
  return `${prefix} ${underHundred(remainder)}`
}

export function amountInFrenchWords(value: number) {
  let amount = Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0))
  if (!amount) return "Zéro"

  const scales = ["", "mille", "million", "milliard", "billion", "billiard"]
  const parts: string[] = []
  let scale = 0
  while (amount > 0) {
    const group = amount % 1000
    if (group) {
      let phrase = underThousand(group)
      if (scale === 1 && group === 1) phrase = "mille"
      else if (scale > 1) phrase += ` ${scales[scale]}${group > 1 ? "s" : ""}`
      else if (scale === 1) phrase += " mille"
      parts.unshift(phrase)
    }
    amount = Math.floor(amount / 1000)
    scale += 1
  }
  const words = parts.join(" ")
  return words.charAt(0).toLocaleUpperCase("fr-FR") + words.slice(1)
}