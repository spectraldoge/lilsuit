import type { UserProfile, WeatherData, OutfitRecommendation, OutfitItem, RideOptions, Activity } from '../types'

function weightAdjustment(kg: number): number {
  if (kg < 60) return -1
  if (kg < 75) return 0
  if (kg < 90) return 1
  return 2
}

function personalAdjustment(profile: UserProfile): number {
  let adj = 0
  if (profile.runsHot) adj += 2
  if (profile.runsCold) adj -= 2
  if (profile.gender === 'female') adj -= 1
  return adj
}

function intensityAdjustment(intensity: RideOptions['intensity']): number {
  if (intensity === 'easy') return 0
  if (intensity === 'moderate') return 2
  return 4
}

function durationAdjustment(duration: RideOptions['duration']): number {
  if (duration === 'short') return 1
  if (duration === 'medium') return 0
  return -1
}

function timeOfDayAdjustment(timeOfDay: RideOptions['timeOfDay']): number {
  if (timeOfDay === 'morning') return -2
  if (timeOfDay === 'midday') return 1
  return 0
}

export function getRecommendation(
  weather: WeatherData,
  profile: UserProfile,
  ride: RideOptions,
  tempBias = 0,
  activity: Activity = 'cycling'
): OutfitRecommendation {
  // When we have a real forecast for a specific hour, the temperature already
  // reflects the time of day — so skip the manual morning/midday adjustment.
  const todAdjustment = ride.dateTime ? 0 : timeOfDayAdjustment(ride.timeOfDay)

  // Runners generate more heat and don't get a cyclist's fast-air windchill,
  // so they should dress lighter — nudge the effective temperature up.
  const runningOffset = activity === 'running' ? 3 : 0

  const baseTemp = weather.feelsLikeC
  const windChill = weather.windKph > 30 ? -2 : weather.windKph > 15 ? -1 : 0
  const effective =
    baseTemp +
    windChill +
    intensityAdjustment(ride.intensity) +
    durationAdjustment(ride.duration) +
    todAdjustment +
    runningOffset +
    tempBias -
    weightAdjustment(profile.weightKg) -
    personalAdjustment(profile)

  const { items, notes } = activity === 'running'
    ? buildRunningItems(effective, weather, profile)
    : buildCyclingItems(effective, weather, profile)

  // ── Custom kit (applies to both activities) ─────────────────────────────────
  for (const item of profile.customItems) {
    if (effective < item.wearBelowC) {
      const emojiMap: Record<string, string> = {
        top: '👕', legs: '🦵', hands: '🧤', head: '🪖', feet: '🥾', extra: '🎽',
      }
      items.push({ category: item.category, name: item.name, emoji: emojiMap[item.category] ?? '🎽' })
    }
  }

  const headline = headlineFor(effective)
  const tip = activity === 'running'
    ? getRunTip(weather, ride, effective)
    : getRideTip(weather, ride, effective)

  return { items, headline, tip, notes, effectiveTempC: Math.round(effective) }
}

