import Link from 'next/link'
import Image from 'next/image'

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-indigo-100 bg-white/95 shadow-sm shadow-indigo-100/30 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-1 py-1 text-lg font-semibold text-slate-900 transition hover:bg-indigo-50 hover:text-indigo-700"
        >
          <Image src="/logo.png" alt="IHSB Events" width={36} height={36} className="rounded-lg object-contain ring-2 ring-indigo-100" />
          IHSB Events
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
          >
            Events
          </Link>
        </nav>
      </div>
    </header>
  )
}
