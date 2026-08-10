'use client'

import { getCityCoords, normalizeCityKey } from '@/constants/indiaCityEvents'
import { getEventImage } from '@/lib/eventImages'
import { AppEvent } from '@/lib/ticketmaster'

type StoredCreatedEvent = {
  _id: string
  title: string
  description: string
  location: string
  category: string
  price: string
  isFree: boolean
  startDateTime: string
  endDateTime?: string
  imageUrl: string
  city: string
}

export function readCreatedEvents(): AppEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('eventdazzle_created_events')
    const list = (raw ? JSON.parse(raw) : []) as StoredCreatedEvent[]
    return list.map((event) => {
      const end = event.endDateTime || new Date(new Date(event.startDateTime).getTime() + 3 * 60 * 60 * 1000).toISOString()
      const coords = getCityCoords(event.city)
      return {
        _id: event._id,
        title: event.title,
        description: event.description,
        location: event.location,
        imageUrl: getEventImage(event.category, event.imageUrl, event.title),
        startDateTime: event.startDateTime,
        endDateTime: end,
        price: event.price,
        isFree: event.isFree,
        url: '#',
        category: { _id: event.category, name: event.category },
        organizer: { _id: 'user', firstName: 'You', lastName: '' },
        city: event.city,
        country: 'India',
        countryCode: 'IN',
        lat: coords?.lat,
        lng: coords?.lng,
        source: 'community' as const,
      } as AppEvent
    })
  } catch {
    return []
  }
}

export function getCreatedEventsForCity(city?: string, keyword?: string) {
  const key = normalizeCityKey(city)
  let events = readCreatedEvents()

  if (key) {
    events = events.filter((event) => normalizeCityKey(event.city) === key)
  }

  if (keyword) {
    const q = keyword.toLowerCase()
    events = events.filter(
      (event) =>
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q) ||
        event.category.name.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q)
    )
  }

  return events
}

export function getCreatedEventById(id: string) {
  return readCreatedEvents().find((event) => event._id === id) || null
}

export function mergeEvents(primary: AppEvent[], extra: AppEvent[]) {
  const map = new Map<string, AppEvent>()
  ;[...extra, ...primary].forEach((event) => {
    map.set(event._id, {
      ...event,
      imageUrl: getEventImage(event.category?.name, event.imageUrl, event.title),
    })
  })
  return Array.from(map.values())
}
