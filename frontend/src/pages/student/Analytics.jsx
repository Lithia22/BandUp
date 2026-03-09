import { useEffect, useState } from 'react'
import { BookOpen, Headphones, SquarePen, Mic } from 'lucide-react'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import SidebarLayoutDefault from '../../components/layouts/SidebarLayout'
import {
  BandOverTimeChart,
  BandRadarChart,
  AttemptsBarChart,
  bandLabel,
} from '../../components/layouts/Charts'
import api from '../../services/api'

const COMPONENT_ICONS = {
  reading: BookOpen,
  listening: Headphones,
  writing: SquarePen,
  speaking: Mic,
}

export default function Analytics() {
  const [bandTrend, setBandTrend] = useState({})
  const [componentBands, setComponentBands] = useState({})
  const [attempts, setAttempts] = useState({})
  const [loading, setLoading] = useState(true)

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
      setLoading(false)
      return
    }

    api
      .get(`/analytics?user_id=${studentId}`)
      .then((res) => {
        const d = res.data
        setBandTrend(d.band_trend || {})
        setComponentBands(d.component_bands || {})
        setAttempts(d.attempts || {})
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const components = ['reading', 'listening', 'writing', 'speaking']

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' }}
    >
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <SidebarLayoutDefault />
        <SidebarInset className="flex-1 min-w-0">
          <main className="overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center md:hidden">
              <SidebarTrigger />
            </div>

            <div>
              <p className="text-[10px] font-black text-[#151313]/50 uppercase tracking-widest mb-0.5">
                My Analytics
              </p>
              <h1 className="text-xl font-black text-[#151313]">
                Performance Overview
              </h1>
              <p className="text-xs text-[#151313]/40 font-medium mt-0.5">
                A summary of your MUET practice progress
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {components.map((c) => {
                const Icon = COMPONENT_ICONS[c]
                const num = componentBands[c]
                const att = attempts[c] || 0
                return (
                  <Card
                    key={c}
                    className="border-2 border-[#151313] shadow-[3px_3px_0px_#151313] rounded-2xl bg-white"
                  >
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-xl border-2 border-[#151313] flex items-center justify-center bg-[#E9424C] shadow-[2px_2px_0px_#151313]">
                          <Icon size={13} className="text-white" />
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-black h-auto py-0.5 px-2 rounded-full ${att > 0 ? 'bg-[#E9424C]/10 text-[#E9424C] border-[#E9424C]/30' : 'bg-transparent text-[#151313]/30 border-[#151313]/10'}`}
                        >
                          {att} attempts
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#151313] capitalize">
                          {c}
                        </p>
                        <p className="text-lg font-black text-[#E9424C]">
                          {num ? bandLabel(num) : 'No data'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div>
              <p className="text-[10px] font-black text-[#151313]/50 uppercase tracking-widest mb-3">
                Band Progression
              </p>
              <BandOverTimeChart bandTrend={bandTrend} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BandRadarChart componentBands={componentBands} />
              <AttemptsBarChart attempts={attempts} />
            </div>

            <div className="pb-6" />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
