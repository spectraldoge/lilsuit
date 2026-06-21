import { useState } from 'react'
import type { UserProfile, Gender } from '../types'
import { defaultProfile, saveProfile } from '../store/profileStore'

interface Props {
  onComplete: (profile: UserProfile) => void
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile(p => ({ ...p, [key]: value }))
  }

  function finish() {
    saveProfile(profile)
    onComplete(profile)
  }

  const steps = [
    // Step 0 — gender + weight
    <div key="body" className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-white">A bit about you</h2>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">Gender</label>
        <div className="grid grid-cols-3 gap-2">
          {(['male','female','other'] as Gender[]).map(g => (
            <button
              key={g}
              onClick={() => set('gender', g)}
              className={`rounded-2xl py-3 text-sm font-medium capitalize transition-all ${
                profile.gender === g
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">Weight: <span className="text-white font-medium">{profile.weightKg} kg</span></label>
        <input
          type="range"
          min={45} max={130} step={1}
          value={profile.weightKg}
          onChange={e => set('weightKg', Number(e.target.value))}
          className="accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>45 kg</span><span>130 kg</span>
        </div>
      </div>
    </div>,

    // Step 2 — running temp
    <div key="temp" className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-white">How do you run?</h2>
      <p className="text-zinc-400 text-sm">This helps calibrate your recommendations.</p>
      <div className="flex flex-col gap-3">
        {[
          { label: '🔥 I run hot', sub: "I'm always warm on the bike", hot: true, cold: false },
          { label: '🌡️ About average', sub: 'Standard conditions work for me', hot: false, cold: false },
          { label: '🥶 I run cold', sub: "I always need an extra layer", hot: false, cold: true },
        ].map(opt => (
          <button
            key={opt.label}
            onClick={() => { set('runsHot', opt.hot); set('runsCold', opt.cold) }}
            className={`rounded-2xl p-4 text-left transition-all ${
              profile.runsHot === opt.hot && profile.runsCold === opt.cold
                ? 'bg-emerald-500/20 ring-2 ring-emerald-500'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            <div className="font-medium text-white">{opt.label}</div>
            <div className="text-sm text-zinc-400">{opt.sub}</div>
          </button>
        ))}
      </div>
    </div>,

    // Step 3 — kit inventory
    <div key="kit" className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-white">What kit do you own?</h2>
      <p className="text-zinc-400 text-sm">We'll only suggest what you have.</p>
      <div className="grid grid-cols-2 gap-2">
        {kitItems.map(item => (
          <button
            key={item.key}
            onClick={() => set(item.key as keyof UserProfile, !(profile[item.key as keyof UserProfile]) as any)}
            className={`rounded-2xl p-3 text-left text-sm transition-all ${
              profile[item.key as keyof UserProfile]
                ? 'bg-emerald-500/20 ring-2 ring-emerald-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <span className="text-lg">{item.emoji}</span>
            <div className="mt-1 font-medium leading-tight">{item.label}</div>
          </button>
        ))}
      </div>
    </div>,
  ]

  const isLastStep = step === steps.length - 1
  const canAdvance = true

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 px-6 pt-16 pb-12">
      {/* Logo */}
      <div className="mb-10">
        <span className="text-3xl font-bold tracking-tight text-white">lilsuit</span>
        <span className="ml-2 text-emerald-500 text-2xl">🚴</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i <= step ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1">{steps[step]}</div>

      {/* Nav */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 rounded-2xl bg-zinc-800 py-4 text-white font-medium hover:bg-zinc-700 transition-all"
          >
            Back
          </button>
        )}
        <button
          disabled={!canAdvance}
          onClick={() => isLastStep ? finish() : setStep(s => s + 1)}
          className={`flex-1 rounded-2xl py-4 font-medium transition-all ${
            canAdvance
              ? 'bg-emerald-500 text-white hover:bg-emerald-400'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {isLastStep ? "Let's go" : 'Next'}
        </button>
      </div>
    </div>
  )
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
