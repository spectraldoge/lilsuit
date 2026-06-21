import { useState } from 'react'
import type { UserProfile, Gender } from '../types'
import { defaultProfile, saveProfile } from '../store/profileStore'
import { saveActivity } from '../store/activityStore'

interface Props {
  onComplete: (profile: UserProfile) => void
}

const cyclingKit = [
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

const runningKit = [
  { key: 'runLongSleeve', label: 'Long-sleeve top', emoji: '👕' },
  { key: 'runBaseLayer',  label: 'Base layer',      emoji: '👕' },
  { key: 'runJacket',     label: 'Running jacket',  emoji: '🧥' },
  { key: 'runVest',       label: 'Vest / gilet',    emoji: '🦺' },
  { key: 'runLongTights', label: 'Long tights',     emoji: '🦵' },
  { key: 'runCapris',     label: 'Capri tights',    emoji: '🦵' },
  { key: 'runGloves',     label: 'Gloves',          emoji: '🧤' },
  { key: 'runBeanie',     label: 'Beanie',          emoji: '🧢' },
  { key: 'runHeadband',   label: 'Headband',        emoji: '🎽' },
  { key: 'runCap',        label: 'Peaked cap',      emoji: '🧢' },
  { key: 'runBuff',       label: 'Buff / gaiter',   emoji: '🧣' },
]

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [does, setDoes] = useState({ cycling: true, running: false })

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile(p => ({ ...p, [key]: value }))
  }

  function finish() {
    saveProfile(profile)
    // start in whichever activity they picked first
    saveActivity(does.cycling ? 'cycling' : 'running')
    onComplete(profile)
  }

  function KitGrid({ items }: { items: { key: string; label: string; emoji: string }[] }) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => (
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
    )
  }

  const steps: React.ReactNode[] = []

  // Step — welcome / how it works
  steps.push(
    <div key="welcome" className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Welcome to lilsuit</h2>
        <p className="text-zinc-400 text-sm mt-1">Here's how it works.</p>
      </div>
      <div className="flex flex-col gap-4">
        {[
          { emoji: '🌤️', text: 'Each time you open the app, lilsuit checks the weather where you are and tells you exactly what to wear.' },
          { emoji: '⚙️', text: 'Tap Customise to change your location, plan for a different day or time, and set how hard and how long you\'re going.' },
          { emoji: '👤', text: 'Tap the gear icon for Settings, where you update your kit, switch between cycling and running gear, change units, and see your ride history.' },
          { emoji: '📈', text: 'After a ride, tell us if you were too hot or too cold. lilsuit learns and fine-tunes your recommendations over time.' },
        ].map(row => (
          <div key={row.emoji} className="flex items-start gap-3">
            <span className="text-2xl w-8 text-center shrink-0">{row.emoji}</span>
            <p className="text-sm text-zinc-300 leading-snug">{row.text}</p>
          </div>
        ))}
      </div>
    </div>
  )

  // Step — gender + weight
  steps.push(
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
                profile.gender === g ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
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
          type="range" min={45} max={130} step={1}
          value={profile.weightKg}
          onChange={e => set('weightKg', Number(e.target.value))}
          className="accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-zinc-500"><span>45 kg</span><span>130 kg</span></div>
      </div>
    </div>
  )

  // Step — which activities
  steps.push(
    <div key="activities" className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-white">What do you do?</h2>
      <p className="text-zinc-400 text-sm">Pick all that apply. You can switch anytime.</p>
      <div className="flex flex-col gap-3">
        {([['cycling', '🚴 Cycling'], ['running', '🏃 Running']] as ['cycling' | 'running', string][]).map(([a, label]) => (
          <button
            key={a}
            onClick={() => setDoes(d => ({ ...d, [a]: !d[a] }))}
            className={`rounded-2xl p-4 text-left text-lg font-medium transition-all ${
              does[a] ? 'bg-emerald-500/20 ring-2 ring-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )

  // Step — how they feel the cold
  steps.push(
    <div key="temp" className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-white">How do you feel the cold?</h2>
      <p className="text-zinc-400 text-sm">This helps calibrate your recommendations.</p>
      <div className="flex flex-col gap-3">
        {[
          { label: '🔥 I run hot', sub: "I'm usually warm when active", hot: true, cold: false },
          { label: '🌡️ About average', sub: 'Standard conditions work for me', hot: false, cold: false },
          { label: '🥶 I run cold', sub: 'I always need an extra layer', hot: false, cold: true },
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
    </div>
  )

  // Step — cycling kit (only if they cycle)
  if (does.cycling) {
    steps.push(
      <div key="cyclingkit" className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-white">Your cycling kit 🚴</h2>
        <p className="text-zinc-400 text-sm">We'll only suggest what you have.</p>
        <KitGrid items={cyclingKit} />
      </div>
    )
  }

  // Step — running kit (only if they run)
  if (does.running) {
    steps.push(
      <div key="runningkit" className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-white">Your running kit 🏃</h2>
        <p className="text-zinc-400 text-sm">Shorts and a t-shirt are assumed. Tell us the extras you own.</p>
        <KitGrid items={runningKit} />
      </div>
    )
  }

  // Clamp step if the dynamic list shrank (e.g. user deselected an activity)
  const safeStep = Math.min(step, steps.length - 1)
  const isLastStep = safeStep === steps.length - 1
  const onActivityStep = safeStep === 2 // welcome(0), about you(1), activities(2)
  const canAdvance = !onActivityStep || does.cycling || does.running

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
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= safeStep ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1">{steps[safeStep]}</div>

      {/* Nav */}
      <div className="flex gap-3 mt-8">
        {safeStep > 0 && (
          <button
            onClick={() => setStep(safeStep - 1)}
            className="flex-1 rounded-2xl bg-zinc-800 py-4 text-white font-medium hover:bg-zinc-700 transition-all"
          >
            Back
          </button>
        )}
        <button
          disabled={!canAdvance}
          onClick={() => isLastStep ? finish() : setStep(safeStep + 1)}
          className={`flex-1 rounded-2xl py-4 font-medium transition-all ${
            canAdvance ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {isLastStep ? "Let's go" : 'Next'}
        </button>
      </div>
    </div>
  )
}
