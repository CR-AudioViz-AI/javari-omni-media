import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Javari Omni-Media | Your Complete Media Universe',
  description: 'One app. All media. Unlimited devices. Cloud storage optimization, unified streaming, DVR, and AI-powered organization.',
  keywords: ['media management', 'cloud storage', 'streaming', 'DVR', 'AI organization'],
  authors: [{ name: 'CR AudioViz AI, LLC' }],
  openGraph: {
    title: 'Javari Omni-Media',
    description: 'The Universal Operating System for Your Digital Life',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
