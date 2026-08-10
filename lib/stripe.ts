import Stripe from 'stripe'

let stripeClient: Stripe | null = null
let stripeKeyUsed = ''

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
  if (!key) throw new Error('STRIPE_SECRET_KEY is missing in .env.local')
  if (!key.startsWith('sk_test_') && !key.startsWith('sk_live_')) {
    throw new Error(
      'STRIPE_SECRET_KEY looks invalid — copy the full Secret key from Stripe Dashboard → Developers → API keys'
    )
  }
  if (key.length < 90) {
    throw new Error('STRIPE_SECRET_KEY looks truncated — copy the entire sk_test_... key from Stripe')
  }

  if (!stripeClient || stripeKeyUsed !== key) {
    stripeClient = new Stripe(key)
    stripeKeyUsed = key
  }

  return stripeClient
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}
