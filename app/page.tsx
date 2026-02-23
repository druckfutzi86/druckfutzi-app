"use client"

import { useState, useEffect } from "react"

type Fahrer = {
  fahrer_id: number
  name: string
  typ: string
  stunden: number
  token: string
}

type Auftrag = {
  id: number
  titel: string
  datum: string
  start_lat: number
  start_lng: number
}

export default function Home() {

  /* ================= STATES ================= */

  const [fahrerId, setFahrerId] = useState("")
  const [pin, setPin] = useState("")
  const [fahrer, setFahrer] = useState<Fahrer | null>(null)

  const [auftraege, setAuftraege] = useState<Auftrag[]>([])
  const [aktivAuftrag, setAktivAuftrag] = useState<Auftrag | null>(null)

  const [startZeit, setStartZeit] = useState<number | null>(null)
  const [laufzeit, setLaufzeit] = useState(0)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const RADIUS_KM = 5

  /* ================= TIMER ================= */

  useEffect(() => {

    if (!startZeit) return

    const interval = setInterval(() => {
      setLaufzeit(Math.floor((Date.now() - startZeit) / 1000))
    }, 1000)

    return () => clearInterval(interval)

  }, [startZeit])

  /* ================= DISTANZ ================= */

  function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /* ================= LOGIN ================= */

  async function login() {

    setError("")
    setLoading(true)

    try {

      const res = await fetch("https://druckfutzi.de/wp-json/druckfutzi/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fahrer_id: Number(fahrerId),
          pin: pin
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login fehlgeschlagen")
        setLoading(false)
        return
      }

      setFahrer({
  fahrer_id: data.fahrer_id,
  name: data.name,
  typ: data.typ,
  stunden: data.stunden,
  token: data.token
})

      // Aufträge mit Token laden
      const a = await fetch("https://druckfutzi.de/wp-json/druckfutzi/v1/auftraege", {
        headers: {
          Authorization: `Bearer ${data.token}`
        }
      })

      const auftragData = await a.json()
      setAuftraege(auftragData)

    } catch {
      setError("Server nicht erreichbar")
    }

    setLoading(false)
  }

  function logout() {
    setFahrer(null)
    setAuftraege([])
    setAktivAuftrag(null)
    setStartZeit(null)
    setLaufzeit(0)
  }

  /* =========================================================
   AUFTRAG START
========================================================= */

async function startAuftrag(a: Auftrag) {

  if (!navigator.geolocation) {
    alert("GPS nicht verfügbar")
    return
  }

  navigator.geolocation.getCurrentPosition(async (position) => {

    const dist = distance(
      position.coords.latitude,
      position.coords.longitude,
      a.start_lat,
      a.start_lng
    )

    if (dist > RADIUS_KM) {
      alert("Nicht im erlaubten Radius (5km)")
      return
    }

    // 🔥 API CALL START
    await fetch("https://druckfutzi.de/wp-json/druckfutzi/v1/auftrag/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${fahrer?.token}`
      },
      body: JSON.stringify({
        auftrag_id: a.id
      })
    })

    setAktivAuftrag(a)
    setStartZeit(Date.now())
  })
}

/* =========================================================
   AUFTRAG STOP
========================================================= */

async function stopAuftrag() {

  if (!aktivAuftrag || !startZeit) return

  const res = await fetch("https://druckfutzi.de/wp-json/druckfutzi/v1/auftrag/stop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${fahrer?.token}`
    },
    body: JSON.stringify({
      auftrag_id: aktivAuftrag.id
    })
  })

  const data = await res.json()

  alert("Zeit gespeichert ✔")

  // Stunden aktualisieren
  setFahrer(prev => prev ? {
    ...prev,
    stunden: data.stunden
  } : prev)

  setAktivAuftrag(null)
  setStartZeit(null)
  setLaufzeit(0)
}

  /* ================= LOGIN VIEW ================= */

  if (!fahrer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">

          <h1 className="text-2xl font-bold text-center mb-6">
            Fahrer Login
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
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            {loading ? "Prüfe..." : "Login"}
          </button>

        </div>
      </div>
    )
  }

  /* ================= DASHBOARD ================= */

  return (
    <div className="min-h-screen p-8 bg-gray-100">

      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between mb-8">
          <div>
  <h2 className="text-xl font-bold">
    Willkommen {fahrer.name}
  </h2>
  <p className="text-sm text-gray-600">
    Typ: {fahrer.typ}
  </p>
  <p className="text-sm text-gray-600">
    Geleistete Stunden: {fahrer.stunden} h
  </p>
</div>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        {aktivAuftrag && (
          <div className="bg-green-100 p-4 mb-6 rounded-xl">
            <p><strong>Aktiver Auftrag:</strong> {aktivAuftrag.titel}</p>
            <p>Laufzeit: {Math.floor(laufzeit / 60)} Minuten</p>
            <button
              onClick={stopAuftrag}
              className="bg-red-600 text-white px-4 py-2 mt-3 rounded-lg"
            >
              Stoppen
            </button>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold mb-4">Meine Aufträge</h3>

          {auftraege.length === 0 && <p>Keine Aufträge</p>}

          {auftraege.map(a => (
            <div key={a.id} className="border p-3 mb-3 rounded-lg">
              <p><strong>{a.titel}</strong></p>
              <p>{a.datum}</p>

              {!aktivAuftrag && (
                <button
                  onClick={() => startAuftrag(a)}
                  className="bg-blue-600 text-white px-4 py-2 mt-2 rounded-lg"
                >
                  Auftrag starten
                </button>
              )}
            </div>
          ))}

        </div>

      </div>
    </div>
  )
}