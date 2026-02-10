export const metadata = {
  title: 'ARARA',
  description: 'ARARA - Gestão de Chamados Internos',
}

import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
