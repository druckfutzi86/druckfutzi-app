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

  mo_notiz: string
  di_notiz: string
  mi_notiz: string
  do_notiz: string
  fr_notiz: string
  sa_notiz: string
  so_notiz: string
}
const emptyPlan = {
  mo: "", di: "", mi: "", do: "", fr: "", sa: "", so: "",
  mo_notiz: "", di_notiz: "", mi_notiz: "", do_notiz: "",
  fr_notiz: "", sa_notiz: "", so_notiz: ""
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

  
const emptyPlan: Plan = {
  mo: "",
  di: "",
  mi: "",
  do: "",
  fr: "",
  sa: "",
  so: "",

  mo_notiz: "",
  di_notiz: "",
  mi_notiz: "",
  do_notiz: "",
  fr_notiz: "",
  sa_notiz: "",
  so_notiz: ""
}

const [plan, setPlan] = useState<Plan>(emptyPlan)

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
          `https://druckfutzi.de/wp-json/druckfutzi/v1/verfuegbarkeit?kw=${kw}&jahr=${jahr}`,
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
          setPlan(emptyPlan);
        }
      } catch (error) {
        console.error("Fehler bei der Kapazitätsabfrage:", error);
        setPlan(emptyPlan);
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

 
  /* ================= START / PAUSE / STOP (API VERSION) ================= */

async function startAuftrag(a: Auftrag) {
  if (!navigator.geolocation) {
    alert("GPS nicht verfügbar");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const dist = distance(
      pos.coords.latitude,
      pos.coords.longitude,
      a.start_lat,
      a.start_lng
    );

    let grund = "";

    if (dist > RADIUS_KM) {
      grund = prompt("Außerhalb 5km – Grund eingeben:") || "";
      if (!grund) {
        alert("Kein Grund angegeben.");
        return;
      }
    }

    try {
      const res = await fetch(
        "https://druckfutzi.de/wp-json/druckfutzi/v1/auftrag/starten",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${fahrer?.token}`,
          },
          body: JSON.stringify({
            auftrag_id: a.id,
            override_grund: grund,
          }),
        }
      );

      const data = await res.json(); // Antwort der API

      if (!res.ok) {
        console.error("Fehler bei der API-Antwort:", data); // Zeige die genaue Fehlermeldung an
        alert(data.error || "Start nicht möglich");
        return;
      }

      const now = Date.now();

      setAktivAuftrag(a);
      setStartZeit(now);
      setIstPause(false);
      setLaufzeit(0);

      localStorage.setItem("startZeit", now.toString());
      localStorage.setItem("aktivAuftrag", JSON.stringify(a));
    } catch (err) {
      console.error("Serverfehler beim Starten:", err); // Fehler ausgeben, wenn der API-Aufruf scheitert
      alert("Serverfehler beim Starten");
    }
  });
}
/* ================= PAUSE ================= */

async function pauseAuftrag() {

  if (!aktivAuftrag) return

  try {
    const res = await fetch(
      "https://druckfutzi.de/wp-json/druckfutzi/v1/auftrag/pausieren",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${fahrer?.token}`
        },
        body: JSON.stringify({
          auftrag_id: aktivAuftrag.id
        })
      }
    )

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || "Pause nicht möglich")
      return
    }

    setIstPause(true)

  } catch {
    alert("Serverfehler bei Pause")
  }
}

/* ================= FORTSETZEN ================= */

