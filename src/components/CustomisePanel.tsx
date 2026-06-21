import type { RideOptions } from '../types'

interface Props {
  options: RideOptions
  onChange: (options: RideOptions) => void
  onClose: () => void
}

type OptionItem<T extends string> = { value: T; label: string; sub: string }

const intensityOptions: OptionItem<RideOptions['intensity']>[] = [
  { value: 'easy',     label: '🐢 Easy',     sub: 'Recovery spin or café ride' },
  { value: 'moderate', label: '🚴 Moderate',  sub: 'Steady endurance pace' },
  { value: 'hard',     label: '🔥 Hard',      sub: 'Intervals, racing, or big efforts' },
]

const durationOptions: OptionItem<RideOptions['duration']>[] = [
  { value: 'short',  label: '⚡ Short',   sub: 'Under an hour' },
  { value: 'medium', label: '🕐 Medium',  sub: '1–3 hours' },
  { value: 'long',   label: '🌄 Long',    sub: '3+ hours' },
]

const timeOptions: OptionItem<RideOptions['timeOfDay']>[] = [
  { value: 'morning',   label: '🌅 Morning',   sub: 'Before 10am — coldest part of the day' },
  { value: 'midday',    label: '☀️ Midday',    sub: '10am–3pm — warmest' },
  { value: 'afternoon', label: '🌇 Afternoon', sub: 'After 3pm — cooling down' },
]

const unitOptions: OptionItem<RideOptions['units']>[] = [
  { value: 'metric',   label: '°C / km',  sub: 'Celsius and kilometres' },
  { value: 'imperial', label: '°F / mi',  sub: 'Fahrenheit and miles' },
]

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: OptionItem<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{label}</p>
      <div className="flex flex-col gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-2xl p-4 text-left transition-all ${
              value === opt.value
                ? 'bg-emerald-500/20 ring-2 ring-emerald-500'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            <div className="font-medium text-white text-sm">{opt.label}</div>
            <div className="text-zinc-400 text-xs mt-0.5">{opt.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function CustomisePanel({ options, onChange, onClose }: Props) {
  function set<K extends keyof RideOptions>(key: K, value: RideOptions[K]) {
    onChange({ ...options, [key]: value })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Customise ride</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-10 flex flex-col gap-6">
          <OptionGroup
            label="Intensity"
            options={intensityOptions}
            value={options.intensity}
            onChange={v => set('intensity', v)}
          />
          <OptionGroup
            label="Duration"
            options={durationOptions}
            value={options.duration}
            onChange={v => set('duration', v)}
          />
          <OptionGroup
            label="Time of day"
            options={timeOptions}
            value={options.timeOfDay}
            onChange={v => set('timeOfDay', v)}
          />
          <OptionGroup
            label="Units"
            options={unitOptions}
            value={options.units}
            onChange={v => set('units', v)}
          />
        </div>
      </div>
    </>
  )
}
