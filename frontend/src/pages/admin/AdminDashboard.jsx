import { useEffect, useState } from 'react'
import { Users, TrendingUp, BookOpen, AlertCircle } from 'lucide-react'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import SidebarLayout from '../../components/layouts/SidebarLayout'
import api from '../../services/api'

const CLUSTER_CONFIG = {
  'Foundation Needed': { icon: AlertCircle, color: '#E9424C' },
  'Balanced Performer': { icon: TrendingUp, color: '#22c55e' },
  'Good Understanding Skills': { icon: BookOpen, color: '#3b82f6' },
  'Good Expressive Skills': { icon: Users, color: '#f59e0b' },
}

export default function AdminDashboard() {
  const name = localStorage.getItem('bandup_name') || 'Admin'
  const firstName = name.split(' ')[0]
  const [clusterData, setClusterData] = useState(null)

  useEffect(() => {
    api
      .get('/admin/clusters')
      .then((res) => setClusterData(res.data))
      .catch((e) => console.error(e))
  }, [])

  const labels = Object.keys(CLUSTER_CONFIG)

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' }}
    >
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <SidebarLayout role="admin" />
        <SidebarInset className="flex-1 min-w-0">
          <main className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
            <div className="flex items-center md:hidden">
              <SidebarTrigger />
            </div>

            {/* Welcome Banner — same style as student */}
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
                  Admin Panel
                </p>
                <h2 className="text-white text-xl md:text-2xl font-black leading-tight mb-2">
                  Hey, {firstName}!
                </h2>
                <p className="text-white/50 text-xs font-medium leading-relaxed mb-1">
                  Monitor student performance clusters and manage your question
                  bank.
                </p>
                <p className="text-white/30 text-xs font-medium leading-relaxed">
                  Use the insights below to make data-driven decisions.
                </p>
              </div>
            </div>

            {/* Cluster Summary Cards */}
            <div>
              <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest mb-3">
                Student Clusters
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {labels.map((label) => {
                  const { icon: Icon, color } = CLUSTER_CONFIG[label]
                  const count = clusterData?.summary?.[label] || 0
                  return (
                    <Card
                      key={label}
                      className="border-2 border-[#151313] shadow-[4px_4px_0px_#151313] rounded-2xl bg-white"
                    >
                      <CardContent className="p-4 flex flex-col gap-3">
                        <div
                          className="w-9 h-9 rounded-xl border-2 border-[#151313] flex items-center justify-center shadow-[2px_2px_0px_#151313]"
                          style={{ background: color }}
                        >
                          <Icon size={15} className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#151313] leading-tight">
                            {label}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#151313]/10">
                          <span className="text-[9px] font-semibold text-[#151313]/40">
                            Students
                          </span>
                          <span
                            className="text-sm font-black"
                            style={{ color: count > 0 ? color : '#15131330' }}
                          >
                            {count}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Quick link */}
            <a
              href="/admin/students"
              className="block border-2 border-[#151313] rounded-2xl bg-white shadow-[4px_4px_0px_#151313] hover:shadow-[6px_6px_0px_#151313] hover:-translate-y-1 transition-all duration-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-[#151313]">
                    View Full Cluster Analysis
                  </p>
                  <p className="text-[10px] text-[#151313]/40 font-medium mt-0.5">
                    See detailed breakdown, charts and individual student data
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl border-2 border-[#151313] bg-[#E9424C] flex items-center justify-center shadow-[2px_2px_0px_#151313]">
                  <Users size={14} className="text-white" />
                </div>
              </div>
            </a>

            <div className="pb-6" />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
