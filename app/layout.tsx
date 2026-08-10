import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EventDazzle — Events, Concerts & Tickets Near You',
  description:
    'Discover and book concerts, comedy, sports and festivals near you. Front, middle and back zone tickets in one place.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
