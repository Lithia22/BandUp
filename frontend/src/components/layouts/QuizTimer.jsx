import { useState, useRef } from 'react'
import { Clock } from 'lucide-react'

const fmt = (s) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

export default function QuizTimer({
  timeLeft,
  setTimeLeft,
  onExpire,
  running,
}) {
  const [intervalId, setIntervalId] = useState(null)
  const expiredRef = useRef(false)

  if (running && !intervalId) {
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          if (!expiredRef.current) {
            expiredRef.current = true
            onExpire()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setIntervalId(id)
  } else if (!running && intervalId) {
    clearInterval(intervalId)
    setIntervalId(null)
  }

  const isLow = timeLeft <= 600
  const isCritical = timeLeft <= 60

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 shrink-0 transition-colors ${
        isCritical
          ? 'border-[#E9424C] bg-[#E9424C]/10 animate-pulse'
          : isLow
            ? 'border-[#fccc42] bg-[#fccc42]/10'
            : 'border-[#151313]/20 bg-white'
      }`}
    >
      <Clock
        size={12}
        className={
          isCritical
            ? 'text-[#E9424C]'
            : isLow
              ? 'text-[#b8960a]'
              : 'text-[#151313]/40'
        }
      />
      <span
        className={`text-xs font-black tabular-nums ${
          isCritical
            ? 'text-[#E9424C]'
            : isLow
              ? 'text-[#b8960a]'
              : 'text-[#151313]'
        }`}
      >
        {fmt(timeLeft)}
      </span>
    </div>
  )
}
