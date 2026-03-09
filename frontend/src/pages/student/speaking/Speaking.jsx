import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Mic } from 'lucide-react'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import SidebarLayout from '../../../components/layouts/SidebarLayout'
import { PracticeSetSkeleton } from '../../../components/layouts/Skeletons'
import api from '../../../services/api'

export default function Speaking() {
  const navigate = useNavigate()
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/speaking/sets')
      .then((res) => setSets(res.data.sets))
      .catch(() => setError('Failed to load practice sets.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' }}
    >
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <SidebarLayout role="student" />
        <SidebarInset className="flex-1 min-w-0">
          <main className="h-full overflow-y-auto p-4 md:p-6">
            <div className="flex items-center mb-4 md:hidden">
              <SidebarTrigger />
            </div>

            <div
              className="relative rounded-2xl border-2 border-[#151313] overflow-hidden mb-6"
              style={{ background: '#1A1A1A', minHeight: 160 }}
            >
              <img
                src="/src/assets/5.svg"
                alt="Speaking illustration"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-[130%] object-contain"
                style={{ maxWidth: '45%' }}
              />
              <div className="relative z-10 p-6" style={{ maxWidth: '55%' }}>
                <p className="text-[10px] font-black text-[#E9424C] uppercase tracking-widest mb-1">
                  MUET Component
                </p>
                <h2 className="text-white text-xl md:text-2xl font-black leading-tight mb-1.5">
                  Speaking
                </h2>
                <p className="text-white/50 text-xs font-medium">
                  2 mins prep • 2 mins speak • AI feedback
                </p>
              </div>
            </div>

            <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest mb-3">
              Choose a Practice Set
            </p>

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <PracticeSetSkeleton />
                <PracticeSetSkeleton />
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border-2 border-[#E9424C] rounded-2xl p-6 max-w-2xl">
                <p className="text-sm font-semibold text-[#E9424C]">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 text-xs font-black text-[#151313] underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                {sets.map((set) => (
                  <div
                    key={set.set_number}
                    className="group bg-white rounded-2xl border-2 border-[#151313] p-5 shadow-[4px_4px_0px_#151313] hover:shadow-[6px_6px_0px_#151313] hover:-translate-y-1 transition-all duration-200"
                  >
                    <p className="text-base font-black text-[#151313] mb-1">
                      {set.label}
                    </p>
                    <div className="flex items-center gap-3 mt-2 mb-4">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#151313]/50">
                        <Clock size={10} /> 2 min prep
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#151313]/50">
                        <Mic size={10} /> 2 min speak
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/speaking/${set.set_number}`)}
                      className="w-full bg-[#151313] text-white border-2 border-[#151313] rounded-xl px-4 py-2 text-xs font-black shadow-[2px_2px_0px_#151313] hover:bg-[#333] transition-all flex items-center justify-center gap-2"
                    >
                      View Booklets
                    </button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
