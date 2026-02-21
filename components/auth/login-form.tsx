"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { SocialButtons } from "@/components/auth/social-buttons"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginErrors = Partial<Record<"email" | "password" | "form", string>>

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [staySignedIn, setStaySignedIn] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [shake, setShake] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const triggerShake = useCallback(() => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setErrors({})

      const result = loginSchema.safeParse({ email, password })

      if (!result.success) {
        const fieldErrors: LoginErrors = {}
        result.error.errors.forEach((err) => {
          const field = err.path[0] as keyof LoginErrors
          fieldErrors[field] = err.message
        })
        setErrors(fieldErrors)
        triggerShake()
        return
      }

      setIsLoading(true)

      // Simulate auth request
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // Demo: simulate invalid credentials for demo@error.com
      if (email === "demo@error.com") {
        setErrors({ form: "Invalid email or password. Please try again." })
        triggerShake()
        setIsLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push("/")
    },
    [email, password, router, triggerShake]
  )

  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId?: string) => {
    if (e.key === "Enter" && nextFieldId) {
      e.preventDefault()
      const next = document.getElementById(nextFieldId)
      next?.focus()
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", shake && "animate-shake")}>
      {/* Social Auth */}
      <SocialButtons disabled={isLoading} />

      {/* Divider */}
      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or continue with email</span>
        <Separator className="flex-1" />
      </div>

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Form-level error */}
        {errors.form && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.form}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
            }}
            onKeyDown={(e) => handleKeyDown(e, "login-password")}
            aria-invalid={!!errors.email}
            disabled={isLoading}
            autoFocus
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Link
              href="#"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              aria-invalid={!!errors.password}
              disabled={isLoading}
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="stay-signed-in"
            checked={staySignedIn}
            onCheckedChange={(checked) => setStaySignedIn(checked === true)}
            disabled={isLoading}
          />
          <Label htmlFor="stay-signed-in" className="text-sm font-normal text-muted-foreground cursor-pointer">
            Stay signed in
          </Label>
        </div>

        <Button type="submit" className="h-11 mt-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {"Don't have an account? "}
        <Link
          href="/signup"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
