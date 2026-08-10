'use client'

import EventImage from '@/components/shared/EventImage'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { TrailEvent } from '@/lib/eventRecommendations'
import { AppEvent, toCountryCode } from '@/lib/ticketmaster'

type EventTrailProps = {
  eventId: string
  city?: string
  countryCode?: string
}

const TRAIL_BADGE: Record<TrailEvent['trailType'], string> = {
  'same-evening': 'Same evening',
  'next-up': 'Follow-up',
  'same-vibe': 'Same vibe',
}

export default function EventTrail({ eventId, city, countryCode }: EventTrailProps) {
  const [trail, setTrail] = useState<TrailEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    const code = toCountryCode(countryCode) || countryCode
    if (code && /^[A-Za-z]{2}$/.test(code)) params.set('countryCode', code.toUpperCase())

    setLoading(true)
    fetch(`/api/events/${encodeURIComponent(eventId)}/trail?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not load trail')
        setTrail(data.trail || [])
        setMessage(data.message || '')
      })
      .catch(() => {
        setTrail([])
        setMessage('')
      })
      .finally(() => setLoading(false))
  }, [eventId, city, countryCode])

  if (loading) {
    return (
      <div className="rounded-3xl border border-dashed border-primary-500/30 bg-primary-50/40 p-6">
        <p className="p-medium-16 text-grey-600">Finding your Event Trail...</p>
      </div>
    )
  }

  if (!trail.length) return null

  return (
    <div className="rounded-3xl border border-surface-line bg-white p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
            Event Trail
          </p>
          <h2 className="h4-bold">What to do next</h2>
          <p className="mt-1 max-w-2xl text-sm text-grey-500">
            {message ||
              'Stack your night — unlike typical listing apps, EventDazzle suggests follow-up events you can book with zone tickets.'}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
          EventDazzle exclusive
        </span>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {trail.map((item) => (
          <TrailCard key={item._id} event={item} />
        ))}
      </ul>
    </div>
  )
}

function TrailCard({ event }: { event: TrailEvent }) {
  const date = new Date(event.startDateTime).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <li>
      <Link
        href={`/events/${encodeURIComponent(event._id)}`}
        className="group flex gap-4 rounded-2xl border border-surface-line p-3 transition hover:border-primary-500/40 hover:shadow-md"
      >
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-grey-50">
          <EventImage
            src={event.imageUrl}
            category={event.category?.name}
            title={event.title}
            alt={event.title}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="96px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-600">
              {TRAIL_BADGE[event.trailType]}
            </span>
            {event.vibeTags?.[0] ? (
              <span className="rounded-full bg-grey-100 px-2 py-0.5 text-[10px] font-medium text-grey-600">
                {event.vibeTags[0]}
              </span>
            ) : null}
          </div>
          <h3 className="line-clamp-2 font-semibold text-black">{event.title}</h3>
          <p className="mt-1 text-xs text-grey-500">{event.trailReason}</p>
          <p className="mt-2 text-xs text-grey-400">{date}</p>
        </div>
      </Link>
    </li>
  )
}
