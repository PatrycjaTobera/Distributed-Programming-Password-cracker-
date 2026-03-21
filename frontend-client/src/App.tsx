import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

function App() {
  const [login, setLogin] = useState('')
  const [method, setMethod] = useState<'Słownikowa' | 'Brute-force'>('Słownikowa')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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

          <button className="start-btn" type="submit">
            Rozpocznij łamanie
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
