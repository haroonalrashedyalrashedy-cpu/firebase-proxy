import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Sarrfa App',
  description: 'App',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar">
      <body>{children}</body>
    </html>
  )
}
