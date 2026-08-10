const http = require('http')

function get(path) {
  return new Promise((resolve, reject) => {
    const t = Date.now()
    http
      .get('http://127.0.0.1:3001' + path, (res) => {
        let b = ''
        res.on('data', (c) => (b += c))
        res.on('end', () => {
          resolve({
            path,
            status: res.statusCode,
            ms: Date.now() - t,
            notFound: b.includes('This page could not be found'),
            hasConcertSvg: b.includes('/assets/events/concert.svg'),
            hasComedySvg: b.includes('/assets/events/comedy.svg'),
            hasFoodSvg: b.includes('/assets/events/food.svg'),
            hasCreate: b.includes('Create Event'),
            hasWelcome: b.includes('Welcome back'),
            eventCount: (() => {
              try {
                return JSON.parse(b).events?.length
              } catch {
                return undefined
              }
            })(),
          })
        })
      })
      .on('error', (e) => reject(e))
  })
}

;(async () => {
  const paths = [
    '/',
    '/events',
    '/events/create',
    '/profile',
    '/sign-in',
    '/sign-up',
    '/events/local_mumbai-1',
    '/events/local_bangalore-1',
    '/events/local_mumbai-1/checkout',
    '/events/local_mumbai-1/payment',
    '/events/local_mumbai-1/success',
    '/api/events?city=Mumbai&countryCode=IN',
    '/api/events?city=Bangalore&countryCode=IN',
    '/api/events?city=Delhi&countryCode=IN',
    '/api/events/local_mumbai-1',
  ]

  for (const p of paths) {
    try {
      const r = await get(p)
      console.log(JSON.stringify(r))
    } catch (e) {
      console.log(JSON.stringify({ path: p, error: e.message }))
    }
  }
})()
