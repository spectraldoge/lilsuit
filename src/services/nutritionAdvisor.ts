import type { WeatherData, RideOptions } from '../types'

export interface NutritionAdvice {
  hydration: string
  fuel: string | null
  notes: string[]
}

type TempBand = 'cold' | 'mild' | 'warm' | 'hot'

function tempBand(tempC: number): TempBand {
  if (tempC < 10) return 'cold'
  if (tempC < 20) return 'mild'
  if (tempC < 27) return 'warm'
  return 'hot'
}

const hydrationMatrix: Record<RideOptions['duration'], Record<TempBand, string>> = {
  short: {
    cold: 'Maybe take a bottle of water — you might not even finish it.',
    mild: 'One bottle should be plenty.',
    warm: 'Take one bottle and sip regularly.',
    hot:  "Take a full bottle even for a short spin — it's hot out there.",
  },
  medium: {
    cold: 'One bottle is usually enough.',
    mild: 'One to two bottles — drink to thirst.',
    warm: "Two bottles, and don't wait until you're thirsty.",
    hot:  'Two bottles minimum, and plan a refill stop.',
  },
  long: {
    cold: 'Take two bottles — it\'s easy to under-drink in the cold.',
    mild: 'Two bottles, and refill once or twice along the way.',
    warm: 'Two bottles and refill at every opportunity.',
    hot:  'Two bottles and fill them up as often as possible — aim to never run dry.',
  },
}

export function getNutrition(weather: WeatherData, ride: RideOptions): NutritionAdvice {
  const band = tempBand(weather.feelsLikeC)
  const notes: string[] = []

  const hydration = hydrationMatrix[ride.duration][band]

  // ── Fuel ──────────────────────────────────────────────────────────────────
  let fuel: string | null = null
  if (ride.duration === 'short') {
    if (ride.intensity === 'hard')
      fuel = 'Pop a gel in your pocket in case you go deep — otherwise no food needed.'
  } else if (ride.duration === 'medium') {
    fuel = 'Pack a couple of energy bars or gels — aim for something every 45 minutes.'
  } else {
    fuel = 'Bring real food and aim for 60–90g of carbs per hour: bars, gels, a banana, or a sandwich.'
  }

  // ── Electrolytes / heat ─────────────────────────────────────────────────────
  if (band === 'hot') {
    notes.push('Add electrolyte tabs to at least one bottle to replace salts lost through sweat.')
  } else if (band === 'warm' && ride.duration !== 'short') {
    notes.push('Consider an electrolyte tab in one bottle — you\'ll be sweating more than it feels.')
  }

  // ── Cold-weather reminder ───────────────────────────────────────────────────
  if (band === 'cold' && ride.duration !== 'short') {
    notes.push("It's easy to forget to drink in the cold — sip every 15 minutes even if you're not thirsty.")
  }

  // ── Hard + long ─────────────────────────────────────────────────────────────
  if (ride.intensity === 'hard' && ride.duration === 'long') {
    notes.push('Hard and long — start fuelling in the first 30 minutes, before you feel you need it.')
  }

  return { hydration, fuel, notes }
}
