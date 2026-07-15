import type { Metadata } from "next"
import { SignupForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Create Account - WordFlow",
  description: "Create your WordFlow account and start mastering English vocabulary through sentence-based learning.",
}

export default function SignupPage() {
  return (
    <SignupForm />
  )
}
