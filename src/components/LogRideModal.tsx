import { useState } from 'react'
import type { FeedbackValue, Units } from '../types'

interface Props {
  units: Units
  onSave: (tempC: number, feedback: FeedbackValue, wore: string) => void
  onClose: () => void
}

const feedbackOptions: { value: FeedbackValue; label: string }[] = [
  { value: 'too_cold',   label: '🥶 Too cold' },
  { value: 'just_right', label: '👌 Just right' },
  { value: 'too_hot',    label: '🥵 Too hot' },
]

export default function LogRideModal({ units, onSave, onClose }: Props) {
  const isMetric = units === 'metric'
  const [temp, setTemp] = useState('')
  const [feedback, setFeedback] = useState<FeedbackValue | null>(null)
  const [wore, setWore] = useState('')

  const canSave = temp.trim() !== '' && !isNaN(Number(temp)) && feedback !== null

  function handleSave() {
    if (!canSave || feedback === null) return
    const entered = Number(temp)
    const tempC = isMetric ? entered : (entered - 32) * 5 / 9
    onSave(tempC, feedback, wore)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Log a past ride</h2>
          <button onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-10 flex flex-col gap-6">
          <p className="text-sm text-zinc-400 -mt-2">
            Tell us about a ride and how it felt. We'll use it to fine-tune recommendations for that kind of weather.
          </p>

          {/* Temperature */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Temperature on the ride
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder={isMetric ? 'e.g. 8' : 'e.g. 46'}
                value={temp}
                onChange={e => setTemp(e.target.value)}
                className="flex-1 rounded-2xl bg-zinc-800 px-5 py-4 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-zinc-400 text-lg font-medium w-10 text-center">
                {isMetric ? '°C' : '°F'}
              </span>
            </div>
          </div>

          {/* How it felt */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">How did you feel?</label>
            <div className="grid grid-cols-3 gap-2">
              {feedbackOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFeedback(opt.value)}
                  className={`rounded-2xl py-3 px-2 text-sm font-medium transition-all ${
                    feedback === opt.value
                      ? 'bg-emerald-500/20 ring-2 ring-emerald-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* What you wore (optional) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              What you wore <span className="normal-case text-zinc-600">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. bib tights, jersey, gilet"
              value={wore}
              onChange={e => setWore(e.target.value)}
              className="rounded-2xl bg-zinc-800 px-5 py-4 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`rounded-2xl py-4 font-medium transition-all ${
              canSave
                ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            Save ride
          </button>
        </div>
      </div>
    </>
  )
}
