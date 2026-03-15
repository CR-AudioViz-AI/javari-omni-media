// app/layout.tsx — Javari Omni-Media
// PWA support: manifest, theme color, SW registration, fullscreen launch
// Date: March 13, 2026 | Henderson Standard

import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Javari — Your Entertainment Universe',
  description: 'Movies, live TV, music, sports — from every service you own. One beautiful app.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Javari',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#0E0B14',
    'msapplication-tap-highlight': 'no',
  },
}

export const viewport: Viewport = {
  themeColor: '#C084FC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <meta name="apple-mobile-web-app-title" content="Javari" />
        {/* TV / large display hints */}
        <meta name="screen-orientation" content="any" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Register service worker for PWA
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    // Check for updates every 60 seconds
                    setInterval(() => reg.update(), 60000)
                  }).catch(function() {
                    // SW registration failed — app still works
                  })
                })
              }

              // Handle PWA install prompt
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault()
                window.__pwaPrompt = e
              })

              // Restore scroll on nav
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual'
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
