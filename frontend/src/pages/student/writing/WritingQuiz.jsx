import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useBlocker } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import QuizTimer from '../../../components/layouts/QuizTimer'
import api from '../../../services/api'
import {
  ExitWarningDialog,
  SubmitDialog,
} from '../../../components/layouts/Dialog'
import {
  QuizPageSkeleton,
  SubmissionSkeleton,
} from '../../../components/layouts/Skeletons'

const QUIZ_DURATION = 25 * 60
const storageKey = (n) => `writing_quiz_${n}`
const MIN_WORDS = 100

function EmailDisplay({ passage }) {
  const data = (() => {
    if (!passage) return null
    if (typeof passage === 'object') return passage
    try {
      return JSON.parse(passage)
    } catch {
      return null
    }
  })()

  if (!data) return null

  const paragraphs = data.paragraphs || []

  return (
    <div>
      {data.context && (
        <p className="text-sm font-medium text-[#151313] leading-relaxed mb-4 text-justify">
          {data.context}
        </p>
      )}

      <div className="bg-white border-2 border-[#151313] rounded-2xl overflow-hidden shadow-[3px_3px_0px_#151313]">
        <div className="bg-[#151313] px-4 py-2.5 flex items-center justify-between">
          <span className="text-white text-xs font-black">New Message</span>
          <span className="text-white/40 text-xs">_ X</span>
        </div>

        {data.from && (
          <div className="flex gap-3 px-4 py-2.5 border-b border-[#151313]/10 text-sm">
            <span className="font-black text-[#151313] shrink-0 w-16">
              From:
            </span>
            <span className="font-medium text-[#151313]">{data.from}</span>
          </div>
        )}
        {data.subject && (
          <div className="flex gap-3 px-4 py-2.5 border-b-2 border-[#151313]/20 text-sm">
            <span className="font-black text-[#151313] shrink-0 w-16">
              Subject:
            </span>
            <span className="font-medium text-[#151313]">{data.subject}</span>
          </div>
        )}

        <div className="p-5 space-y-4">
          {paragraphs.map((para, idx) => {
            const hasNote = !!para.note
            return (
              <div key={para.id}>
                <p
                  className={`text-sm leading-relaxed text-justify ${idx === 0 ? 'font-semibold' : 'italic font-medium'} text-[#151313]`}
                >
                  {para.text}
                  {hasNote && (
                    <span className="inline-flex items-center gap-1.5 ml-2 align-middle">
                      <span className="inline-block w-5 h-px bg-[#151313]/30 align-middle" />
                      <span className="text-[10px] font-black text-[#E9424C] not-italic bg-[#E9424C]/8 border border-[#E9424C]/30 rounded-lg px-2 py-0.5 whitespace-nowrap">
                        Note: {para.note}
                      </span>
                    </span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function WritingQuiz() {
  const { setNumber } = useParams()
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  const submittingRef = useRef(false)
  const answerRef = useRef('')
  const key = storageKey(setNumber)

  const wordCount = answer.trim()
    ? answer.trim().split(/\s+/).filter(Boolean).length
    : 0

  useEffect(() => {
    const saved = (() => {
      try {
        return JSON.parse(localStorage.getItem(key))
      } catch {
        return null
      }
    })()
    if (saved?.answer) {
      setAnswer(saved.answer)
      answerRef.current = saved.answer
    }
    const hasAnswer = (saved?.answer || '').trim().length > 0
    if (hasAnswer && saved?.timeLeft > 0 && saved?.timeLeft <= QUIZ_DURATION) {
      setTimeLeft(saved.timeLeft)
    }

    api
      .get(`/writing/sets/${setNumber}`)
      .then((res) => setQuestion(res.data.question))
      .catch(() => setError('Failed to load question.'))
      .finally(() => setLoading(false))
  }, [setNumber, key])

  useEffect(() => {
    if (loading) return
    answerRef.current = answer
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ answer, timeLeft, timestamp: Date.now() })
      )
    } catch {}
  }, [answer, timeLeft, loading, key])

  useEffect(() => {
    const handler = (e) => {
      if (!submittingRef.current && !submitted) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [submitted])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !submittingRef.current &&
      !submitted &&
      currentLocation.pathname !== nextLocation.pathname
  )

  const doSubmit = async (currentAnswer) => {
    if (submittingRef.current || submitted) return
    submittingRef.current = true
    setSubmitting(true)
    setSubmitted(true)
    try {
      const studentId = (() => {
        try {
          const token = localStorage.getItem('bandup_token')
          return token ? JSON.parse(atob(token.split('.')[1])).sub : null
        } catch {
          return null
        }
      })()
      const res = await api.post('/writing/submit', {
        set_number: parseInt(setNumber),
        question_id: question.id,
        student_answer: currentAnswer,
        student_id: studentId,
        start_time: new Date(
          Date.now() - (QUIZ_DURATION - timeLeft) * 1000
        ).toISOString(),
      })
      const resultsData = res.data
      localStorage.setItem(
        `writing_results_${setNumber}`,
        JSON.stringify(resultsData)
      )
      localStorage.removeItem(key)
      navigate(`/writing/${setNumber}/results`, {
        state: resultsData,
        replace: true,
      })
    } catch {
      setError('Submission failed. Please try again.')
      setSubmitting(false)
      setSubmitted(false)
      submittingRef.current = false
    }
  }

  if (submitted) return <SubmissionSkeleton />
  if (loading) return <QuizPageSkeleton />
  if (error)
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <p className="text-sm font-semibold text-[#E9424C]">{error}</p>
      </div>
    )

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <SubmitDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        onConfirm={() => doSubmit(answerRef.current)}
        submitting={submitting}
        isWriting
        wordCount={wordCount}
        minWords={MIN_WORDS}
      />
      <ExitWarningDialog
        open={blocker.state === 'blocked'}
        onOpenChange={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />

      <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-8 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/writing')}
            className="w-8 h-8 rounded-full border-2 border-[#151313] flex items-center justify-center hover:bg-[#151313] hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <p
            className={`text-[10px] font-semibold tabular-nums ${wordCount >= MIN_WORDS ? 'text-[#22c55e]' : 'text-[#151313]/40'}`}
          >
            {wordCount} / {MIN_WORDS} words
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 flex-1">
          <div className="flex-1 h-2 bg-[#151313]/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${wordCount >= MIN_WORDS ? 'bg-[#22c55e]' : 'bg-[#E9424C]'}`}
              style={{
                width: `${Math.min((wordCount / MIN_WORDS) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
        <QuizTimer
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          onExpire={() => doSubmit(answerRef.current)}
          running={!loading && !submitting && !submitted}
        />
        <Button
          onClick={() => setShowSubmitDialog(true)}
          disabled={submitting || submitted}
          className="bg-[#E9424C] text-white font-black text-xs border-2 border-[#151313] rounded-xl px-4 py-2 shadow-[2px_2px_0px_#151313] shrink-0 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <span className="inline-block bg-[#151313] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3">
            Task 1
          </span>
          <p className="text-xs font-semibold text-[#151313]/60 italic mb-4">
            You are advised to spend about{' '}
            <strong className="text-[#151313] not-italic">25 minutes</strong> on
            this task.
          </p>
        </div>

        {question && <EmailDisplay passage={question.passage} />}

        <p className="text-sm font-medium text-[#151313] leading-relaxed">
          Using <strong>all the notes given</strong>, write a reply of{' '}
          <strong>at least {MIN_WORDS} words</strong> in an appropriate style.{' '}
          <span className="text-[#151313]/40">[30]</span>
        </p>

        <div className="bg-white border-2 border-[#151313] rounded-2xl overflow-hidden shadow-[3px_3px_0px_#151313]">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#151313]/10">
            <span className="text-[10px] font-black text-[#151313]/40 uppercase tracking-widest">
              Your Reply
            </span>
            <span
              className={`text-[10px] font-black tabular-nums ${wordCount >= MIN_WORDS ? 'text-[#22c55e]' : 'text-[#E9424C]'}`}
            >
              {wordCount} word{wordCount !== 1 ? 's' : ''}
              {wordCount >= MIN_WORDS ? ' ✓' : ` / ${MIN_WORDS} min`}
            </span>
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitting || submitted}
            placeholder="Write your reply here..."
            className="w-full p-5 text-sm font-medium text-[#151313] leading-relaxed resize-none focus:outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            rows={16}
          />
        </div>

        <div className="pb-8" />
      </div>
    </div>
  )
}
