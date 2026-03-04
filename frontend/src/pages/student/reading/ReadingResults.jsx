import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import api from '../../../services/api'

const parseBullets = (text) => {
  if (!text) return []
  return text
    .split('\n')
    .map((line) => line.replace(/^[•\-\*]\s*/, '').trim())
    .filter((line) => line.length > 0)
}

export default function ReadingResults() {
  const { setNumber } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [showFeedback, setShowFeedback] = useState(false)
  const [questions, setQuestions] = useState([])

  const results =
    location.state ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem(`reading_results_${setNumber}`))
      } catch {
        return null
      }
    })()

  useEffect(() => {
    if (!results) {
      navigate(`/reading/${setNumber}`, { replace: true })
      return
    }
    api
      .get(`/reading/sets/${setNumber}`)
      .then((res) => setQuestions(res.data.questions))
      .catch(() => {})
  }, [])

  if (!results) return null

  const {
    total,
    results: answerResults,
    estimated_band,
    structured_feedback,
    feedback,
  } = results
  const correct = answerResults.filter((r) => r.is_correct).length
  const wrong = answerResults.filter((r) => !r.is_correct).length
  const skipped = answerResults.filter((r) => !r.student_answer).length

  const sf = structured_feedback || {}

  const enriched = answerResults.map((r) => {
    const q = questions.find((q) => q.id === r.question_id) || {}
    return { ...r, question_text: q.question_text, options: q.options }
  })

  const byPart = enriched.reduce((acc, r) => {
    const part =
      r.question_number <= 8
        ? 1
        : r.question_number <= 14
          ? 2
          : r.question_number <= 20
            ? 3
            : r.question_number <= 26
              ? 4
              : r.question_number <= 30
                ? 5
                : r.question_number <= 33
                  ? 6
                  : 7
    if (!acc[part]) acc[part] = []
    acc[part].push(r)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/reading')}
          className="w-8 h-8 rounded-full border-2 border-[#151313] flex items-center justify-center hover:bg-[#151313] hover:text-white transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-5">
        <div className="bg-white rounded-2xl border-2 border-[#151313] shadow-[4px_4px_0px_#151313] overflow-hidden">
          <div className="grid grid-cols-2 divide-x-2 divide-[#151313]">
            <div className="p-6 flex flex-col items-center justify-between gap-4">
              <div className="text-5xl font-black text-[#E9424C] mt-1">
                {estimated_band || 'Band —'}
              </div>
              <img
                src="/src/assets/7.svg"
                alt=""
                className="w-238 h-30 object-contain opacity-90 scale-180"
              />
            </div>
            <div className="p-6 flex flex-col justify-center gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    <span className="text-xs font-semibold text-[#151313]">
                      Correct
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#22c55e]">
                    {correct}/{total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#E9424C]" />
                    <span className="text-xs font-semibold text-[#151313]">
                      Wrong
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#E9424C]">
                    {wrong}/{total}
                  </span>
                </div>
                {skipped > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#151313]/20" />
                      <span className="text-xs font-semibold text-[#151313]">
                        Skipped
                      </span>
                    </div>
                    <span className="text-sm font-black text-[#151313]/40">
                      {skipped}/{total}
                    </span>
                  </div>
                )}
              </div>
              <div className="h-2 bg-[#151313]/10 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[#22c55e]"
                  style={{ width: `${(correct / total) * 100}%` }}
                />
                <div
                  className="h-full bg-[#E9424C]"
                  style={{ width: `${(wrong / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#151313] shadow-[3px_3px_0px_#151313] overflow-hidden">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f7f7f5] transition-colors"
          >
            <span className="text-xs font-black text-[#151313] uppercase tracking-widest">
              AI Feedback
            </span>
            {showFeedback ? (
              <ChevronUp size={14} className="text-[#151313]/40" />
            ) : (
              <ChevronDown size={14} className="text-[#151313]/40" />
            )}
          </button>

          {showFeedback && (
            <div className="border-t-2 border-[#151313] px-5 py-5">
              <div className="relative">
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-[#151313]/10" />

                <div className="space-y-6">
                  {sf.what_this_band_means && (
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-[#151313] border-2 border-[#151313] flex items-center justify-center shrink-0 z-10">
                        <span className="text-[8px] font-black text-white">
                          01
                        </span>
                      </div>
                      <div className="pb-2">
                        <p className="text-[10px] font-black text-[#151313] uppercase tracking-widest mb-1.5">
                          What {estimated_band} Means
                        </p>
                        <p className="text-sm font-medium text-[#151313] leading-relaxed">
                          {sf.what_this_band_means.replace(/^\[|\]$/g, '')}
                        </p>
                      </div>
                    </div>
                  )}

                  {sf.strengths && (
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-[#151313] border-2 border-[#151313] flex items-center justify-center shrink-0 z-10">
                        <span className="text-[8px] font-black text-white">
                          02
                        </span>
                      </div>
                      <div className="pb-2">
                        <p className="text-[10px] font-black text-[#151313] uppercase tracking-widest mb-2">
                          Strengths
                        </p>
                        <div className="space-y-2">
                          {parseBullets(sf.strengths).map((pt, i) => (
                            <p
                              key={i}
                              className="text-sm font-medium text-[#151313] leading-relaxed"
                            >
                              {pt}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {sf.weaknesses && (
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-[#151313] border-2 border-[#151313] flex items-center justify-center shrink-0 z-10">
                        <span className="text-[8px] font-black text-white">
                          03
                        </span>
                      </div>
                      <div className="pb-2">
                        <p className="text-[10px] font-black text-[#151313] uppercase tracking-widest mb-2">
                          Weaknesses
                        </p>
                        <div className="space-y-2">
                          {parseBullets(sf.weaknesses).map((pt, i) => (
                            <p
                              key={i}
                              className="text-sm font-medium text-[#151313] leading-relaxed"
                            >
                              {pt}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {sf.why_this_band && (
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-[#151313] border-2 border-[#151313] flex items-center justify-center shrink-0 z-10">
                        <span className="text-[8px] font-black text-white">
                          04
                        </span>
                      </div>
                      <div className="pb-2">
                        <p className="text-[10px] font-black text-[#151313] uppercase tracking-widest mb-1.5">
                          Why This Band
                        </p>
                        <p className="text-sm font-medium text-[#151313] leading-relaxed">
                          {sf.why_this_band.replace(/^\[|\]$/g, '')}
                        </p>
                      </div>
                    </div>
                  )}

                  {sf.how_to_improve && (
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-[#151313] border-2 border-[#151313] flex items-center justify-center shrink-0 z-10">
                        <span className="text-[8px] font-black text-white">
                          05
                        </span>
                      </div>
                      <div className="pb-2">
                        <p className="text-[10px] font-black text-[#151313] uppercase tracking-widest mb-2">
                          How to Improve
                        </p>
                        <div className="space-y-2">
                          {parseBullets(sf.how_to_improve).map((pt, i) => (
                            <div key={i} className="flex gap-2.5">
                              <span className="text-xs font-black text-[#151313]/25 shrink-0">
                                {i + 1}.
                              </span>
                              <p className="text-sm font-medium text-[#151313] leading-relaxed">
                                {pt}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {sf.next_target && (
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-[#E9424C] border-2 border-[#151313] flex items-center justify-center shrink-0 z-10">
                        <span className="text-[8px] font-black text-white">
                          06
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#151313] uppercase tracking-widest mb-1.5">
                          Next Target
                        </p>
                        <p className="text-sm font-semibold text-[#151313] leading-relaxed">
                          {sf.next_target.replace(/^\[|\]$/g, '')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] font-black text-[#151313]/40 uppercase tracking-widest">
          Answer Breakdown
        </p>

        {Object.entries(byPart).map(([part, qs]) => {
          const partCorrect = qs.filter((q) => q.is_correct).length
          return (
            <div key={part} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-white bg-[#151313] px-3 py-1 rounded-full uppercase tracking-widest">
                  Part {part}
                </span>
                <span className="text-xs font-black text-[#151313]">
                  {partCorrect}/{qs.length} correct
                </span>
              </div>
              {qs.map((r) => (
                <ResultQuestionCard key={r.question_id} r={r} />
              ))}
            </div>
          )
        })}

        <div className="pb-8" />
      </div>
    </div>
  )
}

function ResultQuestionCard({ r }) {
  const [expanded, setExpanded] = useState(false)
  const hasOptions = r.options && Object.keys(r.options).length > 0

  return (
    <div className="bg-white rounded-2xl border-2 border-[#151313] overflow-hidden shadow-[3px_3px_0px_#151313]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#f7f7f5] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded-full border-2 border-[#151313] flex items-center justify-center text-xs font-black shrink-0 ${
              r.is_correct
                ? 'bg-[#22c55e] text-white'
                : 'bg-[#E9424C] text-white'
            }`}
          >
            {r.question_number}
          </span>
          <p className="text-sm font-medium text-[#151313] text-left line-clamp-1">
            {r.question_text || `Question ${r.question_number}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {r.is_correct ? (
            <span className="text-[10px] font-black text-[#22c55e]">
              Correct
            </span>
          ) : (
            <span className="text-[10px] font-black text-[#E9424C]">
              Incorrect
            </span>
          )}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t-2 border-[#151313]/10 p-5 bg-[#f7f7f5]/50">
          {hasOptions ? (
            <div className="space-y-2">
              {Object.entries(r.options).map(([key, value]) => {
                const isChosen = r.student_answer === key
                const isCorrect = r.correct_answer === key
                const isWrong = isChosen && !isCorrect

                let bgColor = 'bg-white'
                let borderColor = 'border-[#151313]/20'
                if (isCorrect) {
                  bgColor = 'bg-[#22c55e]/5'
                  borderColor = 'border-[#22c55e]'
                }
                if (isWrong) {
                  bgColor = 'bg-[#E9424C]/5'
                  borderColor = 'border-[#E9424C]'
                }

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm ${bgColor} ${borderColor}`}
                  >
                    <span className="font-medium">
                      <span className="font-black mr-2">{key}.</span>
                      {value}
                    </span>
                    <span className="ml-3 text-[10px] font-black shrink-0">
                      {isCorrect && isChosen && (
                        <span className="text-[#22c55e] flex items-center gap-1">
                          <Check size={12} /> Your answer
                        </span>
                      )}
                      {isCorrect && !isChosen && (
                        <span className="text-[#22c55e] flex items-center gap-1">
                          <Check size={12} /> Correct
                        </span>
                      )}
                      {isWrong && (
                        <span className="text-[#E9424C] flex items-center gap-1">
                          <X size={12} /> Your answer
                        </span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#151313]/40">Your answer:</span>
                <span
                  className={`font-black ${r.is_correct ? 'text-[#22c55e]' : 'text-[#E9424C]'}`}
                >
                  {r.student_answer || '—'}
                </span>
              </div>
              {!r.is_correct && r.correct_answer && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[#151313]/40">Correct answer:</span>
                  <span className="font-black text-[#22c55e]">
                    {r.correct_answer}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
