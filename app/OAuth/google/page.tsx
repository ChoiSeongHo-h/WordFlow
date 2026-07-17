"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loginWithGoogle } from "@/lib/api"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      loginWithGoogle(code)
        .then(() => {
          setProcessing(false)
          window.location.href = "/"
        })
        .catch((err) => {
          console.error("Google authentication failed:", err)
          setError("구글 인증 처리 중 오류가 발생했습니다.")
          setProcessing(false)
        })
    } else {
      setError("인증 코드가 존재하지 않습니다.")
      setProcessing(false)
    }
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">로그인 실패</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">{error}</p>
        <Button onClick={() => router.replace("/login")} className="min-w-[120px]">
          로그인으로 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-16 rounded-full bg-blue-500/20 animate-ping opacity-75" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
          <Loader2 className="size-7 animate-spin" />
        </div>
      </div>
      <h2 className="mt-8 text-lg font-semibold text-foreground">구글 로그인 처리 중...</h2>
      <p className="mt-2 text-sm text-muted-foreground">구글 계정을 안전하게 연동하고 있습니다.</p>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  )
}
