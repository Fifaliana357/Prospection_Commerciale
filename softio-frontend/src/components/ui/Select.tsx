import { useCallback, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  required = false,
  disabled = false,
  className,
  ariaLabel = placeholder,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  ariaLabel?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)))
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 256 })
  const selected = options.find((option) => option.value === value)
  const enabledOptions = options.filter((option) => !option.disabled)

  const updateMenuPosition = useCallback(() => {
    const bounds = triggerRef.current?.getBoundingClientRect()
    if (!bounds) return
    const roomBelow = window.innerHeight - bounds.bottom - 12
    const roomAbove = bounds.top - 12
    const naturalHeight = menuRef.current?.scrollHeight ?? 256
    const fitsBelow = roomBelow >= naturalHeight
    const placeBelow = fitsBelow || roomBelow >= roomAbove
    const availableHeight = placeBelow ? roomBelow : roomAbove
    const maxHeight = Math.max(48, Math.min(256, availableHeight))
    const menuHeight = Math.min(naturalHeight, maxHeight)
    const top = placeBelow ? bounds.bottom + 6 : bounds.top - menuHeight - 6
    const width = Math.min(bounds.width, window.innerWidth - 24)
    const left = Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12))
    setMenuPosition({ top, left, width, maxHeight })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updateMenuPosition()
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener("resize", updateMenuPosition)
    window.addEventListener("scroll", updateMenuPosition, true)
    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("resize", updateMenuPosition)
      window.removeEventListener("scroll", updateMenuPosition, true)
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, updateMenuPosition])

  const openMenu = () => {
    if (disabled) return
    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value && !option.disabled)))
    updateMenuPosition()
    setOpen((current) => !current)
  }

  const choose = (option: SelectOption) => {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const direction = event.key === "ArrowDown" ? 1 : -1
      if (!open) {
        setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value && !option.disabled)))
        updateMenuPosition()
        setOpen(true)
      } else if (enabledOptions.length) {
        const activeOptionIndex = enabledOptions.findIndex((option) => options.indexOf(option) === activeIndex)
        const nextIndex = (activeOptionIndex + direction + enabledOptions.length) % enabledOptions.length
        const nextOption = enabledOptions[nextIndex]
        if (nextOption) setActiveIndex(options.indexOf(nextOption))
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (open) {
        const option = options[activeIndex]
        if (option) choose(option)
      } else {
        updateMenuPosition()
        setOpen(true)
      }
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      {required && !disabled && (
        <input
          type="text"
          value={value}
          required
          tabIndex={-1}
          aria-hidden="true"
          aria-label={ariaLabel}
          onChange={() => undefined}
          onInvalid={(event) => {
            event.preventDefault()
            triggerRef.current?.focus()
            updateMenuPosition()
            setOpen(true)
          }}
          className="sr-only"
        />
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={openMenu}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-2 text-left text-sm text-foreground shadow-sm transition hover:border-primary/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground",
          className,
        )}
      >
        <span className="min-w-0 flex-1 whitespace-normal break-words">{selected?.label ?? placeholder}</span>
        <ChevronDown size={17} className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: "fixed",
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
            zIndex: 130,
          }}
          className="animate-modal-dialog-enter overflow-y-auto rounded-2xl border border-primary/10 bg-card p-1.5 text-foreground shadow-[0_16px_40px_rgba(15,35,40,0.16)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <button
                type="button"
                key={`${option.value}-${index}`}
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
                className={cn(
                  "flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-primary/15 font-semibold text-primary"
                    : "text-foreground hover:bg-muted",
                  activeIndex === index && !isSelected && "bg-muted",
                  option.disabled && "cursor-not-allowed opacity-45",
                )}
              >
                <span className="min-w-0 flex-1 whitespace-normal break-words">{option.label}</span>
                {isSelected && <Check size={16} className="shrink-0" />}
              </button>
            )
          })}
          {options.length === 0 && (
            <p className="px-3 py-3 text-center text-sm text-muted-foreground">Aucune option disponible</p>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
