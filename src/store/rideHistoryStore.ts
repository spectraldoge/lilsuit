import type { RideResult, FeedbackValue, Activity } from '../types'

const KEY = 'lilsuit_ride_history'
const MAX = 50

export function loadHistory(): RideResult[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // migrate older records that used effectiveTempC / had no source
    return parsed.map((r: any) => ({
      id: r.id,
      date: r.date,
      tempC: r.tempC ?? r.effectiveTempC ?? 0,
      feedback: r.feedback,
      wore: r.wore,
      source: r.source ?? 'in_app',
      activity: r.activity ?? 'cycling',
    }))
  } catch {
    return []
  }
}

function persist(history: RideResult[]): void {
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX)))
}

export function saveRide(
  tempC: number,
  feedback: FeedbackValue,
  opts: { wore?: string; source?: RideResult['source']; date?: string; activity?: Activity } = {}
): void {
  const history = loadHistory()
  const result: RideResult = {
    id: crypto.randomUUID(),
    date: opts.date ?? new Date().toISOString(),
    tempC: Math.round(tempC),
    feedback,
    wore: opts.wore?.trim() || undefined,
    source: opts.source ?? 'in_app',
    activity: opts.activity ?? 'cycling',
  }
  persist([result, ...history])
}

export function deleteRide(id: string): void {
  persist(loadHistory().filter(r => r.id !== id))
}

// Net "too hot" minus "too cold" → a °C bias.
// Positive = user runs hotter than expected → recommend lighter kit.
function biasFromResults(results: RideResult[]): number {
  if (results.length < 3) return 0
  const hot  = results.filter(r => r.feedback === 'too_hot').length
  const cold = results.filter(r => r.feedback === 'too_cold').length
  const net  = hot - cold
  if (net >= 4) return 3
  if (net >= 2) return 1.5
  if (net <= -4) return -3
  if (net <= -2) return -1.5
  return 0
}

// Temperature-band aware and per-activity: prefer feedback from rides of the
// same activity near `aroundTempC`, falling back to all that activity's rides.
export function getTemperatureBias(aroundTempC: number, activity: Activity): number {
  const history = loadHistory().filter(r => r.activity === activity)
  const nearby = history.filter(r => Math.abs(r.tempC - aroundTempC) <= 5)

  if (nearby.length >= 3) return biasFromResults(nearby.slice(0, 10))
  return biasFromResults(history.slice(0, 10))
}
