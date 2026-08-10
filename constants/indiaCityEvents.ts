import { AppEvent } from '@/lib/ticketmaster'
import { getEventImage } from '@/lib/eventImages'

type CityEventInput = {
  id: string
  title: string
  description: string
  location: string
  category: string
  price: string
  isFree: boolean
  daysFromNow: number
  hour: number
  city: string
  url?: string
}

const CITY_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
  delhi: { lat: 28.6139, lng: 77.209, label: 'New Delhi' },
  mumbai: { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
  bangalore: { lat: 12.9716, lng: 77.5946, label: 'Bangalore' },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: 'Bangalore' },
  chennai: { lat: 13.0827, lng: 80.2707, label: 'Chennai' },
  hyderabad: { lat: 17.385, lng: 78.4867, label: 'Hyderabad' },
  pune: { lat: 18.5204, lng: 73.8567, label: 'Pune' },
  kolkata: { lat: 22.5726, lng: 88.3639, label: 'Kolkata' },
}

const RAW_EVENTS: CityEventInput[] = [
  {
    id: 'mumbai-1',
    title: 'Arijit Singh Live in Mumbai',
    description: 'An evening of chart-topping romantic hits with Arijit Singh live at NSCI Dome. Doors open at 6 PM.',
    location: 'NSCI Dome, Worli, Mumbai',
    category: 'concert',
    price: '2499',
    isFree: false,
    daysFromNow: 18,
    hour: 19,
    city: 'mumbai',
    url: 'https://www.bookmyshow.com',
  },
  {
    id: 'mumbai-2',
    title: 'Stand-up Night with Zakir Khan',
    description: 'Laugh out loud with Zakir Khan’s latest special. Limited seating at NCPA.',
    location: 'NCPA Tata Theatre, Mumbai',
    category: 'comedy',
    price: '999',
    isFree: false,
    daysFromNow: 12,
    hour: 20,
    city: 'mumbai',
  },
  {
    id: 'mumbai-3',
    title: 'Mumbai Food Truck Festival',
    description: 'Street food, live DJ, and family zones across 40+ stalls along the Bandra sea face stretch.',
    location: 'Carter Road, Bandra, Mumbai',
    category: 'food',
    price: '0',
    isFree: true,
    daysFromNow: 9,
    hour: 17,
    city: 'mumbai',
  },
  {
    id: 'mumbai-4',
    title: 'Indie Music Showcase',
    description: 'Discover rising indie bands from across India in an intimate rooftop setting.',
    location: 'The Habitat, Khar, Mumbai',
    category: 'music',
    price: '799',
    isFree: false,
    daysFromNow: 22,
    hour: 20,
    city: 'mumbai',
  },
  {
    id: 'mumbai-5',
    title: 'Startup Pitch Night Mumbai',
    description: 'Founders pitch to investors, mentors, and operators. Networking after the showcases.',
    location: 'WeWork BKC, Mumbai',
    category: 'tech',
    price: '499',
    isFree: false,
    daysFromNow: 15,
    hour: 18,
    city: 'mumbai',
  },
  {
    id: 'mumbai-6',
    title: 'Bollywood Retro Night',
    description: 'Dance to classic Bollywood anthems with a live band and DJ.',
    location: 'Jio World Drive, BKC, Mumbai',
    category: 'nightlife',
    price: '1299',
    isFree: false,
    daysFromNow: 27,
    hour: 21,
    city: 'mumbai',
  },
  {
    id: 'bangalore-1',
    title: 'Sunburn Arena Bangalore',
    description: 'EDM arena night featuring top international and Indian DJs.',
    location: 'Palace Grounds, Bangalore',
    category: 'nightlife',
    price: '1999',
    isFree: false,
    daysFromNow: 20,
    hour: 18,
    city: 'bangalore',
  },
  {
    id: 'bangalore-2',
    title: 'Bangalore Tech Summit Meetup',
    description: 'Talks on AI, product, and cloud with builders from India’s startup capital.',
    location: 'UB City, Bangalore',
    category: 'tech',
    price: '299',
    isFree: false,
    daysFromNow: 8,
    hour: 10,
    city: 'bangalore',
  },
  {
    id: 'bangalore-3',
    title: 'Open Mic Comedy Bangalore',
    description: 'Fresh comics and featured acts in one of Bangalore’s favourite comedy rooms.',
    location: 'Canvas Laugh Club, Bangalore',
    category: 'comedy',
    price: '499',
    isFree: false,
    daysFromNow: 6,
    hour: 20,
    city: 'bangalore',
  },
  {
    id: 'bangalore-4',
    title: 'Lalbagh Flower Photography Walk',
    description: 'Guided photography walk through Lalbagh with tips for beginners and enthusiasts.',
    location: 'Lalbagh Botanical Garden, Bangalore',
    category: 'workshop',
    price: '0',
    isFree: true,
    daysFromNow: 11,
    hour: 7,
    city: 'bangalore',
  },
  {
    id: 'bangalore-5',
    title: 'Acoustic Evening at Cubbon',
    description: 'Unplugged performances by local singer-songwriters under the trees.',
    location: 'Cubbon Park, Bangalore',
    category: 'music',
    price: '0',
    isFree: true,
    daysFromNow: 14,
    hour: 17,
    city: 'bangalore',
  },
  {
    id: 'bangalore-6',
    title: 'Sports Festival Screening Night',
    description: 'Big-screen cricket and football with food, cheers, and fan zones. Celebrate the spirit of sport.',
    location: 'Phoenix Marketcity, Bangalore',
    category: 'sports',
    price: '399',
    isFree: false,
    daysFromNow: 4,
    hour: 21,
    city: 'bangalore',
  },
  {
    id: 'delhi-1',
    title: 'Qutub Festival Cultural Night',
    description: 'Music and dance performances against the historic Qutub Minar backdrop.',
    location: 'Qutub Minar Complex, New Delhi',
    category: 'festival',
    price: '0',
    isFree: true,
    daysFromNow: 16,
    hour: 18,
    city: 'delhi',
  },
  {
    id: 'delhi-2',
    title: 'Anubhav Singh Bassi Live',
    description: 'India’s favourite storyteller brings his latest hour to Delhi.',
    location: 'Indira Gandhi Arena, New Delhi',
    category: 'comedy',
    price: '1499',
    isFree: false,
    daysFromNow: 21,
    hour: 19,
    city: 'delhi',
  },
  {
    id: 'delhi-3',
    title: 'Delhi Street Food Carnival',
    description: 'From chole bhature to momos — taste the capital on one lively street.',
    location: 'Connaught Place, New Delhi',
    category: 'food',
    price: '199',
    isFree: false,
    daysFromNow: 10,
    hour: 16,
    city: 'delhi',
  },
  {
    id: 'delhi-4',
    title: 'Arijit Singh Live in Delhi',
    description: 'Arijit Singh performs his biggest hits live in the capital.',
    location: 'Jawaharlal Nehru Stadium, New Delhi',
    category: 'concert',
    price: '2999',
    isFree: false,
    daysFromNow: 19,
    hour: 19,
    city: 'delhi',
  },
  {
    id: 'delhi-5',
    title: 'Sports Festival Delhi',
    description: 'A city sports festival celebrating cricket, fitness, and fan culture.',
    location: 'India Gate Lawns, New Delhi',
    category: 'sports',
    price: '0',
    isFree: true,
    daysFromNow: 12,
    hour: 17,
    city: 'delhi',
  },
  {
    id: 'chennai-1',
    title: 'Chennai Sangamam Folk Night',
    description: 'Folk arts, music, and dance celebrating Tamil culture.',
    location: 'Marina Beach, Chennai',
    category: 'festival',
    price: '0',
    isFree: true,
    daysFromNow: 13,
    hour: 18,
    city: 'chennai',
  },
  {
    id: 'hyderabad-1',
    title: 'Hyderabad Biryani & Jazz Fest',
    description: 'Gourmet biryani stalls paired with live jazz performances.',
    location: 'Hitex Exhibition Center, Hyderabad',
    category: 'food',
    price: '699',
    isFree: false,
    daysFromNow: 17,
    hour: 18,
    city: 'hyderabad',
  },
  {
    id: 'pune-1',
    title: 'Pune Literature Meetup',
    description: 'Author readings, open discussions, and book swaps.',
    location: 'FC Road, Pune',
    category: 'workshop',
    price: '0',
    isFree: true,
    daysFromNow: 9,
    hour: 16,
    city: 'pune',
  },
  {
    id: 'kolkata-1',
    title: 'Durga Puja Cultural Preview',
    description: 'Music, dance, and art installations celebrating the festive spirit of Kolkata.',
    location: 'Eco Park, Kolkata',
    category: 'festival',
    price: '0',
    isFree: true,
    daysFromNow: 25,
    hour: 17,
    city: 'kolkata',
  },
]

