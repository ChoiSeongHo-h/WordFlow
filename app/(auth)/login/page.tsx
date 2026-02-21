import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"
import { Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign In - WordFlow",
  description: "Sign in to your WordFlow account and continue your learning journey.",
}

export default function LoginPage() {
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
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to continue your learning journey
        </p>
      </div>

      <LoginForm />
    </div>
  )
}
