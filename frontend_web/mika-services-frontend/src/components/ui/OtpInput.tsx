import { useRef, useState, useCallback, useEffect } from 'react'

interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  error?: boolean
}

export const OtpInput = ({ length = 6, value, onChange, disabled = false, autoFocus = false, error = false }: OtpInputProps) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const [focused, setFocused] = useState(-1)

  const digits = value.padEnd(length, '').slice(0, length).split('')

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus()
    }
  }, [autoFocus])

  const focusInput = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, length - 1))
    inputsRef.current[clamped]?.focus()
  }, [length])

  const handleChange = useCallback((idx: number, char: string) => {
    if (!/^\d$/.test(char)) return
    const arr = value.padEnd(length, ' ').split('')
    arr[idx] = char
    const newVal = arr.join('').replace(/\s/g, '')
    onChange(newVal.slice(0, length))
    if (idx < length - 1) focusInput(idx + 1)
  }, [value, length, onChange, focusInput])

  const handleKeyDown = useCallback((idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const arr = value.padEnd(length, ' ').split('')
      if (arr[idx] !== ' ') {
        arr[idx] = ' '
        onChange(arr.join('').trimEnd())
      } else if (idx > 0) {
        arr[idx - 1] = ' '
        onChange(arr.join('').trimEnd())
        focusInput(idx - 1)
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusInput(idx - 1)
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      focusInput(idx + 1)
    }
  }, [value, length, onChange, focusInput])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) {
      onChange(pasted)
      focusInput(Math.min(pasted.length, length - 1))
    }
  }, [length, onChange, focusInput])

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputsRef.current[idx] = el }}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={digits[idx]?.trim() || ''}
          onChange={(e) => handleChange(idx, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onFocus={() => setFocused(idx)}
          onBlur={() => setFocused(-1)}
          className={`
            w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-lg sm:rounded-xl border-2 outline-none
            transition-all duration-150
            ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'}
            ${error
              ? 'border-red-400 dark:border-red-500'
              : focused === idx
                ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                : digits[idx]?.trim()
                  ? 'border-primary/50 dark:border-primary/40'
                  : 'border-gray-300 dark:border-gray-600'
            }
          `}
          aria-label={`Chiffre ${idx + 1}`}
        />
      ))}
    </div>
  )
}
