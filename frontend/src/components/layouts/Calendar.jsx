import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

function getActivityColor(count) {
  if (count === 0) return null
  if (count === 1) return 'bg-[#E9424C]/25'
  if (count === 2) return 'bg-[#E9424C]/50'
  if (count === 3) return 'bg-[#E9424C]/75'
  return 'bg-[#E9424C]'
}

export default function Calendar({ sessionsByDay }) {
  const [current, setCurrent] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const year = current.getFullYear()
  const month = current.getMonth()
  const monthName = current.toLocaleString('default', { month: 'long' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayObj = new Date()
  const isCurrentMonth =
    todayObj.getFullYear() === year && todayObj.getMonth() === month
  const todayDate = todayObj.getDate()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <Card className="border-2 border-[#151313] shadow-[4px_4px_0px_#151313] rounded-2xl bg-white">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
            {monthName} {year}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrent(new Date(year, month - 1, 1))}
              className="w-6 h-6 rounded-full border-2 border-[#151313] hover:bg-[#151313] hover:text-white transition-all"
            >
              <ChevronLeft size={10} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrent(new Date(year, month + 1, 1))}
              className="w-6 h-6 rounded-full border-2 border-[#151313] hover:bg-[#151313] hover:text-white transition-all"
            >
              <ChevronRight size={10} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-7 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div
              key={d}
              className="text-center text-[9px] font-black text-[#151313]/30 py-1"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />
            const isToday = isCurrentMonth && day === todayDate
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const count = sessionsByDay[dateStr] || 0
            const activityColor = getActivityColor(count)

            const dayEl = (
              <div
                className={`
                aspect-square flex items-center justify-center rounded-lg text-[10px] font-black cursor-default transition-all
                ${
                  isToday
                    ? 'border-2 border-[#151313] text-[#151313]'
                    : activityColor
                      ? `${activityColor} ${count >= 3 ? 'text-white' : 'text-[#151313]'}`
                      : 'text-[#151313]/35'
                }
              `}
              >
                {day}
              </div>
            )

            if (count > 0) {
              return (
                <TooltipProvider key={day} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>{dayEl}</TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="text-[10px] font-semibold"
                    >
                      {count} session{count > 1 ? 's' : ''}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            }
            return <div key={day}>{dayEl}</div>
          })}
        </div>
        <Separator className="my-3 bg-[#151313]/10" />
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[9px] font-semibold text-[#151313]/40">
            Activity:
          </span>
          {[
            { color: 'bg-[#E9424C]/25', label: 'Low' },
            { color: 'bg-[#E9424C]/50', label: 'Mid' },
            { color: 'bg-[#E9424C]', label: 'High' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded ${color}`} />
              <span className="text-[9px] font-semibold text-[#151313]/50">
                {label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
