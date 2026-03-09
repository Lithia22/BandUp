import { TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  sessions: {
    label: 'Sessions',
    color: '#E9424C',
  },
}

export default function WeeklyProgressCard({ weeklyData }) {
  const total = weeklyData.reduce((a, b) => a + b.sessions, 0)

  return (
    <Card className="border-2 border-[#151313] shadow-[4px_4px_0px_#151313] rounded-2xl bg-white">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
              Last 7 Days
            </CardTitle>
            <p className="text-[9px] font-semibold text-[#151313]/40 mt-0.5">
              Daily practice sessions
            </p>
          </div>
          <div className="w-7 h-7 rounded-xl bg-[#E9424C] border-2 border-[#151313] flex items-center justify-center shadow-[2px_2px_0px_#151313]">
            <TrendingUp size={12} className="text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ChartContainer config={chartConfig} className="h-[120px] w-full">
          <LineChart
            data={weeklyData}
            margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
          >
            <CartesianGrid vertical={false} stroke="#15131312" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#15131360' }}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              allowDecimals={false}
              width={24}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#15131360' }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="sessions"
              type="monotone"
              stroke="var(--color-sessions)"
              strokeWidth={2.5}
              dot={{ fill: '#E9424C', r: 3, strokeWidth: 2, stroke: '#151313' }}
              activeDot={{
                r: 5,
                fill: '#E9424C',
                stroke: '#151313',
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ChartContainer>
        <Separator className="my-3 bg-[#151313]/10" />
        <div className="flex items-center justify-between px-2">
          <span className="text-[9px] font-semibold text-[#151313]/40">
            Total last 7 days
          </span>
          <Badge className="bg-[#E9424C]/10 text-[#E9424C] border border-[#E9424C]/30 text-[10px] font-black hover:bg-[#E9424C]/20 rounded-full">
            {total} sessions
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
