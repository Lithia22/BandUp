import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import SidebarLayout from '../components/layouts/SidebarLayout'
import { toast } from 'sonner'
import api from '../services/api'

export default function Profile() {
  const navigate = useNavigate()
  const role = localStorage.getItem('bandup_role')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
  })

  const getInitials = (name) => {
    return (
      name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
    )
  }

  const getRoleDisplay = (role) => {
    return role === 'admin' ? 'Administrator' : 'Student'
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('bandup_token')
        if (!token) {
          navigate('/login')
          return
        }

        const payload = JSON.parse(atob(token.split('.')[1]))
        const res = await api.get(`/auth/me?user_id=${payload.sub}`)
        setForm({
          full_name: res.data.full_name || '',
          email: res.data.email || '',
        })
      } catch (err) {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('bandup_token')
      const payload = JSON.parse(atob(token.split('.')[1]))

      const res = await api.put(
        '/auth/profile',
        {
          full_name: form.full_name,
          email: form.email,
        },
        {
          params: { user_id: payload.sub },
        }
      )

      localStorage.setItem('bandup_name', res.data.user.full_name)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SidebarProvider defaultOpen={false}>
        <div className="flex min-h-screen w-full bg-[#f7f7f5]">
          <SidebarLayout role={role} />
          <SidebarInset className="flex-1 min-w-0">
            <main className="h-full overflow-y-auto p-4 md:p-6">
              <div className="max-w-4xl mx-auto">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse" />
                          <div className="h-4 w-32 bg-gray-200 animate-pulse" />
                          <div className="h-3 w-40 bg-gray-200 animate-pulse" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <div className="h-6 w-40 bg-gray-200 animate-pulse" />
                        <div className="h-4 w-56 bg-gray-200 animate-pulse" />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="h-10 w-full bg-gray-200 animate-pulse" />
                        <div className="h-10 w-full bg-gray-200 animate-pulse" />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <SidebarLayout role={role} />
        <SidebarInset className="flex-1 min-w-0">
          <main className="h-full overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <div className="flex items-center gap-2">
                <div className="md:hidden">
                  <SidebarTrigger />
                </div>
                <h1 className="text-xl md:text-3xl font-black text-[#151313]">
                  Edit Profile
                </h1>
              </div>
            </div>
            <p className="text-xs md:text-sm text-[#151313]/60 mb-4 md:mb-6">
              Update your profile information
            </p>

            <div className="max-w-4xl mx-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <Card className="border-2 border-[#151313] shadow-[4px_4px_0px_#151313] rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center space-y-4">
                        <Avatar className="h-24 w-24 border-2 border-[#151313]">
                          <AvatarFallback className="text-xl font-black bg-[#E9424C]/10 text-[#E9424C]">
                            {getInitials(form.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-center space-y-2">
                          <h3 className="font-black text-lg text-[#151313]">
                            {form.full_name || 'User'}
                          </h3>
                          <p className="text-sm text-[#151313]/60">
                            {form.email}
                          </p>
                          <div className="pt-2">
                            <Badge
                              variant="outline"
                              className="border-[#E9424C] text-[#E9424C] bg-[#E9424C]/5 font-bold"
                            >
                              {getRoleDisplay(role)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  <Card className="border-2 border-[#151313] shadow-[4px_4px_0px_#151313] rounded-2xl overflow-hidden">
                    <CardHeader className="border-b-2 border-[#151313] bg-white">
                      <CardTitle className="text-[#151313] font-black">
                        Profile Information
                      </CardTitle>
                      <CardDescription className="text-[#151313]/60">
                        Update your profile details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-[#151313] uppercase tracking-wide">
                            Full Name
                          </label>
                          <Input
                            type="text"
                            value={form.full_name}
                            onChange={(e) =>
                              setForm({ ...form, full_name: e.target.value })
                            }
                            className="border-2 border-[#151313] rounded-xl h-12 text-sm font-semibold focus-visible:border-[#E9424C]"
                            placeholder="Your full name"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-[#151313] uppercase tracking-wide">
                            Email Address
                          </label>
                          <Input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                              setForm({ ...form, email: e.target.value })
                            }
                            className="border-2 border-[#151313] rounded-xl h-12 text-sm font-semibold focus-visible:border-[#E9424C]"
                            placeholder="your.email@example.com"
                          />
                          <p className="text-[9px] text-[#151313]/40 mt-1">
                            Changing email may affect your login credentials
                          </p>
                        </div>
                        <div className="flex justify-end pt-4">
                          <Button
                            type="submit"
                            disabled={saving}
                            className="bg-[#E9424C] hover:bg-[#151313] text-white font-black text-xs rounded-xl border-2 border-[#151313] shadow-[2px_2px_0px_#151313] disabled:opacity-50 flex items-center justify-center gap-1 px-4 py-2 transition-all"
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