function toAppEvent(input: CityEventInput): AppEvent {
  const start = new Date()
  start.setDate(start.getDate() + input.daysFromNow)
  start.setHours(input.hour, 0, 0, 0)
  const end = new Date(start)
  end.setHours(start.getHours() + 3)

  const coords = CITY_COORDS[input.city]

  return {
    _id: `local_${input.id}`,
    title: input.title,
    description: input.description,
    location: input.location,
    imageUrl: getEventImage(input.category, undefined, input.title),
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
    price: input.price,
    isFree: input.isFree,
    url: input.url || '#',
    category: { _id: input.category, name: input.category },
    organizer: { _id: 'eventdazzle', firstName: 'Event', lastName: 'Dazzle' },
    city: coords?.label || input.city,
    country: 'India',
    countryCode: 'IN',
    lat: coords?.lat,
    lng: coords?.lng,
  }
}

export const localIndiaEvents: AppEvent[] = RAW_EVENTS.map(toAppEvent)

export function normalizeCityKey(city?: string) {
  if (!city) return ''
  const value = city.toLowerCase().trim()
  if (value.includes('delhi') || value.includes('noida') || value.includes('gurgaon') || value.includes('gurugram') || value.includes('new delhi')) {
    return 'delhi'
  }
  if (value.includes('mumbai') || value.includes('bombay')) return 'mumbai'
  if (value.includes('bangalore') || value.includes('bengaluru')) return 'bangalore'
  if (value.includes('chennai') || value.includes('madras')) return 'chennai'
  if (value.includes('hyderabad')) return 'hyderabad'
  if (value.includes('pune')) return 'pune'
  if (value.includes('kolkata') || value.includes('calcutta')) return 'kolkata'
  return value
}

export function getLocalEventsByCity(city?: string, keyword?: string) {
  const key = normalizeCityKey(city)
  let events = localIndiaEvents.filter((event) => normalizeCityKey(event.city) === key)

  if (key === 'bengaluru') {
    events = localIndiaEvents.filter((event) => normalizeCityKey(event.city) === 'bangalore')
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

export function getLocalEventById(id: string) {
  const clean = id.startsWith('local_') ? id : `local_${id}`
  return localIndiaEvents.find((event) => event._id === clean) || null
}

export function nearestCityFromCoords(lat: number, lng: number) {
  let best: { key: string; distance: number } | null = null
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (key === 'bengaluru') continue
    const distance = Math.hypot(coords.lat - lat, coords.lng - lng)
    if (!best || distance < best.distance) {
      best = { key, distance }
    }
  }
  return best?.key || 'delhi'
}

export function getCityCoords(city?: string) {
  const key = normalizeCityKey(city)
  return CITY_COORDS[key]
}
