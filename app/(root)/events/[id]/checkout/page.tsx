'use client'

import EventImage from '@/components/shared/EventImage'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import RequireAuth from '@/components/shared/RequireAuth'
import { getCreatedEventById } from '@/lib/createdEvents'
import { getEventImage } from '@/lib/eventImages'
import { readPendingBooking, savePendingBooking } from '@/lib/tickets'
import { AppEvent } from '@/lib/ticketmaster'

export default function CheckoutPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<AppEvent | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(readPendingBooking())

  useEffect(() => {
    const id = decodeURIComponent(params.id)
    const booking = readPendingBooking()
    setPending(booking)

    const load = async () => {
      setLoading(true)
      setError('')

      if (id.startsWith('created_')) {
        const created = getCreatedEventById(id)
        if (!created) {
          setError('Event not found')
          setEvent(null)
        } else {
          setEvent(created)
        }
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/events/${encodeURIComponent(id)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Event not found')
        const loaded = data.event as AppEvent
        setEvent({
          ...loaded,
          imageUrl: getEventImage(loaded.category?.name, loaded.imageUrl, loaded.title),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Event not found')
        setEvent(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [params.id])

  if (loading) {
    return (
      <RequireAuth>
        <section className="wrapper my-16">
          <p className="p-medium-16">Loading checkout...</p>
        </section>
      </RequireAuth>
    )
  }

  if (error || !event) {
    return (
      <RequireAuth>
        <section className="wrapper my-16">
          <p className="p-medium-16 text-red-500">{error || 'Event not found'}</p>
          <Link href="/events" className="mt-4 inline-block text-primary-500">
            Back to events
          </Link>
        </section>
      </RequireAuth>
    )
  }

  if (!pending || pending.eventId !== event._id) {
    return (
      <RequireAuth>
        <section className="wrapper my-16 max-w-xl text-center">
          <h2 className="h3-bold mb-3">Select tickets first</h2>
          <p className="mb-6 text-grey-600">
            Choose Front / Middle / Back tickets on the event page before checkout.
          </p>
          <Button asChild className="button">
            <Link href={`/events/${event._id}`}>Back to event</Link>
          </Button>
        </section>
      </RequireAuth>
    )
  }

  const total = pending.price * pending.quantity

  return (
    <RequireAuth>
      <section className="wrapper my-8 grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-surface-line bg-white shadow-sm">
          <div className="relative h-64 w-full">
            <EventImage
              src={event.imageUrl}
              category={event.category?.name}
              title={event.title}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col gap-3 p-6">
            <h2 className="h3-bold">{event.title}</h2>
            <p className="p-regular-16 text-grey-600">{event.location}</p>
            <p className="p-medium-16">
              {new Date(event.startDateTime).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-surface-line bg-white p-6 md:p-8">
          <h3 className="h3-bold mb-6">Checkout</h3>

          <div className="mb-6 space-y-3 rounded-2xl bg-grey-50 p-4">
            <div className="flex-between text-sm">
              <span>Zone</span>
              <span className="font-semibold">{pending.tierName}</span>
            </div>
            <div className="flex-between text-sm">
              <span>Tickets</span>
              <span className="font-semibold">{pending.quantity}</span>
            </div>
            <div className="flex-between text-sm">
              <span>Price / ticket</span>
              <span className="font-semibold">{pending.price === 0 ? 'FREE' : `₹${pending.price}`}</span>
            </div>
            <div className="flex-between border-t border-surface-line pt-3 text-base font-bold">
              <span>Total</span>
              <span className="text-primary-500">{total === 0 ? 'FREE' : `₹${total}`}</span>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="p-medium-14 text-grey-600">Full name</span>
              <input className="input-field" defaultValue="Demo User" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="p-medium-14 text-grey-600">Email</span>
              <input className="input-field" type="email" defaultValue="demo@eventdazzle.com" />
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="button w-full"
              onClick={() => {
                savePendingBooking(pending)
                router.push(`/events/${event._id}/payment`)
              }}
            >
              Continue to Payment
            </Button>
            <Button asChild size="lg" variant="outline" className="button w-full">
              <Link href={`/events/${event._id}`}>Change tickets</Link>
            </Button>
          </div>
        </div>
      </section>
    </RequireAuth>
  )
}
