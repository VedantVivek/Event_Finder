import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/actions/order.actions'
import { getStripe } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 })
    }

    await createOrder({
      stripeId: session.id,
      totalAmount: session.metadata?.totalAmount || String((session.amount_total || 0) / 100),
      eventId: session.metadata?.eventId || '',
      eventTitle: session.metadata?.eventTitle || '',
    })

    return NextResponse.json({
      paid: true,
      eventId: session.metadata?.eventId,
      eventTitle: session.metadata?.eventTitle,
      tierName: session.metadata?.tierName,
      tierId: session.metadata?.tierId,
      quantity: session.metadata?.quantity,
      amount: session.metadata?.totalAmount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not verify payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
