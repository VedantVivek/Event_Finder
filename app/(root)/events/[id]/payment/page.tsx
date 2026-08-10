'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import RequireAuth from '@/components/shared/RequireAuth'
import UpiQrPayment from '@/components/shared/UpiQrPayment'
import { getCreatedEventById } from '@/lib/createdEvents'
import { readPendingBooking } from '@/lib/tickets'
import { AppEvent } from '@/lib/ticketmaster'

type PayMethod = 'stripe' | 'upi'

export default function PaymentPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<AppEvent | null>(null)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [method, setMethod] = useState<PayMethod>('upi')

  useEffect(() => {
    const id = decodeURIComponent(params.id)

    const load = async () => {
      if (id.startsWith('created_')) {
        const created = getCreatedEventById(id)
        if (!created) setError('Event not found')
        else setEvent(created)
        return
      }

      try {
        const res = await fetch(`/api/events/${encodeURIComponent(id)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Event not found')
        setEvent(data.event)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event')
      }
    }

    load()
  }, [params.id])

  const booking = readPendingBooking()

  if (error) {
    return (
      <RequireAuth>
        <section className="wrapper my-10">
          <p className="p-regular-16 text-red-500">{error}</p>
          <Button asChild className="button mt-4">
            <Link href="/events">Back to Events</Link>
          </Button>
        </section>
      </RequireAuth>
    )
  }

  if (!event) {
    return (
      <RequireAuth>
        <section className="wrapper my-10">
          <p className="p-medium-16">Loading payment...</p>
        </section>
      </RequireAuth>
    )
  }

  if (!booking || booking.eventId !== event._id) {
    return (
      <RequireAuth>
        <section className="wrapper my-10 max-w-xl text-center">
          <h2 className="h3-bold mb-3">No tickets selected</h2>
          <Button asChild className="button">
            <Link href={`/events/${event._id}`}>Choose tickets</Link>
          </Button>
        </section>
      </RequireAuth>
    )
  }

  const amount = booking.price * booking.quantity

  const goSuccess = (opts: { method: string; utr?: string }) => {
    const qs = new URLSearchParams({
      tier: booking.tierName,
      qty: String(booking.quantity),
      amount: String(amount),
      method: opts.method,
    })
    if (opts.utr) qs.set('utr', opts.utr)
    router.push(`/events/${event._id}/success?${qs.toString()}`)
  }

  const onStripePay = async () => {
    setError('')
    setPaying(true)

    try {
      if (amount === 0) {
        const { bookTickets, clearPendingBooking } = await import('@/lib/tickets')
        bookTickets(event._id, booking.tierId, booking.quantity)
        clearPendingBooking()
        goSuccess({ method: 'free' })
        return
      }

      const userRaw = localStorage.getItem('eventdazzle_user')
      const userEmail = userRaw ? (JSON.parse(userRaw).email as string) : undefined

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          eventTitle: event.title,
          tierName: booking.tierName,
          tierId: booking.tierId,
          quantity: booking.quantity,
          amount,
          userEmail,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment could not start')

      if (data.url) {
        window.location.href = data.url
        return
      }

      throw new Error('Stripe checkout URL missing')
    } catch (err) {
      setPaying(false)
      setError(err instanceof Error ? err.message : 'Payment failed')
    }
  }

  return (
    <RequireAuth>
      <section className="wrapper my-10 max-w-2xl">
        <div className="rounded-3xl border border-surface-line bg-white p-6 shadow-sm md:p-10">
          <h2 className="h3-bold mb-2">Choose payment method</h2>
          <p className="p-regular-16 mb-6 text-grey-600">
            <span className="font-semibold">{event.title}</span> · {booking.tierName} ×{' '}
            {booking.quantity}
          </p>

          <div className="mb-6 rounded-2xl bg-primary-50 p-4">
            <div className="flex-between p-medium-16">
              <span>Amount due</span>
              <span className="p-bold-20 text-primary-500">
                {amount === 0 ? 'FREE' : `₹${amount}`}
              </span>
            </div>
          </div>

          {amount > 0 ? (
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-grey-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setMethod('upi')
                  setError('')
                }}
                className={`rounded-xl py-3 text-sm font-semibold transition ${
                  method === 'upi' ? 'bg-white text-primary-500 shadow-sm' : 'text-grey-600'
                }`}
              >
                UPI QR · GPay / Paytm
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethod('stripe')
                  setError('')
                }}
                className={`rounded-xl py-3 text-sm font-semibold transition ${
                  method === 'stripe' ? 'bg-white text-primary-500 shadow-sm' : 'text-grey-600'
                }`}
              >
                Card · Stripe
              </button>
            </div>
          ) : null}

          {error ? <p className="mb-4 text-sm text-red-500">{error}</p> : null}

          {amount === 0 ? (
            <Button size="lg" className="button w-full" onClick={onStripePay}>
              Confirm Free Booking
            </Button>
          ) : method === 'upi' ? (
            <UpiQrPayment
              eventId={event._id}
              eventTitle={event.title}
              tierName={booking.tierName}
              tierId={booking.tierId}
              quantity={booking.quantity}
              amount={amount}
              onSuccess={(utr) => goSuccess({ method: 'upi', utr })}
              onError={setError}
            />
          ) : (
            <>
              <Button size="lg" className="button w-full" onClick={onStripePay} disabled={paying}>
                {paying ? 'Redirecting to Stripe...' : 'Pay with Stripe'}
              </Button>
              <p className="p-regular-14 mt-4 text-grey-500">
                Test card: 4242 4242 4242 4242 · any future expiry · any CVC
              </p>
            </>
          )}

          <Button asChild size="lg" variant="outline" className="button mt-4 w-full">
            <Link href={`/events/${event._id}/checkout`}>Back to Checkout</Link>
          </Button>
        </div>
      </section>
    </RequireAuth>
  )
}
