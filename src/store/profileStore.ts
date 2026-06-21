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
  hasBaseLayer: true,
  hasWinterGloves: true,
  hasLightGloves: true,
  hasOvershoes: false,
  hasSkullCap: true,
  runsHot: false,
  runsCold: false,
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile))
}
