import NearbyEvents from '@/components/shared/NearbyEvents'
import RequireAuth from '@/components/shared/RequireAuth'

export default function EventsPage() {
  return (
    <RequireAuth>
      <section className="border-b border-surface-line bg-ink py-10 text-white">
        <div className="wrapper">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-200">
            Explore
          </p>
          <h3 className="h3-bold">Events near you</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/65">
            Live events from Ticketmaster & Bushdrum. Browse infinitely, pick zones, and stack your night with Event Trail follow-ups.
          </p>
        </div>
      </section>

      <section className="wrapper my-8">
        <NearbyEvents />
      </section>
    </RequireAuth>
  )
}
