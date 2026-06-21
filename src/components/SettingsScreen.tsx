import { useState } from 'react'
import type { UserProfile, Gender } from '../types'
import { saveProfile } from '../store/profileStore'

interface Props {
  profile: UserProfile
  onSave: (profile: UserProfile) => void
  onBack: () => void
}

const kitItems = [
  { key: 'hasGilet',        label: 'Gilet',           emoji: '🦺' },
  { key: 'hasArmWarmers',   label: 'Arm warmers',     emoji: '💪' },
  { key: 'hasLegWarmers',   label: 'Leg warmers',     emoji: '🦵' },
  { key: 'hasThermalBibs',  label: 'Thermal bibs',    emoji: '🩲' },
  { key: 'hasLightJacket',  label: 'Light jacket',    emoji: '🧥' },
  { key: 'hasWinterJacket', label: 'Winter jacket',   emoji: '❄️' },
  { key: 'hasBaseLayer',    label: 'Base layer',      emoji: '👕' },
  { key: 'hasLightGloves',  label: 'Light gloves',    emoji: '🤲' },
  { key: 'hasWinterGloves', label: 'Winter gloves',   emoji: '🧤' },
  { key: 'hasOvershoes',    label: 'Overshoes',       emoji: '🥾' },
  { key: 'hasSkullCap',     label: 'Skull cap',       emoji: '🪖' },
]

export default function SettingsScreen({ profile, onSave, onBack }: Props) {
  const [draft, setDraft] = useState<UserProfile>({ ...profile })

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setDraft(p => ({ ...p, [key]: value }))
  }

  function save() {
    saveProfile(draft)
    onSave(draft)
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-14 pb-6">
        <button
          onClick={onBack}
          className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
      </div>

      <div className="flex flex-col gap-6 px-6">
        {/* Name */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Name</label>
          <input
            type="text"
            value={draft.name}
            onChange={e => set('name', e.target.value)}
            className="rounded-2xl bg-zinc-800 px-5 py-4 text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </section>

        {/* Gender */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {(['male','female','other'] as Gender[]).map(g => (
              <button
                key={g}
                onClick={() => set('gender', g)}
                className={`rounded-2xl py-3 text-sm font-medium capitalize transition-all ${
                  draft.gender === g
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        {/* Weight */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Weight: <span className="text-white normal-case font-medium">{draft.weightKg} kg</span>
          </label>
          <input
            type="range" min={45} max={130} step={1}
            value={draft.weightKg}
            onChange={e => set('weightKg', Number(e.target.value))}
            className="accent-emerald-500"
          />
        </section>

        {/* Running temp */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Running temperature</label>
          <div className="flex flex-col gap-2">
            {[
              { label: '🔥 I run hot', hot: true, cold: false },
              { label: '🌡️ Average', hot: false, cold: false },
              { label: '🥶 I run cold', hot: false, cold: true },
            ].map(opt => (
              <button
                key={opt.label}
                onClick={() => { set('runsHot', opt.hot); set('runsCold', opt.cold) }}
                className={`rounded-2xl py-3 px-4 text-left text-sm font-medium transition-all ${
                  draft.runsHot === opt.hot && draft.runsCold === opt.cold
                    ? 'bg-emerald-500/20 ring-2 ring-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Kit */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">My kit</label>
          <div className="grid grid-cols-2 gap-2">
            {kitItems.map(item => (
              <button
                key={item.key}
                onClick={() => set(item.key as keyof UserProfile, !(draft[item.key as keyof UserProfile]) as any)}
                className={`rounded-2xl p-3 text-left text-sm transition-all ${
                  draft[item.key as keyof UserProfile]
                    ? 'bg-emerald-500/20 ring-2 ring-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                <div className="mt-1 font-medium leading-tight">{item.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Save */}
        <button
          onClick={save}
          className="rounded-2xl bg-emerald-500 py-4 text-white font-medium hover:bg-emerald-400 transition-all mt-2"
        >
          Save
        </button>
      </div>
    </div>
  )
}
