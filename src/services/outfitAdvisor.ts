import type { UserProfile, WeatherData, OutfitRecommendation, OutfitItem, RideOptions } from '../types'

// Heavier riders generate more heat; adjust effective temperature upward
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
  // Women tend to feel cooler at lower temps
  if (profile.gender === 'female') adj -= 1
  return adj
}

function intensityAdjustment(intensity: RideOptions['intensity']): number {
  if (intensity === 'easy') return 0
  if (intensity === 'moderate') return 2
  return 4 // hard effort generates significant heat
}

function durationAdjustment(duration: RideOptions['duration']): number {
  // Long rides: err on the side of warmth since you'll cool at stops
  if (duration === 'short') return 1
  if (duration === 'medium') return 0
  return -1
}

function timeOfDayAdjustment(timeOfDay: RideOptions['timeOfDay']): number {
  // Morning is coldest; factor in temp typically being 2-4° lower
  if (timeOfDay === 'morning') return -2
  if (timeOfDay === 'midday') return 1
  return 0
}

export function getRecommendation(
  weather: WeatherData,
  profile: UserProfile,
  ride: RideOptions
): OutfitRecommendation {
  const baseTemp = weather.feelsLikeC
  const windChill = weather.windKph > 30 ? -2 : weather.windKph > 15 ? -1 : 0
  const effective =
    baseTemp +
    windChill +
    intensityAdjustment(ride.intensity) +
    durationAdjustment(ride.duration) +
    timeOfDayAdjustment(ride.timeOfDay) -
    weightAdjustment(profile.weightKg) -
    personalAdjustment(profile)

  const items: OutfitItem[] = []
  const notes: string[] = []

  // ── Legs ─────────────────────────────────────────────────────────────────
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
  if (effective < 5) {
    if (profile.hasSkullCap)
      items.push({ category: 'head', name: 'Skull cap under helmet', emoji: '🪖' })
  } else if (effective < 10) {
    if (profile.hasSkullCap)
      items.push({ category: 'head', name: 'Skull cap (optional)', emoji: '🪖' })
  }

  // ── Feet ──────────────────────────────────────────────────────────────────
  if (effective < 8) {
    if (profile.hasOvershoes)
      items.push({ category: 'feet', name: 'Overshoes', emoji: '🥾' })
  } else if (effective < 14) {
    if (profile.hasOvershoes)
      items.push({ category: 'feet', name: 'Overshoes (optional)', emoji: '🥾' })
  }

  // ── Rain notes ────────────────────────────────────────────────────────────
  if (weather.isRaining) {
    notes.push('Rain expected — waterproof jacket recommended')
    if (!profile.hasOvershoes)
      notes.push('Consider overshoes to keep feet dry')
  }

  if (weather.windKph > 40)
    notes.push(`Strong wind (${weather.windKph} km/h) — add a windproof layer if you have one`)

  // ── Headline ──────────────────────────────────────────────────────────────
  const headline = headlineFor(effective)

  return { items, headline, notes, effectiveTempC: Math.round(effective) }
}

function headlineFor(temp: number): string {
  if (temp < 0)  return "Proper winter kit today"
  if (temp < 5)  return "Full winter kit"
  if (temp < 10) return "Cold — layer up"
  if (temp < 15) return "Cool — dress smart"
  if (temp < 20) return "Mild — light kit"
  if (temp < 25) return "Warm — keep it simple"
  return "Hot — go minimal"
}
