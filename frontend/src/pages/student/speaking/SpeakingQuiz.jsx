import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RecordRTC from 'recordrtc'
import api from '../../../services/api'
import { SubmissionSkeleton } from '../../../components/layouts/Skeletons'
import { ExitWarningDialog } from '../../../components/layouts/Dialog'
import QuizTimer from '../../../components/layouts/QuizTimer'
import { Textarea } from '@/components/ui/textarea'

const PREP_DURATION = 6 // originally 120 seconds (just for demo purposes)
const SPEAK_DURATION = 30 // originally 120 seconds (just for demo purposes)

export default function SpeakingQuiz() {
  const { setNumber, partNumber, candidateNumber } = useParams()
  const [searchParams] = useSearchParams()
  const year = searchParams.get('year') || ''
  const navigate = useNavigate()

  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('prep')
  const [prepTime, setPrepTime] = useState(PREP_DURATION)
  const [speakTime, setSpeakTime] = useState(SPEAK_DURATION)
  const [notes, setNotes] = useState('')
  const [recording, setRecording] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showExitDialog, setShowExitDialog] = useState(false)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    api
      .get(`/speaking/sets/${setNumber}/${partNumber}?year=${year}`)
      .then((res) => {
        const q = res.data.candidates.find(
          (c) => c.question_number === parseInt(candidateNumber)
        )
        if (q) setQuestion(q)
        else setError('Candidate not found.')
      })
      .catch(() => setError('Failed to load question.'))
      .finally(() => setLoading(false))
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
      })
      recorderRef.current.startRecording()
      setRecording(true)
      setPhase('speak')
      startTimeRef.current = new Date().toISOString()
    } catch {
      setError(
        'Microphone access denied. Please allow microphone access and try again.'
      )
    }
  }

  const stopRecording = () => {
    setRecording(false)
    setPhase('submitting')
    recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current.getBlob()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      doSubmit(blob)
    })
  }

  const doSubmit = async (blob) => {
    setSubmitting(true)
    try {
      const studentId = (() => {
        try {
          const token = localStorage.getItem('bandup_token')
          return token ? JSON.parse(atob(token.split('.')[1])).sub : null
        } catch {
          return null
        }
      })()

      const formData = new FormData()
      formData.append('audio', blob, 'speech.wav')
      formData.append('set_number', setNumber)
      formData.append('part_number', partNumber)
      formData.append('question_id', question.id)
      formData.append('candidate', candidateNumber)
      if (studentId) formData.append('student_id', studentId)
      if (startTimeRef.current)
        formData.append('start_time', startTimeRef.current)

      const res = await api.post('/speaking/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      navigate(
        `/speaking/${setNumber}/${partNumber}/${candidateNumber}/results?year=${year}`,
        { state: res.data, replace: true }
      )
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Submission failed. Please try again.'
      )
      setSubmitting(false)
      setPhase('speak')
    }
  }

  if (loading || submitting || phase === 'submitting')
    return <SubmissionSkeleton />

  if (error && !question) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <p className="text-sm font-semibold text-[#E9424C]">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <ExitWarningDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={() => {
          try {
            recorderRef.current?.stopRecording()
          } catch {}
          streamRef.current?.getTracks().forEach((t) => t.stop())
          navigate(`/speaking/${setNumber}/${partNumber}?year=${year}`)
        }}
        onCancel={() => setShowExitDialog(false)}
      />

      <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-8 py-3 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            phase === 'prep' || phase === 'speak'
              ? setShowExitDialog(true)
              : navigate(`/speaking/${setNumber}/${partNumber}?year=${year}`)
          }
          className="w-8 h-8 rounded-full border-2 border-[#151313] hover:bg-[#151313] hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
        </Button>
        <p className="text-[10px] font-black text-[#151313]/40 uppercase tracking-widest flex-1">
          Speaking • Set {setNumber} ({year}) • Booklet {partNumber} • Candidate{' '}
          {String.fromCharCode(64 + parseInt(candidateNumber))}
        </p>
        {phase === 'prep' && (
          <QuizTimer
            timeLeft={prepTime}
            setTimeLeft={setPrepTime}
            running={phase === 'prep'}
            onExpire={startRecording}
          />
        )}
        {phase === 'speak' && (
          <QuizTimer
            timeLeft={speakTime}
            setTimeLeft={setSpeakTime}
            running={phase === 'speak'}
            onExpire={stopRecording}
          />
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
              phase === 'prep'
                ? 'bg-[#151313] text-white'
                : 'bg-[#E9424C] text-white'
            }`}
          >
            {phase === 'prep' ? 'Preparation Time' : 'Speaking Time'}
          </span>
          {recording && (
            <span className="flex items-center gap-1 text-[10px] font-black text-[#E9424C]">
              <span className="w-2 h-2 rounded-full bg-[#E9424C] animate-pulse" />
              Recording
            </span>
          )}
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#151313] overflow-hidden shadow-[3px_3px_0px_#151313]">
          {question?.passage && (
            <div className="p-4 border-b border-[#151313]/10">
              <p className="text-[10px] font-black text-[#151313]/40 uppercase tracking-widest mb-1">
                Situation
              </p>
              <p className="text-sm font-medium text-[#151313] leading-relaxed">
                {question.passage}
              </p>
            </div>
          )}
          {question?.question_text && (
            <div className="p-4 bg-[#E9424C]/5 border-l-4 border-[#E9424C]">
              <p className="text-[10px] font-black text-[#E9424C] uppercase tracking-widest mb-1">
                Your Task — Candidate
                {String.fromCharCode(64 + parseInt(candidateNumber))}
              </p>
              <p className="text-sm font-semibold text-[#151313] leading-relaxed">
                {question.question_text}
              </p>
            </div>
          )}
        </div>

        {phase === 'prep' && (
          <div className="bg-white rounded-2xl border-2 border-[#151313] overflow-hidden shadow-[3px_3px_0px_#151313]">
            <div className="px-4 py-3 border-b border-[#151313]/10">
              <p className="text-[10px] font-black text-[#151313]/40 uppercase tracking-widest">
                Your Notes
              </p>
              <p className="text-[10px] font-medium text-[#151313]/30 mt-0.5">
                Jot down key points now — notes lock when speaking time starts
              </p>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type your notes here..."
              className="min-h-[150px] text-sm font-medium border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        )}

        {phase === 'speak' && (
          <div className="bg-white rounded-2xl border-2 border-[#151313] overflow-hidden shadow-[3px_3px_0px_#151313]">
            <div className="px-4 py-3 border-b border-[#151313]/10 bg-[#151313]/5">
              <p className="text-[10px] font-black text-[#151313]/40 uppercase tracking-widest">
                Your Notes
              </p>
              <p className="text-[10px] font-medium text-[#151313]/30 mt-0.5">
                Notes are locked — speak now!
              </p>
            </div>
            <div className="p-4 text-sm font-medium text-[#151313] leading-relaxed whitespace-pre-wrap min-h-[120px]">
              {notes || (
                <span className="text-[#151313]/30">
                  No notes written during prep.
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs font-semibold text-[#E9424C] bg-[#fef2f2] border border-[#E9424C]/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="pb-8" />
      </div>
    </div>
  )
}