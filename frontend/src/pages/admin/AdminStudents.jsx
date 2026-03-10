import { useEffect, useState } from 'react'
import { Users, AlertCircle, TrendingUp, BookOpen } from 'lucide-react'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import SidebarLayout from '../../components/layouts/SidebarLayout'
import api from '../../services/api'

const CLUSTER_CONFIG = {
  'Foundation Needed': {
    icon: AlertCircle,
    color: '#E9424C',
    bg: 'bg-[#E9424C]/10',
    border: 'border-[#E9424C]/30',
    text: 'text-[#E9424C]',
  },
  'Balanced Performer': {
    icon: TrendingUp,
    color: '#22c55e',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-600',
  },
  'Good Understanding Skills': {
    icon: BookOpen,
    color: '#3b82f6',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-600',
  },
  'Good Expressive Skills': {
    icon: Users,
    color: '#f59e0b',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-600',
  },
}

const COMPONENTS = ['listening', 'reading', 'writing', 'speaking']

function ClusterBadge({ label }) {
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

function StudentIdCell({ studentId }) {
  const [hovered, setHovered] = useState(false)
  const short = studentId.slice(0, 8) + '••••••••'
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-[10px] font-mono text-[#151313]/40 cursor-default transition-all duration-200 select-all"
      title={studentId}
    >
      {hovered ? studentId : short}
    </span>
  )
}

export default function AdminStudents() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCluster, setActiveCluster] = useState('All')

  useEffect(() => {
    api
      .get('/admin/clusters')
      .then((res) => setData(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const labels = Object.keys(CLUSTER_CONFIG)

  const barData = labels.map((label) => ({
    cluster: label
      .replace(' Skills', '')
      .replace(' Performer', '')
      .replace(' Needed', ''),
    count: data?.summary?.[label] || 0,
    color: CLUSTER_CONFIG[label].color,
  }))

  const radarData = COMPONENTS.map((comp) => {
    if (activeCluster === 'All') {
      const students = data?.students || []
      const avg = students.length
        ? students.reduce((a, s) => a + (s[`${comp}_band`] || 0), 0) /
          students.length
        : 0
      return {
        component: comp.charAt(0).toUpperCase() + comp.slice(1),
        band: parseFloat(avg.toFixed(2)),
      }
    }
    const avgs = data?.cluster_averages?.[activeCluster]
    return {
      component: comp.charAt(0).toUpperCase() + comp.slice(1),
      band: avgs?.[`avg_${comp}`] || 0,
    }
  })

  const filteredStudents =
    activeCluster === 'All'
      ? data?.students || []
      : (data?.students || []).filter((s) => s.cluster_label === activeCluster)

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' }}
    >
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <SidebarLayout role="admin" />
        <SidebarInset className="flex-1 min-w-0">
          <main className="overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center md:hidden">
              <SidebarTrigger />
            </div>

            {/* Header */}
            <div>
              <p className="text-[10px] font-black text-[#151313]/50 uppercase tracking-widest mb-0.5">
                Admin — K-means Clustering
              </p>
              <h1 className="text-xl font-black text-[#151313]">
                Student Analysis
              </h1>
              <p className="text-xs text-[#151313]/40 font-medium mt-0.5">
                {data?.total_students || 0} students grouped by performance
                patterns across all 4 MUET components
              </p>
            </div>

            {/* Cluster filter cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {labels.map((label) => {
                const { icon: Icon, color, text } = CLUSTER_CONFIG[label]
                const count = data?.summary?.[label] || 0
                const isActive = activeCluster === label
                return (
                  <button
                    key={label}
                    onClick={() => setActiveCluster(isActive ? 'All' : label)}
                    className={`text-left transition-all duration-200 rounded-2xl border-2 border-[#151313] bg-white p-4 flex flex-col gap-2
                      ${
                        isActive
                          ? 'shadow-[6px_6px_0px_#151313] -translate-y-1'
                          : 'shadow-[3px_3px_0px_#151313] hover:shadow-[5px_5px_0px_#151313] hover:-translate-y-0.5'
                      }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl border-2 border-[#151313] flex items-center justify-center shadow-[2px_2px_0px_#151313]"
                      style={{ background: color }}
                    >
                      <Icon size={13} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#151313] leading-tight">
                        {label}
                      </p>
                      <p
                        className={`text-lg font-black ${count > 0 ? text : 'text-[#151313]/20'}`}
                      >
                        {count}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-[#151313] shadow-[3px_3px_0px_#151313] rounded-2xl bg-white">
                <CardHeader className="pb-2 px-5 pt-5">
                  <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
                    Students per Cluster
                  </CardTitle>
                  <CardDescription className="text-[10px] text-[#151313]/40">
                    Distribution of K-means cluster assignments
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ChartContainer
                    config={{ count: { label: 'Students', color: '#E9424C' } }}
                    className="h-[200px] w-full"
                  >
                    <BarChart
                      data={barData}
                      margin={{ top: 10, right: 12, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid vertical={false} stroke="#15131312" />
                      <XAxis
                        dataKey="cluster"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{
                          fontSize: 9,
                          fontWeight: 700,
                          fill: '#15131360',
                        }}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        width={24}
                        tick={{
                          fontSize: 10,
                          fontWeight: 700,
                          fill: '#15131360',
                        }}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                        fill="#E9424C"
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#151313] shadow-[3px_3px_0px_#151313] rounded-2xl bg-white">
                <CardHeader className="pb-2 px-5 pt-5">
                  <CardTitle className="text-xs font-black text-[#151313] uppercase tracking-widest">
                    Average Bands
                  </CardTitle>
                  <CardDescription className="text-[10px] text-[#151313]/40">
                    {activeCluster === 'All'
                      ? 'Overall average across all students'
                      : `Cluster: ${activeCluster}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ChartContainer
                    config={{ band: { label: 'Band', color: '#E9424C' } }}
                    className="h-[200px] w-full"
                  >
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#15131315" />
                      <PolarAngleAxis
                        dataKey="component"
                        tick={{
                          fontSize: 10,
                          fontWeight: 700,
                          fill: '#15131370',
                        }}
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
                        dot={{
                          fill: '#E9424C',
                          r: 3,
                          strokeWidth: 2,
                          stroke: '#151313',
                        }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RadarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Student Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest">
                  {activeCluster === 'All' ? 'All Students' : activeCluster} —{' '}
                  {filteredStudents.length} student
                  {filteredStudents.length !== 1 ? 's' : ''}
                </p>
                {activeCluster !== 'All' && (
                  <button
                    onClick={() => setActiveCluster('All')}
                    className="text-[10px] font-black text-[#E9424C] underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>
              <Card className="border-2 border-[#151313] shadow-[4px_4px_0px_#151313] rounded-2xl overflow-hidden bg-white">
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
                          className="text-[9px] font-black text-white/60 uppercase tracking-widest py-2.5 first:pl-4"
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
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-xs font-semibold text-[#151313]/30 py-8"
                        >
                          No students in this cluster yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((s, i) => (
                        <TableRow
                          key={i}
                          className="border-b border-[#151313]/10 hover:bg-[#f7f7f5]"
                        >
                          <TableCell className="py-3 pl-4">
                            <p className="text-xs font-black text-[#151313]">
                              {s.full_name || 'Unknown'}
                            </p>
                            <StudentIdCell studentId={s.student_id} />
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
              </Card>
            </div>
            <div className="pb-6" />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
