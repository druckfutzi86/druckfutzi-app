"use client"

import { useState } from "react"

type Fahrer = {
  fahrer_id: number
  name: string
  typ: string
  stundenlohn: number
}

export default function Home() {

  const [fahrerId, setFahrerId] = useState("")
  const [pin, setPin] = useState("")
  const [fahrer, setFahrer] = useState<Fahrer | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function login() {

    setError("")
    setLoading(true)

    try {
      const res = await fetch("https://druckfutzi.de/wp-json/druckfutzi/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fahrer_id: Number(fahrerId),
          pin: pin
        })
      })

      if (!res.ok) {
        setError("Fahrer-ID oder PIN falsch oder nicht freigeschaltet")
        setLoading(false)
        return
      }

      const data = await res.json()
      setFahrer(data)

    } catch (err) {
      setError("Server nicht erreichbar")
    }

    setLoading(false)
  }

  function logout() {
    setFahrer(null)
    setFahrerId("")
    setPin("")
  }

  /* ================= LOGIN VIEW ================= */

  if (!fahrer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">

        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">

          <h1 className="text-2xl font-bold text-center mb-6">
            Druckfutzi Fahrer Login
          </h1>

          <input
            type="number"
            placeholder="Fahrer-ID"
            value={fahrerId}
            onChange={(e) => setFahrerId(e.target.value)}
            className="w-full mb-4 p-3 border rounded-lg"
          />

          <input
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full mb-4 p-3 border rounded-lg"
          />

          {error && (
            <p className="text-red-600 text-sm mb-4">
              {error}
            </p>
          )}

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Prüfe..." : "Login"}
          </button>

        </div>
      </div>
    )
  }

  /* ================= DASHBOARD ================= */

  return (
    <div className="min-h-screen p-8 bg-gray-100 text-gray-900">

      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">
            Willkommen {fahrer.name}
          </h2>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="mb-2">
            <strong>Fahrer-ID:</strong> {fahrer.fahrer_id}
          </p>

          <p className="mb-2">
            <strong>Typ:</strong> {fahrer.typ}
          </p>

          <p>
            <strong>Stundenlohn:</strong>{" "}
            {fahrer.typ === "selbststaendig"
              ? "—"
              : `${fahrer.stundenlohn} €`}
          </p>

        </div>

      </div>
    </div>
  )
}
