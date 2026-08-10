export type TicketTierId = 'front' | 'middle' | 'back'

export type TicketTier = {
  id: TicketTierId
  name: string
  label: string
  description: string
  price: number
  total: number
  booked: number
}

export type EventInventory = {
  eventId: string
  tiers: TicketTier[]
}

const STORAGE_KEY = 'eventdazzle_inventory'

function parseBasePrice(price?: string, isFree?: boolean) {
  if (isFree) return 0
  const n = Number(price)
  return Number.isFinite(n) && n > 0 ? n : 799
}

function defaultTiers(basePrice: number): TicketTier[] {
  const middle = Math.max(basePrice, 199)
  const front = Math.round(middle * 1.75)
  const back = Math.max(99, Math.round(middle * 0.65))

  return [
    {
      id: 'front',
      name: 'Front Zone',
      label: 'Premium',
      description: 'Closest to stage — best view & sound',
      price: front,
      total: 40,
      booked: 12,
    },
    {
      id: 'middle',
      name: 'Middle Zone',
      label: 'Standard',
      description: 'Great balance of view and price',
      price: middle,
      total: 80,
      booked: 28,
    },
    {
      id: 'back',
      name: 'Back Zone',
      label: 'Economy',
      description: 'Affordable seats at the back',
      price: back,
      total: 120,
      booked: 45,
    },
  ]
}

function readAll(): Record<string, EventInventory> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, EventInventory>
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, EventInventory>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getEventInventory(
  eventId: string,
  options?: { price?: string; isFree?: boolean }
): EventInventory {
  const all = readAll()
  if (all[eventId]) return all[eventId]

  const inventory: EventInventory = {
    eventId,
    tiers: defaultTiers(parseBasePrice(options?.price, options?.isFree)),
  }
  all[eventId] = inventory
  writeAll(all)
  return inventory
}

export function getTierLeft(tier: TicketTier) {
  return Math.max(0, tier.total - tier.booked)
}

export function getInventorySummary(inventory: EventInventory) {
  const total = inventory.tiers.reduce((sum, t) => sum + t.total, 0)
  const booked = inventory.tiers.reduce((sum, t) => sum + t.booked, 0)
  return {
    total,
    booked,
    left: Math.max(0, total - booked),
  }
}

export function bookTickets(eventId: string, tierId: TicketTierId, quantity: number) {
  const all = readAll()
  const inventory = all[eventId]
  if (!inventory) throw new Error('Inventory not found')

  const tier = inventory.tiers.find((t) => t.id === tierId)
  if (!tier) throw new Error('Ticket category not found')

  const left = getTierLeft(tier)
  if (quantity < 1 || quantity > left) {
    throw new Error(left === 0 ? 'Sold out' : `Only ${left} tickets left in ${tier.name}`)
  }

  tier.booked += quantity
  all[eventId] = inventory
  writeAll(all)
  return inventory
}

export function savePendingBooking(payload: {
  eventId: string
  tierId: TicketTierId
  quantity: number
  price: number
  tierName: string
}) {
  localStorage.setItem('eventdazzle_pending_booking', JSON.stringify(payload))
}

export function readPendingBooking() {
  try {
    const raw = localStorage.getItem('eventdazzle_pending_booking')
    return raw
      ? (JSON.parse(raw) as {
          eventId: string
          tierId: TicketTierId
          quantity: number
          price: number
          tierName: string
        })
      : null
  } catch {
    return null
  }
}

export function clearPendingBooking() {
  localStorage.removeItem('eventdazzle_pending_booking')
}
