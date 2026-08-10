'use client'

import EventImage from '@/components/shared/EventImage'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  { label: 'All Events', city: 'Mumbai', keyword: '' },
  { label: 'Concerts', city: 'Mumbai', keyword: 'music' },
  { label: 'Comedy', city: 'Delhi', keyword: 'comedy' },
  { label: 'Workshops', city: 'Pune', keyword: 'workshop' },
  { label: 'Seminars', city: 'Bangalore', keyword: 'seminar' },
  { label: 'Sports', city: 'Delhi', keyword: 'sports' },
  { label: 'Food', city: 'Mumbai', keyword: 'food' },
  { label: 'Festivals', city: 'Bangalore', keyword: 'festival' },
]

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata']

export default function Home() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('Mumbai')

  const goSearch = (nextCity = city, keyword = query) => {
    const user = localStorage.getItem('eventdazzle_user')
    if (!user) {
      router.push('/sign-in')
      return
    }
    const params = new URLSearchParams()
    params.set('city', nextCity)
    if (keyword.trim()) params.set('keyword', keyword.trim())
    router.push(`/events?${params.toString()}`)
  }

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(225,29,72,0.28),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.12),transparent_45%)]" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="wrapper relative grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-rose-200">
              EventDazzle
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-[3.4rem]">
              Find the night.
              <br />
              Book your seat.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
              Live concerts, workshops, seminars and festivals across India — with Front, Middle and Back zone tickets, vibe tags, and Event Trail follow-up plans.
            </p>

            <div className="rounded-3xl border border-white/10 bg-white p-3 shadow-2xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  className="input-field flex-1 !bg-grey-50"
                  placeholder="Search concerts, comedy, sports..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && goSearch()}
                />
                <select
                  className="select-field !text-black md:max-w-[180px]"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ color: '#111111', backgroundColor: '#ffffff', WebkitTextFillColor: '#111111' }}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c} style={{ color: '#111111', backgroundColor: '#ffffff' }}>
                      {c}
                    </option>
                  ))}
                </select>
                <Button className="button shrink-0 bg-primary-500 hover:bg-primary-500/90" size="lg" onClick={() => goSearch()}>
                  Search
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => goSearch(item.city, item.keyword)}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:border-primary-500 hover:bg-primary-500"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
              <EventImage
                src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80&auto=format&fit=crop"
                category="concert"
                title="Live events"
                alt="Live events on EventDazzle"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent p-6">
                <p className="text-sm text-white/60">This weekend near you</p>
                <p className="mt-1 text-xl font-semibold">Arijit • Zakir • Sports Fest</p>
              </div>
            </div>
            <div className="absolute -left-4 top-8 rounded-2xl border border-white/10 bg-ink-soft/90 px-4 py-3 shadow-xl backdrop-blur">
              <p className="text-xs text-white/50">Event Trail</p>
              <p className="text-sm font-semibold text-white">Stack your night</p>
            </div>
          </div>
        </div>
      </section>

      <section className="wrapper py-14 md:py-20">
        <div className="mb-10 flex flex-col gap-2">
          <h2 className="h3-bold">Why EventDazzle</h2>
          <p className="p-regular-16 text-grey-500">
            Built for Indian cities — clear prices, live seat counts, and a smooth book flow.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'Live event feeds',
              text: 'Ticketmaster worldwide + Bushdrum India — not just static listings. Scroll endlessly when browsing.',
            },
            {
              title: 'Zone-based tickets',
              text: 'Front is premium, Middle is balanced, Back is budget — see seats left live before you pay.',
            },
            {
              title: 'Event Trail',
              text: 'Pick an event and get follow-up suggestions — stack your evening with related workshops, food, or shows.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-surface-line bg-white p-6 shadow-sm transition hover:border-primary-500/30 hover:shadow-md"
            >
              <h3 className="mb-2 text-lg font-semibold text-black">{item.title}</h3>
              <p className="text-sm leading-relaxed text-grey-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
