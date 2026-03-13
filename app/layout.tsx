import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TEKE',
  description: 'Track your training journey',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}