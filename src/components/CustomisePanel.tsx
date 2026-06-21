import type { RideOptions, Activity } from '../types'

interface Props {
  options: RideOptions
  activity: Activity
  onChange: (options: RideOptions) => void
  onClose: () => void
}

type OptionItem<T extends string> = { value: T; label: string; sub: string }

const intensityByActivity: Record<Activity, OptionItem<RideOptions['intensity']>[]> = {
  cycling: [
    { value: 'easy',     label: '🐢 Easy',     sub: 'Recovery spin or café ride' },
    { value: 'moderate', label: '🚴 Moderate', sub: 'Steady endurance pace' },
    { value: 'hard',     label: '🔥 Hard',     sub: 'Intervals, racing, or big efforts' },
  ],
  running: [
    { value: 'easy',     label: '🐢 Easy',     sub: 'Easy recovery jog' },
    { value: 'moderate', label: '🏃 Moderate', sub: 'Steady run' },
    { value: 'hard',     label: '🔥 Hard',     sub: 'Tempo, intervals, or racing' },
  ],
}

const durationByActivity: Record<Activity, OptionItem<RideOptions['duration']>[]> = {
  cycling: [
    { value: 'short',  label: '⚡ Short',   sub: 'Under an hour' },
    { value: 'medium', label: '🕐 Medium',  sub: '1–3 hours' },
    { value: 'long',   label: '🌄 Long',    sub: '3+ hours' },
  ],
  running: [
    { value: 'short',  label: '⚡ Short',   sub: 'Under 30 min' },
    { value: 'medium', label: '🕐 Medium',  sub: '30–75 min' },
    { value: 'long',   label: '🌄 Long',    sub: 'Over 75 min' },
  ],
}

const timeOptions: OptionItem<RideOptions['timeOfDay']>[] = [
  { value: 'morning',   label: '🌅 Morning',   sub: 'Before 10am — coldest part of the day' },
  { value: 'midday',    label: '☀️ Midday',    sub: '10am–3pm — warmest' },
  { value: 'afternoon', label: '🌇 Afternoon', sub: 'After 3pm — cooling down' },
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

// Format a Date as the value a datetime-local input expects (local time)
function toInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function timeOfDayLabel(iso: string): string {
  const h = new Date(iso).getHours()
  if (h < 10) return '🌅 Morning'
  if (h < 15) return '☀️ Midday'
  return '🌇 Afternoon'
}

function daysAhead(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

export default function CustomisePanel({ options, activity, onChange, onClose }: Props) {
  function set<K extends keyof RideOptions>(key: K, value: RideOptions[K]) {
    onChange({ ...options, [key]: value })
  }

  const intensityOptions = intensityByActivity[activity]
  const durationOptions = durationByActivity[activity]

  const now = new Date()
  const max = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) // ~16-day forecast limit
  const isFuture = options.dateTime !== null

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
          {/* When */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">When</p>
            <div className="flex gap-2">
              <button
                onClick={() => set('dateTime', null)}
                className={`rounded-2xl px-5 py-3 text-sm font-medium transition-all ${
                  !isFuture
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Now
              </button>
              <input
                type="datetime-local"
                value={isFuture ? toInputValue(new Date(options.dateTime!)) : ''}
                min={toInputValue(now)}
                max={toInputValue(max)}
                onChange={e => {
                  if (!e.target.value) { set('dateTime', null); return }
                  set('dateTime', new Date(e.target.value).toISOString())
                }}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm outline-none transition-all ${
                  isFuture
                    ? 'bg-emerald-500/20 ring-2 ring-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              />
            </div>
            {isFuture && (
              <p className="text-xs text-zinc-400">
                Using the forecast for {new Date(options.dateTime!).toLocaleString([], {
                  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })} · {timeOfDayLabel(options.dateTime!)}
              </p>
            )}
            {isFuture && daysAhead(options.dateTime!) > 7 && (
              <p className="text-xs text-amber-400/90">
                ⚠️ {daysAhead(options.dateTime!)} days out — forecasts get less reliable beyond a week.
              </p>
            )}
          </div>

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
          {/* Time of day only matters when riding "now"; otherwise it's read from the forecast time */}
          {!isFuture && (
            <OptionGroup
              label="Time of day"
              options={timeOptions}
              value={options.timeOfDay}
              onChange={v => set('timeOfDay', v)}
            />
          )}
        </div>
      </div>
    </>
  )
}
