import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toUpperCase() : word.toLowerCase()
    })
    .replace(/\s+/g, '')
}

// Make toPascalCase available globally for lucide-react
if (typeof window !== 'undefined') {
  (window as Window & { toPascalCase: typeof toPascalCase }).toPascalCase = toPascalCase
}
