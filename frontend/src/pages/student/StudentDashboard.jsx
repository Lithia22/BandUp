import { useEffect, useState } from 'react'
import { BookOpen, Headphones, SquarePen, Mic } from 'lucide-react'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import SidebarLayout from '../../components/layouts/SidebarLayout'
import Calendar from '../../components/layouts/Calendar'
import { WeeklyProgressCard } from '../../components/layouts/StudentCharts'
import api from '../../services/api'

const TABS = ['reading', 'listening', 'writing', 'speaking']

const COMPONENT_CONFIG = [
  { label: 'Reading', key: 'reading', icon: BookOpen, href: '/reading' },
  {
    label: 'Listening',
    key: 'listening',
    icon: Headphones,
    href: '/listening',
  },
  { label: 'Writing', key: 'writing', icon: SquarePen, href: '/writing' },
  { label: 'Speaking', key: 'speaking', icon: Mic, href: '/speaking' },
]

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function StudentDashboard() {
  const name = localStorage.getItem('bandup_name') || 'Student'
  const firstName = name.split(' ')[0]

  const [attempts, setAttempts] = useState({})
  const [history, setHistory] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [sessionsByDay, setSessionsByDay] = useState({})
  const [loadingDash, setLoadingDash] = useState(true)

  useEffect(() => {
    const studentId = (() => {
      try {
        const token = localStorage.getItem('bandup_token')
        return token ? JSON.parse(atob(token.split('.')[1])).sub : null
      } catch {
        return null
      }
    })()

    if (!studentId) {
      setLoadingDash(false)
      return
    }

    api
      .get(`/analytics?user_id=${studentId}`)
      .then((res) => {
        const d = res.data
        setAttempts(d.attempts || {})
        setHistory(
          (d.history || []).map((h) => ({
            ...h,
            component: h.component?.toLowerCase(),
          }))
        )
        setWeeklyData(d.weekly || [])
        setSessionsByDay(d.sessions_by_day || {})
      })
      .catch((e) => console.error('Dashboard fetch failed', e))
      .finally(() => setLoadingDash(false))
  }, [])

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' }}
    >
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <SidebarLayout />
        <SidebarInset className="flex-1 min-w-0 overflow-hidden">
          <div className="flex h-screen">
            <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 space-y-5">
              <div className="flex items-center md:hidden">
                <SidebarTrigger />
              </div>

              <div
                className="relative rounded-2xl border-2 border-[#151313] overflow-hidden"
                style={{ background: '#1A1A1A', minHeight: 180 }}
              >
                <img
                  src="/src/assets/6.svg"
                  alt=""
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-[120%] object-contain"
                  style={{ maxWidth: '55%' }}
                />
                <div className="relative z-10 p-6" style={{ maxWidth: '55%' }}>
                  <p className="text-[10px] font-black text-[#E9424C] uppercase tracking-widest mb-1">
                    Welcome back
                  </p>
                  <h2 className="text-white text-xl md:text-2xl font-black leading-tight mb-2">
                    Hey, {firstName}!
                  </h2>
                  <p className="text-white/50 text-xs font-medium leading-relaxed mb-1">
                    Keep practising consistently to reach your target MUET band.
                  </p>
                  <p className="text-white/30 text-xs font-medium leading-relaxed">
                    Every session counts — reading, listening, writing and
                    speaking make the difference.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest mb-3">
                  MUET Components
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {COMPONENT_CONFIG.map(({ label, key, icon: Icon, href }) => {
                    const att = attempts[key] ?? 0
                    return (
                      <a key={key} href={href} className="group block">
                        <Card className="border-2 border-[#151313] shadow-[4px_4px_0px_#151313] rounded-2xl bg-white group-hover:shadow-[6px_6px_0px_#151313] group-hover:-translate-y-1 transition-all duration-200 h-full">
                          <CardContent className="p-4 flex flex-col gap-3">
                            <div className="w-9 h-9 rounded-xl border-2 border-[#151313] flex items-center justify-center bg-[#E9424C] shadow-[2px_2px_0px_#151313]">
                              <Icon size={15} className="text-white" />
                            </div>
                            <p className="text-sm font-black text-[#151313]">
                              {label}
                            </p>
                            <div className="flex items-center justify-between pt-2 border-t border-[#151313]/10">
                              <span className="text-[9px] font-semibold text-[#151313]/40">
                                Attempts
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-black h-auto py-0.5 px-2 rounded-full ${att > 0 ? 'bg-[#E9424C]/10 text-[#E9424C] border-[#E9424C]/30' : 'bg-transparent text-[#151313]/30 border-[#151313]/10'}`}
                              >
                                {att}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </a>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest mb-3">
                  Recent History
                </p>
                <Tabs defaultValue="reading" className="w-full">
                  <div className="mb-3">
                    <TabsList
                      className="bg-white border-2 border-[#151313] rounded-xl shadow-[2px_2px_0px_#151313] h-auto p-1 w-auto"
                      style={{ display: 'inline-flex', gap: '2px' }}
                    >
                      {TABS.map((tab) => (
                        <TabsTrigger
                          key={tab}
                          value={tab}
                          className="text-[10px] font-black capitalize rounded-lg px-3 py-1.5 data-[state=active]:bg-[#151313] data-[state=active]:text-white data-[state=active]:shadow-[2px_2px_0px_#E9424C] transition-all"
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {TABS.map((tab) => {
                    const rows = history
                      .filter((h) => h.component === tab)
                      .slice(0, 10)
                    return (
                      <TabsContent key={tab} value={tab} className="mt-0">
                        <Card className="border-2 border-[#151313] shadow-[4px_4px_0px_#151313] rounded-2xl overflow-hidden bg-white">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-[#151313] hover:bg-[#151313] border-b-0">
                                {[
                                  'Component',
                                  'Practice Set',
                                  'Band',
                                  'Date',
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
                              {loadingDash ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    className="text-center text-xs font-semibold text-[#151313]/30 py-8"
                                  >
                                    Loading...
                                  </TableCell>
                                </TableRow>
                              ) : rows.length === 0 ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    className="text-center text-xs font-semibold text-[#151313]/30 py-8"
                                  >
                                    No attempts yet.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                rows.map((row, i) => (
                                  <TableRow
                                    key={i}
                                    className="border-b border-[#151313]/10 hover:bg-[#f7f7f5] transition-colors"
                                  >
                                    <TableCell className="py-3 pl-4">
                                      <span className="text-xs font-black text-[#151313] capitalize">
                                        {row.component}
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <span className="text-[10px] font-semibold text-[#151313]/60">
                                        {row.set_label || '—'}
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      {row.band ? (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] font-black text-[#E9424C] bg-[#E9424C]/10 border-[#E9424C]/30 rounded-full px-2 py-0.5 h-auto"
                                        >
                                          {row.band}
                                        </Badge>
                                      ) : (
                                        <span className="text-[10px] text-[#151313]/30">
                                          —
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <span className="text-[10px] font-semibold text-[#151313]/40">
                                        {formatDate(row.end_time)}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </Card>
                      </TabsContent>
                    )
                  })}
                </Tabs>
              </div>
              <div className="pb-6" />
            </main>

            <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-l-2 border-[#151313] bg-[#f7f7f5] overflow-y-auto p-4 space-y-4 h-full sticky top-0">
              <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest pt-1">
                My Progress
              </p>
              <Calendar sessionsByDay={sessionsByDay} />
              <WeeklyProgressCard weeklyData={weeklyData} />
            </aside>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
