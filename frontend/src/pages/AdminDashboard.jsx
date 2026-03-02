import {
  LayoutDashboard,
  BookOpenCheck,
  Users,
  BarChart2,
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
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Manage Questions', icon: BookOpenCheck, href: '/admin/questions' },
  { label: 'View Students', icon: Users, href: '/admin/students' },
  { label: 'Results Overview', icon: BarChart2, href: '/admin/results' },
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

function AdminSidebar() {
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
                <a href="/admin">
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
        <AdminSidebar />

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
