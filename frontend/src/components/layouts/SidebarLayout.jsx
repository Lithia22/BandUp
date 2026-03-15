import {
  BookOpen,
  Headphones,
  SquarePen,
  Mic,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpenCheck,
  ScatterChart,
  BarChart2,
  User,
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
import { Button } from '@/components/ui/button'

const STUDENT_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/student' },
  { label: 'Analytics', icon: BarChart2, href: '/analytics' },
  { label: 'Reading', icon: BookOpen, href: '/reading' },
  { label: 'Listening', icon: Headphones, href: '/listening' },
  { label: 'Writing', icon: SquarePen, href: '/writing' },
  { label: 'Speaking', icon: Mic, href: '/speaking' },
  { label: 'Profile', icon: User, href: '/profile' },
]

const ADMIN_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Manage Questions', icon: BookOpenCheck, href: '/admin/questions' },
  { label: 'Analytics', icon: ScatterChart, href: '/admin/analytics' },
  { label: 'Profile', icon: User, href: '/profile' },
]

function ArrowToggle() {
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar()
  const isOpen = isMobile ? openMobile : open
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleSidebar}
      className="w-6 h-6 rounded-full border-2 border-[#151313] bg-white hover:bg-[#E9424C] hover:text-white hover:border-[#E9424C] transition-all duration-150 shrink-0"
    >
      {isOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
    </Button>
  )
}

export default function SidebarLayout({ role = 'student' }) {
  const { open, openMobile, isMobile } = useSidebar()
  const isOpen = isMobile ? openMobile : open
  const isAdmin = role === 'admin'
  const navItems = isAdmin ? ADMIN_NAV : STUDENT_NAV
  const homeHref = isAdmin ? '/admin' : '/student'

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
                <a href={homeHref} className="flex items-center gap-2">
                  <img
                    src="/logo.svg"
                    alt="BandUp"
                    className="h-6 w-auto shrink-0"
                  />
                  {isOpen && (
                    <span className="font-black text-[#151313] text-base truncate">
                      Band<span className="text-[#E9424C]">Up</span>
                    </span>
                  )}
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
              {navItems.map(({ label, icon: Icon, href }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      href === '/admin'
                        ? window.location.pathname === href
                        : window.location.pathname.startsWith(href)
                    }
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
