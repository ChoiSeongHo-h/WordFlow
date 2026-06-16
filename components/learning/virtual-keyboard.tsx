// components/learning/virtual-keyboard.tsx
"use client"

import { cn } from "@/lib/utils"
import { Delete, CornerDownLeft, Eraser } from "lucide-react"

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void
  status: string
  disabled?: boolean
}

export function VirtualKeyboard({ onKeyPress, status, disabled = false }: VirtualKeyboardProps) {
  const row1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]
  const row2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"]
  const row3 = ["Clear", "z", "x", "c", "v", "b", "n", "m", "Backspace"]
  const row4 = ["'", "Space", "Enter"]

  const renderKey = (key: string) => {
    const isSpecial = key === "Backspace" || key === "Enter" || key === "Space" || key === "Clear"
    const isCharDisabled = disabled && key !== "Enter"
    
    let label: React.ReactNode = key
    if (key === "Backspace") {
      label = <Delete className="size-4" />
    } else if (key === "Clear") {
      label = <Eraser className="size-4" />
    } else if (key === "Enter") {
      label = <CornerDownLeft className="size-4" />
    } else if (key === "Space") {
      label = "\u00A0" // Blank space
    }

    return (
      <button
        key={key}
        type="button"
        disabled={isCharDisabled}
        // Prevent default pointerdown behavior to stop input blur/refocus flicker
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => onKeyPress(key)}
        className={cn(
          "flex h-10 items-center justify-center rounded-md font-medium text-sm transition-all duration-100 select-none",
          "active:scale-95 touch-none",
          isSpecial 
            ? "bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted-foreground active:text-muted"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-primary active:text-primary-foreground",
          (key === "Clear" || key === "'") && "w-14 sm:w-18 flex-initial px-1",
          (key === "Backspace" || key === "Enter") && "w-14 sm:w-18 flex-initial px-1",
          key === "Space" && "flex-1",
          (!isSpecial && key !== "'") && "flex-1 max-w-[2.25rem] sm:max-w-[2.75rem]",
          isCharDisabled && "opacity-40 pointer-events-none"
        )}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto p-2 bg-background border-t flex flex-col gap-1.5 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex justify-center gap-1 w-full">
        {row1.map(renderKey)}
      </div>
      <div className="flex justify-center gap-1 w-full px-[5%]">
        {row2.map(renderKey)}
      </div>
      <div className="flex justify-center gap-1 w-full">
        {row3.map(renderKey)}
      </div>
      <div className="flex justify-center gap-1 w-full">
        {row4.map(renderKey)}
      </div>
    </div>
  )
}
