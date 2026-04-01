import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Headphones,
  SquarePen,
  Mic,
  ChevronRight,
} from 'lucide-react'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import SidebarLayout from '../../../components/layouts/SidebarLayout'
import api from '../../../services/api'

const COMPONENTS = [
  {
    key: 'reading',
    label: 'Reading',
    icon: BookOpen,
    description: '7 parts • 40 questions • passages',
    path: '/admin/reading',
  },
  {
    key: 'listening',
    label: 'Listening',
    icon: Headphones,
    description: '5 parts • 30 questions • audio',
    path: '/admin/listening',
  },
  {
    key: 'writing',
    label: 'Writing',
    icon: SquarePen,
    description: '1 task • email reply • 100 words',
    path: '/admin/writing',
  },
  {
    key: 'speaking',
    label: 'Speaking',
    icon: Mic,
    description: 'booklets • individual • presentation',
    path: '/admin/speaking',
  },
]

export default function AdminQuestions() {
  const navigate = useNavigate()
  const [setCounts, setSetCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all(
      COMPONENTS.map(async (c) => {
        try {
          const res = await api.get(`/${c.key}/sets`)
          return { key: c.key, count: res.data.sets?.length || 0 }
        } catch (error) {
          console.error(`Error loading ${c.key} sets:`, error)
          return { key: c.key, count: 0 }
        }
      })
    ).then((results) => {
      const map = {}
      results.forEach(({ key, count }) => {
        map[key] = count
      })
      setSetCounts(map)
      setLoading(false)
    })
  }, [])

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' }}
    >
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <SidebarLayout role="admin" />
        <SidebarInset className="flex-1 min-w-0">
          <main className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
            <div className="flex items-center justify-between mb-2 md:hidden">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h2 className="text-lg font-black text-[#151313]">
                  Manage Questions
                </h2>
              </div>
            </div>

            <Card
              className="relative border-2 border-[#151313] rounded-2xl overflow-hidden mb-6 shadow-[4px_4px_0px_#151313]"
              style={{ background: '#1A1A1A', minHeight: 160 }}
            >
              <CardContent className="p-6">
                <Badge
                  variant="outline"
                  className="bg-[#E9424C] text-white border-2 border-[#151313] mb-2 text-[10px]"
                >
                  Admin Panel
                </Badge>
                <h2 className="text-white text-xl md:text-2xl font-black leading-tight mb-1.5">
                  Manage Questions
                </h2>
                <p className="text-white/50 text-xs font-medium">
                  Select a component to add, edit or remove practice sets.
                </p>
              </CardContent>
            </Card>

            <div>
              <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest mb-3">
                Choose a Component
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl">
                {COMPONENTS.map(
                  ({ key, label, icon: Icon, description, path }) => (
                    <Card
                      key={key}
                      className="group cursor-pointer border-2 border-[#151313] rounded-2xl shadow-[4px_4px_0px_#151313] hover:shadow-[6px_6px_0px_#151313] hover:-translate-y-1 transition-all duration-200 w-full"
                      style={{ minHeight: 140 }}
                      onClick={() => navigate(path)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-[#E9424C] border-2 border-[#151313] flex items-center justify-center shadow-[2px_2px_0px_#151313]">
                            <Icon size={18} className="text-white" />
                          </div>
                          <div className="mt-2">
                            <h3 className="text-base font-black text-[#151313]">
                              {label}
                            </h3>
                            <p className="text-[10px] font-semibold text-[#151313]/40">
                              {description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#151313]/10">
                          <span className="text-[10px] font-black text-[#151313]/30 uppercase tracking-widest">
                            {loading
                              ? '—'
                              : `${setCounts[key] ?? 0} practice sets`}
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-[#151313]/30 group-hover:text-[#151313] group-hover:translate-x-0.5 transition-all"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </div>

            <div className="pb-6" />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}