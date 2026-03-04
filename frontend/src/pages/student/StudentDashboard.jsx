import { BookOpen, Headphones, PenLine, Mic } from 'lucide-react'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import StudentSidebar from '../../components/layouts/StudentSidebar'

const COMPONENTS = [
  { label: 'Reading', icon: BookOpen, band: null },
  { label: 'Listening', icon: Headphones, band: null },
  { label: 'Writing', icon: PenLine, band: null },
  { label: 'Speaking', icon: Mic, band: null },
]

export default function StudentDashboard() {
  const name = localStorage.getItem('bandup_name') || 'Student'
  const firstName = name.split(' ')[0]

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' }}
    >
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <StudentSidebar />

        <SidebarInset className="flex-1 min-w-0">
          <main className="h-full overflow-y-auto p-4 md:p-6">
            <div className="flex items-center mb-4 md:hidden">
              <SidebarTrigger />
            </div>

            <div
              className="relative rounded-2xl border-2 border-[#151313] overflow-hidden mb-5"
              style={{ background: '#1A1A1A', minHeight: 180 }}
            >
              <img
                src="/src/assets/6.svg"
                alt="illustration"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-[120%] object-contain"
                style={{ maxWidth: '55%' }}
              />
              <div className="relative z-10 p-6" style={{ maxWidth: '50%' }}>
                <h2 className="text-white text-xl md:text-2xl font-black leading-tight mb-1.5">
                  Hey, {firstName}!
                </h2>
                <p className="text-white/50 text-xs font-medium">
                  Keep practising consistently to reach your target MUET band.
                </p>
              </div>
            </div>

            <p className="text-[10px] font-black text-[#151313]/60 uppercase tracking-widest mb-3">
              MUET Components
            </p>
            <div className="grid grid-cols-2 gap-3">
              {COMPONENTS.map(({ label, icon: Icon, band }) => (
                <a
                  key={label}
                  href={`/${label.toLowerCase()}`}
                  className="group bg-white rounded-xl border-2 border-[#151313] p-4 flex flex-col gap-3 shadow-[4px_4px_0px_#151313] transition-all duration-200 hover:shadow-[6px_6px_0px_#151313] hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg border-2 border-[#151313] flex items-center justify-center bg-[#E9424C]">
                      <Icon size={14} className="text-white" />
                    </div>
                    <span className="text-[9px] font-black text-white bg-[#151313] px-2 py-0.5 rounded-md">
                      Start
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#151313]">{label}</p>
                    {band !== null ? (
                      <p className="text-[10px] font-bold text-[#E9424C]">
                        Band {band}
                      </p>
                    ) : (
                      <p className="text-[10px] font-medium text-[#151313]/25">
                        No attempt yet
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
