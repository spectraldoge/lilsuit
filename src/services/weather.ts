import type { WeatherData } from '../types'

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,wind_speed_10m,precipitation,weather_code` +
    `&wind_speed_unit=kmh&timezone=auto`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather fetch failed')
  const data = await res.json()
  const c = data.current

  const code: number = c.weather_code
  const isRaining = [51,53,55,61,63,65,71,73,75,80,81,82,95,96,99].includes(code)

  return {
    tempC: Math.round(c.temperature_2m),
    feelsLikeC: Math.round(c.apparent_temperature),
    windKph: Math.round(c.wind_speed_10m),
    precipMm: c.precipitation,
    description: weatherDescription(code),
    isRaining,
  }
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number; displayName: string }> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  if (!res.ok) throw new Error('Geocoding failed')
  const results = await res.json()
  if (!results.length) throw new Error(`Couldn't find "${address}" — try a city or postcode`)
  const { lat, lon, display_name } = results[0]
  return { lat: parseFloat(lat), lon: parseFloat(lon), displayName: display_name }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    if (!res.ok) return ''
    const data = await res.json()
    return data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''
  } catch {
    return ''
  }
}

export function getCurrentLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(err),
      { timeout: 10000, enableHighAccuracy: false }
    )
  })
}

export function isLocationDenied(err: unknown): boolean {
  return err instanceof GeolocationPositionError && err.code === GeolocationPositionError.PERMISSION_DENIED
}

function weatherDescription(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code <= 49) return 'Foggy'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rainy'
  if (code <= 77) return 'Snowy'
  if (code <= 82) return 'Showers'
  return 'Stormy'
}
