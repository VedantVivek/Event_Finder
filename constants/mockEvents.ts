export type MockEvent = {
  _id: string
  title: string
  description: string
  location: string
  imageUrl: string
  startDateTime: string
  endDateTime: string
  price: string
  isFree: boolean
  url: string
  category: { _id: string; name: string }
  organizer: { _id: string; firstName: string; lastName: string }
}

export const mockEvents: MockEvent[] = [
  {
    _id: '1',
    title: 'Arijit Singh Live Concert',
    description:
      'Experience an unforgettable night with Arijit Singh performing his biggest hits live on stage. Join thousands of fans for a magical evening of music.',
    location: 'NSCI Dome, Mumbai',
    imageUrl: '/assets/images/hero1.svg',
    startDateTime: '2026-09-15T19:00:00',
    endDateTime: '2026-09-15T22:30:00',
    price: '2499',
    isFree: false,
    url: 'https://example.com/arijit',
    category: { _id: 'c1', name: 'Concert' },
    organizer: { _id: 'o1', firstName: 'Event', lastName: 'Dazzle' },
  },
  {
    _id: '2',
    title: 'Anubhav Singh Bassi Stand-up',
    description:
      'Laugh out loud with Anubhav Singh Bassi as he brings his latest comedy special to the stage. Perfect night out with friends and family.',
    location: 'Jawaharlal Nehru Stadium, Delhi',
    imageUrl: '/assets/images/hero1.svg',
    startDateTime: '2026-09-20T18:30:00',
    endDateTime: '2026-09-20T21:00:00',
    price: '999',
    isFree: false,
    url: 'https://example.com/bassi',
    category: { _id: 'c2', name: 'Comedy' },
    organizer: { _id: 'o1', firstName: 'Event', lastName: 'Dazzle' },
  },
  {
    _id: '3',
    title: 'DDLJ Movie Premiere Night',
    description:
      'Relive the classic romance of Dilwale Dulhania Le Jayenge on the big screen with special guest appearances and fan activities.',
    location: 'PVR Icon, Bangalore',
    imageUrl: '/assets/events/default.svg',
    startDateTime: '2026-10-02T17:00:00',
    endDateTime: '2026-10-02T20:30:00',
    price: '499',
    isFree: false,
    url: 'https://example.com/ddlj',
    category: { _id: 'c3', name: 'Movie' },
    organizer: { _id: 'o2', firstName: 'Cinema', lastName: 'Club' },
  },
  {
    _id: '4',
    title: 'Dussehra Mela Festival',
    description:
      'Celebrate Dussehra with food stalls, cultural performances, games, and a grand Ravan Dahan ceremony for the whole family.',
    location: 'India Gate Grounds, New Delhi',
    imageUrl: '/assets/events/default.svg',
    startDateTime: '2026-10-10T16:00:00',
    endDateTime: '2026-10-10T22:00:00',
    price: '0',
    isFree: true,
    url: 'https://example.com/dussehra',
    category: { _id: 'c4', name: 'Festival' },
    organizer: { _id: 'o3', firstName: 'City', lastName: 'Events' },
  },
  {
    _id: '5',
    title: 'Tech Webinar: AI for Beginners',
    description:
      'A hands-on online webinar covering the basics of Artificial Intelligence, practical tools, and career paths in AI.',
    location: 'Online',
    imageUrl: '/assets/events/default.svg',
    startDateTime: '2026-09-25T11:00:00',
    endDateTime: '2026-09-25T13:00:00',
    price: '299',
    isFree: false,
    url: 'https://example.com/ai-webinar',
    category: { _id: 'c5', name: 'Webinar' },
    organizer: { _id: 'o4', firstName: 'Learn', lastName: 'Lab' },
  },
  {
    _id: '6',
    title: 'Startup Seminar 2026',
    description:
      'Meet founders, investors, and mentors. Learn how to build, pitch, and scale your startup idea in this full-day seminar.',
    location: 'IIT Madras Research Park, Chennai',
    imageUrl: '/assets/images/logo.svg',
    startDateTime: '2026-11-05T09:30:00',
    endDateTime: '2026-11-05T17:30:00',
    price: '1499',
    isFree: false,
    url: 'https://example.com/startup',
    category: { _id: 'c6', name: 'Seminar' },
    organizer: { _id: 'o4', firstName: 'Learn', lastName: 'Lab' },
  },
]

export function getMockEventById(id: string) {
  return mockEvents.find((event) => event._id === id)
}
