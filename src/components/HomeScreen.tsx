import { useState, useEffect, useCallback } from 'react'
import type { UserProfile, WeatherData, OutfitRecommendation, RideOptions } from '../types'
import { defaultRideOptions } from '../types'
import { fetchWeather, getCurrentLocation, geocodeAddress, isLocationDenied } from '../services/weather'
import { getRecommendation } from '../services/outfitAdvisor'
import CustomisePanel from './CustomisePanel'

interface Props {
  profile: UserProfile
  onOpenSettings: () => void
}

type Status = 'idle' | 'locating' | 'fetching' | 'done' | 'error' | 'needs_address'

export default function HomeScreen({ profile, onOpenSettings }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [outfit, setOutfit] = useState<OutfitRecommendation | null>(null)
  const [error, setError] = useState('')
  const [address, setAddress] = useState('')
  const [locationLabel, setLocationLabel] = useState('')
  const [rideOptions, setRideOptions] = useState<RideOptions>(defaultRideOptions)
  const [showCustomise, setShowCustomise] = useState(false)

  const buildOutfit = useCallback((w: WeatherData, opts: RideOptions) => {
    setOutfit(getRecommendation(w, profile, opts))
  }, [profile])

  const loadFromCoords = useCallback(async (lat: number, lon: number, label?: string) => {
    setStatus('fetching')
    const w = await fetchWeather(lat, lon)
    setWeather(w)
    buildOutfit(w, rideOptions)
    if (label) setLocationLabel(label)
    setStatus('done')
  }, [profile, rideOptions, buildOutfit])

  const load = useCallback(async () => {
    setStatus('locating')
    setError('')
    try {
      const coords = await getCurrentLocation()
      await loadFromCoords(coords.latitude, coords.longitude)
    } catch (e) {
      if (isLocationDenied(e)) {
        setStatus('needs_address')
      } else {
        setError((e as Error).message ?? 'Something went wrong')
        setStatus('error')
      }
    }
  }, [loadFromCoords])

  const loadFromAddress = useCallback(async () => {
    if (!address.trim()) return
    setStatus('fetching')
    setError('')
    try {
      const { lat, lon, displayName } = await geocodeAddress(address.trim())
      await loadFromCoords(lat, lon, displayName)
    } catch (e) {
      setError((e as Error).message ?? 'Could not find that location')
      setStatus('needs_address')
    }
  }, [address, loadFromCoords])

  // Re-compute outfit whenever ride options change (no need to re-fetch weather)
  function handleRideOptionsChange(opts: RideOptions) {
    setRideOptions(opts)
    if (weather) buildOutfit(weather, opts)
  }

  useEffect(() => { load() }, [load])

  const isMetric = rideOptions.units === 'metric'
  function displayTemp(c: number) {
    if (isMetric) return `${c}°C`
    return `${Math.round(c * 9 / 5 + 32)}°F`
  }
  function displayWind(kph: number) {
    if (isMetric) return `${kph} km/h`
    return `${Math.round(kph * 0.621)} mph`
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-14 pb-4">
        <span className="text-2xl font-bold tracking-tight text-white">
          lilsuit <span className="text-emerald-500">🚴</span>
        </span>
        <button
          onClick={onOpenSettings}
          className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all"
          aria-label="Settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 px-6 flex flex-col gap-4">
        {/* Loading */}
        {(status === 'locating' || status === 'fetching') && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-zinc-400">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p>{status === 'locating' ? 'Getting your location…' : 'Checking the weather…'}</p>
          </div>
        )}

        {/* Location denied */}
        {status === 'needs_address' && (
          <div className="flex flex-col justify-center flex-1 gap-5">
            <div className="text-center">
              <span className="text-4xl">📍</span>
              <h2 className="text-xl font-semibold text-white mt-3">Where are you riding?</h2>
              <p className="text-zinc-400 text-sm mt-1">Enter a city, town, or postcode</p>
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <input
              type="text"
              placeholder="e.g. London, SW1A 1AA, Paris…"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadFromAddress()}
              autoFocus
              className="w-full rounded-2xl bg-zinc-800 px-5 py-4 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={loadFromAddress}
              disabled={!address.trim()}
              className={`rounded-2xl py-4 font-medium transition-all ${
                address.trim()
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              Get forecast
            </button>
          </div>
        )}

        {/* Generic error */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center">
            <span className="text-4xl">😬</span>
            <p className="text-zinc-400">{error}</p>
            <button onClick={load} className="rounded-2xl bg-emerald-500 px-6 py-3 text-white font-medium hover:bg-emerald-400 transition-all">
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {status === 'done' && weather && outfit && (
          <>
            {locationLabel && (
              <p className="text-xs text-zinc-500 truncate">📍 {locationLabel}</p>
            )}

            {/* Weather card */}
            <div className="rounded-3xl bg-zinc-900 p-5 flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold text-white">{displayTemp(weather.tempC)}</div>
                <div className="text-zinc-400 text-sm mt-1">{weather.description}</div>
                <div className="text-zinc-500 text-xs mt-1">
                  Feels {displayTemp(weather.feelsLikeC)} · Wind {displayWind(weather.windKph)}
                  {weather.isRaining ? ' · 🌧️ Rain' : ''}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500 mb-1">effective temp</div>
                <div className="text-3xl font-semibold text-emerald-400">{displayTemp(outfit.effectiveTempC)}</div>
                <div className="text-xs text-zinc-500 mt-1">for you</div>
              </div>
            </div>

            {/* Headline */}
            <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/30 p-5">
              <p className="text-lg font-semibold text-emerald-400">{outfit.headline}</p>
              {outfit.notes.map((n, i) => (
                <p key={i} className="text-sm text-zinc-400 mt-1">⚠️ {n}</p>
              ))}
            </div>

            {/* Kit list */}
            <div className="rounded-3xl bg-zinc-900 p-5 flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Your kit</h3>
              {outfit.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-2xl w-8 text-center">{item.emoji}</span>
                  <div>
                    <div className="text-white text-sm font-medium">{item.name}</div>
                    <div className="text-zinc-500 text-xs capitalize">{item.category}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active customisations summary */}
            {(rideOptions.intensity !== 'moderate' || rideOptions.duration !== 'medium' || rideOptions.timeOfDay !== 'morning') && (
              <div className="flex flex-wrap gap-2">
                {rideOptions.intensity !== 'moderate' && (
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                    {rideOptions.intensity === 'easy' ? '🐢 Easy' : '🔥 Hard'}
                  </span>
                )}
                {rideOptions.duration !== 'medium' && (
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                    {rideOptions.duration === 'short' ? '⚡ Short' : '🌄 Long'}
                  </span>
                )}
                {rideOptions.timeOfDay !== 'morning' && (
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                    {rideOptions.timeOfDay === 'midday' ? '☀️ Midday' : '🌇 Afternoon'}
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <button
              onClick={() => setShowCustomise(true)}
              className="rounded-2xl bg-zinc-800 py-4 text-white text-sm font-medium hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Customise ride
            </button>

            <button
              onClick={load}
              className="rounded-2xl bg-zinc-900 py-4 text-zinc-500 text-sm font-medium hover:bg-zinc-800 transition-all"
            >
              Refresh weather
            </button>
          </>
        )}
      </div>

      {/* Customise panel */}
      {showCustomise && (
        <CustomisePanel
          options={rideOptions}
          onChange={handleRideOptionsChange}
          onClose={() => setShowCustomise(false)}
        />
      )}
    </div>
  )
}
