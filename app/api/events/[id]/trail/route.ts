import { NextResponse } from 'next/server'
import { buildEventTrail } from '@/lib/eventRecommendations'
import { getEventById, getEventsPoolForTrail } from '@/lib/eventsProvider'

type RouteContext = {
  params: { id: string }
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const id = decodeURIComponent(context.params.id)
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city') || undefined
    const countryCode = searchParams.get('countryCode') || undefined
    const lat = searchParams.get('lat') || undefined
    const lng = searchParams.get('lng') || undefined

    const event = await getEventById(id)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const pool = await getEventsPoolForTrail({
      city: city || event.city,
      countryCode,
      lat,
      lng,
    })

    const trail = buildEventTrail(event, pool, 6)

    return NextResponse.json({
      current: event,
      trail,
      message:
        trail.length > 0
          ? 'Event Trail — stack your night with follow-up plans (unique to EventDazzle).'
          : 'No follow-up events found yet — check back as more live listings sync.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build event trail'
    return NextResponse.json({ error: message, trail: [] }, { status: 502 })
  }
}
