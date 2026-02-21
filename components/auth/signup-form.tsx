"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SocialButtons } from "@/components/auth/social-buttons"
import { PasswordStrength } from "@/components/auth/password-strength"
import { cn } from "@/lib/utils"

const accountSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/\d/, "Include at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type AccountErrors = Partial<Record<"email" | "password" | "confirmPassword", string>>

const learningGoals = [
  { id: "toeic", label: "TOEIC Prep", description: "High-frequency test vocabulary" },
  { id: "business", label: "Business English", description: "Workplace communication" },
  { id: "academic", label: "Academic English", description: "Research & writing vocabulary" },
  { id: "daily", label: "Daily Conversation", description: "Everyday expressions" },
  { id: "travel", label: "Travel English", description: "Essential travel phrases" },
  { id: "tech", label: "Tech & IT", description: "Technical terminology" },
]

export function SignupForm() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<AccountErrors>({})
  const [shake, setShake] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [showWelcome, setShowWelcome] = useState(false)

  const triggerShake = useCallback(() => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }, [])

  const handleStep1Submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setErrors({})

      const result = accountSchema.safeParse({ email, password, confirmPassword })

      if (!result.success) {
        const fieldErrors: AccountErrors = {}
        result.error.errors.forEach((err) => {
          const field = err.path[0] as keyof AccountErrors
          if (!fieldErrors[field]) {
            fieldErrors[field] = err.message
          }
        })
        setErrors(fieldErrors)
        triggerShake()
        return
      }

      // Simulate checking if email already exists
      if (email === "taken@example.com") {
        setErrors({ email: "This email is already in use" })
        triggerShake()
        return
      }

      setStep(2)
    },
    [email, password, confirmPassword, triggerShake]
  )

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    )
  }

  const handleStep2Submit = useCallback(async () => {
    setIsLoading(true)

    // Simulate account creation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    setStep(3)
    setShowWelcome(true)
  }, [])

  // Redirect after welcome message
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        router.push("/")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showWelcome, router])

  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId?: string) => {
    if (e.key === "Enter" && nextFieldId) {
      e.preventDefault()
      const next = document.getElementById(nextFieldId)
      next?.focus()
    }
  }

  // Step 3: Welcome transition
  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 animate-in fade-in duration-700">
        <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
          <Check className="size-8 text-success" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-heading)]">
            Welcome to WordFlow
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Your first sentence is waiting for you.
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          <div className="size-1.5 rounded-full bg-primary animate-pulse" />
          <div className="size-1.5 rounded-full bg-primary animate-pulse [animation-delay:200ms]" />
          <div className="size-1.5 rounded-full bg-primary animate-pulse [animation-delay:400ms]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
              step >= 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {step > 1 ? <Check className="size-3.5" /> : "1"}
          </div>
          <span className={cn("text-sm", step === 1 ? "text-foreground font-medium" : "text-muted-foreground")}>
            Account
          </span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
              step >= 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            2
          </div>
          <span className={cn("text-sm", step === 2 ? "text-foreground font-medium" : "text-muted-foreground")}>
            Goals
          </span>
        </div>
      </div>

      {/* Step 1: Account Creation */}
      {step === 1 && (
        <div className={cn("flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300", shake && "animate-shake")}>
          <SocialButtons disabled={isLoading} />

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or sign up with email</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleStep1Submit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                onKeyDown={(e) => handleKeyDown(e, "signup-password")}
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
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  onKeyDown={(e) => handleKeyDown(e, "signup-confirm-password")}
                  aria-invalid={!!errors.password}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                  }}
                  aria-invalid={!!errors.confirmPassword}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="h-11 mt-1 gap-2" disabled={isLoading}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {"Already have an account? "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      )}

      {/* Step 2: Learning Goals */}
      {step === 2 && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-heading)]">
              What are you learning for?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {"Select your goals so we can personalize your experience. You can always change these later."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {learningGoals.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id)
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-accent/50"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {goal.label}
                    </span>
                    {isSelected && (
                      <div className="flex size-5 items-center justify-center rounded-full bg-primary">
                        <Check className="size-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {goal.description}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-11 gap-2"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button
              className="h-11 flex-1 gap-2"
              onClick={handleStep2Submit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account...
                </>
              ) : selectedGoals.length > 0 ? (
                <>
                  Get Started
                  <ArrowRight className="size-4" />
                </>
              ) : (
                <>
                  Skip for now
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