async function fortsetzenAuftrag() {

  if (!aktivAuftrag) return

  try {
    const res = await fetch(
      "https://druckfutzi.de/wp-json/druckfutzi/v1/auftrag/fortsetzen",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${fahrer?.token}`
        },
        body: JSON.stringify({
          auftrag_id: aktivAuftrag.id
        })
      }
    )

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || "Fortsetzen nicht möglich")
      return
    }

    setIstPause(false)

  } catch {
    alert("Serverfehler beim Fortsetzen")
  }
}

/* ================= STOP ================= */

async function stopAuftrag() {

  if (!aktivAuftrag) return

  try {
    const res = await fetch(
      "https://druckfutzi.de/wp-json/druckfutzi/v1/auftrag/beenden",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${fahrer?.token}`
        },
        body: JSON.stringify({
          auftrag_id: aktivAuftrag.id
        })
      }
    )

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || "Stop nicht möglich")
      return
    }

    setAktivAuftrag(null)
    setStartZeit(null)
    setIstPause(false)
    setLaufzeit(0)

    localStorage.removeItem("startZeit")
    localStorage.removeItem("aktivAuftrag")

  } catch {
    alert("Serverfehler beim Beenden")
  }
}

  /* ================= LOGIN VIEW ================= */

  if (!fahrer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="bg-[#0F172A] p-8 rounded-xl shadow w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6 text-white">Fahrer Login</h1>
          <input type="number" placeholder="Fahrer-ID"
            value={fahrerId}
            onChange={(e) => setFahrerId(e.target.value)}
            className="w-full mb-4 p-3 border rounded-lg text-white" />
          <input type="password" placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full mb-4 p-3 border rounded-lg text-white" />
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button onClick={login}
            disabled={loading}
            className="w-full bg-[#0F172A] text-white py-3 rounded-lg">
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
    await fetch("https://druckfutzi.de/wp-json/druckfutzi/v1/verfuegbarkeit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${fahrer!.token}`
      },
      body: JSON.stringify({ kw, jahr, plan })
    })
    alert("Gespeichert ✔")
  }

  const tage = [
    { key: "mo", label: "Montag" },
    { key: "di", label: "Dienstag" },
    { key: "mi", label: "Mittwoch" },
    { key: "do", label: "Donnerstag" },
    { key: "fr", label: "Freitag" },
    { key: "sa", label: "Samstag" },
    { key: "so", label: "Sonntag" },
  ]

  return (
    <div className="min-h-screen p-8 bg-[#0F172A] text-white">
      <div className="max-w-2xl mx-auto bg-[#0F172A] p-8 rounded-2xl shadow-xl border border-[#0F172A]">

        <h2 className="text-2xl font-bold mb-2">
          KW {kw} / {jahr}
        </h2>

        <p className="text-slate-400 mb-8">
          {monday.toLocaleDateString("de-DE")} – {saturday.toLocaleDateString("de-DE")}
        </p>

        {tage.map((tag) => (
          <div key={tag.key} className="mb-6">

            <label className="block font-semibold mb-2">
              {tag.label}
            </label>

            <div className="flex flex-col md:flex-row gap-4">

              {/* Dropdown */}
              <select
                value={plan[tag.key as keyof Plan] as string}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    [tag.key]: e.target.value
                  })
                }
                className="w-full md:w-1/2 p-3 rounded-lg bg-[#0F172A] border border-[#0F172A] text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Bitte wählen</option>
                <option value="Ganztag">Ganztag</option>
                <option value="Vormittag">Vormittag</option>
                <option value="Nachmittag">Nachmittag</option>
                <option value="Urlaub">Urlaub</option>
                <option value="Frei">Frei</option>
              </select>

              {/* Notizfeld */}
              <input
                type="text"
                placeholder="Notiz eingeben..."
                value={plan[`${tag.key}_notiz` as keyof Plan] as string}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    [`${tag.key}_notiz`]: e.target.value
                  })
                }
                className="w-full md:w-1/2 p-3 rounded-lg bg-[#0F172A] border border-[#0F172A] text-white placeholder-[#0F172A] focus:outline-none focus:ring-2 focus:ring-green-500"
              />

            </div>
          </div>
        ))}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setWeekIndex(weekIndex - 1)}
            className="bg-pink-600 hover:bg-[#0F172A] px-4 py-2 rounded-lg"
          >
            ← Vorherige Woche
          </button>

          <button
            onClick={() => setWeekIndex(weekIndex + 1)}
            className="bg-pink-600 hover:bg-slate-500 px-4 py-2 rounded-lg"
          >
            Nächste Woche →
          </button>
        </div>

        <button
          onClick={speichern}
          className="w-full bg-green-600 hover:bg-green-500 py-3 mt-8 rounded-xl font-semibold"
        >
          Speichern
        </button>

        <button
          onClick={() => setView("dashboard")}
          className="block mx-auto w-50 bg-red-600 hover:bg-green-500 py-3 mt-8 rounded-xl font-semibold"
        >
          Zurück
        </button>

      </div>
    </div>
  )
}

  /* ================= DASHBOARD ================= */

  return (
    <div className="min-h-screen p-8 bg-[#0F172A]">
      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold">Willkommen {fahrer.name}</h2>
            <p className="text-sm text-white">Typ: {fahrer.typ}</p>
            <p className="text-sm text-white">
              Geleistete Stunden: {fahrer.stunden} h
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView("kapazitaet")}
              className="bg-green-600 text-white px-2 py-2 rounded-lg">
              Verfügbarkeit
            </button>

            <button
              onClick={logout}
              className="bg-red-500 text-white px-2 py-2 rounded-lg">
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
                  className="bg-slate-600 text-white px-4 py-2 rounded-lg">
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

        <div className="bg-red p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold mb-4">Meine Aufträge</h3>
          {auftraege.map(a => (
            <div key={a.id} className="border p-3 mb-3 rounded-lg bg-blue-200 text-white">
  <p><strong>{a.titel}</strong></p>
  <p>{a.datum}</p>
  {!aktivAuftrag && (
    <button
      onClick={() => startAuftrag(a)}
      className="bg-slate-600 text-white px-4 py-2 mt-2 rounded-lg">
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

            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center font-bold text-slate-900">
                  D
                </div>
                <h1 className="text-lg font-semibold tracking-wide">
                  Druckfutzi
                </h1>
              </div>

              <div className="text-sm text-slate-400">
                Fahrer App
              </div>

            </div>