import { useLayoutEffect, useState } from "react"
import type { RefObject } from "react"

export function useAnchoredPopover(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>,
) {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const anchor = anchorRef.current
      const popover = popoverRef.current
      if (!anchor || !popover) return

      const anchorBounds = anchor.getBoundingClientRect()
      const popoverBounds = popover.getBoundingClientRect()
      const gutter = 12
      const left = Math.min(
        Math.max(gutter, anchorBounds.left),
        Math.max(gutter, window.innerWidth - popoverBounds.width - gutter),
      )
      const below = anchorBounds.bottom + 8
      const top = below + popoverBounds.height <= window.innerHeight - gutter
        ? below
        : Math.max(gutter, anchorBounds.top - popoverBounds.height - 8)

      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open, anchorRef, popoverRef])

  return {
    position: "fixed" as const,
    top: position.top,
    left: position.left,
    zIndex: 120,
  }
}
