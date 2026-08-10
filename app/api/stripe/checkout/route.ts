import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getAppUrl } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventId, eventTitle, tierName, tierId, quantity, amount, userEmail } = body as {
      eventId: string
      eventTitle: string
      tierName: string
      tierId?: string
      quantity: number
      amount: number
      userEmail?: string
    }

    if (!eventId || !eventTitle || !tierName || !quantity || amount == null) {
      return NextResponse.json({ error: 'Missing checkout details' }, { status: 400 })
    }

    if (amount === 0) {
      return NextResponse.json({ free: true })
    }

    const stripe = getStripe()
    const appUrl = getAppUrl()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `${eventTitle} — ${tierName}`,
              description: `${quantity} ticket(s) · EventDazzle`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        eventTitle,
        tierName,
        tierId: tierId || '',
        quantity: String(quantity),
        userEmail: userEmail || 'guest',
        totalAmount: String(amount),
      },
      success_url: `${appUrl}/events/${encodeURIComponent(eventId)}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/events/${encodeURIComponent(eventId)}/payment`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Could not create Stripe session' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Stripe checkout failed'
    const message = raw.includes('Invalid API Key')
      ? 'Your Stripe secret key was rejected. In Stripe Dashboard → Developers → API keys, click the ⋯ menu on Secret key → Roll key, copy the NEW sk_test_ key into .env.local, run: npm run clean && npm run dev'
      : raw
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
