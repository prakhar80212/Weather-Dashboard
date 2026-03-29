export function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="skeleton h-3 w-16 mb-3" />
      <div className="skeleton h-8 w-24 mb-2" />
      <div className="skeleton h-2 w-12" />
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="skeleton h-4 w-32" />
      </div>
      <div className="p-5">
        <div className="skeleton h-48 w-full" />
      </div>
    </div>
  )
}

export function LoadingState({ count = 8 }) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonChart key={i} />
        ))}
      </div>
    </>
  )
}
