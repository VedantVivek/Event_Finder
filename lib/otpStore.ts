type OtpEntry = {
  code: string
  expiresAt: number
  name: string
}

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

function getStore() {
  const g = globalThis as typeof globalThis & { __eventdazzleOtp?: Map<string, OtpEntry> }
  if (!g.__eventdazzleOtp) g.__eventdazzleOtp = new Map()
  return g.__eventdazzleOtp
}

export function createOtp(email: string, name: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  getStore().set(email.toLowerCase().trim(), {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    name,
  })
  return code
}

export function verifyOtp(email: string, code: string) {
  const key = email.toLowerCase().trim()
  const entry = getStore().get(key)
  if (!entry) return { ok: false as const, reason: 'No OTP found. Request a new code.' }
  if (Date.now() > entry.expiresAt) {
    getStore().delete(key)
    return { ok: false as const, reason: 'OTP expired. Request a new code.' }
  }
  if (entry.code !== code.trim()) {
    return { ok: false as const, reason: 'Invalid OTP. Please try again.' }
  }
  getStore().delete(key)
  return { ok: true as const, name: entry.name }
}
