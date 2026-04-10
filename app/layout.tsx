import type { Metadata } from 'next'
import './globals.css'
import { SyncStore } from '@/components/SyncStore'

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.location.hostname.endsWith('.')) {
                const newUrl = new URL(window.location.href);
                newUrl.hostname = newUrl.hostname.replace(/\\.+$/, '');
                window.location.replace(newUrl.toString());
              }
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  )
}