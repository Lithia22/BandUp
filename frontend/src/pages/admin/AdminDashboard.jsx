import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import SidebarLayout from '../../components/layouts/SidebarLayout'

export default function AdminDashboard() {
  const name = localStorage.getItem('bandup_name') || 'Admin'
  const firstName = name.split(' ')[0]

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{
        '--sidebar-width': '16rem',
        '--sidebar-width-icon': '3.5rem',
      }}
    >
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <SidebarLayout role="admin" />

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
                  Welcome to your admin dashboard. Manage questions, students,
                  and results.
                </p>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
