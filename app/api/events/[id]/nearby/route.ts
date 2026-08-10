import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/lib/eventsProvider'
import { fetchNearbyPlaces } from '@/lib/nearbyPlaces'

type RouteContext = {
  params: { id: string }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const id = decodeURIComponent(context.params.id)
    const { searchParams } = request.nextUrl

    const qLat = searchParams.get('lat')
    const qLng = searchParams.get('lng')

    let location = searchParams.get('location')?.trim() || ''
    let city = searchParams.get('city')?.trim() || undefined
    let country = searchParams.get('country')?.trim() || undefined
    let lat = qLat != null && qLat !== '' ? Number(qLat) : undefined
    let lng = qLng != null && qLng !== '' ? Number(qLng) : undefined

    const event = await getEventById(id)
    if (event) {
      location = location || event.location
      city = city || event.city
      country = country || event.country
      if (lat == null || !Number.isFinite(lat)) lat = event.lat
      if (lng == null || !Number.isFinite(lng)) lng = event.lng
    } else if (!location && (lat == null || lng == null)) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const { coords, places } = await fetchNearbyPlaces({
      location: location || city || 'Venue',
      city,
      country,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
    })

    const metro = places.filter((p) => p.type === 'metro').slice(0, 5)
    const outlets = places
      .filter((p) => p.type === 'restaurant' || p.type === 'cafe' || p.type === 'shopping')
      .slice(0, 8)

    return NextResponse.json({
      venue: coords.displayName,
      lat: coords.lat,
      lng: coords.lng,
      metro,
      outlets,
      source: 'OpenStreetMap',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load nearby places'
    return NextResponse.json({ error: message, metro: [], outlets: [] }, { status: 502 })
  }
}
