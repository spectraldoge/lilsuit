import type { WeatherData, RideOptions, Activity } from '../types'

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
    cold: 'Maybe take a bottle of water. You might not even finish it.',
    mild: 'One bottle should be plenty.',
    warm: 'Take one bottle and sip regularly.',
    hot:  "Take a full bottle even for a short spin. It's hot out there.",
  },
  medium: {
    cold: 'One bottle is usually enough.',
    mild: 'One to two bottles. Drink to thirst.',
    warm: "Two bottles, and don't wait until you're thirsty.",
    hot:  'Two bottles minimum, and plan a refill stop.',
  },
  long: {
    cold: 'Take two bottles. It\'s easy to under-drink in the cold.',
    mild: 'Two bottles, and refill once or twice along the way.',
    warm: 'Two bottles and refill at every opportunity.',
    hot:  'Two bottles and fill them up as often as possible. Aim to never run dry.',
  },
}

// Runners carry less, so the hydration language is different
const runHydrationMatrix: Record<RideOptions['duration'], Record<TempBand, string>> = {
  short: {
    cold: "You won't need to carry water.",
    mild: 'No need to carry water for a short run.',
    warm: 'A small handheld bottle is plenty.',
    hot:  'Carry a handheld bottle even for a short run.',
  },
  medium: {
    cold: 'You can probably skip carrying water.',
    mild: 'Carry a small bottle or plan a water stop.',
    warm: 'Carry a handheld bottle and sip regularly.',
    hot:  'Carry water and plan a route past fountains.',
  },
  long: {
    cold: 'Carry a bottle. Easy to under-drink when it\'s cold.',
    mild: 'Carry a handheld or plan water stops every few km.',
    warm: 'Carry a hydration vest or bottle and refill when you can.',
    hot:  "Carry a hydration vest, drink often, and plan refills. Don't run dry.",
  },
}

export function getNutrition(weather: WeatherData, ride: RideOptions, activity: Activity = 'cycling'): NutritionAdvice {
  const band = tempBand(weather.feelsLikeC)
  const notes: string[] = []

  const hydration = (activity === 'running' ? runHydrationMatrix : hydrationMatrix)[ride.duration][band]

  // ── Fuel ──────────────────────────────────────────────────────────────────
  let fuel: string | null = null
  if (activity === 'running') {
    if (ride.duration === 'long')
      fuel = 'Take a gel or some chews every 30–45 minutes to keep your energy up.'
    else if (ride.duration === 'medium' && ride.intensity === 'hard')
      fuel = 'A gel partway round will help if you\'re pushing the pace.'
  } else {
    if (ride.duration === 'short') {
      if (ride.intensity === 'hard')
        fuel = 'Pop a gel in your pocket in case you go deep. Otherwise no food needed.'
    } else if (ride.duration === 'medium') {
      fuel = 'Pack a couple of energy bars or gels. Aim for something every 45 minutes.'
    } else {
      fuel = 'Bring real food and aim for 60–90g of carbs per hour: bars, gels, a banana, or a sandwich.'
    }
  }

  // ── Electrolytes / heat ─────────────────────────────────────────────────────
  if (band === 'hot') {
    notes.push('Replace salts lost through sweat. An electrolyte tab in your water helps.')
  } else if (band === 'warm' && ride.duration !== 'short') {
    notes.push("Consider an electrolyte tab. You'll be sweating more than it feels.")
  }

  // ── Cold-weather reminder (cycling — runners drink less anyway) ──────────────
  if (activity === 'cycling' && band === 'cold' && ride.duration !== 'short') {
    notes.push("It's easy to forget to drink in the cold. Sip every 15 minutes even if you're not thirsty.")
  }

  // ── Hard + long ─────────────────────────────────────────────────────────────
  if (ride.intensity === 'hard' && ride.duration === 'long') {
    notes.push('Hard and long, so start fuelling in the first 30 minutes, before you feel you need it.')
  }

  return { hydration, fuel, notes }
}
