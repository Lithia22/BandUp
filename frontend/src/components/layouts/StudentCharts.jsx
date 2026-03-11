import { TrendingUp } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  Label,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const BAND_TICK_MAP = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '5+' }
export function bandLabel(num) {
  if (num === 6) return 'Band 5+'
  return `Band ${num}`
}

const weeklyConfig = { sessions: { label: 'Sessions', color: '#E9424C' } }

export function WeeklyProgressCard({ weeklyData }) {
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
        <ChartContainer config={weeklyConfig} className="h-[120px] w-full">
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

const trendConfig = { band: { label: 'Band', color: '#E9424C' } }
const components = ['reading', 'listening', 'writing', 'speaking']

export function BandOverTimeChart({ bandTrend }) {
  return (
    <Card className="border-2 border-[#151313] shadow-[3px_3px_0px_#151313] rounded-2xl bg-white">
      <CardHeader className="pb-2 px-5 pt-5">
        <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
          Band Over Time
        </CardTitle>
        <CardDescription className="text-[10px] text-[#151313]/40">
          Your band score across your last 10 sessions per component
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-5">
        <Tabs defaultValue="reading">
          <TabsList
            className="bg-white border-2 border-[#151313] rounded-xl shadow-[2px_2px_0px_#151313] h-auto p-1 mb-4"
            style={{ display: 'inline-flex', gap: '2px' }}
          >
            {components.map((c) => (
              <TabsTrigger
                key={c}
                value={c}
                className="text-[10px] font-black capitalize rounded-lg px-3 py-1.5 data-[state=active]:bg-[#151313] data-[state=active]:text-white data-[state=active]:shadow-[2px_2px_0px_#E9424C] transition-all"
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          {components.map((c) => {
            const trend = bandTrend[c] || []
            return (
              <TabsContent key={c} value={c} className="mt-0">
                {trend.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-xs font-semibold text-[#151313]/30">
                    No sessions with band data yet for {c}.
                  </div>
                ) : (
                  <ChartContainer
                    config={trendConfig}
                    className="h-[200px] w-full"
                  >
                    <LineChart
                      data={trend}
                      margin={{ top: 10, right: 20, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid vertical={false} stroke="#15131312" />
                      <XAxis
                        dataKey="session"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tick={{
                          fontSize: 10,
                          fontWeight: 700,
                          fill: '#151313',
                        }}
                      >
                        <Label
                          value="Session"
                          position="insideBottom"
                          offset={-16}
                          fontSize={10}
                          fontWeight={700}
                          fill="#151313"
                        />
                      </XAxis>
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        domain={[0, 6]}
                        ticks={[1, 2, 3, 4, 5, 6]}
                        tickFormatter={(v) => BAND_TICK_MAP[v] ?? v}
                        width={40}
                        tick={{
                          fontSize: 10,
                          fontWeight: 700,
                          fill: '#151313',
                        }}
                      >
                        <Label
                          value="Band"
                          angle={-90}
                          position="insideLeft"
                          offset={-6}
                          fontSize={10}
                          fontWeight={700}
                          fill="#151313"
                        />
                      </YAxis>
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            labelFormatter={() => null}
                            formatter={(value, name, props) => {
                              const formattedBand = bandLabel(value)
                              return formattedBand
                            }}
                          />
                        }
                      />
                      <Line
                        dataKey="band"
                        type="monotone"
                        stroke="#E9424C"
                        strokeWidth={2.5}
                        dot={{
                          fill: '#E9424C',
                          r: 4,
                          strokeWidth: 2,
                          stroke: '#151313',
                        }}
                        activeDot={{
                          r: 6,
                          fill: '#E9424C',
                          stroke: '#151313',
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}

const radarConfig = { band: { label: 'Band', color: '#E9424C' } }

export function BandRadarChart({ componentBands }) {
  const radarData = components.map((c) => ({
    component: c.charAt(0).toUpperCase() + c.slice(1),
    band: componentBands[c] ?? 0,
    fullMark: 6,
  }))
  return (
    <Card className="border-2 border-[#151313] shadow-[3px_3px_0px_#151313] rounded-2xl bg-white">
      <CardHeader className="pb-2 px-5 pt-5">
        <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
          Band by Component
        </CardTitle>
        <CardDescription className="text-[10px] text-[#151313]/40">
          Your latest band across all 4 components
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ChartContainer config={radarConfig} className="h-[220px] w-full">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#15131315" />
            <PolarAngleAxis
              dataKey="component"
              tick={{ fontSize: 10, fontWeight: 700, fill: '#15131370' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 6]}
              tick={{ fontSize: 8, fill: '#15131340' }}
              tickCount={4}
            />
            <Radar
              dataKey="band"
              stroke="#E9424C"
              fill="#E9424C"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ fill: '#E9424C', r: 3, strokeWidth: 2, stroke: '#151313' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const attemptsConfig = { attempts: { label: 'Attempts', color: '#E9424C' } }

export function AttemptsBarChart({ attempts }) {
  const attemptsData = components.map((c) => ({
    component: c.charAt(0).toUpperCase() + c.slice(1),
    attempts: attempts[c] || 0,
  }))
  return (
    <Card className="border-2 border-[#151313] shadow-[3px_3px_0px_#151313] rounded-2xl bg-white">
      <CardHeader className="pb-2 px-5 pt-5">
        <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
          Practice Attempts
        </CardTitle>
        <CardDescription className="text-[10px] text-[#151313]/40">
          Number of sessions completed per component
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ChartContainer config={attemptsConfig} className="h-[220px] w-full">
          <BarChart
            data={attemptsData}
            margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
          >
            <CartesianGrid vertical={false} stroke="#15131312" />
            <XAxis
              dataKey="component"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#15131360' }}
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
            <Bar
              dataKey="attempts"
              fill="var(--color-attempts)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
