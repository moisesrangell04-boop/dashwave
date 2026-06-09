export default function ConversationsLoading() {
  return (
    <div className="flex h-full animate-pulse overflow-hidden">
      {/* Conversation list */}
      <div className="w-80 shrink-0 border-r border-border bg-card">
        <div className="border-b border-border p-3">
          <div className="h-9 w-full rounded-lg bg-muted" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="flex justify-between">
                  <div className="h-3 w-28 rounded bg-muted" />
                  <div className="h-2.5 w-10 rounded bg-muted" />
                </div>
                <div className="h-2.5 w-36 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Message area */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border bg-card p-4">
          <div className="h-9 w-9 rounded-full bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-muted" />
            <div className="h-2.5 w-20 rounded bg-muted" />
          </div>
        </div>
        <div className="flex-1 space-y-4 p-4">
          {[false, true, false, false, true].map((right, i) => (
            <div key={i} className={`flex ${right ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`h-10 rounded-2xl bg-muted ${right ? 'w-52' : 'w-64'}`}
              />
            </div>
          ))}
        </div>
        <div className="border-t border-border bg-card p-3">
          <div className="h-10 w-full rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
