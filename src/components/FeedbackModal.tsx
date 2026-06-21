import type { FeedbackValue } from '../types'

interface Props {
  onSelect: (f: FeedbackValue) => void
  onClose: () => void
}

const options: { value: FeedbackValue; label: string; sub: string }[] = [
  { value: 'too_hot',    label: '🥵 Too hot',     sub: 'I was sweating too much' },
  { value: 'just_right', label: '👌 Just right',  sub: 'Perfect — nailed it' },
  { value: 'too_cold',   label: '🥶 Too cold',    sub: 'I needed another layer' },
]

export default function FeedbackModal({ onSelect, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 rounded-t-3xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>
        <div className="px-6 pt-4 pb-10">
          <h2 className="text-lg font-semibold text-white text-center">How was the kit?</h2>
          <p className="text-sm text-zinc-400 text-center mt-1 mb-6">
            We'll use this to fine-tune your recommendations
          </p>
          <div className="flex flex-col gap-3">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => onSelect(opt.value)}
                className="rounded-2xl bg-zinc-800 p-4 text-left hover:bg-zinc-700 transition-all"
              >
                <div className="font-medium text-white">{opt.label}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
