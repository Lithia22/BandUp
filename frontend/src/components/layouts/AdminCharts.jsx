import { useEffect, useState, useMemo } from 'react'
import {
  Users,
  AlertCircle,
  TrendingUp,
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Customized,
  PieChart,
  Pie,
  Legend,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export const CLUSTER_CONFIG = {
  'Foundation Needed': {
    icon: AlertCircle,
    color: '#E9424C',
    bg: 'bg-[#E9424C]/10',
    border: 'border-[#E9424C]/30',
    text: 'text-[#E9424C]',
    description: 'Students with low bands across all components.',
  },
  'Balanced Performer': {
    icon: TrendingUp,
    color: '#FFD800',
    bg: 'bg-[#FFD800]/10',
    border: 'border-[#FFD800]/40',
    text: 'text-[#FFD800]',
    description: 'Students with consistent bands across all components.',
  },
  'Good Understanding Skills': {
    icon: BookOpen,
    color: '#B57EDC',
    bg: 'bg-[#B57EDC]/10',
    border: 'border-[#B57EDC]/30',
    text: 'text-[#B57EDC]',
    description: 'Students stronger in Listening & Reading bands.',
  },
  'Good Expressive Skills': {
    icon: Users,
    color: '#2BBFBF',
    bg: 'bg-[#2BBFBF]/10',
    border: 'border-[#2BBFBF]/30',
    text: 'text-[#2BBFBF]',
    description: 'Students stronger in Writing & Speaking bands.',
  },
}

export const COMPONENTS = ['listening', 'reading', 'writing', 'speaking']
export const ALL_TABS = ['All', ...Object.keys(CLUSTER_CONFIG)]

export function ClusterBadge({ label }) {
  const cfg = CLUSTER_CONFIG[label] || {}
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-black h-auto py-0.5 px-2 rounded-full ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      {label}
    </Badge>
  )
}

function ChartCard({
  title,
  description,
  children,
  contentClass = 'px-2 pb-4',
}) {
  return (
    <Card className="border-2 border-[#151313] shadow-[3px_3px_0px_#151313] rounded-2xl bg-white">
      <CardHeader className="pb-2 px-5 pt-5">
        <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
          {title}
        </CardTitle>
        <CardDescription className="text-[10px] text-[#151313]/40">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className={contentClass}>{children}</CardContent>
    </Card>
  )
}

