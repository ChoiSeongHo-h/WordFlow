"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function useUserTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [userEmail, setUserEmail] = useState<string>("guest")
  const [mounted, setMounted] = useState(false)

  // Wait until mounted on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)

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
    setUserEmail(email)

    // Load saved user theme if it exists and apply it
    const savedTheme = localStorage.getItem(`wordflow-theme-${email}`)
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme)
    }
  }, [theme, setTheme])

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme)
    if (typeof window !== "undefined") {
      localStorage.setItem(`wordflow-theme-${userEmail}`, newTheme)
    }
  }

  return {
    theme: mounted ? theme : "light",
    setTheme: changeTheme,
    resolvedTheme: mounted ? resolvedTheme : "light",
    userEmail,
    mounted
  }
}
