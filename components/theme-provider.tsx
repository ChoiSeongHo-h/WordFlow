'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
  useTheme,
} from 'next-themes'

function UserThemeSync() {
  const { setTheme } = useTheme()

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    // Decode user email from token
    const token = localStorage.getItem("flow_token")
    let email = "guest"
    if (token) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        const payload = JSON.parse(jsonPayload)
        email = payload.sub || "guest"
      } catch (e) {
        console.error("Failed to decode token", e)
      }
    }

    const savedTheme = localStorage.getItem(`wordflow-theme-${email}`)
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [setTheme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <UserThemeSync />
      {children}
    </NextThemesProvider>
  )
}
