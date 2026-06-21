import type { UserProfile } from '../types'

const KEY = 'lilsuit_profile'

export const defaultProfile: UserProfile = {
  name: '',
  gender: 'male',
  weightKg: 75,
  hasGilet: true,
  hasArmWarmers: true,
  hasLegWarmers: false,
  hasThermalBibs: true,
  hasWinterJacket: false,
  hasLightJacket: true,
  hasRainJacket: false,
  hasBaseLayer: true,
  hasWinterGloves: true,
  hasLightGloves: true,
  hasOvershoes: false,
  hasSkullCap: true,
  runsHot: false,
  runsCold: false,
  customItems: [],
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // migrate older saved profiles
    if (!parsed.customItems) parsed.customItems = []
    if (parsed.hasRainJacket === undefined) parsed.hasRainJacket = false
    return parsed
  } catch {
    return null
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile))
}
