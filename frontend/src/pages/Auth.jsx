import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, X } from 'lucide-react'
import { loginUser, registerUser } from '../services/api'

export default function Auth({ mode = 'login' }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!isLogin) {
        await registerUser({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
        })
      }
      const res = await loginUser({
        email: form.email,
        password: form.password,
      })
      localStorage.setItem('bandup_token', res.data.access_token)
      localStorage.setItem('bandup_role', res.data.user.role)
      localStorage.setItem('bandup_name', res.data.user.full_name)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col">
      <div className="w-full px-6 py-4 flex justify-end">
        <a
          href="/"
          className="w-8 h-8 rounded-full border-2 border-[#151313] flex items-center justify-center hover:bg-[#E9424C] hover:text-white transition-colors"
        >
          <X size={16} />
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-10">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-[#151313] mb-2">
              {isLogin ? 'Log in' : 'Create account'}
            </h1>
            <p className="text-sm font-medium text-[#151313] opacity-50">
              {isLogin
                ? 'Continue your MUET prep journey'
                : 'Practise all 4 MUET components for free'}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl border-2 border-[#151313] p-8 shadow-[4px_4px_0px_#151313]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {!isLogin && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-[#151313] uppercase tracking-wide">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Ahmad bin Ali"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    required
                    className="border-2 border-[#151313] rounded-xl h-12 text-sm font-semibold focus-visible:border-[#E9424C]"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#151313] uppercase tracking-wide">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="border-2 border-[#151313] rounded-xl h-12 text-sm font-semibold focus-visible:border-[#E9424C]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#151313] uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    minLength={8}
                    className="border-2 border-[#151313] rounded-xl h-12 text-sm font-semibold pr-11 focus-visible:border-[#E9424C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#151313] opacity-40 hover:opacity-80"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs font-semibold text-[#E9424C] bg-[#fef2f2] border border-[#E9424C]/20 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-white font-black text-sm rounded-xl border-2 border-[#151313] mt-1 bg-[#E9424C] shadow-[3px_3px_0px_#151313] disabled:opacity-50"
              >
                {loading
                  ? 'Please wait...'
                  : isLogin
                    ? 'Log in'
                    : 'Create account'}
              </Button>
            </form>
          </div>

          {/* Switch link */}
          <p className="text-center text-sm font-semibold text-[#151313] mt-6">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <a
              href={isLogin ? '/signup' : '/login'}
              className="text-[#E9424C] font-black hover:underline opacity-80"
            >
              {isLogin ? 'Sign up free' : 'Log in'}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
