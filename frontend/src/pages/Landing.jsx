import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Subscribe', href: '#footer' },
  { label: 'Contact Us', href: 'mailto:hello@bandup.com' },
]

const COMPONENTS = [
  {
    label: 'Reading',
    svg: '2.svg',
    time: '75 mins • 40 Ques',
    desc: 'MCQs and gapped text questions',
  },
  {
    label: 'Listening',
    svg: '3.svg',
    time: '50 mins • 30 Ques',
    desc: 'Multiple choice questions',
  },
  {
    label: 'Writing',
    svg: '4.svg',
    time: '25 mins • 1 essay',
    desc: 'Guided email or letter writing',
  },
  {
    label: 'Speaking',
    svg: '5.svg',
    time: '2 mins prep • 2 mins speak',
    desc: 'Individual presentation practice',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [email, setEmail] = useState('')
  const subscribeInputRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMenu = () => setMenuOpen(!menuOpen)
  const closeMenu = () => setMenuOpen(false)

  const focusSubscribeInput = () => {
    if (subscribeInputRef.current) {
      subscribeInputRef.current.focus()
    }
  }

  const scrollTo = (e, id) => {
    e.preventDefault()
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })

    if (id === '#footer') {
      setTimeout(focusSubscribeInput, 300)
    }

    closeMenu()
  }

  const handleSubscribe = () => {
    if (!email) return toast.error('Please enter your email!')
    toast.success("You're subscribed!", {
      description: `We'll keep ${email} updated.`,
    })
    setEmail('')
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#f7f7f5] shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="#home"
            onClick={(e) => scrollTo(e, '#home')}
            className="flex items-center gap-2"
          >
            <img src="/logo.svg" alt="BandUp" className="h-7 w-auto" />
            <span className="text-xl font-black text-[#151313]">
              Band<span className="text-[#E9424C]">Up</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={
                  href.startsWith('#') ? (e) => scrollTo(e, href) : undefined
                }
                className="text-sm text-[#151313] hover:text-[#E9424C] font-semibold"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/signup')}
              className="text-sm text-[#151313] font-bold hover:text-[#E9424C]"
            >
              Sign up
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="text-white text-sm rounded-xl px-5 border-2 border-[#151313] font-bold bg-[#E9424C]"
            >
              Login
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            className="md:hidden text-[#151313] hover:text-[#E9424C] hover:bg-transparent"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </Button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#f7f7f5] border-t px-6 pb-5 pt-3">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={
                  href.startsWith('#') ? (e) => scrollTo(e, href) : undefined
                }
                className="block py-2.5 text-sm text-[#151313] font-semibold hover:text-[#E9424C]"
              >
                {label}
              </a>
            ))}
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/signup')}
                className="flex-1 text-sm border-2 border-[#151313] text-[#151313] rounded-xl font-bold"
              >
                Sign up
              </Button>
              <Button
                onClick={() => navigate('/login')}
                className="flex-1 text-sm text-white rounded-xl border-2 border-[#151313] font-bold bg-[#E9424C]"
              >
                Login
              </Button>
            </div>
          </div>
        )}
      </header>

      <section
        id="home"
        className="relative max-w-6xl mx-auto px-6 flex flex-col justify-center"
        style={{ minHeight: '100vh', paddingTop: 80 }}
      >
        <div
          className="hidden md:block absolute"
          style={{
            right: -40,
            top: '60%',
            transform: 'translateY(-50%)',
            width: '56%',
            maxWidth: 660,
          }}
        >
          <img
            src="/src/assets/1.svg"
            alt="Student illustration"
            className="w-full h-auto"
          />
        </div>

        <div className="relative z-10" style={{ maxWidth: 620 }}>
          <h1
            className="text-[#151313] leading-[1.02] mb-5"
            style={{ fontSize: 'clamp(44px, 7vw, 86px)', fontWeight: 900 }}
          >
            Reach your
            <br />
            <span className="text-[#E9424C]">target MUET</span>
            <br />
            band level
          </h1>
          <p
            className="text-[#151313] leading-relaxed mb-8"
            style={{
              fontSize: 15,
              fontWeight: 500,
              maxWidth: 450,
              opacity: 0.6,
            }}
          >
            Interactive practice for Listening, Reading, Writing & Speaking.
            Answer MUET past year papers and get instant AI feedback.
          </p>
          <div className="flex items-center gap-6">
            <Button
              onClick={() => navigate('/login')}
              className="text-white rounded-2xl px-7 py-6 text-sm border-2 border-[#151313] font-bold bg-[#E9424C]"
            >
              Start practising
            </Button>
            <a
              href="#features"
              onClick={(e) => scrollTo(e, '#features')}
              className="text-[#E9424C] text-sm flex items-center gap-1 font-bold group"
            >
              Learn more
              <ArrowUpRight
                size={16}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-8 md:py-16 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-2xl md:text-4xl font-black text-[#151313] mb-2">
            Four components.
            <span className="text-[#E9424C]">One platform.</span>
          </h2>
          <p className="text-[#151313] opacity-60 font-medium text-xs md:text-base">
            Practise every part of MUET with AI feedback
          </p>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap gap-3">
          {COMPONENTS.map(({ label, svg, time, desc }) => (
            <div
              key={label}
              className="w-full lg:w-1/4 bg-[#f7f7f5] rounded-2xl p-4 md:p-6 border-2 border-[#151313] hover:shadow-[6px_6px_0px_#151313] hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 md:w-32 md:h-32 mb-3">
                  <img
                    src={`/src/assets/${svg}`}
                    alt={label}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base md:text-xl font-black text-[#151313] mb-1">
                  {label}
                </h3>
                <p className="text-xs font-semibold opacity-40 mb-2">{time}</p>
                <p className="text-[10px] md:text-xs font-medium opacity-60 mb-3">
                  {desc}
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#E9424C] text-white rounded-xl border-2 border-[#151313] font-bold hover:bg-[#151313] text-xs md:text-sm py-5"
                >
                  Try {label}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer id="footer" className="bg-[#151313]">
        <div className="max-w-6xl mx-auto px-6 py-6 md:py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-6">
            <div>
              <a
                href="#home"
                onClick={(e) => scrollTo(e, '#home')}
                className="flex items-center gap-2"
              >
                <img src="/logo.svg" alt="BandUp" className="h-7 w-auto" />
                <span className="text-xl md:text-2xl font-black text-[#f7f7f5]">
                  Band<span className="text-[#E9424C]">Up</span>
                </span>
              </a>
              <div className="mt-1">
                <a
                  href="mailto:hello@bandup.com"
                  className="text-xs text-[#f7f7f5] opacity-60 hover:text-[#E9424C]"
                >
                  hello@bandup.com
                </a>
              </div>
            </div>
            <div className="w-full md:w-auto flex gap-2">
              <Input
                ref={subscribeInputRef}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#f7f7f5]/10 border-[#f7f7f5]/20 text-[#f7f7f5] placeholder:text-[#f7f7f5]/40 focus-visible:border-[#E9424C] focus-visible:ring-0 w-full md:w-40 cursor-text"
                style={{ caretColor: '#E9424C' }}
              />
              <Button
                onClick={handleSubscribe}
                className="bg-[#E9424C] text-white rounded-xl hover:bg-[#E9424C]/90 font-bold text-xs px-3"
              >
                Subscribe
              </Button>
            </div>
          </div>

          <div className="pt-3 md:pt-4 border-t border-[#f7f7f5]/10 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-[#f7f7f5] opacity-40">
              © 2026 BandUp. All rights reserved.
            </p>
            <a
              href="#"
              className="text-xs text-[#f7f7f5] opacity-40 hover:text-[#E9424C]"
            >
              Terms & Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
