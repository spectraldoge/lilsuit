export type Gender = 'male' | 'female' | 'other'
export type Activity = 'cycling' | 'running'

export interface CustomKitItem {
  id: string
  name: string
  category: 'top' | 'legs' | 'hands' | 'head' | 'feet' | 'extra'
  wearBelowC: number
}

export interface UserProfile {
  name: string
  gender: Gender
  weightKg: number
  hasGilet: boolean
  hasArmWarmers: boolean
  hasLegWarmers: boolean
  hasThermalBibs: boolean
  hasWinterJacket: boolean
  hasLightJacket: boolean
  hasRainJacket: boolean
  hasBaseLayer: boolean
  hasWinterGloves: boolean
  hasLightGloves: boolean
  hasOvershoes: boolean
  hasSkullCap: boolean
  runsHot: boolean
  runsCold: boolean
  customItems: CustomKitItem[]
  units: Units
  // running-specific kit (shorts & t-shirt assumed universal, so not gated)
  runLongSleeve: boolean
  runBaseLayer: boolean
  runJacket: boolean      // windproof / rain running jacket
  runVest: boolean        // running gilet / vest
  runLongTights: boolean
  runCapris: boolean      // three-quarter / capri tights
  runGloves: boolean
  runBeanie: boolean
  runHeadband: boolean
  runCap: boolean         // peaked cap (sun / rain)
  runBuff: boolean        // neck gaiter / buff
}

export interface SavedLocation {
  id: string
  name: string
  lat: number
  lon: number
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
  dateTime: string | null  // ISO string for a future ride, null = ride now
}

export const defaultRideOptions: RideOptions = {
  intensity: 'moderate',
  duration: 'medium',
  timeOfDay: 'morning',
  dateTime: null,
}

export interface OutfitRecommendation {
  items: OutfitItem[]
  headline: string
  tip: string | null
  notes: string[]
  effectiveTempC: number
}

export type FeedbackValue = 'too_hot' | 'just_right' | 'too_cold'

export interface RideResult {
  id: string
  date: string          // when the ride happened (ISO)
  tempC: number         // the felt/air temperature of the ride
  feedback: FeedbackValue
  wore?: string         // optional free-text note of what they wore
  source: 'in_app' | 'manual'
  activity: Activity
}
