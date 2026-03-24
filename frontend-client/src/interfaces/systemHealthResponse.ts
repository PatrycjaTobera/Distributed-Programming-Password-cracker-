export interface SystemHealthResponse {
  frontendToCentral: string
  centralToCalculating: string
  calculatingMessage?: string
  error?: string
}
