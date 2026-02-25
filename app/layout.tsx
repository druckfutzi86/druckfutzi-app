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
          <header className="border-b border-slate-700">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              
              <h1 className="text-lg font-semibold tracking-wide">
                Druckfutzi
              </h1>

              <span className="text-sm text-slate-400">
                Fahrer App
              </span>

            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <div className="max-w-6xl mx-auto px-6 py-10">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-700">
            <div className="max-w-6xl mx-auto px-6 py-4 text-sm text-slate-400 flex justify-between">
              <span>© {new Date().getFullYear()} Druckfutzi</span>
              <span>Enterprise System</span>
            </div>
          </footer>

        </div>

      </body>
    </html>
  )
}