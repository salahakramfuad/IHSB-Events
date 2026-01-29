export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-48 rounded-lg bg-slate-200 animate-pulse" />
      <div className="grid gap-5 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
