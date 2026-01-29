import Link from 'next/link'
import Image from 'next/image'

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-lg font-semibold text-slate-900 transition hover:text-indigo-600"
        >
          <Image src="/logo.png" alt="IHSB Events" width={36} height={36} className="rounded-lg object-contain" />
          IHSB Events
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Events
          </Link>
        </nav>
      </div>
    </header>
  )
}
