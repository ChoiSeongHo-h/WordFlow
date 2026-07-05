// hooks/use-keyboard-shortcut.ts
import { useEffect, useRef } from "react"

/**
 * Custom hook to handle global keyboard shortcuts.
 * @param key - The exact key string to listen for (e.g., 'Escape', 'Enter')
 * @param callback - The function to execute when the key is pressed
 * @param disabled - Boolean to disable the listener conditionally
 */
export function useKeyboardShortcut(key: string, callback: () => void, disabled: boolean = false) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === key.toLowerCase()) {
        // Only prevent default and execute if we're not typing in an active input or textarea
        // OR if the key is Escape (which we want to globalize)
        if (
          (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) &&
          key !== "Escape"
        ) {
          if (!event.target.readOnly) {
            return
          }
        }
        
        event.preventDefault()
        callbackRef.current()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [key, disabled])
}