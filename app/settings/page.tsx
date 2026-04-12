"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Zap, Lock, CreditCard, LogOut, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)
  const [isUpdatingSubscription, setIsUpdatingSubscription] = React.useState(false)

  const handleBack = () => {
    router.push("/")
  }

  const handleLogout = () => {
    localStorage.removeItem("flow_token")
    localStorage.removeItem("wordflow-daily-goal")
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
    router.push("/login")
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    // Mock delay
    setTimeout(() => {
      setIsChangingPassword(false)
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully (mock).",
      })
      const form = e.target as HTMLFormElement
      form.reset()
    }, 1000)
  }

  const handleSubscriptionUpdate = () => {
    setIsUpdatingSubscription(true)
    // Mock delay
    setTimeout(() => {
      setIsUpdatingSubscription(false)
      toast({
        title: "Subscription updated",
        description: "Welcome to Premium! Your plan has been updated (mock).",
      })
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="rounded-full hover:bg-accent"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20 text-primary-foreground">
                <Zap className="size-4 fill-current" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground font-[family-name:var(--font-heading)]">
                WordFlow Settings
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
        <section className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-[family-name:var(--font-heading)]">
            Account Settings
          </h1>
          <p className="text-muted-foreground">Manage your profile, password, and subscription preferences.</p>
        </section>

        <div className="space-y-6">
          {/* Password Change Card */}
          <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/20 bg-muted/20 pb-4">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-primary" />
                <CardTitle className="text-lg">Change Password</CardTitle>
              </div>
              <CardDescription>Secure your account with a new password.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                    id="current-password" 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    className="bg-background/50"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isChangingPassword}
                  className="w-full md:w-auto"
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/20 bg-muted/20 pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                <CardTitle className="text-lg">Subscription Plan</CardTitle>
              </div>
              <CardDescription>Manage your premium features and billing cycle.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 rounded-xl border border-primary/20 bg-primary/5 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10">Current Plan</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Free Tier</h3>
                  <p className="text-sm text-muted-foreground mt-1">Upgrade for unlimited word decks and AI hints.</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <span className="text-2xl font-black text-foreground">$0</span>/month
                </div>
              </div>

              <Tabs defaultValue="monthly" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Upgrade Options</Label>
                  <TabsList>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="monthly" className="mt-0">
                  <div className="p-4 rounded-lg border border-border/50 bg-background/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold">Premium Monthly</p>
                      <p className="text-xs text-muted-foreground">Full access, billed monthly.</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">$9.99</p>
                      <p className="text-[10px] text-muted-foreground">per month</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="yearly" className="mt-0">
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">Premium Yearly</p>
                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">SAVE 17%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Full access, billed annually.</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">$99.99</p>
                      <p className="text-[10px] text-muted-foreground">per year</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t border-border/10 px-6 py-4 flex justify-between items-center">
              <p className="text-xs text-muted-foreground max-w-[60%]">
                Upgrade to Premium to unlock specialized TOEIC decks and detailed progress analytics.
              </p>
              <Button 
                onClick={handleSubscriptionUpdate}
                disabled={isUpdatingSubscription}
                className="shadow-md shadow-primary/20"
              >
                {isUpdatingSubscription ? "Processing..." : "Upgrade Now"}
              </Button>
            </CardFooter>
          </Card>

          {/* Danger Zone / Logout */}
          <Card className="border-destructive/20 shadow-sm bg-destructive/5 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <LogOut className="size-4 text-destructive" />
                <CardTitle className="text-lg text-destructive">Account Actions</CardTitle>
              </div>
              <CardDescription>Manage sensitive account operations.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Log out of your account</p>
                <p className="text-xs text-muted-foreground">Your progress will be saved for your next session.</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="shrink-0"
              >
                Log Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

    </div>
  )
}
