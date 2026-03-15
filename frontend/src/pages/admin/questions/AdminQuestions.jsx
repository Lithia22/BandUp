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
    description: 'booklets • candidates • discussion',
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
          const res = await api.get(`/admin/questions?component=${c.key}`)
          const questions = res.data.questions || []
          const uniqueSets = [...new Set(questions.map((q) => q.set_number))]
          return { key: c.key, count: uniqueSets.length }
        } catch {
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
          <main className="h-full overflow-y-auto p-4 md:p-6">
            <div className="flex items-center mb-4 md:hidden">
              <SidebarTrigger />
            </div>

            <Card
              className="relative border-2 border-[#151313] rounded-2xl overflow-hidden mb-6 shadow-[4px_4px_0px_#151313]"
              style={{ background: '#1A1A1A', minHeight: 160 }}
            >
              <CardContent className="p-6">
                <Badge
                  variant="outline"
                  className="bg-[#E9424C] text-white border-2 border-[#151313] mb-2"
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

            <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest mb-3">
              Choose a Component
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl">
              {COMPONENTS.map(
                ({ key, label, icon: Icon, description, path }) => (
                  <Card
                    key={key}
                    className="group cursor-pointer border-2 border-[#151313] rounded-2xl shadow-[4px_4px_0px_#151313] hover:shadow-[6px_6px_0px_#151313] hover:-translate-y-1 transition-all duration-200 w-full"
                    style={{ minHeight: 160 }}
                    onClick={() => navigate(path)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#E9424C] border-2 border-[#151313] flex items-center justify-center shadow-[2px_2px_0px_#151313]">
                          <Icon size={22} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-[#151313]">
                            {label}
                          </h3>
                          <p className="text-xs font-semibold text-[#151313]/40">
                            {description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#151313]/10">
                        <span className="text-xs font-black text-[#151313]/30 uppercase tracking-widest">
                          {loading
                            ? '—'
                            : `${setCounts[key] ?? 0} practice sets`}
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-[#151313]/30 group-hover:text-[#151313] group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