// ── Cycling ───────────────────────────────────────────────────────────────────
function buildCyclingItems(effective: number, weather: WeatherData, profile: UserProfile) {
  const items: OutfitItem[] = []
  const notes: string[] = []

  // Legs
  if (effective < 8) {
    if (profile.hasThermalBibs) {
      items.push({ category: 'legs', name: 'Thermal bib tights', emoji: '🦵' })
    } else {
      items.push({ category: 'legs', name: 'Bib tights', emoji: '🦵' })
      if (profile.hasLegWarmers)
        items.push({ category: 'legs', name: 'Leg warmers underneath', emoji: '🦵' })
    }
  } else if (effective < 14) {
    items.push({ category: 'legs', name: 'Bib tights', emoji: '🦵' })
  } else if (effective < 18) {
    if (profile.hasLegWarmers) {
      items.push({ category: 'legs', name: 'Bib shorts + leg warmers', emoji: '🦵' })
    } else {
      items.push({ category: 'legs', name: 'Bib tights', emoji: '🦵' })
    }
  } else {
    items.push({ category: 'legs', name: 'Bib shorts', emoji: '🩳' })
  }

  // Top
  if (effective < 5) {
    if (profile.hasBaseLayer)
      items.push({ category: 'top', name: 'Thermal base layer', emoji: '👕' })
    items.push({ category: 'top', name: 'Winter jersey', emoji: '🧥' })
    if (profile.hasWinterJacket)
      items.push({ category: 'top', name: 'Winter jacket', emoji: '🧥' })
    else if (profile.hasLightJacket)
      items.push({ category: 'top', name: 'Light jacket (layered)', emoji: '🧥' })
  } else if (effective < 10) {
    if (profile.hasBaseLayer)
      items.push({ category: 'top', name: 'Light base layer', emoji: '👕' })
    items.push({ category: 'top', name: 'Thermal jersey', emoji: '👕' })
    if (profile.hasGilet)
      items.push({ category: 'top', name: 'Gilet', emoji: '🦺' })
    else if (profile.hasLightJacket)
      items.push({ category: 'top', name: 'Light jacket', emoji: '🧥' })
  } else if (effective < 15) {
    items.push({ category: 'top', name: 'Long-sleeve jersey', emoji: '👕' })
    if (profile.hasGilet)
      items.push({ category: 'top', name: 'Gilet', emoji: '🦺' })
    else if (profile.hasArmWarmers)
      items.push({ category: 'top', name: 'Arm warmers', emoji: '💪' })
  } else if (effective < 20) {
    items.push({ category: 'top', name: 'Short-sleeve jersey', emoji: '👕' })
    if (profile.hasArmWarmers)
      items.push({ category: 'extra', name: 'Arm warmers (in pocket)', emoji: '💪' })
  } else {
    items.push({ category: 'top', name: 'Short-sleeve jersey', emoji: '👕' })
  }

  // Hands
  if (effective < 5) {
    items.push({ category: 'hands', name: profile.hasWinterGloves ? 'Winter gloves' : 'Full-finger gloves', emoji: '🧤' })
  } else if (effective < 12) {
    items.push({ category: 'hands', name: profile.hasLightGloves ? 'Light gloves' : 'Full-finger gloves', emoji: '🧤' })
  } else if (effective < 17) {
    items.push({ category: 'hands', name: 'Fingerless gloves (optional)', emoji: '🤲' })
  }

  // Head
  if (effective < 5 && profile.hasSkullCap)
    items.push({ category: 'head', name: 'Skull cap under helmet', emoji: '🪖' })
  else if (effective < 10 && profile.hasSkullCap)
    items.push({ category: 'head', name: 'Skull cap (optional)', emoji: '🪖' })

  // Feet
  if (effective < 8 && profile.hasOvershoes)
    items.push({ category: 'feet', name: 'Overshoes', emoji: '🥾' })
  else if (effective < 14 && profile.hasOvershoes)
    items.push({ category: 'feet', name: 'Overshoes (optional)', emoji: '🥾' })

  // Rain
  if (weather.isRaining) {
    if (profile.hasRainJacket)
      items.push({ category: 'top', name: 'Rain jacket', emoji: '🌧️' })
    else
      notes.push('Rain expected. Waterproof jacket recommended')
    if (!profile.hasOvershoes)
      notes.push('Overshoes would keep your feet dry')
  }
  if (weather.windKph > 40)
    notes.push(`Strong wind (${weather.windKph} km/h). Add a windproof layer if you have one`)

  return { items, notes }
}

// ── Running ─────────────────────────────────────────────────────────────────
function buildRunningItems(effective: number, weather: WeatherData, profile: UserProfile) {
  const items: OutfitItem[] = []
  const notes: string[] = []

  // Legs
  if (effective < 5) {
    items.push({ category: 'legs', name: profile.runLongTights ? 'Long tights' : 'Tights', emoji: '🦵' })
  } else if (effective < 10) {
    if (profile.runCapris) items.push({ category: 'legs', name: 'Capri / three-quarter tights', emoji: '🦵' })
    else items.push({ category: 'legs', name: profile.runLongTights ? 'Long tights' : 'Shorts', emoji: '🦵' })
  } else if (effective < 14) {
    if (profile.runCapris) items.push({ category: 'legs', name: 'Capri tights or shorts', emoji: '🩳' })
    else items.push({ category: 'legs', name: 'Shorts', emoji: '🩳' })
  } else {
    items.push({ category: 'legs', name: 'Shorts', emoji: '🩳' })
  }

  // Top
  if (effective < 0) {
    if (profile.runBaseLayer) items.push({ category: 'top', name: 'Thermal base layer', emoji: '👕' })
    items.push({ category: 'top', name: 'Long-sleeve top', emoji: '👕' })
    if (profile.runJacket) items.push({ category: 'top', name: 'Running jacket', emoji: '🧥' })
    else if (profile.runVest) items.push({ category: 'top', name: 'Vest over the top', emoji: '🦺' })
  } else if (effective < 6) {
    items.push({ category: 'top', name: 'Long-sleeve top', emoji: '👕' })
    if (profile.runVest) items.push({ category: 'top', name: 'Vest', emoji: '🦺' })
    else if (profile.runJacket) items.push({ category: 'top', name: 'Light running jacket', emoji: '🧥' })
  } else if (effective < 11) {
    items.push({ category: 'top', name: 'Long-sleeve top', emoji: '👕' })
    if (profile.runVest) items.push({ category: 'extra', name: 'Vest (easy to stash)', emoji: '🦺' })
  } else if (effective < 15) {
    items.push({ category: 'top', name: 'T-shirt', emoji: '👕' })
    if (profile.runLongSleeve)
      items.push({ category: 'extra', name: 'Long-sleeve to start (tie round waist later)', emoji: '👕' })
  } else if (effective < 22) {
    items.push({ category: 'top', name: 'T-shirt', emoji: '👕' })
  } else {
    items.push({ category: 'top', name: 'Singlet / vest top', emoji: '🎽' })
  }

  // Hands
  if (effective < 2) {
    items.push({ category: 'hands', name: profile.runGloves ? 'Gloves' : 'Gloves (worth getting)', emoji: '🧤' })
  } else if (effective < 8 && profile.runGloves) {
    items.push({ category: 'hands', name: 'Light gloves', emoji: '🧤' })
  }

  // Head
  if (effective < 3) {
    if (profile.runBeanie) items.push({ category: 'head', name: 'Beanie', emoji: '🧢' })
  } else if (effective < 8) {
    if (profile.runHeadband) items.push({ category: 'head', name: 'Headband / ear cover', emoji: '🎽' })
    else if (profile.runBeanie) items.push({ category: 'head', name: 'Light beanie (optional)', emoji: '🧢' })
  } else if (effective > 22 && profile.runCap) {
    items.push({ category: 'head', name: 'Peaked cap (sun)', emoji: '🧢' })
  }

  // Neck
  if (effective < 5 && profile.runBuff)
    items.push({ category: 'extra', name: 'Buff / neck gaiter', emoji: '🧣' })

  // Rain
  if (weather.isRaining) {
    if (profile.runJacket) items.push({ category: 'top', name: 'Running jacket', emoji: '🌧️' })
    else notes.push('Rain expected. A light waterproof running jacket helps')
    if (profile.runCap) items.push({ category: 'head', name: 'Peaked cap (keeps rain off your face)', emoji: '🧢' })
  }
  if (weather.windKph > 40)
    notes.push(`Strong wind (${weather.windKph} km/h). A windproof layer makes a big difference`)

  return { items, notes }
}

