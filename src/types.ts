export type Gender = 'male' | 'female' | 'other'

export interface UserProfile {
  name: string
  gender: Gender
  weightKg: number
  // kit preferences
  hasGilet: boolean
  hasArmWarmers: boolean
  hasLegWarmers: boolean
  hasThermalBibs: boolean
  hasWinterJacket: boolean
  hasLightJacket: boolean
  hasBaseLayer: boolean
  hasWinterGloves: boolean
  hasLightGloves: boolean
  hasOvershoes: boolean
  hasSkullCap: boolean
  // personal running temp
  runsHot: boolean  // feels warmer than average
  runsCold: boolean // feels cooler than average
  // user-defined kit
  customItems: CustomKitItem[]
}

export interface CustomKitItem {
  id: string
  name: string
  category: 'top' | 'legs' | 'hands' | 'head' | 'feet' | 'extra'
  wearBelowC: number  // include in recommendation when effective temp is below this
}

export interface WeatherData {
  tempC: number
  feelsLikeC: number
  windKph: number
  precipMm: number
  description: string
  isRaining: boolean
}

export interface OutfitItem {
  category: 'top' | 'legs' | 'hands' | 'head' | 'feet' | 'extra'
  name: string
  emoji: string
}

export type Intensity = 'easy' | 'moderate' | 'hard'
export type Duration = 'short' | 'medium' | 'long'
export type TimeOfDay = 'morning' | 'midday' | 'afternoon'
export type Units = 'metric' | 'imperial'

export interface RideOptions {
  intensity: Intensity
  duration: Duration
  timeOfDay: TimeOfDay
  units: Units
}

export const defaultRideOptions: RideOptions = {
  intensity: 'moderate',
  duration: 'medium',
  timeOfDay: 'morning',
  units: 'metric',
}

export interface OutfitRecommendation {
  items: OutfitItem[]
  headline: string
  notes: string[]
  effectiveTempC: number
}

// Stubs for future feedback + wardrobe features
export interface RideResult {
  id: string
  date: string
  weatherSnapshot: WeatherData
  outfitSnapshot: OutfitItem[]
  feedback: 'too_hot' | 'just_right' | 'too_cold'
}

export interface WardrobeItem {
  id: string
  name: string
  category: OutfitItem['category']
  warmthRating: 1 | 2 | 3 | 4 | 5
}
