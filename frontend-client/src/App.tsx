import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import SystemConnectionCheck from './components/system-connection-check'

type CrackingMethod = 'Słownikowa' | 'Brute-force'

type CrackingResponse = {
  message?: string
  Message?: string
  [key: string]: unknown
}

class HttpResponseError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpResponseError'
    this.status = status
  }
}

const CSV_RESULTS_NOTE = 'Wyniki zapisano do pliku CSV.'

const normalizeBaseUrl = (value: string): string => {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed) {
    return ''
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`
}

const expandBaseUrlCandidates = (value?: string): string[] => {
  if (!value) {
    return []
  }

  const normalized = normalizeBaseUrl(value)
  if (!normalized) {
    return []
  }

  try {
    const parsedUrl = new URL(normalized)
    if (parsedUrl.port) {
      return [`${parsedUrl.protocol}//${parsedUrl.host}`]
    }

    return [`${parsedUrl.protocol}//${parsedUrl.hostname}:5098`, `${parsedUrl.protocol}//${parsedUrl.hostname}:5170`]
  } catch {
    return [normalized]
  }
}

const getResponseMessage = (payload: unknown): string | null => {
  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    if (!trimmed || /^<!doctype html/i.test(trimmed) || /^<html/i.test(trimmed)) {
      return null
    }

    return trimmed
  }

  if (payload && typeof payload === 'object') {
    const responsePayload = payload as CrackingResponse
    if (typeof responsePayload.message === 'string') {
      return responsePayload.message
    }

    if (typeof responsePayload.Message === 'string') {
      return responsePayload.Message
    }
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

const formatResponseDetails = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null
  }

  const responsePayload = payload as Record<string, unknown>
  const lines: string[] = []

  if (typeof responsePayload.totalExecutionTime === 'number') {
    lines.push(`Calkowity czas: ${responsePayload.totalExecutionTime} ms`)
  }

  if (typeof responsePayload.averageServerTime === 'number') {
    lines.push(`Sredni czas serwera: ${responsePayload.averageServerTime} ms`)
  }

  if (typeof responsePayload.communicationTime === 'number') {
    lines.push(`Czas komunikacji: ${responsePayload.communicationTime} ms`)
  }

  if (Array.isArray(responsePayload.serversTimes) && responsePayload.serversTimes.length > 0) {
    const formattedServers = responsePayload.serversTimes
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null
        }

        const server = typeof (entry as Record<string, unknown>).server === 'string' ? (entry as Record<string, unknown>).server : null
        const time = typeof (entry as Record<string, unknown>).time === 'number' ? (entry as Record<string, unknown>).time : null

        if (!server || time === null) {
          return null
        }

        return `${server}: ${time} ms`
      })
      .filter((entry): entry is string => Boolean(entry))

    if (formattedServers.length > 0) {
      lines.push('Czasy serwerów:')
      for (const formattedServer of formattedServers) {
        lines.push(`- ${formattedServer}`)
      }
    }
  }

  if (lines.length === 0) {
    return null
  }

  return lines.join('\n')
}

const formatErrorMessage = (payload: unknown, status: number): string => {
  const message = getResponseMessage(payload)
  const details = formatResponseDetails(payload)
  let formattedMessage: string | null = null

  if (message && details) {
    formattedMessage = `${message}\n${details}`
  }

  if (!formattedMessage && message) {
    formattedMessage = message
  }

  if (!formattedMessage && details) {
    formattedMessage = details
  }

  if (!formattedMessage) {
    return `Błąd serwera (${status}).`
  }

  if (details) {
    return `${formattedMessage}\n${CSV_RESULTS_NOTE}`
  }

  return formattedMessage
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
      [
        ...expandBaseUrlCandidates(configuredBaseUrl),
        ...expandBaseUrlCandidates(configuredIp),
        'http://localhost:5098',
        'http://localhost:5170',
      ]
        .filter((url): url is string => Boolean(url))
        .filter((url, index, all) => Boolean(url) && all.indexOf(url) === index),
    [configuredBaseUrl, configuredIp],
  )

  const sendBruteForceRequest = async (baseUrl: string) => {
    const payload = JSON.stringify({
      userLogin: login.trim(),
      passwordLength,
    })

    const response = await fetch(`${baseUrl}/api/cracking/brute-force`, {
      method: 'POST',
      body: payload,
    })

    const rawText = await response.text()
    const parsed = parsePayload(rawText)

    if (!response.ok) {
      throw new HttpResponseError(formatErrorMessage(parsed, response.status), response.status)
    }

    const message = getResponseMessage(parsed)
    if (!message) {
      throw new Error('Serwer zwrócił nieprawidłową odpowiedź dla brute-force.')
    }

    return message
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
    crackingData.append('username', login.trim())

    const response = await fetch(`${baseUrl}/api/cracking/dictionary`, {
      method: 'POST',
      body: crackingData,
    })

    const rawText = await response.text()
    const parsed = parsePayload(rawText)

    if (!response.ok) {
      throw new HttpResponseError(formatErrorMessage(parsed, response.status), response.status)
    }

    const message = getResponseMessage(parsed)
    if (!message) {
      throw new Error('Serwer zwrócił nieprawidłową odpowiedź dla metody słownikowej.')
    }

    return message
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
        if (error instanceof HttpResponseError) {
          throw error
        }

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

  const summaryMessage = resultMessage ?? errorMessage
  const summaryClassName = errorMessage ? 'request-summary error' : 'request-summary success'

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

          {summaryMessage && (
            <section className={summaryClassName} role="alert" aria-live="polite">
              <p className="request-summary-title">Wynik:</p>
              <p className="request-summary-content">{summaryMessage}</p>
            </section>
          )}
        </form>

        <SystemConnectionCheck />
      </section>
    </main>
  )
}

export default App
