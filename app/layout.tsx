import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Druckfutzi App",
  description: "Fahrer Dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
     <body className="min-h-screen bg-[#0F172A] text-white antialiased">
        <div className="min-h-screen flex flex-col">

          {/* Header */}
          <header className="bg-[#0F172A]-800 border-b border-[#0F172A]-700">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center font-bold text-slate-900">
                  D
                </div>
                <h1 className="text-lg font-semibold tracking-wide">
                  Druckfutzi
                </h1>
              </div>

              <div className="text-sm text-black-400">
                Fahrer App
              </div>

            </div>
          </header>

          {/* Main */}
          <main className="flex-1">
            <div className="max-w-6xl mx-auto px-6 py-10">
              <div className="bg-[#0F172A]-800 rounded-2xl shadow-xl border border-[#0F172A]-700 p-8">
                {children}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-[#0F172A]-800 border-t border-[#0F172A]-700">
            <div className="max-w-6xl mx-auto px-6 py-4 text-sm text-slate-500 flex justify-between">
              <span>© {new Date().getFullYear()} Druckfutzi</span>
              <span className="text-slate-600">Enterprise System</span>
            </div>
          </footer>

        </div>

      </body>
    </html>
  )
}