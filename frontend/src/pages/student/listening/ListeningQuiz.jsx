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
import { PartSection } from './ListeningComponents'

const QUIZ_DURATION = 50 * 60
const storageKey = (n) => `listening_quiz_${n}`

function groupByPart(questions) {
  const parts = {}
  for (const q of questions) {
    const p = q.part_number
    if (!parts[p]) {
      parts[p] = {
        partNumber: p,
        passageTitle: q.passage_title || null,
        passage: q.passage || null,
        audioUrl: null,
        questions: [],
      }
    }
    parts[p].questions.push(q)
    if (q.audio_url && !parts[p].audioUrl) parts[p].audioUrl = q.audio_url
  }
  return Object.values(parts).sort((a, b) => a.partNumber - b.partNumber)
}

function labelForAudioId(id) {
  if (!id) return ''
  if (id.startsWith('part-5-conv-')) {
    const n = id.replace('part-5-conv-', '')
    return `Part 5 — Dialogue ${n}`
  }
  const n = id.replace('part-', '')
  return `Part ${n} Audio`
}

export default function ListeningQuiz() {
  const { setNumber } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState(null)
  const submittingRef = useRef(false)
  const answersRef = useRef({})
  const key = storageKey(setNumber)

  useEffect(() => {
    const saved = (() => {
      try {
        return JSON.parse(localStorage.getItem(key))
      } catch {
        return null
      }
    })()
    if (saved?.answers) {
      setAnswers(saved.answers)
      answersRef.current = saved.answers
    }
    const hasAnswers = Object.keys(saved?.answers || {}).length > 0
    if (hasAnswers && saved?.timeLeft > 0 && saved?.timeLeft <= QUIZ_DURATION) {
      setTimeLeft(saved.timeLeft)
    }

    api
      .get(`/listening/sets/${setNumber}`)
      .then((res) => setQuestions(res.data.questions))
      .catch(() => setError('Failed to load questions.'))
      .finally(() => setLoading(false))
  }, [setNumber, key])

  useEffect(() => {
    if (loading) return
    answersRef.current = answers
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ answers, timeLeft, timestamp: Date.now() })
      )
    } catch {}
  }, [answers, timeLeft, loading, key])

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

  const handleSelect = (qId, opt) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [qId]: opt }))
  }

  const doSubmit = async (currentAnswers) => {
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
      const res = await api.post('/listening/submit', {
        set_number: parseInt(setNumber),
        answers: currentAnswers,
        student_id: studentId,
        start_time: new Date(
          Date.now() - (QUIZ_DURATION - timeLeft) * 1000
        ).toISOString(),
      })
      const resultsData = res.data
      localStorage.setItem(
        `listening_results_${setNumber}`,
        JSON.stringify(resultsData)
      )
      localStorage.removeItem(key)
      navigate(`/listening/${setNumber}/results`, {
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

  const partGroups = groupByPart(questions)
  const answeredCount = Object.values(answers).filter((v) => v != null).length
  const unansweredCount = questions.length - answeredCount
  const currentPlayingLabel = labelForAudioId(playingAudioId)

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <SubmitDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        onConfirm={() => doSubmit(answers)}
        unansweredCount={unansweredCount}
        totalCount={questions.length}
        submitting={submitting}
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
            onClick={() => navigate('/listening')}
            className="w-8 h-8 rounded-full border-2 border-[#151313] flex items-center justify-center hover:bg-[#151313] hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-[10px] font-semibold text-[#151313]/40">
            {answeredCount}/{questions.length} answered
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 flex-1">
          <div className="flex-1 h-2 bg-[#151313]/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E9424C] rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-black text-[#151313]/40 shrink-0">
            {Math.round((answeredCount / questions.length) * 100)}%
          </span>
        </div>
        <QuizTimer
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          onExpire={() => doSubmit(answersRef.current)}
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

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-10">
        {partGroups.map((part) => (
          <PartSection
            key={part.partNumber}
            partNumber={part.partNumber}
            partTitle={part.passageTitle}
            passage={part.passage}
            audioUrl={part.partNumber !== 5 ? part.audioUrl : null}
            questions={part.questions}
            answers={answers}
            onSelect={handleSelect}
            disabled={submitting || submitted}
            playingId={playingAudioId}
            playingLabel={currentPlayingLabel}
            onPlay={(id) => setPlayingAudioId(id)}
            onPause={() => setPlayingAudioId(null)}
          />
        ))}
      </div>
    </div>
  )
}
