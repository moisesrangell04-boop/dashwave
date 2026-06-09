export default function LeadsLoading() {
  return (
    <div className="flex h-full animate-pulse gap-4 overflow-x-auto p-6">
      {Array.from({ length: 5 }).map((_, col) => (
        <div key={col} className="flex w-72 shrink-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-5 w-8 rounded-full bg-muted" />
          </div>
          {Array.from({ length: col === 0 ? 4 : col === 1 ? 3 : 2 }).map((_, card) => (
            <div key={card} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="h-3.5 w-36 rounded bg-muted" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-5 w-20 rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
