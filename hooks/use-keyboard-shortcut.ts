// hooks/use-keyboard-shortcut.ts
import { useEffect } from "react"

/**
 * Custom hook to handle global keyboard shortcuts.
 * @param key - The exact key string to listen for (e.g., 'Escape', 'Enter')
 * @param callback - The function to execute when the key is pressed
 * @param disabled - Boolean to disable the listener conditionally
 */
export function useKeyboardShortcut(key: string, callback: () => void, disabled: boolean = false) {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key) {
        // Only prevent default and execute if we're not typing in an input 
        // OR if the key is Escape (which we want to globalize)
        if (event.target instanceof HTMLInputElement && key !== "Escape") {
          return
        }
        
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [key, callback, disabled])
}