function StudentTable({ students, loading, search }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [search, students])

  const filtered = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter(
      (s) =>
        (s.full_name || '').toLowerCase().includes(q) ||
        (s.student_id || '').toLowerCase().includes(q)
    )
  }, [students, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )
  const startRow = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endRow = Math.min(safePage * pageSize, filtered.length)

  function goPage(next) {
    if (next < 1 || next > totalPages) {
      toast.info(
        next < 1 ? "You're on the first page." : "You're on the last page.",
        { icon: null }
      )
      return
    }
    setPage(next)
  }

  return (
    <div className="space-y-3">
      <div className="border border-[#151313]/15 rounded-xl overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#151313] hover:bg-[#151313] border-b-0">
              {[
                'Student',
                'Listening',
                'Reading',
                'Writing',
                'Speaking',
                'Cluster',
              ].map((h) => (
                <TableHead
                  key={h}
                  className="text-[9px] font-black text-white/60 uppercase tracking-widest py-2.5 first:pl-5"
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-xs font-semibold text-[#151313]/30 py-8"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-xs font-semibold text-[#151313]/30 py-8"
                >
                  {search
                    ? 'No students match your search.'
                    : 'No students in this cluster yet.'}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((s, i) => (
                <TableRow
                  key={i}
                  className="border-b border-[#151313]/8 hover:bg-[#f7f7f5]"
                >
                  <TableCell className="py-3 pl-5">
                    <p className="text-xs font-black text-[#151313]">
                      {s.full_name || 'Unknown'}
                    </p>
                    <span className="text-[10px] font-mono text-[#151313]/40">
                      {s.student_id?.slice(0, 8)}••••
                    </span>
                  </TableCell>
                  {COMPONENTS.map((comp) => (
                    <TableCell key={comp} className="py-3">
                      <span className="text-xs font-black text-[#151313]">
                        {s[`${comp}_band`] ?? '—'}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="py-3">
                    <ClusterBadge label={s.cluster_label} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold text-[#151313]/40 whitespace-nowrap">
              Rows per page
            </p>
            <Select
              value={`${pageSize}`}
              onValueChange={(val) => {
                setPageSize(Number(val))
                setPage(1)
              }}
            >
              <SelectTrigger className="h-6 w-16 text-[10px] font-black border border-[#151313]/20 rounded-lg px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem
                    key={size}
                    value={`${size}`}
                    className="text-xs font-semibold"
                  >
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] font-semibold text-[#151313]/30">
            {filtered.length === 0
              ? 'No results'
              : `${startRow}–${endRow} of ${filtered.length}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 border border-[#151313]/20 rounded-md text-[#151313]/50 hover:bg-[#151313] hover:text-white transition-all"
            onClick={() => goPage(safePage - 1)}
          >
            <ChevronLeft size={11} />
          </Button>
          <span className="text-[10px] font-black text-[#151313]/50">
            Page {safePage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 border border-[#151313]/20 rounded-md text-[#151313]/50 hover:bg-[#151313] hover:text-white transition-all"
            onClick={() => goPage(safePage + 1)}
          >
            <ChevronRight size={11} />
          </Button>
        </div>
      </div>
    </div>
  )
}

function CustomPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos((-midAngle * Math.PI) / 180)
  const y = cy + r * Math.sin((-midAngle * Math.PI) / 180)
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={900}
    >{`${(percent * 100).toFixed(0)}%`}</text>
  )
}

function ClusterEllipses({ xAxisMap, yAxisMap, scatterByCluster }) {
  if (!xAxisMap || !yAxisMap) return null
  const xScale = Object.values(xAxisMap)[0]
  const yScale = Object.values(yAxisMap)[0]
  if (!xScale?.scale || !yScale?.scale) return null
  return (
    <>
      {Object.entries(scatterByCluster).map(([label, pts]) => {
        if (!pts.length) return null
        const color = CLUSTER_CONFIG[label]?.color
        if (!color) return null
        const px = pts.map((p) => xScale.scale(p.x))
        const py = pts.map((p) => yScale.scale(p.y))
        const cx = px.reduce((s, v) => s + v, 0) / px.length
        const cy = py.reduce((s, v) => s + v, 0) / py.length
        const pad = 28
        const rx =
          pts.length === 1
            ? pad
            : Math.max(
                pad,
                Math.sqrt(
                  px.reduce((s, v) => s + (v - cx) ** 2, 0) / px.length
                ) *
                  1.8 +
                  pad
              )
        const ry =
          pts.length === 1
            ? pad
            : Math.max(
                pad,
                Math.sqrt(
                  py.reduce((s, v) => s + (v - cy) ** 2, 0) / py.length
                ) *
                  1.8 +
                  pad
              )
        return (
          <ellipse
            key={label}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill={color}
            fillOpacity={0.08}
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
        )
      })}
    </>
  )
}

function ScatterTooltipContent({
  active,
  payload,
  centroids,
  scatterByCluster,
}) {
  if (!active || !payload?.length) return null
  const currentPoint = payload[0].payload
  const allPointsAtLocation =
    scatterByCluster?.[currentPoint.cluster]?.filter(
      (p) => p.x === currentPoint.x && p.y === currentPoint.y
    ) || []
  const distances = Object.entries(centroids)
    .map(([clusterName, centroidData]) => {
      if (!centroidData?.length) return null
      const centroid = centroidData[0]
      return {
        cluster: clusterName,
        distance: Math.sqrt(
          (currentPoint.x - centroid.x) ** 2 +
            (currentPoint.y - centroid.y) ** 2
        ).toFixed(3),
        color: CLUSTER_CONFIG[clusterName]?.color || '#999',
        isAssigned: clusterName === currentPoint.cluster,
        centroidX: centroid.x,
        centroidY: centroid.y,
      }
    })
    .filter(Boolean)
  return (
    <div className="bg-white border-2 border-[#151313] rounded-xl shadow-[3px_3px_0px_#151313] p-3 min-w-[220px]">
      {allPointsAtLocation.length > 1 ? (
        <p className="text-xs font-black text-[#151313] mb-1">
          {allPointsAtLocation.length} students at this point
        </p>
      ) : (
        <p className="text-xs font-black text-[#151313] mb-1">
          {currentPoint.name}
        </p>
      )}
      <p className="text-[9px] text-[#151313]/60 font-semibold mb-2">
        Student: ({currentPoint.x}, {currentPoint.y})
      </p>
      <div className="space-y-1.5 mt-1">
        {distances.map((d) => (
          <div key={d.cluster}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="text-[9px] font-medium text-[#151313]/70">
                  {d.cluster}
                </span>
                {d.isAssigned && (
                  <span className="text-[9px] text-[#151313] ml-0.5">✓</span>
                )}
              </div>
              <span className="text-[9px] font-mono font-bold text-[#151313]">
                {d.distance}
              </span>
            </div>
            <p className="text-[8px] text-[#151313]/40 ml-3.5">
              centroid: ({d.centroidX}, {d.centroidY})
            </p>
          </div>
        ))}
      </div>
      {allPointsAtLocation.length > 1 && (
        <div className="mt-2 pt-2 border-t border-[#151313]/10">
          <p className="text-[8px] font-semibold text-[#151313]/50 mb-1">
            Students:
          </p>
          {allPointsAtLocation.map((p, i) => (
            <p key={i} className="text-[8px] text-[#151313] ml-1">
              • {p.name}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function CentroidTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  const cfg = CLUSTER_CONFIG[point.cluster] || {}
  return (
    <div className="bg-white border-2 border-[#151313] rounded-xl shadow-[3px_3px_0px_#151313] p-2 min-w-[140px]">
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: cfg.color }}
        />
        <p className="text-[9px] font-black text-[#151313]">
          {point.cluster} Centroid
        </p>
      </div>
      <p className="text-[9px] text-[#151313]/60 font-semibold">
        ({point.x}, {point.y})
      </p>
    </div>
  )
}

export function ClusterCardsSection({ data }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Object.entries(CLUSTER_CONFIG).map(
        ([label, { icon: Icon, color, text, description }]) => {
          const count = data?.summary?.[label] || 0
          return (
            <div
              key={label}
              className="border-2 border-[#151313] shadow-[3px_3px_0px_#151313] rounded-2xl bg-white p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-9 h-9 rounded-xl border-2 border-[#151313] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#151313]"
                  style={{ background: color }}
                >
                  <Icon size={15} className="text-white" />
                </div>
                <span
                  className={`text-2xl font-black leading-none mt-0.5 ${count > 0 ? text : 'text-[#151313]/20'}`}
                >
                  {count}
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-[#151313] leading-tight mb-1">
                  {label}
                </p>
                <p className="text-[10px] font-medium text-[#151313]/40 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                  {description}
                </p>
              </div>
              <div className="pt-1 border-t border-[#151313]/10">
                <span className="text-[9px] font-semibold text-[#151313]/30 uppercase tracking-widest">
                  {count === 1 ? '1 student' : `${count} students`}
                </span>
              </div>
            </div>
          )
        }
      )}
    </div>
  )
}

export function ClusterBreakdownChart({ clusterBarData }) {
  return (
    <ChartCard
      title="Cluster Breakdown"
      description="Number of students assigned to each cluster"
    >
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={clusterBarData}
            margin={{ top: 25, right: 12, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#15131312" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              interval={0}
              height={52}
              tick={(props) => {
                const { x, y, payload } = props
                const words = payload.value.split(' ')
                const mid = Math.ceil(words.length / 2)
                return (
                  <text
                    x={x}
                    y={y + 8}
                    textAnchor="middle"
                    fill="#15131360"
                    fontSize={9}
                    fontWeight={700}
                  >
                    <tspan x={x} dy={0}>
                      {words.slice(0, mid).join(' ')}
                    </tspan>
                    {words.slice(mid).length > 0 && (
                      <tspan x={x} dy={14}>
                        {words.slice(mid).join(' ')}
                      </tspan>
                    )}
                  </text>
                )
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={24}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#15131360' }}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div
                    style={{
                      borderRadius: '10px',
                      border: '2px solid #151313',
                      padding: '8px 12px',
                      background: 'white',
                      fontSize: '11px',
                      fontWeight: 700,
                      boxShadow: '3px 3px 0px #151313',
                    }}
                  >
                    {d.fullName}: {d.count} student{d.count !== 1 ? 's' : ''}
                  </div>
                )
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {clusterBarData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export function ClusterDistributionChart({ pieData }) {
  return (
    <ChartCard
      title="Cluster Distribution"
      description="Proportion of students in each performance group"
      contentClass="flex items-center justify-center pb-2 px-2"
    >
      {pieData.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center">
          <p className="text-xs font-semibold text-[#151313]/30">No data yet</p>
        </div>
      ) : (
        <PieChart
          width={320}
          height={260}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        >
          <Pie
            data={pieData}
            cx="50%"
            cy="44%"
            outerRadius={78}
            dataKey="value"
            labelLine={false}
            label={CustomPieLabel}
            strokeWidth={2}
            stroke="#f7f7f5"
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${value} student${value !== 1 ? 's' : ''}`,
              name,
            ]}
            contentStyle={{
              borderRadius: '10px',
              border: '2px solid #151313',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '3px 3px 0px #151313',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span
                style={{ fontSize: '9px', fontWeight: 700, color: '#15131370' }}
              >
                {value}
              </span>
            )}
          />
        </PieChart>
      )}
    </ChartCard>
  )
}

export function ClusterMapChart({ scatterByCluster, centroids, labels }) {
  const hasData = Object.values(scatterByCluster).some((pts) => pts.length > 0)
  return (
    <Card className="border-2 border-[#151313] shadow-[3px_3px_0px_#151313] rounded-2xl bg-white">
      <CardHeader className="pb-1 px-5 pt-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
              K-means Cluster Map
            </CardTitle>
          </div>
          <div className="flex items-center gap-4 flex-wrap pt-0.5">
            {labels.map((label) => (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: CLUSTER_CONFIG[label].color }}
                />
                <span className="text-[9px] font-bold text-[#151313]/50">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-5 pt-2">
        {!hasData ? (
          <div className="h-[320px] flex items-center justify-center">
            <p className="text-xs font-semibold text-[#151313]/30">
              No student data yet
            </p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 100, left: 0, bottom: 30 }}
              >
                <CartesianGrid stroke="#15131310" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Receptive avg"
                  domain={[0, 6]}
                  ticks={[1, 2, 3, 4, 5, 6]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#15131360' }}
                  label={{
                    value: 'Listening & Reading (avg)',
                    position: 'insideBottom',
                    offset: -15,
                    fontSize: 9,
                    fontWeight: 700,
                    fill: '#15131450',
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Expressive avg"
                  domain={[0, 6]}
                  ticks={[1, 2, 3, 4, 5, 6]}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#15131360' }}
                  label={{
                    value: 'Writing & Speaking (avg)',
                    angle: -90,
                    position: 'center',
                    offset: 25,
                    fontSize: 9,
                    fontWeight: 700,
                    fill: '#15131450',
                  }}
                />
                <ZAxis range={[36, 36]} />
                <ReferenceLine x={3} stroke="#15131318" strokeDasharray="5 4" />
                <ReferenceLine y={3} stroke="#15131318" strokeDasharray="5 4" />
                <Customized
                  component={(props) => (
                    <ClusterEllipses
                      xAxisMap={props.xAxisMap}
                      yAxisMap={props.yAxisMap}
                      scatterByCluster={scatterByCluster}
                    />
                  )}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    if (payload[0].payload.name === 'Centroid')
                      return (
                        <CentroidTooltipContent
                          active={active}
                          payload={payload}
                        />
                      )
                    return (
                      <ScatterTooltipContent
                        active={active}
                        payload={payload}
                        centroids={centroids}
                        scatterByCluster={scatterByCluster}
                      />
                    )
                  }}
                />
                {labels.map((label) => {
                  const pts = centroids[label]
                  if (!pts) return null
                  const c = CLUSTER_CONFIG[label].color
                  return (
                    <Scatter
                      key={`c-${label}`}
                      data={pts}
                      fill="white"
                      shape={({ cx, cy }) => {
                        const arm = 7
                        return (
                          <g>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={arm + 5}
                              fill={c}
                              fillOpacity={0.15}
                            />
                            <line
                              x1={cx - arm}
                              y1={cy - arm}
                              x2={cx + arm}
                              y2={cy + arm}
                              stroke={c}
                              strokeWidth={2.5}
                              strokeLinecap="round"
                            />
                            <line
                              x1={cx + arm}
                              y1={cy - arm}
                              x2={cx - arm}
                              y2={cy + arm}
                              stroke={c}
                              strokeWidth={2.5}
                              strokeLinecap="round"
                            />
                            <circle
                              cx={cx}
                              cy={cy}
                              r={3}
                              fill="white"
                              stroke={c}
                              strokeWidth={2}
                            />
                          </g>
                        )
                      }}
                    />
                  )
                })}
                {labels.map((label) => {
                  const pts = scatterByCluster[label] || []
                  if (!pts.length) return null
                  const c = CLUSTER_CONFIG[label].color
                  return (
                    <Scatter
                      key={label}
                      name={label}
                      data={pts}
                      fill={c}
                      isAnimationActive={false}
                      shape={({ cx, cy }) => (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill={c}
                          fillOpacity={0.82}
                          stroke="white"
                          strokeWidth={1.2}
                        />
                      )}
                    />
                  )
                })}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StudentRecordsSection({
  data,
  loading,
  search,
  setSearch,
  studentsByTab,
}) {
  return (
    <div>
      <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest mb-3">
        Student Records
      </p>
      <Tabs defaultValue="All">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="overflow-x-auto">
            <TabsList
              className="bg-white border-2 border-[#151313] rounded-xl shadow-[2px_2px_0px_#151313] h-auto p-1 w-auto"
              style={{ display: 'inline-flex', gap: '2px' }}
            >
              {ALL_TABS.map((tab) => {
                const count =
                  tab === 'All'
                    ? data?.total_students || 0
                    : data?.summary?.[tab] || 0
                const cfg = CLUSTER_CONFIG[tab]
                const shortName =
                  tab === 'All'
                    ? 'All'
                    : tab
                        .replace(' Skills', '')
                        .replace(' Performer', '')
                        .replace(' Needed', '')
                return (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="group text-[10px] font-black rounded-lg px-3 py-1.5 data-[state=active]:bg-[#151313] data-[state=active]:text-white data-[state=active]:shadow-[2px_2px_0px_#E9424C] transition-all whitespace-nowrap flex items-center gap-1.5"
                  >
                    {shortName}
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${tab === 'All' ? 'bg-[#151313]/10 text-[#151313]/60 group-data-[state=active]:bg-white group-data-[state=active]:text-[#151313]/60' : `${cfg?.bg} ${cfg?.text}`}`}
                    >
                      {count}
                    </span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>
          <div className="relative shrink-0">
            <Search
              size={11}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#151313]/30"
            />
            <Input
              placeholder="Search name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 w-48 text-[10px] font-medium border-2 border-[#151313]/20 rounded-xl focus-visible:border-[#E9424C] bg-white placeholder:text-[10px]"
            />
          </div>
        </div>
        {ALL_TABS.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <StudentTable
              students={studentsByTab[tab] || []}
              loading={loading}
              search={search}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
