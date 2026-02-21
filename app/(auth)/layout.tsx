import { AuthBranding } from "@/components/auth/auth-branding"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Branding panel (hidden on mobile) */}
      <AuthBranding />

      {/* Right: Form area */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  )
}
