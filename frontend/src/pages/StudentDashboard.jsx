import {
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarRail,
  useSidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/student' },
  { label: 'Reading', icon: BookOpen, href: '/reading' },
  { label: 'Listening', icon: Headphones, href: '/listening' },
  { label: 'Writing', icon: PenLine, href: '/writing' },
  { label: 'Speaking', icon: Mic, href: '/speaking' },
]

const COMPONENTS = [
  { label: 'Reading', icon: BookOpen, band: null, color: '#FFC8A2' },
  { label: 'Listening', icon: Headphones, band: null, color: '#B0E0D6' },
  { label: 'Writing', icon: PenLine, band: null, color: '#be94f5' },
  { label: 'Speaking', icon: Mic, band: null, color: '#fccc42' },
]

function ArrowToggle() {
  const { toggleSidebar, open } = useSidebar()
  return (
    <button
      onClick={toggleSidebar}
      className="w-6 h-6 rounded-full border-2 border-[#151313] bg-white flex items-center justify-center hover:bg-[#E9424C] hover:text-white hover:border-[#E9424C] transition-all duration-150 shrink-0"
    >
      {open ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
    </button>
  )
}

// SidebarLeft
function SidebarLeft() {
  const handleLogout = () => {
    localStorage.removeItem('bandup_token')
    localStorage.removeItem('bandup_role')
    localStorage.removeItem('bandup_name')
    window.location.href = '/'
  }

  return (
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader className="border-b-2 border-[#151313]">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-2">
              <SidebarMenuButton
                asChild
                size="lg"
                className="hover:bg-transparent active:bg-transparent flex-1 min-w-0"
              >
                <a href="/student">
                  <span className="font-black text-[#151313] text-base truncate">
                    Band<span className="text-[#E9424C]">Up</span>
                  </span>
                </a>
              </SidebarMenuButton>
              <ArrowToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton
                    asChild
                    isActive={window.location.pathname === href}
                    tooltip={label}
                    className="data-[active=true]:bg-[#E9424C] data-[active=true]:text-white data-[active=true]:shadow-[2px_2px_0px_#151313] font-semibold"
                  >
                    <a href={href}>
                      <Icon size={16} />
                      <span>{label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t-2 border-[#151313]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="text-[#E9424C] font-bold hover:bg-[#E9424C]/10 hover:text-[#E9424C]"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default function StudentDashboard() {
  const name = localStorage.getItem('bandup_name') || 'Student'
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
        <SidebarLeft />

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
