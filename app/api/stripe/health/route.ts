import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function GET() {
  try {
    const key = process.env.STRIPE_SECRET_KEY?.trim() || ''
    const stripe = getStripe()
    const balance = await stripe.balance.retrieve()

    return NextResponse.json({
      ok: true,
      keyPrefix: key.slice(0, 12),
      keySuffix: key.slice(-4),
      keyLength: key.length,
      livemode: balance.livemode,
      message: 'Stripe key is valid',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe health check failed'
    const key = process.env.STRIPE_SECRET_KEY?.trim() || ''

    return NextResponse.json(
      {
        ok: false,
        error: message,
        keyLoaded: Boolean(key),
        keyPrefix: key ? key.slice(0, 12) : null,
        keySuffix: key ? key.slice(-4) : null,
        keyLength: key.length,
        hint:
          'Roll your secret key in Stripe Dashboard → Developers → API keys → ... → Roll key, paste the NEW sk_test_ key into .env.local, delete .next folder, restart npm run dev',
      },
      { status: 500 }
    )
  }
}
