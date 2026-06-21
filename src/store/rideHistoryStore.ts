import type { RideResult, FeedbackValue } from '../types'

const KEY = 'lilsuit_ride_history'
const MAX = 20

export function loadHistory(): RideResult[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveRide(effectiveTempC: number, feedback: FeedbackValue): void {
  const history = loadHistory()
  const result: RideResult = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    effectiveTempC,
    feedback,
  }
  const updated = [result, ...history].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

// Returns a bias in °C to add to effective temp based on recent feedback.
// Positive = user runs hotter than expected → recommend lighter kit.
// Negative = user runs colder than expected → recommend heavier kit.
export function getTemperatureBias(): number {
  const history = loadHistory().slice(0, 10)
  if (history.length < 3) return 0

  const hot  = history.filter(r => r.feedback === 'too_hot').length
  const cold = history.filter(r => r.feedback === 'too_cold').length
  const net  = hot - cold

  if (net >= 4) return 3
  if (net >= 2) return 1.5
  if (net <= -4) return -3
  if (net <= -2) return -1.5
  return 0
}
