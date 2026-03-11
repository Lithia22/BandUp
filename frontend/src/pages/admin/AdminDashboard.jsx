import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { CLUSTER_CONFIG } from '../../components/layouts/AdminCharts'
import SidebarLayout from '../../components/layouts/SidebarLayout'
import api from '../../services/api'

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

            <div>
              <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest mb-3">
                Student Clusters
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {labels.map((label) => {
                  const {
                    icon: Icon,
                    color,
                    text,
                    description,
                  } = CLUSTER_CONFIG[label]
                  const count = clusterData?.summary?.[label] || 0
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
                })}
              </div>
            </div>

            <a
              href="/admin/analytics"
              className="block border-2 border-[#151313] rounded-2xl bg-white shadow-[3px_3px_0px_#151313] hover:shadow-[6px_6px_0px_#151313] hover:-translate-y-1 transition-all duration-200 p-4"
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
              </div>
            </a>

            <div className="pb-6" />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
