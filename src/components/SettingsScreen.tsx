import { useState } from 'react'
import type { UserProfile, Gender, CustomKitItem, Units } from '../types'
import { saveProfile } from '../store/profileStore'
import { loadLocations, deleteLocation } from '../store/locationStore'
import { loadHistory, deleteRide } from '../store/rideHistoryStore'
import { loadTheme, saveTheme, applyTheme, type Theme } from '../store/themeStore'

interface Props {
  profile: UserProfile
  onSave: (profile: UserProfile) => void
  onBack: () => void
}

const presetKitItems = [
  { key: 'hasGilet',        label: 'Gilet',           emoji: '🦺' },
  { key: 'hasArmWarmers',   label: 'Arm warmers',     emoji: '💪' },
  { key: 'hasLegWarmers',   label: 'Leg warmers',     emoji: '🦵' },
  { key: 'hasThermalBibs',  label: 'Thermal bibs',    emoji: '🩲' },
  { key: 'hasLightJacket',  label: 'Light jacket',    emoji: '🧥' },
  { key: 'hasWinterJacket', label: 'Winter jacket',   emoji: '❄️' },
  { key: 'hasRainJacket',   label: 'Rain jacket',     emoji: '🌧️' },
  { key: 'hasBaseLayer',    label: 'Base layer',      emoji: '👕' },
  { key: 'hasLightGloves',  label: 'Light gloves',    emoji: '🤲' },
  { key: 'hasWinterGloves', label: 'Winter gloves',   emoji: '🧤' },
  { key: 'hasOvershoes',    label: 'Overshoes',       emoji: '🥾' },
  { key: 'hasSkullCap',     label: 'Skull cap',       emoji: '🪖' },
]

const categoryOptions: { value: CustomKitItem['category']; label: string }[] = [
  { value: 'top',   label: 'Top / jacket' },
  { value: 'legs',  label: 'Legs' },
  { value: 'hands', label: 'Hands' },
  { value: 'head',  label: 'Head' },
  { value: 'feet',  label: 'Feet' },
  { value: 'extra', label: 'Other' },
]

const tempThresholds = [
  { label: 'Below 0°C (freezing)',  value: 0  },
  { label: 'Below 5°C (very cold)', value: 5  },
  { label: 'Below 10°C (cold)',     value: 10 },
  { label: 'Below 15°C (cool)',     value: 15 },
  { label: 'Below 20°C (mild)',     value: 20 },
  { label: 'Always wear it',        value: 99 },
]

const blankItem = (): Omit<CustomKitItem, 'id'> => ({ name: '', category: 'top', wearBelowC: 10 })

