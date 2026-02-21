import type { Metadata } from "next"
import { SignupForm } from "@/components/auth/signup-form"
import { Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Create Account - WordFlow",
  description: "Create your WordFlow account and start mastering English vocabulary through sentence-based learning.",
}

export default function SignupPage() {
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
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Start learning words in real sentences
        </p>
      </div>

      <SignupForm />
    </div>
  )
}
