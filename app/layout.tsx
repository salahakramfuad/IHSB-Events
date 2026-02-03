import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'IHSB Events',
  description: 'IHSB Event Management - Register for events',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased flex min-h-screen flex-col`}>
        <div className="flex-1">{children}</div>
        <footer className="mt-auto border-t border-slate-200/60 bg-slate-50/50 py-3">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <Link
              href="https://github.com/salahakramfuad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 transition hover:text-amber-600"
            >
              Developed by Mohammad Salah
            </Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
