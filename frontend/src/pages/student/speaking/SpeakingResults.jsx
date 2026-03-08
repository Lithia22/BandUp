import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import {
  parseBullets,
  buildTimelineSections,
} from '../../../components/layouts/ResultCard'

export default function SpeakingResults() {
  const { setNumber, partNumber, candidateNumber } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [showFeedback, setShowFeedback] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  const results = location.state || null

  useEffect(() => {
    if (!results) navigate(`/speaking/${setNumber}`, { replace: true })
  }, [])

  if (!results) return null

  const {
    estimated_band,
    structured_feedback,
    feedback,
    word_count,
    transcript,
    speaking_script,
    filler_words,
  } = results
  const timelineSections = buildTimelineSections(
    structured_feedback || {},
    estimated_band
  )

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <div className="sticky top-0 z-50 bg-[#f7f7f5] border-b-2 border-[#151313] px-4 md:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(`/speaking/${setNumber}/${partNumber}`)}
          className="w-8 h-8 rounded-full border-2 border-[#151313] flex items-center justify-center hover:bg-[#151313] hover:text-white transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-[10px] font-black text-[#151313]/40 uppercase tracking-widest">
          Speaking • Set {setNumber} • Booklet {partNumber} • Candidate{' '}
          {String.fromCharCode(64 + parseInt(candidateNumber))}
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-5">
        <div className="bg-white rounded-2xl border-2 border-[#151313] shadow-[4px_4px_0px_#151313] overflow-hidden">
          <div className="grid grid-cols-2 divide-x-2 divide-[#151313]">
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-[10px] font-black text-[#151313]/40 uppercase tracking-widest block">
                Estimated Band
              </span>
              <div className="text-5xl font-black text-[#E9424C]">
                {estimated_band || '—'}
              </div>
              <img
                src="/src/assets/7.svg"
                alt=""
                className="w-238 h-30 object-contain opacity-90 scale-180"
              />
            </div>
            <div className="p-6 flex flex-col justify-center gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#151313]/20" />
                    <span className="text-xs font-semibold text-[#151313]">
                      Words Spoken
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#151313]">
                    {word_count} words
                  </span>
                </div>
                {filler_words?.total > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#E9424C]" />
                      <span className="text-xs font-semibold text-[#151313]">
                        Filler Words
                      </span>
                    </div>
                    <span className="text-sm font-black text-[#E9424C]">
                      {filler_words.total} detected
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#151313]/20" />
                    <span className="text-xs font-semibold text-[#151313]">
                      Candidate
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#151313]/40">
                    {String.fromCharCode(64 + parseInt(candidateNumber))}
                  </span>
                </div>
              </div>
              {filler_words?.total > 0 && (
                <p className="text-[10px] font-semibold text-[#E9424C]/80 bg-[#E9424C]/5 border border-[#E9424C]/20 rounded-xl px-3 py-2">
                  Try to reduce filler words like "um", "uh", "like" for a
                  smoother delivery.
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

        {speaking_script && (
          <div className="bg-white rounded-2xl border-2 border-[#151313] shadow-[3px_3px_0px_#151313] overflow-hidden">
            <button
              onClick={() => setShowScript(!showScript)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f7f7f5] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#151313] uppercase tracking-widest">
                  Suggested Answer
                </span>
                <span className="text-[9px] font-black text-white bg-[#E9424C] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Band 5
                </span>
              </div>
              {showScript ? (
                <ChevronUp size={14} className="text-[#151313]/40" />
              ) : (
                <ChevronDown size={14} className="text-[#151313]/40" />
              )}
            </button>
            {showScript && (
              <div className="border-t-2 border-[#151313] px-5 py-5 space-y-3">
                <p className="text-[10px] font-semibold text-[#151313]/50 italic">
                  An improved version of your response at Band 5 level — same
                  ideas, stronger language.
                </p>
                <p className="text-sm font-medium text-[#151313] leading-relaxed whitespace-pre-wrap">
                  {speaking_script}
                </p>
              </div>
            )}
          </div>
        )}

        {transcript && (
          <div className="bg-white rounded-2xl border-2 border-[#151313] shadow-[3px_3px_0px_#151313] overflow-hidden">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f7f7f5] transition-colors"
            >
              <span className="text-xs font-black text-[#151313] uppercase tracking-widest">
                Your Transcript
              </span>
              {showTranscript ? (
                <ChevronUp size={14} className="text-[#151313]/40" />
              ) : (
                <ChevronDown size={14} className="text-[#151313]/40" />
              )}
            </button>
            {showTranscript && (
              <div className="border-t-2 border-[#151313] px-5 py-5">
                <p className="text-sm font-medium text-[#151313] leading-relaxed whitespace-pre-wrap">
                  {transcript}
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
