export const metadata = {
  title: "Druckfutzi App",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="bg-#0F172A-100 min-h-screen">
        <div className="pb-20">{children}</div>
      </body>
    </html>
  );
}