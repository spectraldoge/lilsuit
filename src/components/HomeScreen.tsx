import { useState, useEffect, useCallback } from 'react'
import type { UserProfile, WeatherData, OutfitRecommendation, RideOptions, SavedLocation } from '../types'
import { defaultRideOptions } from '../types'
import { fetchWeatherAt, getCurrentLocation, geocodeAddress, reverseGeocode, isLocationDenied } from '../services/weather'
import { getRecommendation, buildShareText } from '../services/outfitAdvisor'
import { getNutrition } from '../services/nutritionAdvisor'
import { getTemperatureBias, saveRide } from '../store/rideHistoryStore'
import { loadLocations, saveLocation } from '../store/locationStore'
import CustomisePanel from './CustomisePanel'
import FeedbackModal from './FeedbackModal'
import LogRideModal from './LogRideModal'

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
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [rideOptions, setRideOptions] = useState<RideOptions>(defaultRideOptions)
  const [showCustomise, setShowCustomise] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showLogRide, setShowLogRide] = useState(false)
  const [feedbackDone, setFeedbackDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [remindersCopied, setRemindersCopied] = useState(false)
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([])
  const [locationSaved, setLocationSaved] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => { setSavedLocations(loadLocations()) }, [])

  const buildOutfit = useCallback((w: WeatherData, opts: RideOptions) => {
    setOutfit(getRecommendation(w, profile, opts, getTemperatureBias(w.feelsLikeC)))
  }, [profile])

  const loadFromCoords = useCallback(async (lat: number, lon: number, label?: string) => {
    setStatus('fetching')
    const w = await fetchWeatherAt(lat, lon, rideOptions.dateTime)
    setWeather(w)
    setCurrentCoords({ lat, lon })
    buildOutfit(w, rideOptions)
    if (label) setLocationLabel(label)
    setStatus('done')
    setFeedbackDone(false)
    setLocationSaved(false)
  }, [rideOptions, buildOutfit])

  const load = useCallback(async () => {
    setStatus('locating')
    setError('')
    try {
      const coords = await getCurrentLocation()
      const cityName = await reverseGeocode(coords.latitude, coords.longitude)
      await loadFromCoords(coords.latitude, coords.longitude, cityName)
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

  const loadFromSaved = useCallback(async (loc: SavedLocation) => {
    await loadFromCoords(loc.lat, loc.lon, loc.name)
  }, [loadFromCoords])

  async function handleRideOptionsChange(opts: RideOptions) {
    // Derive time-of-day from a chosen future time so tips stay consistent
    if (opts.dateTime) {
      const h = new Date(opts.dateTime).getHours()
      opts = { ...opts, timeOfDay: h < 10 ? 'morning' : h < 15 ? 'midday' : 'afternoon' }
    }

    const dateChanged = opts.dateTime !== rideOptions.dateTime
    setRideOptions(opts)

    if (dateChanged && currentCoords) {
      // Re-fetch the forecast for the new time
      setUpdating(true)
      try {
        const w = await fetchWeatherAt(currentCoords.lat, currentCoords.lon, opts.dateTime)
        setWeather(w)
        setOutfit(getRecommendation(w, profile, opts, getTemperatureBias(w.feelsLikeC)))
      } catch (e) {
        setError((e as Error).message ?? 'Could not load that forecast')
      } finally {
        setUpdating(false)
      }
    } else if (weather) {
      setOutfit(getRecommendation(weather, profile, opts, getTemperatureBias(weather.feelsLikeC)))
    }
  }

  function handleSaveLocation() {
    if (!currentCoords || !locationLabel) return
    const saved = saveLocation({ name: locationLabel, lat: currentCoords.lat, lon: currentCoords.lon })
    setSavedLocations(loadLocations())
    setLocationSaved(true)
    return saved
  }

  async function handleShare() {
    if (!outfit) return
    const text = buildShareText(outfit)
    if (navigator.share) {
      await navigator.share({ text })
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleAddToReminders() {
    if (!outfit || !weather) return
    const nutrition = getNutrition(weather, rideOptions)
    const lines = ['🚴 lilsuit ride kit', '']
    outfit.items.forEach(i => lines.push(`• ${i.name}`))
    lines.push('', `• 💧 ${nutrition.hydration}`)
    if (nutrition.fuel) lines.push(`• 🍌 ${nutrition.fuel}`)
    const text = lines.join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ title: 'lilsuit ride kit', text })
      } catch { /* user cancelled the share sheet */ }
    } else {
      await navigator.clipboard.writeText(text)
      setRemindersCopied(true)
      setTimeout(() => setRemindersCopied(false), 2000)
    }
  }

  function handleFeedback(f: 'too_hot' | 'just_right' | 'too_cold') {
    if (weather) saveRide(weather.feelsLikeC, f, { source: 'in_app' })
    setShowFeedback(false)
    setFeedbackDone(true)
  }

  function handleLogRide(tempC: number, f: 'too_hot' | 'just_right' | 'too_cold', wore: string) {
    saveRide(tempC, f, { source: 'manual', wore })
    setShowLogRide(false)
    // Re-apply learning to the current recommendation immediately
    if (weather) setOutfit(getRecommendation(weather, profile, rideOptions, getTemperatureBias(weather.feelsLikeC)))
  }

  useEffect(() => { load() }, [load])

  function daysAhead(iso: string): number {
    const ms = new Date(iso).getTime() - Date.now()
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
  }

  const isMetric = profile.units === 'metric'
  function displayTemp(c: number) {
    return isMetric ? `${c}°` : `${Math.round(c * 9 / 5 + 32)}°`
  }
  function unitLabel() { return isMetric ? 'C' : 'F' }
  function displayWind(kph: number) {
    return isMetric ? `${kph} km/h` : `${Math.round(kph * 0.621)} mph`
  }

  const alreadySaved = currentCoords
    ? savedLocations.some(l => Math.abs(l.lat - currentCoords.lat) < 0.01 && Math.abs(l.lon - currentCoords.lon) < 0.01)
    : false

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

            {/* Saved location chips */}
            {savedLocations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {savedLocations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => loadFromSaved(loc)}
                    className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition-all"
                  >
                    📍 {loc.name.split(',')[0]}
                  </button>
                ))}
              </div>
            )}

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
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
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
            {/* Location row */}
            {locationLabel && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 truncate">📍 {locationLabel.split(',')[0]}</p>
                {!alreadySaved && !locationSaved && (
                  <button
                    onClick={handleSaveLocation}
                    className="text-xs text-emerald-500 hover:text-emerald-400 transition-all shrink-0 ml-2"
                  >
                    Save location
                  </button>
                )}
                {locationSaved && <p className="text-xs text-emerald-500 shrink-0 ml-2">✓ Saved</p>}
              </div>
            )}

            {/* Future forecast banner */}
            {rideOptions.dateTime && (
              <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span>🗓️</span>
                  <p className="text-sm text-blue-300">
                    Forecast for {new Date(rideOptions.dateTime).toLocaleString([], {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                {daysAhead(rideOptions.dateTime) > 7 && (
                  <p className="text-xs text-amber-400/90">
                    ⚠️ That's {daysAhead(rideOptions.dateTime)} days out — accuracy drops beyond a week, so treat this as a rough guide.
                  </p>
                )}
              </div>
            )}

            {/* Weather card */}
            <div className={`rounded-3xl bg-zinc-900 p-5 flex items-center justify-between transition-opacity ${updating ? 'opacity-50' : ''}`}>
              <div>
                <div className="text-5xl font-bold text-white">
                  {displayTemp(weather.tempC)}<span className="text-2xl text-zinc-400">{unitLabel()}</span>
                </div>
                <div className="text-zinc-400 text-sm mt-1">{weather.description}</div>
                <div className="text-zinc-500 text-xs mt-1">
                  Feels {displayTemp(weather.feelsLikeC)}{unitLabel()} · {displayWind(weather.windKph)}
                  {weather.isRaining ? ' · 🌧️ Rain' : ''}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500 mb-1">effective</div>
                <div className="text-3xl font-semibold text-emerald-400">
                  {displayTemp(outfit.effectiveTempC)}{unitLabel()}
                </div>
                <div className="text-xs text-zinc-500 mt-1">for you</div>
              </div>
            </div>

            {/* Headline + tip */}
            <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/30 p-5">
              <p className="text-lg font-semibold text-emerald-400">{outfit.headline}</p>
              {outfit.tip && (
                <p className="text-sm text-zinc-300 mt-2">{outfit.tip}</p>
              )}
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

            {/* Nutrition */}
            {(() => {
              const nutrition = getNutrition(weather, rideOptions)
              return (
                <div className="rounded-3xl bg-zinc-900 p-5 flex flex-col gap-3">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Fuel & hydration</h3>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl w-8 text-center">💧</span>
                    <p className="text-white text-sm leading-snug">{nutrition.hydration}</p>
                  </div>
                  {nutrition.fuel && (
                    <div className="flex items-start gap-4">
                      <span className="text-2xl w-8 text-center">🍌</span>
                      <p className="text-white text-sm leading-snug">{nutrition.fuel}</p>
                    </div>
                  )}
                  {nutrition.notes.map((n, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="text-2xl w-8 text-center">🧂</span>
                      <p className="text-zinc-400 text-sm leading-snug">{n}</p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Active customisation pills */}
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

            {/* Feedback confirmation */}
            {feedbackDone && (
              <p className="text-sm text-emerald-400 text-center">
                ✓ Thanks — we'll calibrate your next recommendation
              </p>
            )}

            {/* Action buttons */}
            <button
              onClick={handleShare}
              className="rounded-2xl bg-zinc-800 py-4 text-white text-sm font-medium hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
            >
              {copied ? '✓ Copied to clipboard' : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share your kit
                </>
              )}
            </button>

            <button
              onClick={handleAddToReminders}
              className="rounded-2xl bg-zinc-800 py-4 text-white text-sm font-medium hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
            >
              {remindersCopied ? '✓ Copied checklist' : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Add to Reminders
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCustomise(true)}
                className="rounded-2xl bg-zinc-800 py-4 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-all"
              >
                ⚙️ Customise
              </button>
              {!feedbackDone ? (
                <button
                  onClick={() => setShowFeedback(true)}
                  className="rounded-2xl bg-zinc-800 py-4 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-all"
                >
                  🌡️ How was it?
                </button>
              ) : (
                <button
                  onClick={load}
                  className="rounded-2xl bg-zinc-800 py-4 text-zinc-400 text-sm font-medium hover:bg-zinc-700 transition-all"
                >
                  ↻ Refresh
                </button>
              )}
            </div>

            <button
              onClick={() => setShowLogRide(true)}
              className="rounded-2xl bg-zinc-900 py-3 text-zinc-500 text-sm font-medium hover:bg-zinc-800 hover:text-zinc-300 transition-all"
            >
              + Log a past ride
            </button>
          </>
        )}
      </div>

      {showCustomise && (
        <CustomisePanel
          options={rideOptions}
          onChange={handleRideOptionsChange}
          onClose={() => setShowCustomise(false)}
        />
      )}

      {showFeedback && (
        <FeedbackModal
          onSelect={handleFeedback}
          onClose={() => setShowFeedback(false)}
        />
      )}

      {showLogRide && (
        <LogRideModal
          units={profile.units}
          onSave={handleLogRide}
          onClose={() => setShowLogRide(false)}
        />
      )}
    </div>
  )
}
