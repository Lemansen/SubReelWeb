"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Убрали /dist/types, теперь типы берутся напрямую
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
