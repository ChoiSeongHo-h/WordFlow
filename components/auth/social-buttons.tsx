"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/contexts/LanguageContext"
import { getOAuthUrls } from "@/lib/api"
import { Loader2 } from "lucide-react"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.297 1.01-1.077 3.662-1.123 3.864-.06.27.1.53.367.352.21-.137 2.44-1.657 3.443-2.34A10.377 10.377 0 0012 18.23c4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
    </svg>
  )
}

interface SocialButtonsProps {
  disabled?: boolean
}

export function SocialButtons({ disabled }: SocialButtonsProps) {
  const { t } = useTranslation()
  const [loadingProvider, setLoadingProvider] = useState<"google" | "kakao" | null>(null)

  const handleSocialLogin = async (provider: "google" | "kakao") => {
    if (disabled || loadingProvider) return
    setLoadingProvider(provider)
    try {
      const urls = await getOAuthUrls()
      const redirectUrl = provider === "google" ? urls.google : urls.kakao
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        throw new Error("No redirect URL found")
      }
    } catch (error) {
      console.error("Social login failed:", error)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Google Login */}
      <Button
        variant="outline"
        className="h-11 gap-3 text-sm font-medium transition-all hover:bg-accent/50 hover:scale-[1.01] active:scale-[0.99] border-muted-foreground/20"
        disabled={disabled || !!loadingProvider}
        type="button"
        onClick={() => handleSocialLogin("google")}
      >
        {loadingProvider === "google" ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <GoogleIcon className="size-5" />
        )}
        {t("continueWithGoogle")}
      </Button>

      {/* Kakao Login */}
      <Button
        variant="ghost"
        className="h-11 gap-3 text-sm font-semibold transition-all bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] hover:scale-[1.01] active:scale-[0.99] border-none shadow-sm"
        disabled={disabled || !!loadingProvider}
        type="button"
        onClick={() => handleSocialLogin("kakao")}
      >
        {loadingProvider === "kakao" ? (
          <Loader2 className="size-5 animate-spin text-[#191919]" />
        ) : (
          <KakaoIcon className="size-5 fill-[#191919]" />
        )}
        {t("continueWithKakao") || "카카오로 시작하기"}
      </Button>
    </div>
  )
}
