export function buildUpiPaymentUri(params: {
  upiId: string
  payeeName: string
  amount: number
  transactionNote: string
}) {
  const amount = params.amount.toFixed(2)
  const query = new URLSearchParams({
    pa: params.upiId.trim(),
    pn: params.payeeName.trim().slice(0, 50),
    am: amount,
    cu: 'INR',
    tn: params.transactionNote.trim().slice(0, 80),
  })

  return `upi://pay?${query.toString()}`
}

export function getUpiConfig() {
  const upiId = process.env.UPI_ID?.trim() || ''
  const payeeName = process.env.UPI_MERCHANT_NAME?.trim() || 'EventDazzle'
  return { upiId, payeeName, configured: Boolean(upiId && upiId.includes('@')) }
}
