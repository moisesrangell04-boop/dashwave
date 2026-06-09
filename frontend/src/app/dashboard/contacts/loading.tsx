export default function ContactsLoading() {
  return (
    <div className="flex flex-col gap-4 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-9 w-64 rounded-lg bg-muted" />
        <div className="h-9 w-32 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border px-4 py-3">
          {[120, 100, 80, 80, 60].map((w, i) => (
            <div key={i} className="h-3 rounded bg-muted" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0">
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            <div className="h-3 w-36 rounded bg-muted" />
            <div className="h-3 w-44 rounded bg-muted ml-4" />
            <div className="h-3 w-28 rounded bg-muted ml-4" />
            <div className="ml-auto h-5 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-8 rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
