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
