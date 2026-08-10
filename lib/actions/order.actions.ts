'use server'

import { connectToDatabase } from '@/lib/database'
import Order from '@/lib/database/models/order.model'

export async function createOrder(params: {
  stripeId: string
  totalAmount: string
  eventId: string
  eventTitle: string
  buyerId?: string
}) {
  try {
    if (!process.env.MONGODB_URI) return null
    await connectToDatabase()
    const order = await Order.create({
      stripeId: params.stripeId,
      totalAmount: params.totalAmount,
      event: params.eventId,
      buyer: params.buyerId,
    })
    return JSON.parse(JSON.stringify(order))
  } catch (error) {
    console.error('createOrder failed:', error)
    return null
  }
}
