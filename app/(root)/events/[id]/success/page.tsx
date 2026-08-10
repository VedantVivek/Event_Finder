'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import RequireAuth from '@/components/shared/RequireAuth'
import { getCreatedEventById } from '@/lib/createdEvents'
import { bookTickets, clearPendingBooking, TicketTierId } from '@/lib/tickets'
import { AppEvent } from '@/lib/ticketmaster'

function SuccessContent() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const [event, setEvent] = useState<AppEvent | null>(null)
  const [error, setError] = useState('')
  const [tier, setTier] = useState(search.get('tier') || 'Selected zone')
  const [qty, setQty] = useState(search.get('qty') || '1')
  const [amount, setAmount] = useState(search.get('amount') || '0')
  const payMethod = search.get('method') || (search.get('session_id') ? 'stripe' : '')
  const utr = search.get('utr') || ''

  useEffect(() => {
    const id = decodeURIComponent(params.id)
    const sessionId = search.get('session_id')

    const finalizeBooking = async (tierId: TicketTierId, quantity: number) => {
      try {
        bookTickets(id, tierId, quantity)
        clearPendingBooking()
      } catch (err) {
        console.warn('Ticket inventory update:', err)
      }
    }

    const load = async () => {
      if (sessionId) {
        try {
          const verifyRes = await fetch(`/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`)
          const verifyData = await verifyRes.json()
          if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed')

          setTier(verifyData.tierName || tier)
          setQty(verifyData.quantity || qty)
          setAmount(verifyData.amount || amount)

          const tierId = (verifyData.tierId || 'middle') as TicketTierId
          const quantity = Number(verifyData.quantity || 1)
          await finalizeBooking(tierId, quantity)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Payment verification failed')
        }
      }

      if (id.startsWith('created_')) {
        const created = getCreatedEventById(id)
        if (!created) setError((e) => e || 'Event not found')
        else setEvent(created)
        return
      }

      try {
        const res = await fetch(`/api/events/${encodeURIComponent(id)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Event not found')
        setEvent(data.event)
      } catch (err) {
        setError((prev) => prev || (err instanceof Error ? err.message : 'Event not found'))
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, search])

  if (error) {
    return (
      <section className="wrapper my-16">
        <p className="text-red-500">{error}</p>
        <Button asChild className="button mt-4">
          <Link href={`/events/${params.id}/payment`}>Back to payment</Link>
        </Button>
      </section>
    )
  }

  if (!event) {
    return (
      <section className="wrapper my-16">
        <p>Confirming booking...</p>
      </section>
    )
  }

  return (
    <section className="wrapper my-16 max-w-2xl text-center">
      <div className="rounded-3xl border border-surface-line bg-white p-8 shadow-sm md:p-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-700">
          {search.get('session_id')
            ? 'Payment successful'
            : payMethod === 'upi'
              ? 'UPI payment received'
              : 'Booking confirmed'}
        </p>
        <h2 className="h3-bold mb-4">{event.title}</h2>
        <p className="p-regular-16 mb-2 text-grey-600">{event.location}</p>
        <p className="p-medium-16 mb-6">
          {new Date(event.startDateTime).toLocaleString('en-IN', {
            dateStyle: 'full',
            timeStyle: 'short',
          })}
        </p>

        <div className="mb-8 rounded-2xl bg-grey-50 p-4 text-left">
          <div className="flex-between mb-2 text-sm">
            <span>Zone</span>
            <span className="font-semibold">{tier}</span>
          </div>
          <div className="flex-between mb-2 text-sm">
            <span>Tickets</span>
            <span className="font-semibold">{qty}</span>
          </div>
          <div className="flex-between text-sm">
            <span>Paid</span>
            <span className="font-semibold text-primary-500">
              {amount === '0' ? 'FREE' : `₹${amount}`}
            </span>
          </div>
          {payMethod ? (
            <div className="flex-between mt-2 text-sm">
              <span>Method</span>
              <span className="font-semibold capitalize">
                {payMethod === 'upi' ? 'UPI (GPay / Paytm)' : payMethod}
              </span>
            </div>
          ) : null}
          {utr ? (
            <div className="flex-between mt-2 text-sm">
              <span>UPI ref</span>
              <span className="font-semibold">{utr}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="button">
            <Link href="/events">Browse more events</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="button">
            <Link href={`/events/${event._id}`}>View updated availability</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default function SuccessPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<section className="wrapper my-16">Loading...</section>}>
        <SuccessContent />
      </Suspense>
    </RequireAuth>
  )
}
