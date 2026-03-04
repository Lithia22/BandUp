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
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/student' },
  { label: 'Reading', icon: BookOpen, href: '/reading' },
  { label: 'Listening', icon: Headphones, href: '/listening' },
  { label: 'Writing', icon: PenLine, href: '/writing' },
  { label: 'Speaking', icon: Mic, href: '/speaking' },
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

export default function StudentSidebar() {
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
