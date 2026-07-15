"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Zap } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { SocialButtons } from "@/components/auth/social-buttons"
import { cn } from "@/lib/utils"
import { login, setAuthToken, getAuthToken } from "@/lib/api"
import { useTranslation, type TranslationKeys } from "@/lib/contexts/LanguageContext"

const loginSchema = z.object({
  email: z.string().email("emailInvalid"),
  password: z.string().min(1, "passwordRequired"),
})

type LoginErrors = Partial<Record<"email" | "password" | "form", string>>

export function LoginForm() {
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    if (getAuthToken()) {
      router.replace("/")
    }
  }, [router])

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

      const validationResult = loginSchema.safeParse({ email, password })

      if (!validationResult.success) {
        const fieldErrors: LoginErrors = {}
        validationResult.error.errors.forEach((err) => {
          const field = err.path[0] as keyof LoginErrors
          fieldErrors[field] = err.message
        })
        setErrors(fieldErrors)
        triggerShake()
        return
      }

      setIsLoading(true)

      try {
        // Actual API call
        const response = await login({ email, password })
        
        if (response.success) {
          setAuthToken(response.token)
          // Smooth transition to dashboard
          router.push("/")
          router.refresh()
        }
      } catch (error: any) {
        setErrors({ form: error.message || t("formError") })
        triggerShake()
      } finally {
        setIsLoading(false)
      }
    },
    [email, password, router, triggerShake, t]
  )

  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId?: string) => {
    if (e.key === "Enter" && nextFieldId) {
      e.preventDefault()
      const next = document.getElementById(nextFieldId)
      next?.focus()
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Mobile-only logo */}
      <div className="flex flex-col items-center gap-3 lg:hidden">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Zap className="size-5" />
        </div>
        <h1 className="text-xl font-bold text-foreground font-[family-name:var(--font-heading)]">
          WordFlow
        </h1>
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-1.5 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-heading)]">
          {t("signInTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("signInDesc")}
        </p>
      </div>

      <div className={cn("flex flex-col gap-6", shake && "animate-shake")}>
        {/* Social Auth */}
        <SocialButtons disabled={isLoading} />

        {/* Divider */}
        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t("orContinueWithEmail")}</span>
          <Separator className="flex-1" />
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Form-level error */}
          {errors.form && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in zoom-in-95 duration-200">
              {errors.form}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="login-email">{t("emailLabel")}</Label>
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
              <p className="text-xs text-destructive">{t(errors.email as TranslationKeys)}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">{t("passwordLabel")}</Label>
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder={t("enterPasswordPlaceholder")}
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
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{t(errors.password as TranslationKeys)}</p>
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
              {t("staySignedIn")}
            </Label>
          </div>

          <Button type="submit" className="h-11 mt-1" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("signingIn")}
              </>
            ) : (
              t("signInButton")
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("dontHaveAccount")}
          <Link
            href="/signup"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t("createAccountLink")}
          </Link>
        </p>
      </div>
    </div>
  )
}