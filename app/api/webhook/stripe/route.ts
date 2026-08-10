import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createOrder } from '@/lib/actions/order.actions'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 })
  }

  const body = await req.text()
  const signature = headers().get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status === 'paid' && session.id) {
      await createOrder({
        stripeId: session.id,
        totalAmount: session.metadata?.totalAmount || String((session.amount_total || 0) / 100),
        eventId: session.metadata?.eventId || '',
        eventTitle: session.metadata?.eventTitle || '',
      })
    }
  }

  return NextResponse.json({ received: true })
}
