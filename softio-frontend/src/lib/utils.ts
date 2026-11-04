import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const mgaFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })

export function formatMGA(value: number | string | null | undefined) {
  return `${mgaFormatter.format(Number(value) || 0)} MGA`
}