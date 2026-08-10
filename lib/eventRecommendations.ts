import { normalizeCityKey } from '@/constants/indiaCityEvents'
import { AppEvent } from '@/lib/ticketmaster'

const RELATED_CATEGORIES: Record<string, string[]> = {
  concert: ['music', 'nightlife', 'festival', 'food'],
  music: ['concert', 'nightlife', 'festival'],
  comedy: ['food', 'nightlife', 'theatre'],
  food: ['festival', 'music', 'market'],
  festival: ['food', 'music', 'concert'],
  sports: ['food', 'festival', 'concert'],
  workshop: ['conference', 'tech', 'seminar'],
  conference: ['workshop', 'tech', 'seminar'],
  tech: ['workshop', 'conference', 'seminar'],
  theatre: ['comedy', 'music', 'food'],
  nightlife: ['concert', 'music', 'food'],
  movie: ['food', 'theatre', 'comedy'],
}

function categoryScore(current: AppEvent, candidate: AppEvent) {
  const currentCat = current.category?.name?.toLowerCase() || ''
  const candidateCat = candidate.category?.name?.toLowerCase() || ''
  if (currentCat === candidateCat) return 4

  const related = RELATED_CATEGORIES[currentCat] || []
  if (related.includes(candidateCat)) return 3
  if (related.some((cat) => candidateCat.includes(cat))) return 2
  return 0
}

function cityScore(current: AppEvent, candidate: AppEvent) {
  const a = normalizeCityKey(current.city)
  const b = normalizeCityKey(candidate.city)
  if (!a || !b) return 0
  return a === b ? 3 : 0
}

function timingScore(current: AppEvent, candidate: AppEvent) {
  const currentEnd = new Date(current.endDateTime || current.startDateTime).getTime()
  const candidateStart = new Date(candidate.startDateTime).getTime()
  const diffHours = (candidateStart - currentEnd) / (1000 * 60 * 60)

  // Same evening (0–6h after) or next few days
  if (diffHours >= 0 && diffHours <= 6) return 5
  if (diffHours > 6 && diffHours <= 48) return 4
  if (diffHours > 48 && diffHours <= 168) return 2
  if (diffHours < 0 && diffHours >= -3) return 1 // happening around same time
  return 0
}

export type TrailEvent = AppEvent & {
  trailReason: string
  trailType: 'same-evening' | 'next-up' | 'same-vibe'
}

export function buildEventTrail(current: AppEvent, pool: AppEvent[], limit = 6): TrailEvent[] {
  const now = Date.now()
  const scored = pool
    .filter((event) => event._id !== current._id)
    .map((event) => {
      const cat = categoryScore(current, event)
      const city = cityScore(current, event)
      const timing = timingScore(current, event)
      const start = new Date(event.startDateTime).getTime()
      if (start < now - 1000 * 60 * 60 * 3) return null

      const score = cat + city + timing
      if (score < 3) return null

      let trailType: TrailEvent['trailType'] = 'same-vibe'
      let trailReason = `More ${event.category?.name || 'events'} you may like`

      const diffHours =
        (new Date(event.startDateTime).getTime() -
          new Date(current.endDateTime || current.startDateTime).getTime()) /
        (1000 * 60 * 60)

      if (diffHours >= 0 && diffHours <= 6) {
        trailType = 'same-evening'
        trailReason = 'Perfect for right after this event'
      } else if (diffHours > 6 && diffHours <= 72) {
        trailType = 'next-up'
        trailReason = 'A great follow-up in the next few days'
      } else if (cat >= 3) {
        trailReason = `Same vibe as ${current.category?.name}`
      }

      return { event, score, trailType, trailReason }
    })
    .filter(Boolean) as Array<{
    event: AppEvent
    score: number
    trailType: TrailEvent['trailType']
    trailReason: string
  }>

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ event, trailType, trailReason }) => ({
      ...event,
      trailType,
      trailReason,
    }))
}
