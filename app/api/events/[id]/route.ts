import { NextResponse } from 'next/server'
import { getEventById } from '@/lib/eventsProvider'

type RouteContext = {
  params: { id: string }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = decodeURIComponent(context.params.id)
    const event = await getEventById(id)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    return NextResponse.json({ event })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch event'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
