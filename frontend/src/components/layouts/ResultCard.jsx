import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const parseBullets = (text) => {
  if (!text) return []
  const cleaned = text.replace(/^\[|\]$/g, '').trim()
  return cleaned
    .split('\n')
    .map((line) => line.replace(/^[•\-\*]\s*/, '').trim())
    .filter((line) => line.length > 0)
}

export const cleanText = (text) => {
  if (!text) return ''
  return text.replace(/^\[|\]$/g, '').trim()
}

export const buildTimelineSections = (sf, estimated_band) =>
  [
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

export function ResultCard({ r }) {
  const [expanded, setExpanded] = useState(false)
  const hasOptions = r.options && Object.keys(r.options).length > 0

  const isImageOption = (val) =>
    typeof val === 'string' && /\.(png|jpg|jpeg|gif|svg|webp)/i.test(val)
  const hasImageOptions =
    hasOptions && Object.values(r.options).some(isImageOption)

  return (
    <div className="bg-white rounded-2xl border-2 border-[#151313] overflow-hidden shadow-[3px_3px_0px_#151313]">
      <Button
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#f7f7f5] transition-colors h-auto gap-3"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className={`w-6 h-6 rounded-full border-2 border-[#151313] flex items-center justify-center text-xs font-black shrink-0 ${
              r.is_correct
                ? 'bg-[#22c55e] text-white'
                : 'bg-[#E9424C] text-white'
            }`}
          >
            {r.question_number}
          </span>
          <p className="text-sm font-medium text-[#151313] text-left truncate min-w-0">
            {r.question_text || `Question ${r.question_number}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span
            className={`text-[10px] font-black whitespace-nowrap ${
              r.is_correct ? 'text-[#22c55e]' : 'text-[#E9424C]'
            }`}
          >
            {r.is_correct
              ? 'Correct'
              : r.student_answer
                ? 'Incorrect'
                : 'Skipped'}
          </span>
          {expanded ? (
            <ChevronUp size={14} className="text-[#151313]/40" />
          ) : (
            <ChevronDown size={14} className="text-[#151313]/40" />
          )}
        </div>
      </Button>

      {expanded && (
        <div className="border-t-2 border-[#151313]/10 p-5 bg-[#f7f7f5]/50">
          {r.question_text && (
            <p className="text-sm font-semibold text-[#151313] mb-4 leading-relaxed">
              {r.question_text}
            </p>
          )}

          {hasImageOptions ? (
            <div className="grid grid-cols-1 gap-3 mb-3 max-w-sm">
              {Object.entries(r.options).map(([key, value]) => {
                const isChosen = r.student_answer === key
                const isCorrect = r.correct_answer === key
                const isWrong = isChosen && !isCorrect
                return (
                  <div
                    key={key}
                    className={`flex flex-col rounded-xl border-2 overflow-hidden ${
                      isCorrect
                        ? 'border-[#22c55e]'
                        : isWrong
                          ? 'border-[#E9424C]'
                          : 'border-[#151313]/20'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between px-3 py-2 border-b-2 ${
                        isCorrect
                          ? 'bg-[#22c55e]/10 border-[#22c55e]/30'
                          : isWrong
                            ? 'bg-[#E9424C]/10 border-[#E9424C]/30'
                            : 'bg-[#f7f7f5] border-[#151313]/10'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${
                          isCorrect
                            ? 'bg-[#22c55e] border-[#22c55e] text-white'
                            : isWrong
                              ? 'bg-[#E9424C] border-[#E9424C] text-white'
                              : 'bg-white border-[#151313] text-[#151313]'
                        }`}
                      >
                        {key}
                      </span>
                      {(isCorrect || isWrong) && (
                        <span
                          className={`text-[10px] font-black flex items-center gap-1 ${
                            isCorrect ? 'text-[#22c55e]' : 'text-[#E9424C]'
                          }`}
                        >
                          {isCorrect && isChosen && (
                            <>
                              <Check size={10} /> Your answer
                            </>
                          )}
                          {isCorrect && !isChosen && (
                            <>
                              <Check size={10} /> Correct
                            </>
                          )}
                          {isWrong && (
                            <>
                              <X size={10} /> Your answer
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <img
                      src={value}
                      alt={`Option ${key}`}
                      className="w-full h-auto object-contain max-h-40"
                    />
                  </div>
                )
              })}
            </div>
          ) : hasOptions ? (
            <div className="space-y-2">
              {Object.entries(r.options).map(([key, value]) => {
                const isChosen = r.student_answer === key
                const isCorrect = r.correct_answer === key
                const isWrong = isChosen && !isCorrect
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm ${
                      isCorrect
                        ? 'bg-[#22c55e]/5 border-[#22c55e]'
                        : isWrong
                          ? 'bg-[#E9424C]/5 border-[#E9424C]'
                          : 'bg-white border-[#151313]/20'
                    }`}
                  >
                    <span className="font-medium text-justify">
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
                  className={`font-black ${
                    r.is_correct ? 'text-[#22c55e]' : 'text-[#E9424C]'
                  }`}
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

export function ResultsPage({ backPath, heroImage, results, byPart }) {
  const navigate = useNavigate()
  const [showFeedback, setShowFeedback] = useState(false)

  const {
    total,
    results: answerResults,
    estimated_band,
    structured_feedback,
    feedback,
  } = results
  const sf = structured_feedback || {}

  const correct = answerResults.filter((r) => r.is_correct).length
  const attempted = answerResults.filter((r) => r.student_answer).length
  const wrong = attempted - correct
  const skipped = total - attempted

  const timelineSections = buildTimelineSections(sf, estimated_band)

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-6 py-3 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(backPath)}
          className="w-8 h-8 rounded-full border-2 border-[#151313] hover:bg-[#151313] hover:text-white transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
        </Button>
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
                src={heroImage}
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
                {wrong > 0 && (
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
                )}
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
                {wrong > 0 && (
                  <div
                    className="h-full bg-[#E9424C]"
                    style={{ width: `${(wrong / total) * 100}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#151313] shadow-[3px_3px_0px_#151313] overflow-hidden">
          <Button
            variant="ghost"
            onClick={() => setShowFeedback(!showFeedback)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f7f7f5] transition-colors h-auto"
          >
            <span className="text-xs font-black text-[#151313] uppercase tracking-widest">
              AI Feedback
            </span>
            {showFeedback ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
          {showFeedback && (
            <div className="border-t-2 border-[#151313] px-5 py-5">
              {timelineSections.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-2.75 top-3 bottom-3 w-px bg-[#151313]/10" />
                  <div className="space-y-6">
                    {timelineSections.map((s) => (
                      <div key={s.num} className="flex gap-4">
                        <div
                          className={`w-6 h-6 rounded-full border-2 border-[#151313] flex items-center justify-center shrink-0 z-10 ${
                            s.isLast ? 'bg-[#E9424C]' : 'bg-[#151313]'
                          }`}
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
                                  <span className="text-justify">{pt}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm font-medium text-[#151313] leading-relaxed text-justify">
                              {cleanText(s.content)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#151313] leading-relaxed text-justify">
                  {feedback}
                </p>
              )}
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
                <ResultCard key={r.question_id} r={r} />
              ))}
            </div>
          )
        })}

        <div className="pb-8" />
      </div>
    </div>
  )
}