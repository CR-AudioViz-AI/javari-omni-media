import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Javari — Your Complete Media Universe',
  description: 'The most beautiful, complete media platform ever built. Live TV, movies, music, family, wellness — all in one place.',
  keywords: 'streaming, live TV, media platform, family entertainment, wellness',
  openGraph: {
    title: 'Javari Omni-Media',
    description: 'Your complete media universe',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
