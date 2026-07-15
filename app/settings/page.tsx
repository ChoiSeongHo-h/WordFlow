"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Zap, Lock, CreditCard, LogOut, CheckCircle2, Volume2, Play, Palette, Keyboard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { removeAuthToken } from "@/lib/api"
import { useUserTheme } from "@/hooks/use-user-theme"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme, mounted } = useUserTheme()
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)
  const [isUpdatingSubscription, setIsUpdatingSubscription] = React.useState(false)

  const [userEmail, setUserEmail] = React.useState("guest")
  const [voiceSpeed, setVoiceSpeed] = React.useState(1.0)
  const [voiceURI, setVoiceURI] = React.useState("system-default")
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([])
  const [keyboardHeight, setKeyboardHeight] = React.useState(200)

  React.useEffect(() => {
    // Decode user email from token
    const token = localStorage.getItem("flow_token")
    let email = "guest"
    if (token) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
        const payload = JSON.parse(jsonPayload)
        email = payload.sub || "guest"
      } catch (e) {
        console.error("Failed to decode token", e)
      }
    }
    setUserEmail(email)

    // Load saved settings
    const speed = localStorage.getItem(`wordflow-voice-speed-${email}`)
    const uri = localStorage.getItem(`wordflow-voice-uri-${email}`)
    const kbHeight = localStorage.getItem(`wordflow-keyboard-height-${email}`)
    if (speed) setVoiceSpeed(parseFloat(speed))
    if (uri) setVoiceURI(uri)
    if (kbHeight) setKeyboardHeight(parseInt(kbHeight, 10))

    // Populate voices
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const updateVoices = () => {
        const allVoices = window.speechSynthesis.getVoices()
        const englishVoices = allVoices.filter(v => v.lang.startsWith("en"))
        setVoices(englishVoices)
      }
      updateVoices()
      window.speechSynthesis.onvoiceschanged = updateVoices
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const handleBack = () => {
    router.push("/")
  }

  const handleLogout = () => {
    removeAuthToken()
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

          {/* Voice Settings Card */}
          <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/20 bg-muted/20 pb-4">
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-primary" />
                <CardTitle className="text-lg">Voice Settings</CardTitle>
              </div>
              <CardDescription>Customize the TTS (Text-to-Speech) feedback voice and speed.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice-speed">Voice Speed ({voiceSpeed.toFixed(1)}x)</Label>
                  <span className="text-xs text-muted-foreground">0.5x (Slow) - 2.0x (Fast)</span>
                </div>
                <div className="pt-2">
                  <Slider
                    id="voice-speed"
                    value={[voiceSpeed]}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    onValueChange={(val) => {
                      const speed = val[0]
                      setVoiceSpeed(speed)
                      localStorage.setItem(`wordflow-voice-speed-${userEmail}`, speed.toString())
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="voice-style">Voice Style (Accents & Personalities)</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={voiceURI}
                      onValueChange={(uri) => {
                        setVoiceURI(uri)
                        localStorage.setItem(`wordflow-voice-uri-${userEmail}`, uri)
                        const voiceName = voices.find(v => v.voiceURI === uri)?.name || ""
                        localStorage.setItem(`wordflow-voice-name-${userEmail}`, voiceName)
                      }}
                    >
                      <SelectTrigger className="w-full bg-background/50">
                        <SelectValue placeholder="System Default Voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system-default">System Default Voice</SelectItem>
                        {voices.map((voice) => (
                          <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                            {voice.name} ({voice.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (typeof window !== "undefined" && "speechSynthesis" in window) {
                        window.speechSynthesis.cancel()
                        const utterance = new SpeechSynthesisUtterance("Welcome to WordFlow. This is a preview of your voice settings.")
                        utterance.lang = "en-US"
                        utterance.rate = voiceSpeed
                        if (voiceURI && voiceURI !== "system-default") {
                          const selectedVoice = voices.find(v => v.voiceURI === voiceURI)
                          if (selectedVoice) {
                            utterance.voice = selectedVoice
                          }
                        }
                        window.speechSynthesis.speak(utterance)
                      } else {
                        toast({
                          title: "Not supported",
                          description: "Your browser does not support Speech Synthesis.",
                        })
                      }
                    }}
                    className="shrink-0 gap-1.5"
                  >
                    <Play className="size-3.5 fill-current" />
                    Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings Card */}
          <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/20 bg-muted/20 pb-4">
              <div className="flex items-center gap-2">
                <Palette className="size-4 text-primary" />
                <CardTitle className="text-lg">Theme Settings</CardTitle>
              </div>
              <CardDescription>Select your preferred application color theme.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2.5">
                <Label htmlFor="theme-select">App Theme</Label>
                <Select
                  value={mounted ? theme : "system"}
                  onValueChange={(val) => setTheme(val)}
                >
                  <SelectTrigger id="theme-select" className="w-full bg-background/50">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Keyboard Settings Card */}
          <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/20 bg-muted/20 pb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="size-4 text-primary" />
                <CardTitle className="text-lg">Keyboard Settings</CardTitle>
              </div>
              <CardDescription>Customize the virtual keyboard height for comfortable typing.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="keyboard-height">Keyboard Height ({keyboardHeight}px)</Label>
                  <span className="text-xs text-muted-foreground">160px (Small) - 300px (Large)</span>
                </div>
                <div className="pt-2">
                  <Slider
                    id="keyboard-height"
                    value={[keyboardHeight]}
                    min={160}
                    max={300}
                    step={10}
                    onValueChange={(val) => {
                      const height = val[0]
                      setKeyboardHeight(height)
                      localStorage.setItem(`wordflow-keyboard-height-${userEmail}`, height.toString())
                    }}
                  />
                </div>
              </div>
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
