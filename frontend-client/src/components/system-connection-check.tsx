import { useState } from 'react'
import type { SystemHealthResponse } from '../interfaces/systemHealthResponse'

function SystemConnectionCheck() {
  const [status, setStatus] = useState<SystemHealthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const configuredBaseUrl = import.meta.env.VITE_CENTRAL_SERVER_URL as string | undefined
  const centralServerBaseUrls = [configuredBaseUrl, 'http://localhost:5098', 'http://localhost:5170'].filter(
    (url): url is string => Boolean(url),
  )

  const handleCheck = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('[FRONTEND] => Wysyłam żądanie sprawdzenia połączenia systemu do Serwera Centralnego...')

      let lastNetworkError: string | null = null

      for (const baseUrl of centralServerBaseUrls) {
        try {
          const response = await fetch(`${baseUrl}/api/status/check-nodes`)
          const data = (await response.json()) as SystemHealthResponse

          console.log('[FRONTEND] <= Otrzymano końcową odpowiedź ze sprawdzenia połączenia systemu:', data)

          setStatus(data)

          if (!response.ok) {
            setError(data.error ?? 'Sprawdzenie połączenia nie powiodło się.')
          }

          return
        } catch (networkError) {
          lastNetworkError =
            networkError instanceof Error
              ? `Błąd sieci: ${networkError.message}`
              : 'Błąd sieci: nie udało się pobrać odpowiedzi z serwera.'
        }
      }

      throw new Error(lastNetworkError ?? 'Sprawdzenie połączenia nie powiodło się.')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Sprawdzenie połączenia nie powiodło się.'
      console.log('[FRONTEND] <= Sprawdzenie połączenia zakończone błędem:', message)
      setError(message)
      setStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="health-check">
      <button type="button" className="start-btn" onClick={handleCheck} disabled={isLoading}>
        {isLoading ? 'Sprawdzanie...' : 'Sprawdź połączenie systemu'}
      </button>

      {status && (
        <p className="health-status">
          Frontend → Centralny: {status.frontendToCentral}, Centralny → Obliczeniowy: {status.centralToCalculating}
          {status.calculatingMessage ? ` (${status.calculatingMessage})` : ''}
        </p>
      )}

      {error && <p className="health-error">Błąd: {error}</p>}
    </section>
  )
}

export default SystemConnectionCheck
