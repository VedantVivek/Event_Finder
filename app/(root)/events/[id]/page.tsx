'use client'

import EventImage from '@/components/shared/EventImage'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import EventTrail from '@/components/shared/EventTrail'
import EventNearby from '@/components/shared/EventNearby'
import RequireAuth from '@/components/shared/RequireAuth'
import { Button } from '@/components/ui/button'
import { getCreatedEventById } from '@/lib/createdEvents'
import {
  EventInventory,
  TicketTier,
  TicketTierId,
  getEventInventory,
  getInventorySummary,
  getTierLeft,
  savePendingBooking,
} from '@/lib/tickets'
import { AppEvent } from '@/lib/ticketmaster'

export default function EventDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<AppEvent | null>(null)
  const [inventory, setInventory] = useState<EventInventory | null>(null)
  const [selectedTier, setSelectedTier] = useState<TicketTierId>('middle')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = decodeURIComponent(params.id)

    const load = async () => {
      setLoading(true)
      setError('')

      let loaded: AppEvent | null = null

      if (id.startsWith('created_')) {
        loaded = getCreatedEventById(id)
        if (!loaded) setError('Event not found')
      } else {
        try {
          const res = await fetch(`/api/events/${encodeURIComponent(id)}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Event not found')
          loaded = data.event as AppEvent
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Event not found')
        }
      }

      if (loaded) {
        setEvent(loaded)
        const inv = getEventInventory(loaded._id, {
          price: loaded.price,
          isFree: loaded.isFree,
        })
        setInventory(inv)
      } else {
        setEvent(null)
      }
      setLoading(false)
    }

    load()
  }, [params.id])

  const selected = useMemo(
    () => inventory?.tiers.find((t) => t.id === selectedTier) || null,
    [inventory, selectedTier]
  )

  const summary = inventory ? getInventorySummary(inventory) : null

  const bookNow = () => {
    if (!event || !selected) return
    const left = getTierLeft(selected)
    if (left < 1) {
      setError('This zone is sold out')
      return
    }
    if (quantity > left) {
      setError(`Only ${left} tickets left in ${selected.name}`)
      return
    }

    savePendingBooking({
      eventId: event._id,
      tierId: selected.id,
      quantity,
      price: selected.price,
      tierName: selected.name,
    })
    router.push(`/events/${encodeURIComponent(event._id)}/checkout`)
  }

  return (
    <RequireAuth>
      {loading ? (
        <section className="wrapper my-16">
          <p className="p-medium-16">Loading event details...</p>
        </section>
      ) : error && !event ? (
        <section className="wrapper my-16">
          <p className="p-medium-16 text-red-500">{error}</p>
          <Link href="/events" className="mt-4 inline-block text-primary-500">
            Back to events
          </Link>
        </section>
      ) : event && inventory && summary && selected ? (
        <section className="bg-surface-soft pb-16 pt-6">
          <div className="wrapper grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-3xl border border-surface-line bg-white shadow-sm">
              <div className="relative min-h-[280px] md:min-h-[420px]">
                <EventImage
                  src={event.imageUrl}
                  category={event.category?.name}
                  title={event.title}
                  alt={event.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              </div>
              <div className="space-y-5 p-6 md:p-8">
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary-500">
                    {event.category?.name || 'Event'}
                  </p>
                  <h1 className="h2-bold mb-3">{event.title}</h1>
                  <p className="p-regular-16 text-grey-600">{event.description}</p>
                </div>

                {event.vibeTags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {event.vibeTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="grid gap-4 rounded-2xl bg-grey-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-grey-400">Date & time</p>
                    <p className="p-medium-16">
                      {new Date(event.startDateTime).toLocaleString('en-IN', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-grey-400">Venue</p>
                    <p className="p-medium-16">{event.location}</p>
                    {event.city ? (
                      <p className="text-sm text-grey-500">
                        {event.city}
                        {event.country ? `, ${event.country}` : ''}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-surface-line p-5">
                  <h2 className="mb-3 text-lg font-semibold">Ticket availability</h2>
                  <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-primary-50 p-3">
                      <p className="text-xs text-grey-500">Total</p>
                      <p className="text-xl font-bold">{summary.total}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="text-xs text-grey-500">Booked</p>
                      <p className="text-xl font-bold text-amber-700">{summary.booked}</p>
                    </div>
                    <div className="rounded-xl bg-green-50 p-3">
                      <p className="text-xs text-grey-500">Left</p>
                      <p className="text-xl font-bold text-green-700">{summary.left}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {inventory.tiers.map((tier: TicketTier) => {
                      const left = getTierLeft(tier)
                      const active = selectedTier === tier.id
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => {
                            setSelectedTier(tier.id)
                            setQuantity(1)
                            setError('')
                          }}
                          className={`flex w-full items-start justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                            active
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-surface-line bg-white hover:border-primary-500/40'
                          }`}
                        >
                          <div>
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{tier.name}</p>
                              <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                                {tier.label}
                              </span>
                            </div>
                            <p className="text-sm text-grey-500">{tier.description}</p>
                            <p className="mt-2 text-sm">
                              <span className="font-medium text-amber-700">{tier.booked} booked</span>
                              {' · '}
                              <span className="font-medium text-green-700">{left} left</span>
                              {' · '}
                              <span className="text-grey-500">{tier.total} total</span>
                            </p>
                          </div>
                          <p className="shrink-0 text-lg font-bold">
                            {tier.price === 0 ? 'FREE' : `₹${tier.price}`}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <EventNearby
                  eventId={event._id}
                  location={event.location}
                  city={event.city}
                  country={event.country}
                  lat={event.lat}
                  lng={event.lng}
                />

                <EventTrail
                  eventId={event._id}
                  city={event.city}
                  countryCode={event.countryCode || event.country}
                />
              </div>
            </div>

            <div className="h-fit rounded-3xl border border-surface-line bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <p className="mb-1 text-sm text-grey-500">Selected zone</p>
              <h2 className="mb-1 text-2xl font-bold">{selected.name}</h2>
              <p className="mb-4 text-sm text-grey-500">{selected.description}</p>
              <p className="mb-6 text-3xl font-bold text-primary-500">
                {selected.price === 0 ? 'FREE' : `₹${selected.price}`}
                <span className="ml-2 text-sm font-medium text-grey-500">/ ticket</span>
              </p>

              <label className="mb-4 flex flex-col gap-2">
                <span className="text-sm font-medium">Quantity</span>
                <select
                  className="select-field"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                >
                  {Array.from({ length: Math.min(6, Math.max(1, getTierLeft(selected))) }, (_, i) => i + 1).map(
                    (n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-grey-500">Payable now</span>
                <span className="text-lg font-bold">
                  {selected.price === 0 ? 'FREE' : `₹${selected.price * quantity}`}
                </span>
              </div>

              {error ? <p className="mb-3 text-sm text-red-500">{error}</p> : null}

              <Button
                size="lg"
                className="button w-full"
                onClick={bookNow}
                disabled={getTierLeft(selected) < 1}
              >
                {getTierLeft(selected) < 1 ? 'Sold out' : 'Continue to Checkout'}
              </Button>

              <p className="mt-4 text-center text-xs text-grey-400">
                Front = costly · Middle = mid · Back = budget
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </RequireAuth>
  )
}