export default function SettingsScreen({ profile, onSave, onBack }: Props) {
  const [draft, setDraft] = useState<UserProfile>({ ...profile, customItems: profile.customItems ?? [] })
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState(blankItem())
  const [locations, setLocations] = useState(loadLocations())
  const [history, setHistory] = useState(loadHistory())
  const [theme, setThemeState] = useState<Theme>(loadTheme())

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setDraft(p => ({ ...p, [key]: value }))
  }

  function addCustomItem() {
    if (!newItem.name.trim()) return
    const item: CustomKitItem = { ...newItem, id: crypto.randomUUID() }
    setDraft(p => ({ ...p, customItems: [...p.customItems, item] }))
    setNewItem(blankItem())
    setAddingItem(false)
  }

  function removeCustomItem(id: string) {
    setDraft(p => ({ ...p, customItems: p.customItems.filter(i => i.id !== id) }))
  }

  function handleDeleteLocation(id: string) {
    deleteLocation(id)
    setLocations(loadLocations())
  }

  function handleDeleteRide(id: string) {
    deleteRide(id)
    setHistory(loadHistory())
  }

  const feedbackLabel: Record<string, string> = {
    too_hot: '🥵 Too hot', just_right: '👌 Just right', too_cold: '🥶 Too cold',
  }
  const tempUnit = draft.units === 'metric' ? '°C' : '°F'
  function showTemp(c: number) {
    return draft.units === 'metric' ? `${c}${tempUnit}` : `${Math.round(c * 9 / 5 + 32)}${tempUnit}`
  }

  function handleThemeToggle(t: Theme) {
    setThemeState(t)
    saveTheme(t)
    applyTheme(t)
  }

  function save() {
    saveProfile(draft)
    onSave(draft)
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 pb-12">
      <div className="flex items-center gap-4 px-6 pt-14 pb-6">
        <button onClick={onBack} className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
      </div>

      <div className="flex flex-col gap-6 px-6">

        {/* Gender */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {(['male','female','other'] as Gender[]).map(g => (
              <button key={g} onClick={() => set('gender', g)}
                className={`rounded-2xl py-3 text-sm font-medium capitalize transition-all ${
                  draft.gender === g ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}>{g}</button>
            ))}
          </div>
        </section>

        {/* Weight */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Weight: <span className="text-white normal-case font-medium">{draft.weightKg} kg</span>
          </label>
          <input type="range" min={45} max={130} step={1} value={draft.weightKg}
            onChange={e => set('weightKg', Number(e.target.value))}
            className="accent-emerald-500" />
        </section>

        {/* Running temp */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Running temperature</label>
          <div className="flex flex-col gap-2">
            {[
              { label: '🔥 I run hot', hot: true,  cold: false },
              { label: '🌡️ Average',   hot: false, cold: false },
              { label: '🥶 I run cold', hot: false, cold: true  },
            ].map(opt => (
              <button key={opt.label} onClick={() => { set('runsHot', opt.hot); set('runsCold', opt.cold) }}
                className={`rounded-2xl py-3 px-4 text-left text-sm font-medium transition-all ${
                  draft.runsHot === opt.hot && draft.runsCold === opt.cold
                    ? 'bg-emerald-500/20 ring-2 ring-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}>{opt.label}</button>
            ))}
          </div>
        </section>

        {/* Preset kit */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">My kit</label>
          <div className="grid grid-cols-2 gap-2">
            {presetKitItems.map(item => (
              <button key={item.key}
                onClick={() => set(item.key as keyof UserProfile, !(draft[item.key as keyof UserProfile]) as any)}
                className={`rounded-2xl p-3 text-left text-sm transition-all ${
                  draft[item.key as keyof UserProfile]
                    ? 'bg-emerald-500/20 ring-2 ring-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}>
                <span className="text-lg">{item.emoji}</span>
                <div className="mt-1 font-medium leading-tight">{item.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Custom kit */}
        <section className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Custom kit</label>
          {draft.customItems.length > 0 && (
            <div className="flex flex-col gap-2">
              {draft.customItems.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-zinc-800 px-4 py-3">
                  <div>
                    <div className="text-white text-sm font-medium">{item.name}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">
                      {categoryOptions.find(c => c.value === item.category)?.label} ·{' '}
                      {tempThresholds.find(t => t.value === item.wearBelowC)?.label ?? `Below ${item.wearBelowC}°C`}
                    </div>
                  </div>
                  <button onClick={() => removeCustomItem(item.id)} className="text-zinc-500 hover:text-red-400 transition-all pl-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          {addingItem ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900 p-4">
              <input type="text" placeholder="Item name (e.g. Neck gaiter)" value={newItem.name}
                onChange={e => setNewItem(i => ({ ...i, name: e.target.value }))} autoFocus
                className="rounded-xl bg-zinc-800 px-4 py-3 text-white text-sm placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500" />
              <select value={newItem.category}
                onChange={e => setNewItem(i => ({ ...i, category: e.target.value as CustomKitItem['category'] }))}
                className="rounded-xl bg-zinc-800 px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                {categoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={newItem.wearBelowC}
                onChange={e => setNewItem(i => ({ ...i, wearBelowC: Number(e.target.value) }))}
                className="rounded-xl bg-zinc-800 px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                {tempThresholds.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => setAddingItem(false)}
                  className="flex-1 rounded-xl bg-zinc-800 py-3 text-zinc-400 text-sm font-medium hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={addCustomItem} disabled={!newItem.name.trim()}
                  className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all ${
                    newItem.name.trim() ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}>Add</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingItem(true)}
              className="rounded-2xl border border-dashed border-zinc-700 py-3 text-zinc-400 text-sm hover:border-emerald-500 hover:text-emerald-500 transition-all">
              + Add custom item
            </button>
          )}
        </section>

        {/* Saved locations */}
        <section className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Saved locations</label>
          {locations.length === 0 ? (
            <p className="text-sm text-zinc-500">No saved locations yet. Tap "Save location" after a forecast loads.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {locations.map(loc => (
                <div key={loc.id} className="flex items-center justify-between rounded-2xl bg-zinc-800 px-4 py-3">
                  <div>
                    <div className="text-white text-sm font-medium">📍 {loc.name.split(',')[0]}</div>
                    <div className="text-zinc-500 text-xs mt-0.5 truncate max-w-[200px]">{loc.name}</div>
                  </div>
                  <button onClick={() => handleDeleteLocation(loc.id)} className="text-zinc-500 hover:text-red-400 transition-all pl-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Ride history */}
        <section className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Ride history</label>
          {history.length === 0 ? (
            <p className="text-sm text-zinc-500">No rides logged yet. Rate a ride or log a past one to start fine-tuning your recommendations.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map(ride => (
                <div key={ride.id} className="flex items-center justify-between rounded-2xl bg-zinc-800 px-4 py-3">
                  <div>
                    <div className="text-white text-sm font-medium">
                      {showTemp(ride.tempC)} · {feedbackLabel[ride.feedback]}
                    </div>
                    <div className="text-zinc-500 text-xs mt-0.5">
                      {new Date(ride.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                      {ride.source === 'manual' ? ' · logged' : ''}
                      {ride.wore ? ` · ${ride.wore}` : ''}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteRide(ride.id)} className="text-zinc-500 hover:text-red-400 transition-all pl-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Units */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Units</label>
          <div className="grid grid-cols-2 gap-2">
            {([['metric', '°C / km'], ['imperial', '°F / mi']] as [Units, string][]).map(([u, label]) => (
              <button key={u} onClick={() => set('units', u)}
                className={`rounded-2xl py-3 text-sm font-medium transition-all ${
                  draft.units === u ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}>{label}</button>
            ))}
          </div>
        </section>

        {/* Theme */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Appearance</label>
          <div className="grid grid-cols-2 gap-2">
            {([['dark', '🌑 Dark'], ['light', '☀️ Light']] as [Theme, string][]).map(([t, label]) => (
              <button key={t} onClick={() => handleThemeToggle(t)}
                className={`rounded-2xl py-3 text-sm font-medium transition-all ${
                  theme === t ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}>{label}</button>
            ))}
          </div>
        </section>

        {/* Save */}
        <button onClick={save}
          className="rounded-2xl bg-emerald-500 py-4 text-white font-medium hover:bg-emerald-400 transition-all mt-2">
          Save
        </button>
      </div>
    </div>
  )
}
