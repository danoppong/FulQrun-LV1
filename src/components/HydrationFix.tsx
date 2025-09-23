'use client'
import React from 'react'

import { useHydrationFix } from '@/lib/hooks/useHydrationFix'

export default function HydrationFix() {
  useHydrationFix()
  return null
}
