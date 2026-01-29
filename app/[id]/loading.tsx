import PublicHeader from '@/components/PublicHeader'

export default function EventDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 h-5 w-24 rounded bg-slate-200 animate-pulse" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-10 w-3/4 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-5 w-full rounded bg-slate-200 animate-pulse" />
            <div className="aspect-video rounded-2xl bg-slate-200 animate-pulse" />
          </div>
          <div className="h-96 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
      </main>
    </div>
  )
}
