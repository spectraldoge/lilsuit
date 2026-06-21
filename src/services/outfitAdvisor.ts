import type { UserProfile, WeatherData, OutfitRecommendation, OutfitItem, RideOptions } from '../types'

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
  tempBias = 0
): OutfitRecommendation {
  const baseTemp = weather.feelsLikeC
  const windChill = weather.windKph > 30 ? -2 : weather.windKph > 15 ? -1 : 0
  const effective =
    baseTemp +
    windChill +
    intensityAdjustment(ride.intensity) +
    durationAdjustment(ride.duration) +
    timeOfDayAdjustment(ride.timeOfDay) +
    tempBias -
    weightAdjustment(profile.weightKg) -
    personalAdjustment(profile)

  const items: OutfitItem[] = []
  const notes: string[] = []

  // ── Legs ──────────────────────────────────────────────────────────────────
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

  // ── Top ───────────────────────────────────────────────────────────────────
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

  // ── Hands ─────────────────────────────────────────────────────────────────
  if (effective < 5) {
    if (profile.hasWinterGloves)
      items.push({ category: 'hands', name: 'Winter gloves', emoji: '🧤' })
    else
      items.push({ category: 'hands', name: 'Full-finger gloves', emoji: '🧤' })
  } else if (effective < 12) {
    if (profile.hasLightGloves)
      items.push({ category: 'hands', name: 'Light gloves', emoji: '🧤' })
    else
      items.push({ category: 'hands', name: 'Full-finger gloves', emoji: '🧤' })
  } else if (effective < 17) {
    items.push({ category: 'hands', name: 'Fingerless gloves (optional)', emoji: '🤲' })
  }

  // ── Head ──────────────────────────────────────────────────────────────────
  if (effective < 5 && profile.hasSkullCap)
    items.push({ category: 'head', name: 'Skull cap under helmet', emoji: '🪖' })
  else if (effective < 10 && profile.hasSkullCap)
    items.push({ category: 'head', name: 'Skull cap (optional)', emoji: '🪖' })

  // ── Feet ──────────────────────────────────────────────────────────────────
  if (effective < 8 && profile.hasOvershoes)
    items.push({ category: 'feet', name: 'Overshoes', emoji: '🥾' })
  else if (effective < 14 && profile.hasOvershoes)
    items.push({ category: 'feet', name: 'Overshoes (optional)', emoji: '🥾' })

  // ── Rain ──────────────────────────────────────────────────────────────────
  if (weather.isRaining) {
    if (profile.hasRainJacket)
      items.push({ category: 'top', name: 'Rain jacket', emoji: '🌧️' })
    else
      notes.push('Rain expected — waterproof jacket recommended')
    if (!profile.hasOvershoes)
      notes.push('Overshoes would keep your feet dry')
  }

  if (weather.windKph > 40)
    notes.push(`Strong wind (${weather.windKph} km/h) — add a windproof layer if you have one`)

  // ── Custom kit ────────────────────────────────────────────────────────────
  for (const item of profile.customItems) {
    if (effective < item.wearBelowC) {
      const emojiMap: Record<string, string> = {
        top: '👕', legs: '🦵', hands: '🧤', head: '🪖', feet: '🥾', extra: '🎽',
      }
      items.push({ category: item.category, name: item.name, emoji: emojiMap[item.category] ?? '🎽' })
    }
  }

  const headline = headlineFor(effective)
  const tip = getRideTip(weather, ride, effective)

  return { items, headline, tip, notes, effectiveTempC: Math.round(effective) }
}

function headlineFor(temp: number): string {
  if (temp < 0)  return 'Proper winter kit today'
  if (temp < 5)  return 'Full winter kit'
  if (temp < 10) return 'Cold — layer up'
  if (temp < 15) return 'Cool — dress smart'
  if (temp < 20) return 'Mild — light kit'
  if (temp < 25) return 'Warm — keep it simple'
  return 'Hot — go minimal'
}

function getRideTip(weather: WeatherData, ride: RideOptions, effective: number): string | null {
  if (ride.timeOfDay === 'morning' && effective < 15 && ride.duration !== 'short')
    return "You'll warm up after 20–30 mins — a gilet or arm warmers in your pocket is good insurance."
  if (ride.intensity === 'hard' && effective > 15)
    return "Hard efforts generate a lot of heat — start feeling slightly cool and you'll be perfect at pace."
  if (ride.duration === 'long' && ride.timeOfDay !== 'midday')
    return "Long ride: pack an extra layer — you'll cool down fast whenever you stop."
  if (weather.isRaining && ride.duration === 'long')
    return "Wet kit in the cold gets heavy. A dry base layer change at the halfway mark makes a big difference."
  if (effective > 25)
    return "Stay on top of hydration — at this temp you'll sweat more than you realise."
  if (ride.intensity === 'easy' && effective < 10)
    return "Easy pace means less body heat — dress one layer warmer than you think."
  return null
}

export function buildShareText(outfit: OutfitRecommendation): string {
  const legs  = outfit.items.find(i => i.category === 'legs')
  const tops  = outfit.items.filter(i => i.category === 'top' && !i.name.toLowerCase().includes('base layer'))
  const hands = outfit.items.find(i => i.category === 'hands')

  const parts: string[] = []
  if (legs)  parts.push(legs.name.toLowerCase())
  tops.forEach(t => parts.push(t.name.toLowerCase()))
  if (hands && !hands.name.includes('optional')) parts.push(hands.name.toLowerCase())

  const joined = parts.length <= 1
    ? parts[0] ?? 'my kit'
    : parts.slice(0, -1).join(', ') + ' and ' + parts.at(-1)

  return `Heading out in ${joined}, thanks to lilsuit.netlify.app 🚴`
}
