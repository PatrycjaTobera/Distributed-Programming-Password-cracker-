import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import SystemConnectionCheck from './components/system-connection-check'

type CrackingMethod = 'Słownikowa' | 'Brute-force'

type CrackingResponse = {
  message?: string
  [key: string]: unknown
}

const normalizeBaseUrl = (value: string): string => {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed) {
    return ''
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`
}

const getResponseMessage = (payload: unknown): string | null => {
  if (typeof payload === 'string') {
    return payload
  }

  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as CrackingResponse).message
    return typeof message === 'string' ? message : null
  }

  return null
}

const parsePayload = (rawText: string): unknown => {
  if (!rawText) {
    return null
  }

  try {
    return JSON.parse(rawText) as unknown
  } catch {
    return rawText
  }
}

function App() {
  const [login, setLogin] = useState('')
  const [method, setMethod] = useState<CrackingMethod>('Słownikowa')
  const [passwordLength, setPasswordLength] = useState(4)
  const [dictionaryFile, setDictionaryFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const configuredBaseUrl = import.meta.env.VITE_CENTRAL_SERVER_URL as string | undefined
  const configuredIp = import.meta.env.VITE_CENTRAL_SERVER_IP as string | undefined

  const centralServerBaseUrls = useMemo(
    () =>
      [configuredBaseUrl, configuredIp, 'http://localhost:5098', 'http://localhost:5170']
        .filter((url): url is string => Boolean(url))
        .map(normalizeBaseUrl)
        .filter((url, index, all) => Boolean(url) && all.indexOf(url) === index),
    [configuredBaseUrl, configuredIp],
  )

  const sendBruteForceRequest = async (baseUrl: string) => {
    const response = await fetch(`${baseUrl}/api/cracking/brute-force`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userLogin: login,
        passwordLength,
      }),
    })

    const rawText = await response.text()
    const parsed = parsePayload(rawText)

    if (!response.ok) {
      throw new Error(getResponseMessage(parsed) ?? `Błąd serwera (${response.status}).`)
    }

    return getResponseMessage(parsed) ?? 'Wysłano żądanie brute-force.'
  }

  const sendDictionaryRequest = async (baseUrl: string) => {
    if (dictionaryFile && !dictionaryFile.name.endsWith('.txt')) {
      throw new Error('Plik słownikowy musi mieć rozszerzenie .txt')
    }

    if (dictionaryFile) {
      const syncData = new FormData()
      syncData.append('file', dictionaryFile)

      const syncResponse = await fetch(`${baseUrl}/api/synchronizing/dictionary`, {
        method: 'POST',
        body: syncData,
      })

      if (!syncResponse.ok) {
        const syncError = await syncResponse.text()
        throw new Error(syncError || `Synchronizacja słownika nie powiodła się (${syncResponse.status}).`)
      }
    }

    const crackingData = new FormData()
    crackingData.append('username', login)

    const response = await fetch(`${baseUrl}/api/cracking/dictionary`, {
      method: 'POST',
      body: crackingData,
    })

    const rawText = await response.text()
    const parsed = parsePayload(rawText)

    if (!response.ok) {
      throw new Error(getResponseMessage(parsed) ?? `Błąd serwera (${response.status}).`)
    }

    return getResponseMessage(parsed) ?? 'Wysłano żądanie słownikowe.'
  }

  const dispatchCrackingRequest = async () => {
    let lastNetworkError: string | null = null

    for (const baseUrl of centralServerBaseUrls) {
      try {
        if (method === 'Brute-force') {
          return await sendBruteForceRequest(baseUrl)
        }

        return await sendDictionaryRequest(baseUrl)
      } catch (error) {
        lastNetworkError = error instanceof Error ? error.message : 'Nieznany błąd żądania.'
      }
    }

    throw new Error(lastNetworkError ?? 'Nie udało się połączyć z serwerem centralnym.')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!login.trim()) {
      setErrorMessage('Login jest wymagany.')
      setResultMessage(null)
      return
    }

    if (method === 'Brute-force' && passwordLength < 2) {
      setErrorMessage('Długość hasła musi być większa lub równa 2.')
      setResultMessage(null)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setResultMessage(null)

    try {
      const message = await dispatchCrackingRequest()
      setResultMessage(message)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się wysłać żądania.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="screen">
      <section className="panel">
        <header className="heading">
          <h1>Łamacz haseł - Programowanie systemów rozproszonych</h1>
          <p className="subtitle">1ID21B: Łukasz Stępień, Patrycja Tobera</p>
        </header>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login">Wprowadz login</label>
            <input
              id="login"
              name="login"
              type="text"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="np. user"
            />
          </div>

          <div className="field">
            <p className="label">Wybierz metodę</p>
            <div className="method-list" role="radiogroup" aria-label="Wybierz metodę">
              <button
                type="button"
                className={method === 'Słownikowa' ? 'method active' : 'method'}
                onClick={() => setMethod('Słownikowa')}
                aria-pressed={method === 'Słownikowa'}
              >
                Słownikowa
              </button>
              <button
                type="button"
                className={method === 'Brute-force' ? 'method active' : 'method'}
                onClick={() => setMethod('Brute-force')}
                aria-pressed={method === 'Brute-force'}
              >
                Brute-force
              </button>
            </div>
          </div>

          {method === 'Brute-force' && (
            <div className="field">
              <label htmlFor="passwordLength">Długość hasła</label>
              <input
                id="passwordLength"
                name="passwordLength"
                type="number"
                min={2}
                value={passwordLength}
                onChange={(event) => setPasswordLength(Number(event.target.value))}
              />
            </div>
          )}

          {method === 'Słownikowa' && (
            <div className="field">
              <label htmlFor="dictionary">Plik słownika (opcjonalny, .txt)</label>
              <input
                id="dictionary"
                name="dictionary"
                type="file"
                accept=".txt,text/plain"
                onChange={(event) => setDictionaryFile(event.target.files?.[0] ?? null)}
              />
            </div>
          )}

          <button className="start-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Wysyłanie...' : 'Rozpocznij łamanie'}
          </button>

          {resultMessage && <p className="request-success">Status: {resultMessage}</p>}
          {errorMessage && <p className="request-error">Błąd: {errorMessage}</p>}
        </form>

        <SystemConnectionCheck />
      </section>
    </main>
  )
}

export default App
