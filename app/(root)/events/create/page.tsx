'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import RequireAuth from '@/components/shared/RequireAuth'
import { getEventImage } from '@/lib/eventImages'

const CATEGORIES = [
  'concert',
  'comedy',
  'food',
  'music',
  'tech',
  'festival',
  'sports',
  'nightlife',
  'workshop',
  'movie',
  'theatre',
  'conference',
]

type CreatedEvent = {
  _id: string
  title: string
  description: string
  location: string
  category: string
  price: string
  isFree: boolean
  startDateTime: string
  imageUrl: string
  city: string
}

export default function CreateEventPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('Mumbai')
  const [category, setCategory] = useState('concert')
  const [price, setPrice] = useState('499')
  const [isFree, setIsFree] = useState(false)
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title.trim() || !description.trim() || !location.trim() || !date) {
      setError('Please fill all required fields')
      return
    }

    const event: CreatedEvent = {
      _id: `created_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      category,
      price: isFree ? '0' : price || '0',
      isFree,
      startDateTime: new Date(date).toISOString(),
      imageUrl: getEventImage(category, undefined, title.trim()),
      city,
    }

    const existing = JSON.parse(localStorage.getItem('eventdazzle_created_events') || '[]') as CreatedEvent[]
    existing.unshift(event)
    localStorage.setItem('eventdazzle_created_events', JSON.stringify(existing))

    setSuccess('Event created successfully!')
    setTimeout(() => router.push(`/events?city=${encodeURIComponent(city)}`), 700)
  }

  return (
    <RequireAuth>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Create Event</h3>
        <p className="wrapper mt-2 text-sm text-grey-500">Login required — only signed-in users can host events.</p>
      </section>

      <section className="wrapper my-8">
        <form onSubmit={onSubmit} className="mx-auto flex max-w-3xl flex-col gap-5 rounded-3xl border border-surface-line bg-white p-6 shadow-sm md:p-8">
          <label className="flex flex-col gap-2">
            <span className="p-medium-14">Event title *</span>
            <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Arijit Singh Live" />
          </label>

          <label className="flex flex-col gap-2">
            <span className="p-medium-14">Description *</span>
            <textarea
              className="textarea min-h-[120px] rounded-xl"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people what to expect..."
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="p-medium-14">Location *</span>
              <input className="input-field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue name, area" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="p-medium-14">City</span>
              <select
                className="select-field !text-black"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ color: '#111111', backgroundColor: '#ffffff' }}
              >
                {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'].map((c) => (
                  <option key={c} value={c} style={{ color: '#111111', backgroundColor: '#ffffff' }}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="p-medium-14">Category</span>
              <select className="select-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="p-medium-14">Date & time *</span>
              <input className="input-field" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex items-center gap-3 pt-6">
              <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
              <span className="p-medium-16">Free event</span>
            </label>
            {!isFree ? (
              <label className="flex flex-col gap-2">
                <span className="p-medium-14">Base price (₹) — used for Middle zone</span>
                <input className="input-field" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
            ) : null}
          </div>

          {error ? <p className="p-regular-14 text-red-500">{error}</p> : null}
          {success ? <p className="p-regular-14 text-green-700">{success}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" className="button">Create Event</Button>
            <Button asChild type="button" size="lg" variant="outline" className="button">
              <Link href="/events">Cancel</Link>
            </Button>
          </div>
        </form>
      </section>
    </RequireAuth>
  )
}
