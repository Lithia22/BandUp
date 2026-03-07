import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, FileText, SquarePen } from 'lucide-react'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import SidebarLayout from '../../../components/layouts/SidebarLayout'
import { PracticeSetSkeleton } from '../../../components/layouts/Skeletons'
import api from '../../../services/api'

const storageKey = (setNumber) => `writing_quiz_${setNumber}`

export default function Writing() {
  const navigate = useNavigate()
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState({})

  useEffect(() => {
    let isMounted = true

    const initializeData = async () => {
      try {
        const savedProgress = {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith('writing_quiz_')) {
            try {
              const setNumber = key.replace('writing_quiz_', '')
              const data = JSON.parse(localStorage.getItem(key))
              if (data?.answer && data.answer.trim().length > 0) {
                savedProgress[setNumber] = {
                  wordCount: data.answer.trim().split(/\s+/).filter(Boolean)
                    .length,
                  timestamp: data.timestamp || Date.now(),
                }
              }
            } catch (e) {}
          }
        }
        if (isMounted) setProgress(savedProgress)

        const res = await api.get('/writing/sets')
        if (isMounted) setSets(res.data.sets)
      } catch (err) {
        if (isMounted) setError('Failed to load practice sets.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initializeData()
    return () => {
      isMounted = false
    }
  }, [])

  const handleStartSet = (setNumber, action = 'start') => {
    if (action === 'restart') {
      localStorage.removeItem(storageKey(setNumber))
      setProgress((prev) => {
        const next = { ...prev }
        delete next[setNumber]
        return next
      })
    }
    navigate(`/writing/${setNumber}`)
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' }}
    >
      <div className="flex min-h-screen w-full bg-[#f7f7f5]">
        <SidebarLayout />
        <SidebarInset className="flex-1 min-w-0">
          <main className="h-full overflow-y-auto p-4 md:p-6">
            <div className="flex items-center mb-4 md:hidden">
              <SidebarTrigger />
            </div>

            {/* Hero banner */}
            <div
              className="relative rounded-2xl border-2 border-[#151313] overflow-hidden mb-6"
              style={{ background: '#1A1A1A', minHeight: 160 }}
            >
              <img
                src="/src/assets/5.svg"
                alt="Writing illustration"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-[130%] object-contain"
                style={{ maxWidth: '45%' }}
              />
              <div className="relative z-10 p-6" style={{ maxWidth: '55%' }}>
                <p className="text-[10px] font-black text-[#E9424C] uppercase tracking-widest mb-1">
                  MUET Component
                </p>
                <h2 className="text-white text-xl md:text-2xl font-black leading-tight mb-1.5">
                  Writing
                </h2>
                <p className="text-white/50 text-xs font-medium">
                  25 mins • 1 task • 100 words min
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
                {sets.map((set) => {
                  const hasProgress = progress[set.set_number]
                  const wordCount = hasProgress?.wordCount || 0

                  return (
                    <div
                      key={set.set_number}
                      className="group bg-white rounded-2xl border-2 border-[#151313] p-5 shadow-[4px_4px_0px_#151313] hover:shadow-[6px_6px_0px_#151313] hover:-translate-y-1 transition-all duration-200"
                    >
                      <p className="text-base font-black text-[#151313] mb-1">
                        {set.label}
                      </p>

                      <div className="flex items-center gap-3 mt-2 mb-4">
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#151313]/50">
                          <Clock size={10} /> 25 mins
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#151313]/50">
                          <FileText size={10} /> 1 task
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#151313]/50">
                          <SquarePen size={10} /> 100 words min
                        </span>
                      </div>

                      {hasProgress && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                            <span className="text-[#151313]/50">
                              Words written
                            </span>
                            <span
                              className={`font-black ${wordCount >= 100 ? 'text-[#22c55e]' : 'text-[#E9424C]'}`}
                            >
                              {wordCount} words
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#151313]/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${wordCount >= 100 ? 'bg-[#22c55e]' : 'bg-[#E9424C]'}`}
                              style={{
                                width: `${Math.min((wordCount / 100) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-[8px] font-medium text-[#151313]/30 mt-1">
                            Last active:{' '}
                            {formatTimestamp(hasProgress.timestamp)}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        {hasProgress ? (
                          <>
                            <button
                              onClick={() =>
                                handleStartSet(set.set_number, 'resume')
                              }
                              className="flex-1 bg-[#151313] text-white border-2 border-[#151313] rounded-xl px-3 py-2 text-xs font-black shadow-[2px_2px_0px_#151313] hover:bg-[#333] transition-all flex items-center justify-center gap-1"
                            >
                              <SquarePen size={12} /> Resume
                            </button>
                            <button
                              onClick={() =>
                                handleStartSet(set.set_number, 'restart')
                              }
                              className="flex-1 bg-white text-[#151313] border-2 border-[#151313] rounded-xl px-3 py-2 text-xs font-black shadow-[2px_2px_0px_#151313] hover:bg-[#151313] hover:text-white transition-all flex items-center justify-center gap-1"
                            >
                              Restart
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              handleStartSet(set.set_number, 'start')
                            }
                            className="w-full bg-[#151313] text-white border-2 border-[#151313] rounded-xl px-4 py-2 text-xs font-black shadow-[2px_2px_0px_#151313] hover:bg-[#333] transition-all flex items-center justify-center gap-2"
                          >
                            Start Practice
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
