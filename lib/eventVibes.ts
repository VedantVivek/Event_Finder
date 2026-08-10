import { AppEvent } from '@/lib/ticketmaster'

const VIBE_RULES: Array<{ tag: string; match: RegExp }> = [
  { tag: 'High energy', match: /concert|dj|edm|sports|festival|nightlife|sunburn/i },
  { tag: 'Date night', match: /jazz|acoustic|theatre|romantic|sunset/i },
  { tag: 'Family friendly', match: /food|fair|market|puja|cultural|kids|family/i },
  { tag: 'Learn & grow', match: /workshop|seminar|conference|literature|startup|tech|meetup/i },
  { tag: 'Laugh out loud', match: /comedy|stand-?up|open mic/i },
  { tag: 'Chill vibes', match: /acoustic|indie|literature|photography|meetup/i },
  { tag: 'Weekend plan', match: /festival|food|sports|concert/i },
]

export function getVibeTags(event: Pick<AppEvent, 'title' | 'description' | 'category' | 'isFree'>): string[] {
  const text = `${event.title} ${event.description} ${event.category?.name || ''}`
  const tags = new Set<string>()

  for (const rule of VIBE_RULES) {
    if (rule.match.test(text)) tags.add(rule.tag)
  }

  if (event.isFree) tags.add('Free entry')
  if (tags.size === 0) tags.add('Good times')

  return Array.from(tags).slice(0, 3)
}

export function withVibeTags<T extends AppEvent>(events: T[]): T[] {
  return events.map((event) => ({
    ...event,
    vibeTags: event.vibeTags?.length ? event.vibeTags : getVibeTags(event),
  }))
}
