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

type Plan = {
  mo: string
  di: string
  mi: string
  do: string
  fr: string
  sa: string
  so: string
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
  const [istPause, setIstPause] = useState(false)

  const [view, setView] = useState<"dashboard" | "kapazitaet">("dashboard")
  const [weekIndex, setWeekIndex] = useState(0)

  const planKeys = ["mo", "di", "mi", "do", "fr", "sa", "so"] as const;
  type PlanKey = typeof planKeys[number];  // Typ ist jetzt "mo" | "di" | "mi" | "do" | "fr" | "sa" | "so"

  const [plan, setPlan] = useState<Plan>({
    mo: "",
    di: "",
    mi: "",
    do: "",
    fr: "",
    sa: "",
    so: ""
  });

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const RADIUS_KM = 5

  /* ================= TIMER ================= */

  useEffect(() => {
    if (!startZeit || istPause) return

    const interval = setInterval(() => {
      setLaufzeit(Math.floor((Date.now() - startZeit) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startZeit, istPause])

  /* ================= iOS WIEDERHERSTELLUNG ================= */

  useEffect(() => {
    const gespeicherteZeit = localStorage.getItem("startZeit")
    const gespeicherterAuftrag = localStorage.getItem("aktivAuftrag")

    if (gespeicherteZeit && gespeicherterAuftrag) {
      setStartZeit(Number(gespeicherteZeit))
      setAktivAuftrag(JSON.parse(gespeicherterAuftrag))
    }
  }, [])

  /* ================= HELPERS ================= */

  function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  function getISOWeek(date: Date) {
    const tmp = new Date(date.getTime())
    tmp.setHours(0, 0, 0, 0)
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
    const week1 = new Date(tmp.getFullYear(), 0, 4)
    return 1 + Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000
        - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  }

  const farbe = (wert: string) => {
    switch (wert) {
      case "Ganztag": return "bg-green-100 border-green-400"
      case "Halbtags": return "bg-yellow-100 border-yellow-400"
      case "Urlaub": return "bg-red-100 border-red-400"
      case "Frei": return "bg-gray-100 border-gray-400"
      default: return ""
    }
  }

  /* ================= KAPAZITÄT AUTO LADEN ================= */

  useEffect(() => {

    if (view !== "kapazitaet" || !fahrer) return

    const futureDate = new Date(Date.now() + weekIndex * 7 * 86400000)
    const kw = getISOWeek(futureDate)
    const jahr = futureDate.getFullYear()

    // Der API-Aufruf wird jetzt direkt hier durchgeführt
    async function ladePlan() {
      try {
        const res = await fetch(
          `https://druckfutzi.de/wp-json/druckfutzi/v1/kapazitaet?kw=${kw}&jahr=${jahr}`,
          {
            headers: {
              Authorization: `Bearer ${fahrer!.token}`,
            },
          }
        );

        if (!res.ok) {
          const errorDetails = await res.text();
          throw new Error(`Fehler beim Laden der Kapazitäten: ${res.statusText} - Details: ${errorDetails}`);
        }

        const data = await res.json();

        if (data && Object.keys(data).length > 0) {
          setPlan(data); // Erfolgreich gefüllte Daten setzen
        } else {
          setPlan({ mo: "", di: "", mi: "", do: "", fr: "", sa: "", so: "" }); // Leere Antwort behandeln
        }
      } catch (error) {
        console.error("Fehler bei der Kapazitätsabfrage:", error);
        setPlan({ mo: "", di: "", mi: "", do: "", fr: "", sa: "", so: "" });
      }
    }

    ladePlan(); // API-Aufruf ausführen

  }, [weekIndex, view, fahrer]); // Abhängigkeiten des useEffect

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
          pin
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

      const a = await fetch("https://druckfutzi.de/wp-json/druckfutzi/v1/auftraege", {
        headers: { Authorization: `Bearer ${data.token}` }
      })

      setAuftraege(await a.json())

    } catch {
      setError("Server nicht erreichbar")
    }

    setLoading(false)
  }

  function logout() {
    setFahrer(null)
    setView("dashboard")
  }

  /* ================= START ================= */

  async function startAuftrag(a: Auftrag) {

    if (!navigator.geolocation) return alert("GPS nicht verfügbar")

    navigator.geolocation.getCurrentPosition(async (pos) => {

      const dist = distance(
        pos.coords.latitude,
        pos.coords.longitude,
        a.start_lat,
        a.start_lng
      )

      let grund = ""

      if (dist > RADIUS_KM) {
        grund = prompt("Außerhalb 5km – Grund eingeben:") || ""
        if (!grund) return alert("Kein Grund angegeben.")
      }

      const res = await fetch("https://druckfutzi.de/wp-json/druckfutzi/v1/auftrag/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${fahrer?.token}`
        },
        body: JSON.stringify({
          auftrag_id: a.id,
          override_grund: grund
        })
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Start nicht möglich")
        return
      }
      const now = Date.now()
      setAktivAuftrag(a)
      setStartZeit(now)
      setIstPause(false)

      localStorage.setItem("startZeit", now.toString())
      localStorage.setItem("aktivAuftrag", JSON.stringify(a))
    })
  }

  async function pauseAuftrag() { setIstPause(true) }
  async function fortsetzenAuftrag() { setIstPause(false) }

  async function stopAuftrag() {
    if (!aktivAuftrag) return

    await fetch("https://druckfutzi.de/wp-json/druckfutzi/v1/auftrag/stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${fahrer?.token}`
      },
      body: JSON.stringify({ auftrag_id: aktivAuftrag.id })
    })

    setAktivAuftrag(null)
    setStartZeit(null)
    setIstPause(false)

    localStorage.removeItem("startZeit")
    localStorage.removeItem("aktivAuftrag")
  }

  /* ================= LOGIN VIEW ================= */

  if (!fahrer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6 text-black">Fahrer Login</h1>
          <input type="number" placeholder="Fahrer-ID"
            value={fahrerId}
            onChange={(e) => setFahrerId(e.target.value)}
            className="w-full mb-4 p-3 border rounded-lg text-black" />
          <input type="password" placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full mb-4 p-3 border rounded-lg text-black" />
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg">
            {loading ? "Prüfe..." : "Login"}
          </button>
        </div>
      </div>
    )
  }

  /* ================= KAPAZITÄT VIEW ================= */

  if (view === "kapazitaet") {

    const futureDate = new Date(Date.now() + weekIndex * 7 * 86400000)
    const kw = getISOWeek(futureDate)
    const jahr = futureDate.getFullYear()

    const monday = new Date(futureDate)
    monday.setDate(futureDate.getDate() - ((futureDate.getDay() + 6) % 7))

    const saturday = new Date(monday)
    saturday.setDate(monday.getDate() + 5)

    async function speichern() {
      await fetch("https://druckfutzi.de/wp-json/druckfutzi/v1/kapazitaet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${fahrer!.token}`
        },
        body: JSON.stringify({ kw, jahr, plan })
      })
      alert("Gespeichert ✔")
    }

    return (
      <div className="min-h-screen p-8 bg-gray-100">
        <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">

          <h2 className="text-xl font-bold mb-2">
            KW {kw} / {jahr}
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            {monday.toLocaleDateString("de-DE")} – {saturday.toLocaleDateString("de-DE")}
          </p>

          {Object.keys(plan).map((tag) => (
            <div key={tag} className="mb-4">
              <label className="block text-sm font-semibold mb-1">
                {tag.toUpperCase()}
              </label>

              <select
                value={plan[tag as keyof Plan] || ""}  // Zugriff auf das plan-Objekt mit dem richtigen Schlüssel
                onChange={(e) =>
                  setPlan({ ...plan, [tag as keyof Plan]: e.target.value })  // Typisiere den Schlüssel
                }
                className={`w-full p-2 border rounded ${farbe(plan[tag as keyof Plan])}`}
              >
                <option value="">Bitte wählen</option>
                <option value="Ganztag">Ganztag</option>
                <option value="Halbtags">Halbtags</option>
                <option value="Urlaub">Urlaub</option>
                <option value="Frei">Frei</option>
              </select>
            </div>
          ))}

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setWeekIndex((weekIndex + 3) % 4)}
              className="bg-gray-500 text-white px-3 py-2 rounded">
              Vorherige Woche
            </button>

            <button
              onClick={() => setWeekIndex((weekIndex + 1) % 4)}
              className="bg-gray-500 text-white px-3 py-2 rounded">
              Nächste Woche
            </button>
          </div>

          <button onClick={speichern}
            className="w-full bg-green-600 text-white py-3 mt-6 rounded-lg">
            Speichern
          </button>

          <button
            onClick={() => setView("dashboard")}
            className="w-full mt-4 text-blue-600">
            Zurück
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
            <h2 className="text-xl font-bold">Willkommen {fahrer.name}</h2>
            <p className="text-sm text-gray-600">Typ: {fahrer.typ}</p>
            <p className="text-sm text-gray-600">
              Geleistete Stunden: {fahrer.stunden} h
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView("kapazitaet")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg">
              Verfügbarkeit
            </button>

            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg">
              Logout
            </button>
          </div>
        </div>

        {aktivAuftrag && (
          <div className="bg-green-100 p-4 mb-6 rounded-xl">
            <p><strong>Aktiver Auftrag:</strong> {aktivAuftrag.titel}</p>

            {!istPause && (
              <p>Laufzeit: {Math.floor(laufzeit / 60)} Minuten</p>
            )}

            {istPause && (
              <p className="text-red-600 font-semibold">⏸ Pause läuft</p>
            )}

            <div className="flex gap-2 mt-3">
              {!istPause &&
                <button onClick={pauseAuftrag}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg">
                  Pause
                </button>
              }

              {istPause &&
                <button onClick={fortsetzenAuftrag}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                  Fortsetzen
                </button>
              }

              <button onClick={stopAuftrag}
                className="bg-red-600 text-white px-4 py-2 rounded-lg">
                Stoppen
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold mb-4">Meine Aufträge</h3>
          {auftraege.map(a => (
            <div key={a.id} className="border p-3 mb-3 rounded-lg">
              <p><strong>{a.titel}</strong></p>
              <p>{a.datum}</p>
              {!aktivAuftrag &&
                <button
                  onClick={() => startAuftrag(a)}
                  className="bg-blue-600 text-white px-4 py-2 mt-2 rounded-lg">
                  Auftrag starten
                </button>
              }
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}