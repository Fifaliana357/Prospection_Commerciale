export const SOFTIO_URL = (import.meta.env.VITE_SOFTIO_URL ?? 'http://localhost:5173').replace(
  /\/$/,
  '',
)

export function retournerVersSoftio(): void {
  window.location.assign(`${SOFTIO_URL}/dashboard`)
}
