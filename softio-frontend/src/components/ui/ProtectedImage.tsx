import { useEffect, useState } from "react"
import type { ImgHTMLAttributes } from "react"
import api from "@/services/api"

export default function ProtectedImage({
  endpoint,
  alt,
  className,
  ...imageProps
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { endpoint: string }) {
  const [result, setResult] = useState<{ endpoint: string; objectUrl: string | null; failed: boolean } | null>(null)

  useEffect(() => {
    let active = true
    let currentObjectUrl: string | null = null

    void api.get<Blob>(endpoint, { responseType: "blob" })
      .then(({ data }) => {
        if (!active) return
        currentObjectUrl = URL.createObjectURL(data)
        setResult({ endpoint, objectUrl: currentObjectUrl, failed: false })
      })
      .catch(() => {
        if (active) setResult({ endpoint, objectUrl: null, failed: true })
      })

    return () => {
      active = false
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
    }
  }, [endpoint])

  const currentResult = result?.endpoint === endpoint ? result : null

  if (currentResult?.failed) {
    return (
      <span className={`inline-flex items-center justify-center text-xs text-muted-foreground ${className ?? ""}`} role="img" aria-label={`${alt}: image indisponible`}>
        Image indisponible
      </span>
    )
  }

  return currentResult?.objectUrl
    ? <img {...imageProps} src={currentResult.objectUrl} alt={alt} className={className} />
    : <span className={`inline-flex items-center justify-center text-xs text-muted-foreground ${className ?? ""}`} role="status">Chargement de l’image…</span>
}
