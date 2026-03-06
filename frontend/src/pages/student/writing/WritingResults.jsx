import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { parseBullets, cleanText } from '../../../components/layouts/ResultCard'

export default function WritingResults() {
  const { setNumber } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [showFeedback, setShowFeedback] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  const results =
    location.state ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem(`writing_results_${setNumber}`))
      } catch {
        return null
      }
    })()

  useEffect(() => {
    if (!results) navigate(`/writing/${setNumber}`, { replace: true })
  }, [])

  if (!results) return null

  const {
    estimated_band,
    structured_feedback,
    feedback,
    word_count,
    student_answer,
  } = results
  const sf = structured_feedback || {}

  const timelineSections = [
    {
      num: '01',
      label: `Your ${estimated_band} Result`,
      content: cleanText(sf.your_band_result),
      isList: false,
      isLast: false,
    },
    {
      num: '02',
      label: 'What You Did Well',
      content: cleanText(sf.what_you_did_well),
      isList: true,
      isLast: false,
    },
    {
      num: '03',
      label: 'Where to Focus',
      content: cleanText(sf.where_to_focus),
      isList: true,
      isLast: false,
    },
    {
      num: '04',
      label: 'How To Improve',
      content: cleanText(sf.your_study_plan),
      isList: true,
      isLast: false,
    },
    {
      num: '05',
      label: 'Next Target',
      content: cleanText(sf.your_next_goal),
      isList: false,
      isLast: true,
    },
  ].filter((s) => s.content)

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/writing')}
          className="w-8 h-8 rounded-full border-2 border-[#151313] flex items-center justify-center hover:bg-[#151313] hover:text-white transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-5">
        <div className="bg-white rounded-2xl border-2 border-[#151313] shadow-[4px_4px_0px_#151313] overflow-hidden">
          <div className="grid grid-cols-2 divide-x-2 divide-[#151313]">
            <div className="p-6 flex flex-col items-center justify-between gap-4">
              <div className="text-center">
                <span className="text-[10px] font-black text-[#151313]/40 uppercase tracking-widest block mb-1">
                  Estimated Band
                </span>
                <div className="text-5xl font-black text-[#E9424C]">
                  {estimated_band || 'Band —'}
                </div>
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
                    <div
                      className={`w-2 h-2 rounded-full ${word_count >= 100 ? 'bg-[#22c55e]' : 'bg-[#E9424C]'}`}
                    />
                    <span className="text-xs font-semibold text-[#151313]">
                      Word Count
                    </span>
                  </div>
                  <span
                    className={`text-sm font-black ${word_count >= 100 ? 'text-[#22c55e]' : 'text-[#E9424C]'}`}
                  >
                    {word_count} words
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#151313]/20" />
                    <span className="text-xs font-semibold text-[#151313]">
                      Minimum
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#151313]/40">
                    100 words
                  </span>
                </div>
              </div>
              <div className="h-2 bg-[#151313]/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${word_count >= 100 ? 'bg-[#22c55e]' : 'bg-[#E9424C]'}`}
                  style={{
                    width: `${Math.min((word_count / 100) * 100, 100)}%`,
                  }}
                />
              </div>
              {word_count < 100 && (
                <p className="text-[10px] font-semibold text-[#E9424C]">
                  {100 - word_count} more words needed to meet the minimum
                  requirement.
                </p>
              )}
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
              {timelineSections.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-2.75 top-3 bottom-3 w-px bg-[#151313]/10" />
                  <div className="space-y-6">
                    {timelineSections.map((s) => (
                      <div key={s.num} className="flex gap-4">
                        <div
                          className={`w-6 h-6 rounded-full border-2 border-[#151313] flex items-center justify-center shrink-0 z-10 ${s.isLast ? 'bg-[#E9424C]' : 'bg-[#151313]'}`}
                        >
                          <span className="text-[8px] font-black text-white">
                            {s.num}
                          </span>
                        </div>
                        <div className={`${s.isLast ? '' : 'pb-2'} flex-1`}>
                          <p className="text-[10px] font-black text-[#151313] uppercase tracking-widest mb-1.5">
                            {s.label}
                          </p>
                          {s.isList ? (
                            <ul className="space-y-2">
                              {parseBullets(s.content).map((pt, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-sm font-medium text-[#151313] leading-relaxed"
                                >
                                  <span className="text-[#151313] font-black shrink-0">
                                    •
                                  </span>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm font-medium text-[#151313] leading-relaxed">
                              {s.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#151313] leading-relaxed">
                  {feedback}
                </p>
              )}
            </div>
          )}
        </div>

        {student_answer && (
          <div className="bg-white rounded-2xl border-2 border-[#151313] shadow-[3px_3px_0px_#151313] overflow-hidden">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f7f7f5] transition-colors"
            >
              <span className="text-xs font-black text-[#151313] uppercase tracking-widest">
                Your Answer
              </span>
              {showAnswer ? (
                <ChevronUp size={14} className="text-[#151313]/40" />
              ) : (
                <ChevronDown size={14} className="text-[#151313]/40" />
              )}
            </button>
            {showAnswer && (
              <div className="border-t-2 border-[#151313] px-5 py-5">
                <p className="text-sm font-medium text-[#151313] leading-relaxed whitespace-pre-wrap">
                  {student_answer}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  )
}
