import Link from 'next/link'
import Image from 'next/image'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-amber-50/30 to-rose-50/40">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0f172a 1px, transparent 1px),
            linear-gradient(to bottom, #0f172a 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Decorative circles */}
      <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-rose-200/20 blur-3xl" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <Link
          href="/"
          className="mb-12 flex items-center gap-3 text-slate-700 transition hover:text-amber-600"
        >
          <Image
            src="/logo.png"
            alt="IHSB Events"
            width={40}
            height={40}
            className="rounded-lg object-contain"
          />
          <span className="text-lg font-semibold">IHSB Events</span>
        </Link>

        <div className="flex flex-col items-center text-center">
          {/* 404 typography */}
          <div className="relative">
            <span
              className="block text-[clamp(8rem,25vw,14rem)] font-bold leading-none tracking-tighter text-slate-200/90"
              aria-hidden
            >
              404
            </span>
            <span className="sr-only">404</span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold text-slate-800 sm:text-3xl">
            Page not found
          </h1>
          <p className="mt-2 max-w-sm text-slate-600">
            This event or page has moved, ended, or doesn&apos;t exist. Let&apos;s get you back on track.
          </p>

          <Link
            href="/"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 hover:shadow-amber-500/30"
          >
            <Home className="h-4 w-4" aria-hidden />
            Back to events
          </Link>
        </div>

        {/* Bottom accent */}
        <div className="mt-16 flex items-center gap-2 text-sm text-slate-500">
          <span className="h-px w-8 bg-slate-300" aria-hidden />
          <span>Lost? You&apos;re in good company.</span>
          <span className="h-px w-8 bg-slate-300" aria-hidden />
        </div>
      </div>
    </div>
  )
}
