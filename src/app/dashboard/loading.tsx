/** Route-level loading UI for dashboard segments (dark shimmer). */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-12 pt-24">
      <div className="mb-8 h-8 w-40 animate-pulse rounded-lg bg-white/[0.08]" />
      <div className="space-y-3">
        <div className="h-36 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="h-36 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="h-28 animate-pulse rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}
