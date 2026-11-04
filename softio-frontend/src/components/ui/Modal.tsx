import { useCallback, useEffect, useId, useRef, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import Select from "@/components/ui/Select"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  closing?: boolean
  hideHeader?: boolean
  topAligned?: boolean
  ariaLabel?: string
  contentClassName?: string
}

interface ModalPortalProps {
  children: ReactNode
  onClose: () => void
}

export interface FormField {
  name: string
  label: string
  type?: "text" | "email" | "tel" | "number" | "date" | "time" | "file" | "textarea" | "select"
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: string }>
}

interface RecordFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: Record<string, string>) => void
  title: string
  description?: string
  submitLabel?: string
  fields: FormField[]
  initialValues?: Record<string, string>
}

const emptyValues: Record<string, string> = {}

function useModalLifecycle(onClose: () => void) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])
}

export function ModalPortal({ children, onClose }: ModalPortalProps) {
  useModalLifecycle(onClose)

  return createPortal(
    <div
      onMouseDown={(event) => {
        const target = event.target
        if (!(target instanceof Element)) return
        const backdrop = target.closest('[class~="fixed"][class~="inset-0"]')
        if (target === backdrop) onClose()
      }}
    >
      {children}
    </div>,
    document.body
  )
}

export default function Modal(props: ModalProps) {
  if (!props.open) return null

  return <ModalContent {...props} />
}

function ModalContent({
  onClose,
  title,
  children,
  size = "md",
  closing,
  hideHeader = false,
  topAligned = false,
  ariaLabel,
  contentClassName,
}: ModalProps) {
  const [internalClosing, setInternalClosing] = useState(false)
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleId = useId()
  const isClosing = closing ?? internalClosing

  const requestClose = useCallback(() => {
    if (closing !== undefined) {
      onClose()
      return
    }
    if (internalClosing || closeTimeout.current) return
    setInternalClosing(true)
    closeTimeout.current = setTimeout(onClose, 160)
  }, [closing, internalClosing, onClose])

  useModalLifecycle(requestClose)

  useEffect(() => () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current)
  }, [])

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    "2xl": "max-w-5xl",
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex ${topAligned ? "items-start justify-center overflow-y-auto pt-[8vh] sm:pt-[12vh]" : "items-center justify-center"} p-3 sm:p-4 ${isClosing ? "modal-overlay-exit" : "modal-overlay-enter"}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isClosing) requestClose()
      }}
    >
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-sm" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={hideHeader ? undefined : titleId}
        aria-label={hideHeader ? ariaLabel ?? title : undefined}
        className={`relative flex max-h-[min(90dvh,800px)] w-full ${sizes[size]} flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ${isClosing ? "modal-dialog-exit" : "modal-dialog-enter"}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {!hideHeader && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
            <button
              type="button"
              onClick={requestClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Fermer la fenêtre"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className={contentClassName ?? "overflow-y-auto px-5 py-5 sm:px-6"}>{children}</div>
      </section>
    </div>,
    document.body
  )
}

export function RecordFormModal({
  open,
  onClose,
  onSubmit,
  title,
  description,
  submitLabel,
  fields,
  initialValues = emptyValues,
}: RecordFormModalProps) {
  if (!open) return null

  return (
    <RecordFormContent
      key={JSON.stringify(initialValues)}
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      title={title}
      description={description}
      submitLabel={submitLabel}
      fields={fields}
      initialValues={initialValues}
    />
  )
}

function RecordFormContent({
  open,
  onClose,
  onSubmit,
  title,
  description,
  submitLabel,
  fields,
  initialValues = emptyValues,
}: RecordFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [closing, setClosing] = useState(false)
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current)
  }, [])

  const requestClose = () => {
    if (closing) return
    setClosing(true)
    closeTimeout.current = setTimeout(onClose, 160)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(values)
    requestClose()
  }

  return (
    <Modal open={open} onClose={requestClose} title={title} size="lg" closing={closing}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {description && <p className="-mt-2 text-sm text-muted-foreground">{description}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const value = values[field.name] ?? ""
            const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            return (
              <label
                key={field.name}
                className={`block space-y-1.5 text-sm font-medium ${field.type === "textarea" ? "sm:col-span-2" : ""}`}
              >
                <span>{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea
                    required={field.required}
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                    className={`${inputClass} min-h-24 resize-y`}
                  />
                ) : field.type === "select" ? (
                  <Select
                    required={field.required}
                    value={value}
                    onChange={(nextValue) => setValues({ ...values, [field.name]: nextValue })}
                    placeholder="Choisir..."
                    options={field.options ?? []}
                  />
                ) : (
                  <input
                    required={field.required}
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    {...(field.type === "file" ? {} : { value })}
                    onChange={(event) => {
                      const inputValue = field.type === "file"
                        ? (event.target as HTMLInputElement).files?.[0]?.name ?? ""
                        : event.target.value
                      setValues({ ...values, [field.name]: inputValue })
                    }}
                    className={inputClass}
                  />
                )}
              </label>
            )
          })}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={requestClose}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {submitLabel ?? "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
