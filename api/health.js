export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.gemini ||
    process.env.GEMINI ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    ''
  const hasApiKey = Boolean(rawKey.trim().length > 0)

  return res.status(200).json({
    ok: true,
    hasApiKey
  })
}
