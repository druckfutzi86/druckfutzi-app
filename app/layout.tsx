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
      <body className="min-h-screen bg-gray-100 text-gray-900 antialiased">
        
        <div className="min-h-screen flex flex-col">
          
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <h1 className="text-xl font-bold">
                Druckfutzi
              </h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <div className="max-w-6xl mx-auto px-6 py-8">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t">
            <div className="max-w-6xl mx-auto px-6 py-4 text-sm text-gray-500">
              © {new Date().getFullYear()} Druckfutzi
            </div>
          </footer>

        </div>

      </body>
    </html>
  )
}


