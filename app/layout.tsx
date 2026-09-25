import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed } from 'next/font/google'
import './globals.css'

const displayFont = Barlow_Condensed({ subsets: ['latin'], weight: ['700', '800', '900'], variable: '--font-display', display: 'swap' })

export const metadata: Metadata = {
  title: 'FLOODLIGHT — The beautiful game. Under the lights.',
  description: 'Play immersive 3D five-a-side football in your browser. A floodlit stadium, intelligent opponents, cinematic replays, and keyboard or touch controls.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#101615',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