function headlineFor(temp: number): string {
  if (temp < 0)  return 'Proper winter kit today'
  if (temp < 5)  return 'Full winter kit'
  if (temp < 10) return 'Cold. Layer up'
  if (temp < 15) return 'Cool. Dress smart'
  if (temp < 20) return 'Mild. Light kit'
  if (temp < 25) return 'Warm. Keep it simple'
  return 'Hot. Go minimal'
}

function getRideTip(weather: WeatherData, ride: RideOptions, effective: number): string | null {
  if (ride.timeOfDay === 'morning' && effective < 15 && ride.duration !== 'short')
    return "You'll warm up after 20–30 mins. A gilet or arm warmers in your pocket is good insurance."
  if (ride.intensity === 'hard' && effective > 15)
    return "Hard efforts generate a lot of heat. Start feeling slightly cool and you'll be perfect at pace."
  if (ride.duration === 'long' && ride.timeOfDay !== 'midday')
    return "Long ride: pack an extra layer. You'll cool down fast whenever you stop."
  if (weather.isRaining && ride.duration === 'long')
    return "Wet kit in the cold gets heavy. A dry base layer change at the halfway mark makes a big difference."
  if (effective > 25)
    return "Stay on top of hydration. At this temp you'll sweat more than you realise."
  if (ride.intensity === 'easy' && effective < 10)
    return "Easy pace means less body heat. Dress one layer warmer than you think."
  return null
}

function getRunTip(weather: WeatherData, ride: RideOptions, effective: number): string | null {
  if (effective < 12)
    return "Dress so you feel slightly cool standing still. You'll warm up within the first kilometre."
  if (ride.intensity === 'hard' && effective > 15)
    return 'Hard session in the warmth. Start a touch cool and you’ll be glad of it at pace.'
  if (effective > 24)
    return 'Hot out there. Run easier than planned, seek shade, and drink before you feel thirsty.'
  if (weather.isRaining)
    return 'A peaked cap keeps the rain out of your eyes, often more useful than a jacket.'
  if (ride.duration === 'long')
    return 'Long run: a layer you can tie round your waist beats one you have to carry.'
  return null
}

export function buildShareText(outfit: OutfitRecommendation, activity: Activity = 'cycling'): string {
  const legs  = outfit.items.find(i => i.category === 'legs')
  const tops  = outfit.items.filter(i => i.category === 'top' && !i.name.toLowerCase().includes('base layer'))
  const hands = outfit.items.find(i => i.category === 'hands')

  const parts: string[] = []
  if (legs)  parts.push(legs.name.toLowerCase())
  tops.forEach(t => parts.push(t.name.toLowerCase()))
  if (hands && !hands.name.includes('optional') && !hands.name.includes('worth getting')) parts.push(hands.name.toLowerCase())

  const joined = parts.length <= 1
    ? parts[0] ?? 'my kit'
    : parts.slice(0, -1).join(', ') + ' and ' + parts.at(-1)

  const verb = activity === 'running' ? 'Running' : 'Heading out'
  const emoji = activity === 'running' ? '🏃' : '🚴'
  return `${verb} in ${joined}, thanks to lilsuit.netlify.app ${emoji}`
}
